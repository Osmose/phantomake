---
title: Examples
---

### Reusable HTML (Includes)

[Includes](../features.html#includes) are primarily useful when you have a block of HTML that you want to reuse in multiple places. For example, you may want to put speech bubbles on your webpage that represent different headmates talking. The HTML may look like this:

```html
<div class="speech-bubble">
  <img src="/static/phanto.png" class="avatar" />
  <h3>phanto</h3>
  <p>I have successfully adapted Ian's Secure Knot for ghostlaces!</p>
</div>
```

This can be annoying to copy-paste, and especially annoying to update with new HTML. We can rewrite this to be an EJS include:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/.includes/speech-bubble.ejs</div>

  ```erb
  <div class="speech-bubble">
    <img src="/static/<%- name %>.png" class="avatar">
    <h3><%- name %></h3>
    <p><%- text %></p>
  </div>
  ```
</div>

Then, in any page we want to include a speech bubble, we can add an `.ejs` extension and use `include`:

<div class="code-block-with-filename">
  <div class="filename">📄 /src/index.html.ejs</div>

  ```erb
  <div class="page">
    <p>Ian's Secure Knot is one of my favorite shoelace knots.</p>
    <%-
      include('.includes/speech-bubble.ejs', {
        name: 'phanto',
        text: "I have successfully adapted Ian's Secure Knot for ghostlaces!",
      })
    %>
  </div>
  ```
</div>

The resulting output inserts the speech bubble HTML into your final generated page:

<div class="code-block-with-filename">
  <div class="filename">📄 /output/index.html</div>

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
</div>
