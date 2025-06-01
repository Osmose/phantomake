import dedent from 'dedent';
import { describe } from 'bun:test';
import { testInputFiles } from './utils';

describe('Paginator', () => {
  testInputFiles('Rendering items per-page', {
    'page.html.ejs': dedent`
      <h1>Pagination</h1>
      <% const paginator = ctx.paginate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], {itemsPerPage: 3}) -%>
      <% for (const number of paginator.items) { -%>
        <div><%- number %></div>
      <% } %>
    `,
  });

  testInputFiles('Rendering a pagination control', {
    'page.html.ejs': dedent`
      <h1>Pagination</h1>
      <% const paginator = ctx.paginate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], {itemsPerPage: 3}) -%>
      <ul>
        <% if (paginator.previousPage) { -%>
          <li><a href="<%- paginator.previousPage.url %>">Prev</a></li>
        <% } -%>
        <% for (const page of paginator.pages) { -%>
          <li>
            <% if (page.isCurrentPage) { -%>
              <%- page.number %>
            <% } else { -%>
              <a href="<%- page.url %>"><%- page.number %></a>
            <% } -%>
          </li>
        <% } -%>
        <% if (paginator.nextPage) { -%>
          <li><a href="<%- paginator.nextPage.url %>">Next</a></li>
        <% } -%>
      </ul>
    `,
  });
});
