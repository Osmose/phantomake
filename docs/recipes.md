---
title: Recipes
---

This page contains common scenarios where Phantomake is useful for building a static website, and example code for solving them.

### Shared Includes: Reusable HTML

Includes are primarily useful when you have a block of HTML that you want to reuse in multiple places. For example, you may want to put speech bubbles on your webpage that represent different headmates talking. The HTML may look like this:

```html
<div class="speech-bubble">
  <img src="/static/phanto.png" class="avatar" />
  <h3>phanto</h3>
  <p>I have successfully adapted Ian's Secure Knot for ghostlaces!</p>
</div>
```

This can be annoying to copy-paste, and especially annoying to update with new HTML. We can rewrite this to be an EJS include:

```erb
<div class="speech-bubble">
  <img src="/static/<%- name %>.png" class="avatar">
  <h3><%- name %></h3>
  <p><%- text %></p>
</div>
```

Then, in any page we want to include a speech bubble, we can add an `.ejs` extension and use `include`:

```erb
<div class="page">
  <p>Ian's Secure Knot is one of my favorite shoelace knots.</p>
  <%- include('.speech-bubble.ejs', { name: 'phanto', text: "I have successfully adapted Ian's Secure Knot for ghostlaces!" })%>
</div>
```

The resulting output inserts the speech bubble HTML into your final generated page:

```html
<div class="page">
  <p>Ian's Secure Knot is one of my favorite shoelace knots.</p>
  <div class="speech-bubble">
    <img src="/static/phanto.png" class="avatar" />
    <h3>phanto</h3>
    <p>I have successfully adapted Ian's Secure Knot for ghostlaces!</p>
  </div>
</div>
```

### Templates: Global Site Layout

Templates are like includes, but they wrap around an entire file instead of inserting a snippet of code into it. They're primarily useful for the base HTML code that every page on your website needs.

Create a template file in your source directory named `.templates/default.html`:

```erb
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Phanto's Ghostlace Site</title>
  </head>
  <body>
    <h1>Phanto's Ghostlace Site</h1>
    <%- output.content %>
  </body>
</html>
```

Any file can then add a `template` marker to get their content wrapped in the template:

```html
---
title: How to Contact Me
template: default
---

<h2>How to Contact Me</h2>
<p>That is a good question! I am still figuring this out.</p>
```

Templates also have access to the attributes in a file's YAML frontmatter. For example, if you add a `title` attribute to your pages, you can include it in the `<title>` tag in your global template:

```erb
<title><%- output.file.attributes.title %> - Phanto's Ghostlace Site</title>
```

### Pagination and Markdown: Personal Blog

You can combine pagination, EJS templates, and Markdown support to add a blog to your website.

Let's say you want your blog to be under the `/blog` URL on your website. You may also want your blog posts to have slug URLs like `/blog/my-blog-post/`. Let's create a post in our source folder named `blog/my-blog-post/index.md`:

```md
---
title: My Blog Post
description: A small post for testing purposes.
date: 2017-4-25 08:57:00 -0700
---

# My Blog Post

Hello! This is the first post in my new blog!
```

Since the blog index should be at `/blog`, create a file for it at `blog/index.html.ejs`:

```erb
<%# The `./*/index.md` pattern matches each individual blog post file. %>
<% const paginator = ctx.paginate(ctx.getFiles('./*/index.md'), {itemsPerPage: 5}) %>

<%# For each blog post, show the title and description and link to the full post. %>
<% for (const file of paginator.items) { %>
  <div class="blog-post">
    <h2><a href="<%- file.url ->"><%- file.attributes.title %></a></h2>
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

This will create a page at `/blog` that lists all of our blog posts in pages of 5 posts each, with links to each page at the bottom. If you add 5 more test posts, you will see a second page added to the listing.

However, the order of the posts may be random. You can solve this by using the `date` field in each blog post and passing extra arguments to `ctx.getFiles` telling it to sort by date:

```erb
<%
  const paginator = ctx.paginate(
    ctx.getFiles('./*/index.md', {sort: {attribute: 'date', type: 'date', order: 'desc'}}),
    {itemsPerPage: 5},
  )
%>
```

This causes `ctx.getFiles` to return your blog post files sorted by the `date` attribute in their YAML frontmatter, in descending (i.e. most recent first) order.

If you wanted the blog post listing to include the full blog posts instead of their descriptions, you could replace the description with the `ctx.renderMarkdown` helper and pass it the un-rendered Markdown of the post:

```erb
<% for (const file of paginator.items) { %>
  <div class="blog-post">
    <%- ctx.renderMarkdown(file.body) %>
  </div>
<% } %>
```
