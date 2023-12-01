---
title: Examples
---

### Personal Blog (Pagination, Markdown)

You can combine [pagination](../features.html#pagination), [EJS templates](../features.html#ejs), and [Markdown](../features.html#markdown) support to add a blog to your website.

Let's say you want your blog to be under the `/blog` URL on your website. You may also want your blog posts to have slug URLs like `/blog/my-blog-post/`. Let's create the file for our post:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/blog/my-block-post/index.md</div>

  ```text
  ---
  title: My Blog Post
  description: A small post for testing purposes.
  date: 2017-4-25 08:57:00 -0700
  ---
  # My Blog Post

  Hello! This is the first post in my new blog!
  ```
</div>

Since the blog index should be at `/blog`, create a file for it at `blog/index.html.ejs`:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/blog/index.html.ejs</div>

  ```erb
  <%# The `./*/index.md` pattern matches each individual blog post file. %>
  <% const paginator = ctx.paginate(ctx.getFiles('./*/index.md'), {itemsPerPage: 5}) %>

  <%# For each blog post, show the title and description and link to the full post. %>
  <% for (const file of paginator.items) { %>
    <div class="blog-post">
      <h2><a href="<%- file.url %>"><%- file.attributes.title %></a></h2>
      <p><%- file.attributes.description %></p>
    </div>
  <% } %>

  <%# Show a list of page links at the bottom of the listing. %>
  <p>Pages</p>
  <div>
    <% for (const page of paginator.pages) { %>
      <a class="page-number" href="<%- page.url %>"><%- page.number %></a>
    <% } %>
  </div>
  ```
</div>

This will create a page at `/blog` that lists all of our blog posts in pages of 5 posts each, with links to each page at the bottom. If you add 5 more test posts, you will see a second page added to the listing.

However, the order of the posts may be random. You can solve this by using the `date` field in each blog post and passing extra arguments to `ctx.getFiles` telling it to sort by date:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/blog/index.html.ejs</div>

  ```erb
  <%
    const paginator = ctx.paginate(
      ctx.getFiles('./*/index.md', {
        sort: {
          attribute: 'date',
          type: 'date',
          order: 'desc',
        },
      }),
      {itemsPerPage: 5},
    )
  %>
  ```
</div>

This causes `ctx.getFiles` to return your blog post files sorted by the `date` attribute in their YAML frontmatter, in descending (i.e. most recent first) order.

If you wanted the blog post listing to include the full blog posts instead of their descriptions, you could replace the description with the `ctx.renderMarkdown` helper and pass it the un-rendered Markdown of the post:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/blog/index.html.ejs</div>

  ```erb
  <% for (const file of paginator.items) { %>
    <div class="blog-post">
      <%- ctx.renderMarkdown(file.body) %>
    </div>
  <% } %>
  ```
</div>
