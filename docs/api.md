---
title: API Reference
---
<div class="api-container">

<div class="api-toc">
  <nav class="toc">
    <span class="toc-title">Contents</span>
    <ul>
      <li><a href="#the-filecontext-class">FileContext</a></li>
      <li><a href="#the-inputfile-class">InputFile</a></li>
      <li><a href="#the-paginator-class">Paginator</a></li>
      <li><a href="#the-output-object">output</a></li>
    </ul>
  </nav>
</div>

<div class="api-content">

### The `FileContext` class
The `FileContext` class contains data about an EJS file being rendered, as well as utility functions for use in EJS files. A `FileContext` instance is available in every EJS file as the `ctx` variable.

---

#### `ctx.file`
The `file` property is an [InputFile](#inputfile) instance for the EJS file being processed.

> [!NOTE]
> For EJS files in the `.templates` directory that are being applied as [templates](features.html#templates), this is the InputFile instance for the template and **not** the file that the template is being applied to.

---

#### `ctx.getFiles(pattern, options?)`
The `ctx.getFiles()` method searches for files matching a [glob pattern](https://www.digitalocean.com/community/tools/glob) and returns a list of [InputFile](#inputfile) instances for the matched files. Patterns are treated as relative to the EJS file being processed.

##### `options.sort?`
If `options.sort` is provided, the list matched files will be sorted by an attribute from their YAML frontmatter. This can be used to sort files by a title or date field. `options.sort` is an object that looks like:

```ts
{
  /** Required, the name of the frontmatter attribute to sort by. */
  attribute: 'attributeName',

  /** Optional, can be 'asc' or 'desc' to signify whether files are sorted
      in ascending or descending order. */
  order: 'asc',

  /** Optional, can be 'string' or 'date' to signify how to parse the value of
      the attribute being sorted by. */
  type: 'string',
}
```

---

#### `ctx.paginate(items, config?)`
The `ctx.paginate()` method marks the current file as being [paginated](features.html#pagination) and returns a [Paginator](#paginator) instance. The list of items will be split into pages of `config.itemsPerPage` items each, and the EJS file will be rendered once for each page. On each render, the Paginator instance returned by `ctx.paginate()` will have a different list of values in [`paginator.items`](#paginatoritems) as well as a different [`paginator.currentPage`](#paginatorcurrentpage) value.

`ctx.paginate()` can only be called once per-file. Subsequent calls will return the Paginator created by the first call in the file.

[Templates](features.html#templates) cannot be paginated.

##### `config.itemsPerPage?`
The maximum number of items for each page. Defaults to `5`.

---

#### `ctx.renderMarkdown(content)`
The `ctx.renderMarkdown()` method renders a string of Markdown into a string of HTML. It's useful when combined with the [`body`](#inputfilebody) attribute of an InputFile instance for a Markdown file.

---

#### `ctx.formatDate(dateString, template)`
Parses a date in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format, and then reformats it to match a template with [Day.js date formatting](https://day.js.org/docs/en/display/format).

---

#### `ctx.absolutify(url)`
`ctx.absolutify()` takes a relative URL string and turns it into an absolute URL, with a full domain. Using this requires that you provide the `--base-url` option to `phantomake` containing the base origin that your static site will be hosted at:

```sh
phantomake --base-url https://osmose.ceo/phantomake docs docs_output
```

URLs are parsed relative to the EJS file that `ctx.absolutify()` is called in.

---

#### `ctx.readJson(path)`
The `ctx.readJson()` method reads a file located at the given path (relative to the current EJS file) and parses it as JSON, returning the parsed result.

---

#### `ctx.now()`
Returns a [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object for the time at which the site was most recently generated.

---

#### `ctx.currentUrl(absolute?)`
Returns the URL for the current file. If `absolute` is true, returns an absolute URI using [`ctx.absolutify`](#ctxabsolutifyurl), which requires the `--base-url` option.

---

#### `ctx.tagUri(uri, date)`
Creates a ([tag URI](https://www.ietf.org/rfc/rfc4151.txt)) based on the given URI and date.

Tag URIs are useful when generating [Atom feeds](examples/atom_feed.html) that require unique IDs that are valid [IRIs](https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier).

### The `InputFile` class
Every file in the source directory passed to Phantomake has an instance of the `InputFile` class that stores metadata about the file used during processing. These instances are available through the [`ctx.file`](#ctxfile) property or are returned from [`ctx.getFiles()`](#ctxgetfilespattern-options).

Both text and binary files are represented by `InputFile`, but text files have a few extra attributes available as Phantomake loads and parses them to see if they have any frontmatter at the top.

---

#### `inputFile.path`
Absolute path to the file represented by this `InputFile` instance.

---

#### `inputFile.relativePath`
File path to the file represented by this instance, relative to the root source directory given to `phantomake`.

---

#### `inputFile.parsedRelativePath`
The return value of calling [Node's `path.parse()`](https://nodejs.org/api/path.html#pathparsepath) on this file's `relativePath`.

---

#### `inputFile.url`
The URL that the output generated by this `InputFile` will be located at, relative to the output directory.

> [!NOTE]
> For paginated pages, `inputFile.url` will return a URL to the first page in the series.

---

#### `inputFile.isText`
A boolean indicating whether this file was detected as a text or binary file. Files are detected based on their file extension.

---

#### `inputFile.body`
**TEXT FILES ONLY.** Contains the raw text of the file represented by this instance before any processing, including YAML frontmatter.

---

#### `inputFile.attributes`
**TEXT FILES ONLY.** Contains the parsed YAML frontmatter for this file. Defaults to an empty object if no frontmatter is found.

### The `Paginator` class
An instance of the `Paginator` class is returned from [`ctx.paginate`](#ctxpaginateitems-config). It contains a list of the items for the current page being rendered, as well as information on all the available pages to help build a pagination UI. See the [pagination example](./examples/pagination.html) for how to use this instance in a template.

---

#### `paginator.items`
An array of items to be rendered on the current page. `paginator.items` is a subset of the items passed to `ctx.paginate` and is different for each rendered page output during pagination.

---

#### `paginator.currentPage`
The page number for the current page. Page numbers are 1-indexed, meaning the first page is 1 rather than 0, so as to be suitable for displaying in a template.

---

#### `paginator.pages`
A list of page objects for all the pages that will be generated for the current file. Pages are objects of the form:

```ts
{
  url: '/path/to/output2.html', // URL to the output file for this page
  number: 2, // 1-indexed page number
}
```

### The `output` object
[Templates](./features.html#templates) within the `.templates` directory are rendered with an extra `output` variable that contains data for the base file that is applying the template. EJS files that aren't used as templates do not have an `output` object available.

---

#### `output.content`
A string containing the processed output of the file applying the template, such as the HTML for a Markdown file or the rendered content of an EJS file.

---

#### `output.file`
An [`InputFile` instance](#the-inputfile-class) for the file the template is being applied to. This is very useful for accessing `output.file.attributes` to read the frontmatter attributes of the file the template is being applied to for things like titles, dates, and other metadata.

---

#### `output.path`
File path (relative to the output directory) where the output file will be written. Can be used to determine which file the template is being applied to, e.g. to add a "selected" class to a navigation link corresponding to the current page:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/.templates/default.ejs</div>

  ```erb
  <a
    class="topbar-nav-link <%- output.path === 'api.html' && 'selected' %>"
    href="<%- ctx.absolutify('../api.html') %>"
  >
    API
  </a>
  ```
</div>

</div>

</div>
