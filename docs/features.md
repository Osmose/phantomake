---
title: Features
---

### Processing

Phantomake transforms a source directory into an output directory by processing each individual file in the source directory and determining if any modifications need to be made before copying it to the output directory. This page describes _how_ files may be transformed during processing.

<nav class="toc">
  <span class="toc-title">Contents</span>
  <ul>
    <li><a href="#copied-files-and-hidden-files">Copied Files and Hidden Files</a></li>
    <li><a href="#yaml-frontmatter">YAML Frontmatter</a></li>
    <li><a href="#templates">Templates</a></li>
    <li>
      <a href="#markdown">Markdown</a>
      <ul class="subtoc">
        <li><a href="#templates-1">Templates</a></li>
        <li><a href="#syntax-highlighting">Syntax Highlighting</a></li>
        <li><a href="#includes">Includes</a></li>
      </ul>
    </li>
    <li>
      <a href="#ejs">EJS</a>
      <ul class="subtoc">
        <li><a href="#file-context">File Context</a></li>
        <li><a href="#includes-1">Includes</a></li>
        <li><a href="#pagination">Pagination</a></li>
      </ul>
    </li>
  </ul>
</nav>

#### Copied Files and Hidden Files

Any file that doesn't have special processing involved (e.g. images, HTML files with no EJS, etc.) is copied from the source directory to the output directory with no changes.

The exception is hidden files, which are _not_ copied to the output at all. Hidden files are files that start with a `.` in their filename, or that are within a directory that starts with a `.`. For example, both `.shared_header.html` and `.includes/shared_header.html` will not be included in the output directory. This is useful for includes and templates that are needed for processing but you do not want to have their own pages on your final generated site.

#### YAML Frontmatter

