import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root } from 'mdast';
import type { PlatformPreset } from './presets/types';

export function parseMarkdown(text: string, preset: PlatformPreset): Root {
  const processor = unified().use(remarkParse);
  for (const plugin of preset.remarkPlugins) {
    (processor as any).use(plugin);
  }
  return processor.parse(text);
}
