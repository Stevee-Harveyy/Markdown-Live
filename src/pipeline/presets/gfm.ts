import remarkGfm from 'remark-gfm';
import type { PlatformPreset } from './types';

export const gfmPreset: PlatformPreset = {
  id: 'gfm',
  displayName: 'GitHub Flavored Markdown',
  remarkPlugins: [remarkGfm],
  stringifyOptions: {
    bullet: '-',
    emphasis: '*',
    strong: '*',
    fence: '`',
    fences: true,
    incrementListMarker: false,
  },
  tiptapExtensionIds: ['taskList', 'taskItem', 'table', 'tableRow', 'tableCell', 'tableHeader', 'strike'],
};
