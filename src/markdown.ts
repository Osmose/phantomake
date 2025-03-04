import * as nodePath from 'node:path';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { all } from 'lowlight';
import rehypeSlug from 'rehype-slug';
import admonitionPlugin from 'remark-github-beta-blockquote-admonitions';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkDirective from 'remark-directive';
import { Root, Parent } from 'mdast';
import { VFile } from 'vfile';
import { visit } from 'unist-util-visit';
import { ContainerDirective, LeafDirective, TextDirective } from 'mdast-util-directive';
import { FileContext } from './context';

export default function renderMarkdown(content: string, fileContext?: FileContext) {
  const vFile = unified()
    .use(remarkParse)
    .use(remarkGfm)
    // @ts-ignore Not sure why TS thinks this needs an array of booleans
    .use(admonitionPlugin, {
      classNameMaps: {
        block: (title: string) => `admonition ${title.toLowerCase()}`,
        title: 'admonition-title',
      },
    })
    .use(remarkDirective)
    .use(ejsRemarkPlugin, { fileContext })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeHighlight, { languages: all })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .processSync(content);
  return String(vFile);
}

type Directive = ContainerDirective | LeafDirective | TextDirective;

function ejsRemarkPlugin({ fileContext }: { fileContext?: FileContext }) {
  return function (tree: Root) {
    // Includes are not available if rendering a string with no file
    if (!fileContext) {
      return;
    }

    const directiveReplacements: [Directive, number, Parent][] = [];
    visit(tree, (node, index, parent) => {
      // Can't replace without an index and parent
      if (['containerDirective', 'leafDirective', 'textDirective'].includes(node.type)) {
        const directive = node as Directive;
        if (directive.name !== 'include') {
          return;
        }

        if (index === null || index === undefined || !parent) {
          return;
        }

        directiveReplacements.push([directive, index, parent]);
      }
    });

    for (const [directive, index, parent] of directiveReplacements) {
      if (!directive.attributes?.path) {
        throw new Error(`include directives must specify a path attribute.`);
      }

      const { path, ...args } = directive.attributes;
      const absolutePath = nodePath.resolve(nodePath.dirname(fileContext.file.path), path);
      const renderedInclude = fileContext._include(absolutePath, args);
      parent.children.splice(index, 1, { type: 'html', value: renderedInclude });
    }
  };
}
