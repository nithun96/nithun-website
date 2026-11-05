// Turns a post's Markdown into a ready-made tree at build time (Node only).
//
// Used by the `posts` plugin in vite.config.js: `import post from './x.md?post'`
// gives { data, footnotes, hast } and `?meta` gives just the frontmatter. The
// browser then only has to turn the tree into React elements
// (hast-util-to-jsx-runtime), so the Markdown parser, GFM and the HTML parser
// behind rehype-raw no longer ship to visitors. The steps match what
// react-markdown did in the browser before, including its link and image URL check.

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import { visit } from 'unist-util-visit'
import { urlAttributes } from 'html-url-attributes'
import { defaultUrlTransform } from 'react-markdown'
import { parseFrontmatter } from './parseFrontmatter.js'
import { parseFootnotes } from './parseFootnotes.js'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)

export function postMeta(raw) {
  return parseFrontmatter(raw).data
}

export function postToHast(raw) {
  const { data, content } = parseFrontmatter(raw)
  const { body, footnotes } = parseFootnotes(content)
  const hast = processor.runSync(processor.parse(body))

  visit(hast, (node, index, parent) => {
    delete node.position   // only useful for error messages; keeps the bundle small
    if (node.type === 'raw' && parent && typeof index === 'number') {
      parent.children[index] = { type: 'text', value: node.value }
      return
    }
    if (node.type === 'element') {
      for (const key of Object.keys(urlAttributes)) {
        if (!Object.hasOwn(node.properties, key)) continue
        const test = urlAttributes[key]
        if (test === null || test.includes(node.tagName)) {
          node.properties[key] = defaultUrlTransform(String(node.properties[key] || ''))
        }
      }
    }
  })

  return { data, footnotes, hast }
}
