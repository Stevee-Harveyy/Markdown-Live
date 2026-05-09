import { unified } from 'unified';
import remarkStringify from 'remark-stringify';
import type { Root, BlockContent, PhrasingContent, ListItem } from 'mdast';

type Mark = { type: string; attrs?: Record<string, unknown> };
type PmNode = {
  type: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: PmNode[];
};

export function serializeToMarkdown(doc: PmNode): string {
  const root = docToMdast(doc);
  return String(
    unified()
      .use(remarkStringify, {
        bullet: '-',
        emphasis: '*',
        strong: '*',
        fence: '`',
        fences: true,
        incrementListMarker: false,
      } as Parameters<typeof remarkStringify>[0])
      .stringify(root)
  );
}

function docToMdast(doc: PmNode): Root {
  return { type: 'root', children: (doc.content ?? []).map(blockToMdast) };
}

function blockToMdast(node: PmNode): BlockContent {
  switch (node.type) {
    case 'paragraph':
      return { type: 'paragraph', children: inlineContent(node.content ?? []) };
    case 'heading':
      return { type: 'heading', depth: (node.attrs?.level as 1|2|3|4|5|6) ?? 1, children: inlineContent(node.content ?? []) };
    case 'bulletList':
      return { type: 'list', ordered: false, spread: false, children: (node.content ?? []).map(listItem) };
    case 'orderedList':
      return { type: 'list', ordered: true, spread: false, children: (node.content ?? []).map(listItem) };
    case 'blockquote':
      return { type: 'blockquote', children: (node.content ?? []).map(blockToMdast) };
    case 'codeBlock':
      return { type: 'code', lang: (node.attrs?.language as string) || null, value: rawText(node.content ?? []) };
    case 'horizontalRule':
      return { type: 'thematicBreak' };
    default:
      return { type: 'paragraph', children: [{ type: 'text', value: `[unknown:${node.type}]` }] };
  }
}

function listItem(node: PmNode): ListItem {
  return { type: 'listItem', spread: false, children: (node.content ?? []).map(blockToMdast) };
}

function rawText(nodes: PmNode[]): string {
  return nodes.map(n => n.text ?? rawText(n.content ?? [])).join('');
}

function inlineContent(nodes: PmNode[]): PhrasingContent[] {
  const flat = nodes.flatMap(textToMdast);
  return mergeAdjacent(flat);
}

function textToMdast(node: PmNode): PhrasingContent[] {
  if (node.type === 'hardBreak') return [{ type: 'break' }];
  if (node.type !== 'text') return [];

  const text = node.text ?? '';
  const marks = node.marks ?? [];

  // Inline code — takes full precedence, no nesting allowed
  if (marks.some(m => m.type === 'code')) return [{ type: 'inlineCode', value: text }];

  const linkMark = marks.find(m => m.type === 'link');
  const rest = marks.filter(m => m.type !== 'link');

  let leaf: PhrasingContent = { type: 'text', value: text };

  // Apply bold / italic inside-out (italic inner, bold outer)
  const sorted = [...rest].sort((a, b) => ['italic', 'bold'].indexOf(a.type) - ['italic', 'bold'].indexOf(b.type));
  for (const mark of sorted) {
    if (mark.type === 'bold') leaf = { type: 'strong', children: [leaf] };
    else if (mark.type === 'italic') leaf = { type: 'emphasis', children: [leaf] };
  }

  if (linkMark) {
    leaf = {
      type: 'link',
      url: (linkMark.attrs?.href as string) ?? '',
      title: (linkMark.attrs?.title as string) || null,
      children: [leaf],
    };
  }

  return [leaf];
}

function mergeAdjacent(nodes: PhrasingContent[]): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  for (const node of nodes) {
    const prev = out[out.length - 1];
    if (prev && prev.type === node.type && (node.type === 'strong' || node.type === 'emphasis') && 'children' in prev && 'children' in node) {
      (prev as { children: PhrasingContent[] }).children.push(...(node as { children: PhrasingContent[] }).children);
    } else {
      out.push(node);
    }
  }
  return out;
}
