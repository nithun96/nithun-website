// Footnote types:
//   clarification — purely informational aside; rendered without left border (quiet)
//   wry           — personality-driven aside; gets a warm left border (var(--stone))

export function parseFootnotes(content) {
  const footnotes = []

  const body = content.replace(
    /\[\^(\d+):\s*(clarification|wry):\s*([^\]]+)\]/g,
    (_, numStr, type, text) => {
      const number = parseInt(numStr, 10)
      const trimmed = text.trim()
      footnotes.push({ number, type, text: trimmed })
      const safeLabel = trimmed.replace(/"/g, '&quot;')
      return `<sup id="fnref-${number}" class="footnote-ref" aria-label="Footnote ${number}: ${safeLabel}">${number}</sup>`
    }
  )

  footnotes.sort((a, b) => a.number - b.number)
  return { body, footnotes }
}
