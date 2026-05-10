import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { mdastToTiptap } from '../../webview-src/mdastToTiptap';
import { serializeToMarkdown } from '../../src/pipeline/serialize';
import { resolvePreset } from '../../src/pipeline/presets/index';
import type { Root } from 'mdast';

const gfm = resolvePreset('gfm');

function roundTrip(md: string): string {
  const mdast = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  const doc = mdastToTiptap(mdast);
  return serializeToMarkdown(doc, gfm);
}

function assertIdempotent(md: string) {
  const once = roundTrip(md);
  const twice = roundTrip(once);
  expect(twice).toBe(once);
}

describe('round-trip pipeline — Phase 2 node types', () => {
  it('plain paragraph', () => assertIdempotent('Hello world.\n'));
  it('headings H1–H6', () => assertIdempotent('# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6\n'));
  it('bold', () => assertIdempotent('**bold text**\n'));
  it('italic', () => assertIdempotent('*italic text*\n'));
  it('inline code', () => assertIdempotent('Use `npm install` to install.\n'));
  it('link', () => assertIdempotent('[visit](https://example.com)\n'));
  it('unordered list', () => assertIdempotent('- item one\n- item two\n- item three\n'));
  it('ordered list', () => assertIdempotent('1. first\n2. second\n3. third\n'));
  it('nested list', () => assertIdempotent('- parent\n  - child\n  - child two\n'));
  it('blockquote', () => assertIdempotent('> A blockquote.\n'));
  it('fenced code block', () => assertIdempotent('```typescript\nconst x = 1;\n```\n'));
  it('thematic break', () => assertIdempotent('---\n'));

  it('fast-check: paragraphs with plain text are idempotent', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Za-z0-9 .,!?'-]{1,80}$/),
        text => { assertIdempotent(`${text}\n`); }
      ),
      { numRuns: 100 }
    );
  });

  it('fast-check: headings with plain text are idempotent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }),
        fc.stringMatching(/^[A-Za-z0-9 ]{1,60}$/),
        (level, text) => { assertIdempotent(`${'#'.repeat(level)} ${text}\n`); }
      ),
      { numRuns: 100 }
    );
  });
});

describe('round-trip pipeline — Phase 3 GFM node types', () => {
  it('task list — mixed checked/unchecked', () => assertIdempotent('- [x] done\n- [ ] not done\n- [x] also done\n'));
  it('strikethrough', () => assertIdempotent('~~deleted text~~\n'));
  it('table', () => assertIdempotent('| Name | Age |\n| ---- | --- |\n| Alice | 30 |\n| Bob | 25 |\n'));

  it('fast-check: task lists preserve checked state', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ checked: fc.boolean(), label: fc.stringMatching(/^[A-Za-z0-9 ]{1,40}$/) }),
          { minLength: 1, maxLength: 5 }
        ),
        items => {
          const md = items.map(i => `- [${i.checked ? 'x' : ' '}] ${i.label}`).join('\n') + '\n';
          assertIdempotent(md);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('fast-check: tables with plain-text cells are idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[A-Za-z0-9]{1,12}$/), { minLength: 2, maxLength: 4 }),
        fc.array(
          fc.array(fc.stringMatching(/^[A-Za-z0-9]{1,12}$/), { minLength: 2, maxLength: 4 }),
          { minLength: 1, maxLength: 3 }
        ),
        (headers, rows) => {
          // Ensure all rows have same column count as headers
          const cols = headers.length;
          const normalizedRows = rows.map(r => {
            const padded = [...r];
            while (padded.length < cols) padded.push('x');
            return padded.slice(0, cols);
          });
          const sep = headers.map(() => '----');
          const md = [
            `| ${headers.join(' | ')} |`,
            `| ${sep.join(' | ')} |`,
            ...normalizedRows.map(r => `| ${r.join(' | ')} |`),
          ].join('\n') + '\n';
          assertIdempotent(md);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('resolvePreset falls back to gfm for unknown id', () => {
    const preset = resolvePreset('unknown-preset');
    expect(preset.id).toBe('gfm');
  });
});
