import { gfmPreset } from './gfm';
import type { PlatformPreset } from './types';

const registry: Record<string, PlatformPreset> = {
  gfm: gfmPreset,
};

export function resolvePreset(id: string): PlatformPreset {
  return registry[id] ?? gfmPreset;
}

export type { PlatformPreset };
