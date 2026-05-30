import type { Root, Content, PhrasingContent, ListContent, TableContent, RowContent } from 'mdast';

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

    case 'list': {
      // GFM task lists: checked is true/false. Also treat items whose text
      // starts with [~] or [!] (in-progress / blocked markers) as task items.
      const isTaskList = node.children.some(item => {
        const c = (item as any).checked;
        if (c !== null && c !== undefined) return true;
        return looksLikeCustomTaskItem(item as any);
      });
      if (isTaskList) {
        return [{ type: 'taskList', content: node.children.map(item => taskItemToTiptap(item as any)) }];
      }
      return [{
        type: node.ordered ? 'orderedList' : 'bulletList',
        content: node.children.map(listItemToTiptap),
      }];
    }

    case 'blockquote':
      return [{ type: 'blockquote', content: node.children.flatMap(blockToTiptap) }];

    case 'code':
      return [{ type: 'codeBlock', attrs: { language: node.lang ?? null }, content: [{ type: 'text', text: node.value }] }];

    case 'thematicBreak':
      return [{ type: 'horizontalRule' }];

    case 'table': {
      const [head, ...body] = node.children as TableContent[];
      return [{
        type: 'table',
        content: [
          tableRowToTiptap(head as RowContent, true),
          ...body.map(r => tableRowToTiptap(r as RowContent, false)),
        ],
      }];
    }

    // Frontmatter and raw HTML — preserve as read-only raw block
    case 'html':
      return [{ type: 'rawBlock', attrs: { content: node.value, kind: 'html' } }];
    case 'yaml':
      return [{ type: 'rawBlock', attrs: { content: `---\n${node.value}\n---`, kind: 'frontmatter' } }];

    default:
      return [];
  }
}

function tableRowToTiptap(row: RowContent, isHeader: boolean): TiptapNode {
  return {
    type: 'tableRow',
    content: (row as any).children.map((cell: any) => ({
      type: isHeader ? 'tableHeader' : 'tableCell',
      content: phrasingToTiptap(cell.children),
    })),
  };
}

// Detects items like "- [~] In progress" or "- [!] Blocked" that remark
// parses as plain list items (checked: null) with a leading [~/!] text token.
function looksLikeCustomTaskItem(node: any): boolean {
  const firstChild = node.children?.[0];
  if (firstChild?.type !== 'paragraph') return false;
  const firstText = firstChild.children?.[0];
  return firstText?.type === 'text' && /^\[~\]|\[!\]/.test(firstText.value);
}

function listItemToTiptap(node: ListContent): TiptapNode {
  return { type: 'listItem', content: (node as any).children.flatMap(blockToTiptap) };
}

function taskItemToTiptap(node: any): TiptapNode {
  let checked = node.checked === true;
  let children = node.children as Content[];

  // Handle [~] / [!] items: strip the prefix token, treat as unchecked
  if (node.checked === null || node.checked === undefined) {
    const firstPara = children[0] as any;
    if (firstPara?.type === 'paragraph') {
      const firstText = firstPara.children?.[0];
      if (firstText?.type === 'text' && /^\[~\] |^\[!\] /.test(firstText.value)) {
        // Strip the "[~] " / "[!] " prefix from the text node
        const stripped = { ...firstText, value: firstText.value.replace(/^\[~\] |^\[!\] /, '') };
        const newPara = { ...firstPara, children: [stripped, ...firstPara.children.slice(1)] };
        children = [newPara, ...children.slice(1)];
        checked = false;
      }
    }
  }

  const inner: TiptapNode[] = children.flatMap((child: Content) => {
    if (child.type === 'paragraph') {
      return [{ type: 'paragraph', content: phrasingToTiptap((child as any).children) }];
    }
    return blockToTiptap(child);
  });
  return { type: 'taskItem', attrs: { checked }, content: inner };
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
    case 'delete':
      return addMark(phrasingToTiptap(node.children), { type: 'strike' });
    case 'inlineCode':
      return [{ type: 'text', text: node.value, marks: [{ type: 'code' }] }];
    case 'link':
      return addMark(phrasingToTiptap(node.children), {
        type: 'link',
        attrs: { href: node.url, title: node.title ?? null },
      });
    case 'image':
      return [{ type: 'text', text: `![${node.alt ?? ''}](${node.url})` }];
    case 'break':
      return [{ type: 'hardBreak' }];
    default:
      return [];
  }
}

function addMark(nodes: TiptapNode[], mark: TiptapMark): TiptapNode[] {
  return nodes.map(n =>
    n.type === 'text' ? { ...n, marks: [...(n.marks ?? []), mark] } : n
  );
}
