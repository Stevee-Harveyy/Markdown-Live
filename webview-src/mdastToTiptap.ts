import type { Root, Content, PhrasingContent, ListContent } from 'mdast';

export type TiptapMark = { type: string; attrs?: Record<string, unknown> };
export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};
export type TiptapDoc = { type: 'doc'; content: TiptapNode[] };

export function mdastToTiptap(root: Root): TiptapDoc {
  return { type: 'doc', content: root.children.flatMap(blockToTiptap) };
}

function blockToTiptap(node: Content): TiptapNode[] {
  switch (node.type) {
    case 'paragraph':
      return [{ type: 'paragraph', content: phrasingToTiptap(node.children) }];
    case 'heading':
      return [{ type: 'heading', attrs: { level: node.depth }, content: phrasingToTiptap(node.children) }];
    case 'list':
      return [{
        type: node.ordered ? 'orderedList' : 'bulletList',
        content: node.children.map(listItemToTiptap),
      }];
    case 'blockquote':
      return [{ type: 'blockquote', content: node.children.flatMap(blockToTiptap) }];
    case 'code':
      return [{ type: 'codeBlock', attrs: { language: node.lang ?? null }, content: [{ type: 'text', text: node.value }] }];
    case 'thematicBreak':
      return [{ type: 'horizontalRule' }];
    default:
      return [];
  }
}

function listItemToTiptap(node: ListContent): TiptapNode {
  return { type: 'listItem', content: (node as any).children.flatMap(blockToTiptap) };
}

function phrasingToTiptap(nodes: PhrasingContent[]): TiptapNode[] {
  return nodes.flatMap(phrasingNodeToTiptap);
}

function phrasingNodeToTiptap(node: PhrasingContent): TiptapNode[] {
  switch (node.type) {
    case 'text':
      return [{ type: 'text', text: node.value }];
    case 'strong':
      return addMark(phrasingToTiptap(node.children), { type: 'bold' });
    case 'emphasis':
      return addMark(phrasingToTiptap(node.children), { type: 'italic' });
    case 'inlineCode':
      return [{ type: 'text', text: node.value, marks: [{ type: 'code' }] }];
    case 'link':
      return addMark(phrasingToTiptap(node.children), { type: 'link', attrs: { href: node.url, title: node.title ?? null } });
    case 'break':
      return [{ type: 'hardBreak' }];
    default:
      return [];
  }
}

function addMark(nodes: TiptapNode[], mark: TiptapMark): TiptapNode[] {
  return nodes.map(n =>
    n.type === 'text'
      ? { ...n, marks: [...(n.marks ?? []), mark] }
      : n
  );
}
