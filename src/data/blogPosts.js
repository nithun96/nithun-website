// Add new blog posts here. The newest post should go at the top.
// Each post needs: slug (URL-friendly ID), title, date (YYYY-MM-DD), excerpt, and content (array of paragraphs).

export const blogPosts = [
  {
    slug: 'hello-world',
    title: 'Hello, World',
    date: '2026-04-08',
    excerpt: "A first post to get the ball rolling \u2014 why I\u2019m starting a blog and what to expect.",
    content: [
      "This is a placeholder for my first real blog post. I\u2019ll fill this in properly soon.",
      "The plan is to write about things I find interesting: AI, products, books, and whatever else is on my mind. No strict editorial calendar, no newsletter, no content strategy \u2014 just writing when I have something worth saying.",
      'More soon.',
    ],
  },
]

export function getPostBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug) ?? null
}
