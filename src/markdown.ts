import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeHighlight from 'rehype-highlight';

export default function renderMarkdown(content: string) {
  return String(
    unified().use(remarkParse).use(remarkRehype).use(rehypeHighlight).use(rehypeStringify).processSync(content)
  );
}
