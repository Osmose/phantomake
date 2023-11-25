/// <reference types="mdast-util-directive" />

import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import { visit } from 'unist-util-visit';

// function renderEJSPlugin() {
//   return (tree: Root, file: VFile) => {
//     visit(tree, function (node) {
//       if (node.type === 'containerDirective' || node.type === 'leafDirective' || node.type === 'textDirective') {
//         if (node.name !== 'renderEJS') return;
//
//         const data = node.data || (node.data = {});
//         const attributes = node.attributes || {};
//
//         if (node.type === 'containerDirective') {
//           file.fail('Unexpected `renderEJS` container directive, cannot use it in a ```code block.', node);
//         }
//
//         data.hName = 'iframe';
//         data.hProperties = {
//           src: 'https://www.youtube.com/embed/' + id,
//           width: 200,
//           height: 200,
//           frameBorder: 0,
//           allow: 'picture-in-picture',
//           allowFullScreen: true,
//         };
//       }
//     });
//   };
// }

export default function renderMarkdown(content: string) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      // .use(renderEJSPlugin)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeHighlight)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(content)
  );
}
