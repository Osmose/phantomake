---
title: Examples
---

### Global Site Layout (Templates)

[Templates](../features.html#templates) are like includes, but they wrap around an entire file instead of inserting a snippet of code into it. They're primarily useful for the base HTML code that every page on your website needs.

Create a template file in your source directory within the `.templates` directory:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/.templates/default.ejs</div>

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
</div>

Any file can then add a `template` marker to get their content wrapped in the template:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/contact.html.ejs</div>

  ```html
  ---
  title: How to Contact Me
  template: default
  ---

  <h2>How to Contact Me</h2>
  <p>That is a good question! I am still figuring this out.</p>
  ```
</div>

Templates also have access to the attributes in a file's YAML frontmatter. For example, if you add a `title` attribute to your pages, you can include it in the `<title>` tag in your global template:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/.templates/default.ejs</div>

  ```erb
  <title><%- output.file.attributes.title %> - Phanto's Ghostlace Site</title>
  ```
</div>
