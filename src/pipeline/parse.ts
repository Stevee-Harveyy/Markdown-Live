import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root } from 'mdast';

export function parseMarkdown(text: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(text);
}
