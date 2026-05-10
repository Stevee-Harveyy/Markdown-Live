import type { Plugin } from 'unified';
import type { Options as StringifyOptions } from 'remark-stringify';

export interface PlatformPreset {
  id: string;
  displayName: string;
  remarkPlugins: Plugin[];
  stringifyOptions: StringifyOptions;
  // TipTap extension names enabled by this preset (used by the WebView to load extensions)
  tiptapExtensionIds: string[];
}
