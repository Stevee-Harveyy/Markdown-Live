// Base ProseMirror schema constants — node type names used across the pipeline.
// TipTap's StarterKit provides the actual schema; this module is the reference for names.
export const nodeTypes = {
  paragraph: 'paragraph',
  heading: 'heading',
  bulletList: 'bulletList',
  orderedList: 'orderedList',
  listItem: 'listItem',
  blockquote: 'blockquote',
  codeBlock: 'codeBlock',
  horizontalRule: 'horizontalRule',
  hardBreak: 'hardBreak',
  text: 'text',
} as const;

export const markTypes = {
  bold: 'bold',
  italic: 'italic',
  code: 'code',
  link: 'link',
} as const;
