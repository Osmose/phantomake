<div align="center">
  <a href="github.com/Osmose/phantomake"><img src="phantomake.png"></a>
  <h3>Phantomake</h3>
  <p>A file-focused static site generator.</p>
  <p><a href="https://www.osmose.ceo/phantomake/">Documentation</a> - <a href="https://www.osmose.ceo/phantomake/download.html">Download</a> - <a href="https://www.osmose.ceo/phantomake/examples/">Examples</a></p>
</div>

## About

Phantomake is a static site generator with specific goals:

- Distributed as a single, standalone executable
- When run on an existing static site, will (in most cases) output the exact same site with no changes
- Can reuse common code (headers/footers/common HTML) across several pages with templates and includes
- Can do pagination (e.g. for blog listings)

Phantomake is available as a terminal command or the PhantoGUI app for desktop use.

Phantomake is written in [TypeScript](https://www.typescriptlang.org/) and runs on [Bun](https://bun.sh/). PhantoGUI is built using [Tauri](https://tauri.app/).

## Install

Binaries and PhantoGUI installers for MacOS, Linux, and Windows are available from the [Releases](https://github.com/Osmose/phantomake/releases) page. Or, use the links below to fetch the latest builds:

- `phantomake` standalone binary
  - [MacOS](https://github.com/Osmose/phantomake/releases/latest/download/phantomake-macos.tar.gz)
  - [Linux](https://github.com/Osmose/phantomake/releases/latest/download/phantomake-linux.tar.gz)
  - [Windows](https://github.com/Osmose/phantomake/releases/latest/download/phantomake-windows.zip)
- PhantoGUI
  - [MacOS](https://github.com/Osmose/phantomake/releases/latest/download/PhantoGUI_0.1.0_universal.dmg)
  - [Windows Installer](https://github.com/Osmose/phantomake/releases/latest/download/PhantoGUI_0.1.0_x64_en-US.msi)
  - Linux
    - [AppImage](https://github.com/Osmose/phantomake/releases/latest/download/phanto-gui_0.1.0_amd64.AppImage)
    - [deb](https://github.com/Osmose/phantomake/releases/latest/download/phanto-gui_0.1.0_amd64.deb)
    - [rpm](https://github.com/Osmose/phantomake/releases/latest/download/phanto-gui-0.1.0-1.x86_64.rpm)

If you have [Bun](https://bun.sh/) installed, you can also install Phantomake as a global package:

```sh
bun add -g https://github.com/Osmose/phantomake/releases/latest/download/source.tar.gz
```

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

See [the full documentation](https://www.osmose.ceo/phantomake/features.html) for more information.

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
    <%- include('.header.html') %>
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

## License

Phantomake is distributed under the [ISC license](LICENSE).
