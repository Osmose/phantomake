---
title: Syndicated (RSS/Atom) Feeds
---

### Syndicated (RSS/Atom) Feeds

[Web feeds](https://en.wikipedia.org/wiki/Web_feed) use formats like [RSS](https://en.wikipedia.org/wiki/RSS) or [Atom](https://en.wikipedia.org/wiki/Atom_(web_standard)) to list content available on your site so that feed aggregator software can subscribe for updates whenever you release new content. Since EJS can be used to generate any type of text file and not only HTML, Phantomake can be used to generate a feed for your statically-generated site.

#### Prerequisites

This guide assumes that your content is separated into individual `index.md` files in separate subdirectories, e.g. `/blog/post-1/index.md`, `/blog/post-2/index.md`, and so on. These files should have [YAML Frontmatter](../features.html#yaml-frontmatter) in them with some metadata we'll need for generating the feed. At a minimum it is recommended to have a `title` and `date` field on each of your files:

<div class="code-block-with-filename">
  <div class="filename">📄 /blog/test-post-1/index.md</div>

  ```text
    ---
    title: My Blog Post
    date: 2017-4-25 08:57:00 -0700
    ---
    # My Blog Post

    Hello! This is the first post in my new blog!
  ```
</div>

> [!NOTE]
> The date fields used in this guide are in [ISO8601](https://en.wikipedia.org/wiki/ISO_8601) format. You can use a site like [time.lol](https://time.lol/) to generate these if needed.

#### `feed.xml.ejs`

Create a new file for your feed with an `.ejs` extension. We recommend naming it `feed.xml.ejs` and putting it in the shared root directory of your blog posts:

<div class="code-block-with-filename">
  <div class="filename">📄 /blog/feed.xml.ejs</div>

  ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <!-- Metadata for the feed you can edit freely. -->
      <title>My Blog Title</title>
      <subtitle>My Blog Subtitle</subtitle>
      <author>
        <name>My Name</name>
      </author>

      <!-- Generate a unique ID based off the URL and a static date. -->
      <id><%- ctx.tagUri(ctx.currentUrl(true), new Date(2023, 11, 23)) %></id>

      <!-- Provide an absolute link back to the feed. -->
      <link href="<%- ctx.currentUrl(true) %>" rel="self" />

      <!-- Set the last updated date to whenever this file is generated. -->
      <updated><%- ctx.formatDate(ctx.now()) %></updated>

      <!-- Generate an <entry> tag for each index.md file within a directory adjacent to this file.
           The entries will be sorted by date with the most recent first. -->
      <% for (const file of ctx.getFiles('./*/index.md', {sort: {attribute: 'date', type: 'date', order: 'desc'}})) { %>
        <entry>
          <!-- Use the frontmatter (available under file.attributes) to fill out post info. -->
          <title><%- file.attributes.title %></title>
          <link href="<%- ctx.absolutify(file.url) %>" />
          <id><%- ctx.tagUri(ctx.absolutify(file.url), new Date(file.attributes.date)) %></id>
          <published><%- ctx.formatDate(file.attributes.date) %></published>
        </entry>
      <% } %>
    </feed>
  ```
</div>

This will generate a `/blog/feed.xml` file in your final generated site that lists your posts in the Atom feed format.

#### Autodiscovery

Besides providing a link to your feed, you may also add a link to it in your webpage's `<head>` section. Tools for feeds, such as browser extensions, can detect this link and inform the user that a feed is available for the current site they're viewing:

```html
<head>
  <link rel="alternate" type="application/atom+xml" title="My Atom Feed" href="/blog/feed.xml" />
</head>
```
