import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { mdastToTiptap } from './mdastToTiptap';
import { RawBlock } from './rawBlockExtension';
import { postMessage, onMessage } from './vscodeApi';
import type { EditorConfig, HostMessage } from '../src/protocol';

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

function parseMd(text: string) {
  const mdast = unified().use(remarkParse).use(remarkGfm).parse(text);
  return mdastToTiptap(mdast as Parameters<typeof mdastToTiptap>[0]);
}

type PendingExternal = { text: string } | null;

export function Editor() {
  const initialized = useRef(false);
  const configRef = useRef<EditorConfig>({ spellCheck: false, syncDelay: 150 });
  const sendRef = useRef<((doc: unknown) => void) | null>(null);
  // Tracks whether there are unsent local edits in flight
  const localDirtyRef = useRef(false);
  const [pendingExternal, setPendingExternal] = useState<PendingExternal>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      RawBlock,
    ],
    content: '',
    editable: true,
    editorProps: {
      attributes: {
        spellcheck: String(configRef.current.spellCheck),
      },
    },
    onUpdate: ({ editor: e }) => {
      if (!initialized.current) return;
      localDirtyRef.current = true;
      sendRef.current?.(e.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const rebuildSend = (delay: number) => {
      sendRef.current = debounce((doc: unknown) => {
        localDirtyRef.current = false;
        postMessage({ type: 'transaction', doc });
      }, delay);
    };
    rebuildSend(configRef.current.syncDelay);

    postMessage({ type: 'ready' });

    const unsubMessage = onMessage((msg: HostMessage) => {
      if (msg.type === 'init') {
        configRef.current = msg.config;
        rebuildSend(msg.config.syncDelay);
        const el = editor.view.dom as HTMLElement;
        el.setAttribute('spellcheck', String(msg.config.spellCheck));
        editor.commands.setContent(parseMd(msg.text), false);
        initialized.current = true;
      }

      if (msg.type === 'external_update') {
        if (localDirtyRef.current) {
          // Local edits in flight — surface the banner instead of clobbering
          setPendingExternal({ text: msg.text });
        } else {
          editor.commands.setContent(parseMd(msg.text), false);
        }
      }
    });

    return () => { unsubMessage(); };
  }, [editor]);

  const acceptExternal = () => {
    if (pendingExternal && editor) {
      editor.commands.setContent(parseMd(pendingExternal.text), false);
    }
    setPendingExternal(null);
  };

  const keepMine = () => setPendingExternal(null);

  return (
    <>
      {pendingExternal && (
        <div id="ext-change-banner">
          <span>File changed externally</span>
          <button onClick={keepMine}>Keep mine</button>
          <button onClick={acceptExternal}>Accept theirs</button>
        </div>
      )}
      <EditorContent editor={editor} style={pendingExternal ? { marginTop: '36px' } : undefined} />
    </>
  );
}
