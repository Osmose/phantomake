import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { all } from 'lowlight';
import rehypeSlug from 'rehype-slug';
import admonitionPlugin from 'remark-github-beta-blockquote-admonitions';

export default function renderMarkdown(content: string) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      // @ts-ignore Not sure why TS thinks this needs an array of booleans
      .use(admonitionPlugin, {
        classNameMaps: {
          block: (title: string) => `admonition ${title.toLowerCase()}`,
          title: 'admonition-title',
        },
      })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeHighlight, { languages: all })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(content)
  );
}
