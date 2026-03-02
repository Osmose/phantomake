import dedent from 'dedent';
import { describe } from 'bun:test';
import { testInputFiles } from './utils';

describe('Context', () => {
  describe('getFiles', () => {
    testInputFiles('matches files via glob syntax', {
      'children/child1.html': '<div>Child 1</div>',
      'children/child2.html': '<div>Child 2</div>',
      'children/child3.txt': 'Child 3',
      'page.html.ejs': dedent`
        <% for (const page of ctx.getFiles('children/*.html')) { %>
          <a href="<%= page.url %>"><%= page.body %></a>
        <% } %>
      `,
    });

    testInputFiles('accepts multiple glob patterns', {
      'children/child1.html': '<div>Child 1</div>',
      'children/child2.html': '<div>Child 2</div>',
      'children2/child3.html': '<div>Child 3</div>',
      'page.html.ejs': dedent`
        <% for (const page of ctx.getFiles(['children/*.html', 'children2/*.html'])) { %>
          <a href="<%= page.url %>"><%= page.body %></a>
        <% } %>
      `,
    });
  });
});
