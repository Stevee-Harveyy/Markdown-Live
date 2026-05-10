// Node type and mark type name constants shared across the pipeline.
// TipTap's StarterKit + GFM extensions provide the actual schema.
export const nodeTypes = {
  paragraph: 'paragraph',
  heading: 'heading',
  bulletList: 'bulletList',
  orderedList: 'orderedList',
  listItem: 'listItem',
  taskList: 'taskList',
  taskItem: 'taskItem',
  blockquote: 'blockquote',
  codeBlock: 'codeBlock',
  horizontalRule: 'horizontalRule',
  hardBreak: 'hardBreak',
  text: 'text',
  table: 'table',
  tableRow: 'tableRow',
  tableCell: 'tableCell',
  tableHeader: 'tableHeader',
} as const;

export const markTypes = {
  bold: 'bold',
  italic: 'italic',
  strike: 'strike',
  code: 'code',
  link: 'link',
} as const;