[YAML Frontmatter](https://jekyllrb.com/docs/front-matter/) is a convention for storing metadata about a file written in [YAML](https://yaml.org/). It looks like this:

```html
---
title: Phanto's Ghostlace Site
author: Phanto
---

<html>
  <body>
    <p>Welcome to my ghostlace site!</p>
  </body>
</html>
```

Phantomake uses YAML frontmatter for specifying templates, as well as storing data for use in EJS. Because of this, **any text file with YAML frontmatter at the top will have it parsed and removed from that file's output.** This applies to both processed files (Markdown, EJS) and otherwise unprocessed text files (`*.txt` files, JSON files, etc.).

#### Templates

Templates are files that can be "wrapped" around other files in an easy and reusable way. They're primarily useful for defining the base HTML code for your website that other pages are wrapped in without having to copy-paste the HTML between every page on your site. Templates are not specific to HTML, however—you can have a template that generates JavaScript, JSON, or any other text format.

Templates are stored in the `.templates` directory at the root of your source folder. A template's name is its filename with the file extension removed, i.e. the `default` template is expected to be `.templates/default.ejs` in your source folder.

Templates files are written in EJS and have their own file context (`ctx`) just like standard Phantomake EJS files. Unlike standard files, templates have access to another variable: the `output` variable, containing data on the file the template is _applied_ to:

```erb
<html>
  <body>
    <h1>Phanto's Ghostlace Site</h1>
    <article>
      <%# output.file is the InputFile object for the processed file %>
      <h2><%- output.file.attributes.title %></h2>

      <div class="content">
        <%# output.content is the processed output of the file %>
        <%- output.content %>
      </div>
    </article>
  </body>
</html>
```

To apply a template to a file, you include the name of the template in its YAML frontmatter:

```html
---
template: default
---

<p>I have been writing about ghostlaces for over 300 years.</p>
```

Because templates are under the `.templates` dot directory, they are not included in your generated output.

#### Markdown

Files with an `*.md` extension are processed as [Markdown](https://www.markdownguide.org/) and transformed into HTML. The output file's extension is replaced with `*.html`.

Phantomake supports [Github-flavored Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax), which has extra features on top of standard Markdown:

```md
# Autolinking literals

www.example.com, https://example.com, and contact@example.com.

# Footnotes

A note[^1]

[^1]: Big note.

# Strikethrough

~one~ or ~~two~~ tildes.

# Tables

| a   | b   |   c |  d  |
| --- | :-- | --: | :-: |

# Tasklists

- [ ] to do
- [x] done

# Blockquote admonitions

> [!NOTE]
> Highlights information that users should take into account, even when skimming.

> [!WARNING]
> Critical content demanding immediate user attention due to potential risks.
```

##### Templates

Markdown files are assumed to use templates since Markdown doesn't generate a complete HTML page. If no template is sepcified, Phantomake defaults to applying the `default` template to all Markdown files.

##### Syntax Highlighting

Code fences with syntax highlighting are also supported:

````md
```js
function add(a, b) {
  return a + b;
}
```
````

Code fences output HTML that uses [highlight.js](https://highlightjs.org/)-compatible CSS classes. You will need to include CSS for styling these classes correctly. The easiest way is to pull the CSS from a public CDN, like [cdnjs](https://cdnjs.com/libraries/highlight.js):

```html
<!-- Put this in your <head> tag to use the Atom One Dark theme.
     Change the `atom-one-dark` part to use a different theme. -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css" />
```

The [highlight.js examples preview](https://highlightjs.org/examples) can help you find a theme that matches your site design.

##### Includes

Markdown files can use the `include` directive to pull the content of another file and embed it into the current file:

```md
# Section Header

This paragraph includes an inline include :include{path="path/to/.include.md"}

The next paragraph has a block-level include.

::include{path="path/to/.include.md"}
```

Included Markdown files will also be transformed into HTML before being inserted. Templates are **not** applied to included Markdown files.

You may pass extra arguments to the `include` directive, and EJS files may access these arguments as variables:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/main.md</div>

  ```md
  The sum of 2 plus 2 is :include{path=".add.ejs" arg1=2 arg2=2}
  ```
</div>

<div class="code-block-with-filename">
  <div class="filename">📄 /src/.add.ejs</div>

  ```erb
  <%- Number.parseInt(arg1) + Number.parseInt(arg2) -%>
  ```
</div>

> [!NOTE]
> All arguments passed to EJS templates via `include` are strings.

#### EJS

Files with a `*.ejs` extension are processed as [EJS](https://ejs.co/). The output filename has the `.ejs` extension removed—if you want to generate an HTML file with EJS, you would name the file `index.html.ejs` and the output file would be named `index.html`.

EJS allows you to run JavaScript code while processing a file. It uses `<% %>` tags to separate JavaScript code from the content included in the output file.

```erb
<% if (1 + 1 == 2) { %>
  <p>This will be rendered in the output because the condition is true.</p>
<% } else { %>
  <p>This will not be rendered in the output because the condition is true.</p>
<% } %>
```

You can put a `-` at the start to take a value in JavaScript and print the result in the output.

```erb
<p>The sum of 3852 and 250572 is <%- (3852 + 250572) %>.</p>
```

##### File Context

EJS templates have access to the `ctx` variable, called the "file context", which is a variable containing useful functions and data about the file being rendered.

```erb
---
title: Phanto's Ghostlace Site
last_updated: 2017-4-25 08:57:00 -0700
---
<div class="page">
  <h2><%- ctx.file.attributes.title %></h2>
  <p>Last Updated: <%- ctx.formatDate(ctx.file.attributes.last_updated, 'MMMM D, YYYY') %></p>
</div>
```

See the [API docs](./api.html#the-filecontext-class) for a complete description of the functions available on the file context.

##### Includes

EJS has an `include` function that pulls the content of another file and embeds them into the output:

```erb
<div class="page">
  <%- include('.includes/shared_header.html') %>
  <h2>The Phanto Ghostlace Knot</h2>
</div>
```

`include` paths are relative to the file being processed; absolute paths are relative to the source directory passed to `phantomake`. It's recommended that include files are hidden with a `.` filename or in a dot-directory so that they aren't accidentally included in your output on their own.

> [!NOTE]
> Included files don't have access to the same variables as the current file, such as the file context. You can use the second argument to `include` to pass needed variables instead.
>
> ```erb
> <%- include('.includes/shared_header.html', { title: ctx.file.attributes.title }) %>
> ```

##### Pagination

Pagination allows you to take a list of files and display them on multiple pages. It's achieved using the `ctx.paginate` and `ctx.getFiles` functions:

```erb
<%# ctx.getFiles returns a list of files that match a glob pattern. %>
<%# ctx.paginate creates a paginator that contains all the items on the current "page". %>
<% const paginator = ctx.paginate(ctx.getFiles('./*/index.html'), {itemsPerPage: 5}) %>

<h2>Blog</h2>
<ul>
  <%# paginator.items is an array of the items to be displayed on the current page. %>
  <%# The template will be processed once for each page, with a different items list each time. %>
  <% for (const file of paginator.items) { %>
    <li><a href="<%- file.url %>"><%- file.attributes.title %></a></li>
  <% } %>
</ul>

<h2>Pages</h2>
<div>
  <%# paginator.pages is an array of page objects with page numbers and URLs. %>
  <% for (const page of paginator.pages) { %>
    <a class="page-number" href="<%- page.url %>"><%- page.number %></a>
  <% } %>
</div>
```

A single file that calls `ctx.paginate` will generate **multiple** output files depending on how many pages need to be generated. The filenames of the output files depending on the source filename:

- If the source filename is `index.html.ejs`, the output filenames will be `1.html`, `2.html`, and so on.
- Otherwise, the page number is appended to the filename, e.g. `blog.html` will output `blog1.html`, `blog2.html`, and so on.

> [!NOTE]
> The first page will actually be output twice—once with the 1 page number and once without. For example, `index.html.ejs` will output the first page at both `index.html` and `1.html`. This lets you be flexible on how you link to a paginated file.

See the [API docs](./api.html#ctxpaginateitems-config) for a complete description of the pagination API.
