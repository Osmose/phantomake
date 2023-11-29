---
title: Overview
---

<div class="overview-summary-phanto">

<div class="summary">

### What is Phantomake?

Phantomake is a static site generator with specific goals:

- Distributed as a single, standalone executable
- When run on an existing static site, will (in most cases) output the exact same site with no changes
- Can reuse common code (headers/footers/common HTML) across several pages with templates and includes
- Can do pagination (e.g. for blog listings)

</div>

<div class="phanto">
  <img src="left_phantomake.png" title="Phanto" alt="Phanto, the construction-hat-wearing ghost mascot of Phantomake." class="phanto">
</div>

</div>

<p class="hero-text">Phantomake turns files like this:</p>

<div class="side-by-side">

<div class="code-block-with-filename">

<div class="filename">📄 /src/.templates/default.ejs</div>

```erb
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Phanto's Ghostlace Site</title>
  </head>
  <body>
    <h1>
      <%- output.file.attributes.title %>
    </h1>
    <%- output.content %>
  </body>
</html>
```

</div>

<div class="code-block-with-filename">

<div class="filename">📄 /src/favorites.md</div>

```md
---
title: My Favorite Ghostlace Knots
---
I'd like to share with you a few of my
favorite ghostlace knots!

1. [Phanto's Secure Knot](secure.html)
2. [Reef Knot](reef.html)
3. [Berluti Knot](berluti.html)
```
</div>

</div>

<p class="hero-text">into this:<p>

<div class="code-block-with-filename">

<div class="filename">📄 /output/favorites.html</div>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Phanto's Ghostlace Site</title>
  </head>
  <body>
    <h1>My Favorite Ghostlace Knots</h1>
    <p>I'd like to share with you a few of my favorite ghostlace knots!</p>
    <ol>
      <li><a href="secure.html">Phanto's Secure Knot</a></li>
      <li><a href="reef.html">Reef Knot</a></li>
      <li><a href="berluti.html">Berluti Knot</a></li>
    </ol>
  </body>
</html>
```

</div>
