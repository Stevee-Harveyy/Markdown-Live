import { Node, mergeAttributes } from '@tiptap/core';

// Read-only block for content we can parse but not round-trip through TipTap
// (YAML frontmatter, raw HTML blocks). Rendered as a monospace dashed box.
// The original source text is stored in the `content` attribute.
export const RawBlock = Node.create({
  name: 'rawBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      content: { default: '' },
      kind: { default: 'raw' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-raw-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-raw-block': '', class: 'raw-block' }), HTMLAttributes.content ?? ''];
  },
});
