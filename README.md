<div align="center">
  <a href="github.com/Osmose/phantomake"><img src="phantomake.png"></a>
  <h3>Phantomake</h3>
  <p>A file-focused static site generator.</p>
</div>

## About

Phantomake is a static site generator with specific goals:

- Be distributed as a single, standalone executable
- When run on an existing static site, will (in most cases) output the exact same site with no changes
- Can reuse common code (headers/footers/common HTML) across several pages with templates and includes
- Can do pagination (e.g. for blog listings)

Phantomake is written in [TypeScript](https://www.typescriptlang.org/) and runs on [Bun](https://bun.sh/).

## Install

- [ ] TODO: Link to automated builds once they are running.
- [ ] TODO: Publish on npm.

## Usage

Phantomake takes two arguments: a source directory and an output directory. It processes the source files and generates output files in the output directory:

```sh
phantomake /path/to/source /path/to/output
```

Phantomake will transform files that meet one of the following criteria:

- Any file with a `.ejs` extension will be processed as an [EJS template](https://ejs.co/).
- Any file with a `.md` extension will be processed as [Markdown](https://www.markdownguide.org/).
- Any text file (including `.ejs` or `.md` files) with a `template` value in [YAML front matter](https://jekyllrb.com/docs/front-matter/) will have a template applied to its output.
- Any dotfile or dot directory (with a `.` at the start of its name) is not included in the output.

All files that don't match any of these are copied without changes from the source to the output.

### Example: Shared Header

Let's say we have a header for our website that we don't want to have to copy-paste to every page whenever we update it. We can put this header in a separate file:

```html
<!-- src/.header.html -->
<header class="header-container">
  <h1>Phanto's Ghostlace Site</h1>
  <nav class="links">
    <a href="/">Home</a>
    <a href="/blog">Blog</a>
  </nav>
</header>
```

We can add the `.ejs` extension to our HTML files and use the `include` function of EJS to embed the content of `header.html` in the generated output:

```html
<!-- src/index.html.ejs -->
<html>
  <head>
    <title>Phanto's Ghostlace Site</title>
  </head>
  <body>
    <!-- EJS templates use <% %> to mark template logic. The dash at the start
         means "output the return value of this function". -->
    <%- include('header.html') %>
    <h2>Homepage</h2>
    <p>Welcome to Phanto's Ghostlace Site</p>
  </body>
</html>
```

Now we can run Phantomake:

```sh
phantomake src output
```

This will create an `output/index.html` file with our shared header:

```html
<!-- output/index.html -->
<html>
  <head>
    <title>Phanto's Ghostlace Site</title>
  </head>
  <body>
    <header class="header-container">
      <h1>Phanto's Ghostlace Site</h1>
      <nav class="links">
        <a href="/">Home</a>
        <a href="/blog">Blog</a>
      </nav>
    </header>
    <h2>Homepage</h2>
    <p>Welcome to Phanto's Ghostlace Site</p>
  </body>
</html>
```

## Developer Setup

Before working on Phantomake you'll need a few tools:

- [Git](https://git-scm.com/)
- [Bun](https://bun.sh/)

To set up your development copy:

1. Check out the repo:

   ```sh
   git clone https://github.com/Osmose/phantomake.git
   cd phantomake
   ```

2. Install the dependencies:

   ```sh
   bun install
   ```

After this you can run the Phantomake CLI of your development copy using `bun cli` instead of `phantomake`:

```sh
bun cli watch ./example --verbose
```

## License

Phantomake is distributed under the [ISC license](LICENSE).
