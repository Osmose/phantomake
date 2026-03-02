import dedent from 'dedent';
import { describe } from 'bun:test';
import { testInputFiles } from './utils';

describe('Context', () => {
  describe('getFile', () => {
    testInputFiles('matches a single file via filename', {
      'otherfile.html': '<div>Other</div>',
      'page.html.ejs': dedent`
        <h1>Page</h1>
        <p><%- ctx.getFile('otherfile.html').body %></p>
      `,
    });

    testInputFiles('supports absolute paths', {
      'otherfile.html': '<div>Other</div>',
      'child/directory/page.html.ejs': dedent`
        <h1>Page</h1>
        <p><%- ctx.getFile('/otherfile.html').body %></p>
      `,
    });

    testInputFiles('returns null if the file does not exist', {
      'child/directory/page.html.ejs': dedent`
        <h1>Page</h1>
        <p><%= ctx.getFile('/otherfile.html') === null %></p>
      `,
    });
  });

  describe('readJson', () => {
    testInputFiles('can read JSON from a file', {
      'data.json': '{"foo": "bar"}',
      'page.html.ejs': dedent`
        <h1>Page</h1>
        <p><%= ctx.readJson('data.json').foo %></p>
      `,
    });
  });

  describe('getFiles', () => {
    testInputFiles('matches files via glob syntax', {
      'children/child1.html': '<div>Child 1</div>',
      'children/child2.html': '<div>Child 2</div>',
      'children/child3.txt': 'Child 3',
      'page.html.ejs': dedent`
        <% for (const page of ctx.getFiles('children/*.html')) { %>
          <a href="<%= page.url %>"><%- page.body %></a>
        <% } %>
      `,
    });

    testInputFiles('accepts multiple glob patterns', {
      'children/child1.html': '<div>Child 1</div>',
      'children/child2.html': '<div>Child 2</div>',
      'children2/child3.html': '<div>Child 3</div>',
      'page.html.ejs': dedent`
        <% for (const page of ctx.getFiles(['children/*.html', 'children2/*.html'])) { %>
          <a href="<%= page.url %>"><%- page.body %></a>
        <% } %>
      `,
    });
  });
});
