import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { mdastToTiptap } from './mdastToTiptap';
import { postMessage, onMessage } from './vscodeApi';
import type { HostMessage } from '../src/protocol';

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function Editor() {
  const initialized = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: '',
    editable: true,
  });

  useEffect(() => {
    if (!editor) return;

    const sendTransaction = debounce((doc: unknown) => {
      postMessage({ type: 'transaction', doc });
    }, 150);

    const cleanup = editor.on('update', ({ editor: e }) => {
      if (!initialized.current) return;
      sendTransaction(e.getJSON());
    });

    postMessage({ type: 'ready' });

    const unsubMessage = onMessage((msg: HostMessage) => {
      if (msg.type === 'init' || msg.type === 'external_update') {
        const text = msg.type === 'init' ? msg.text : msg.text;
        const mdast = unified().use(remarkParse).use(remarkGfm).parse(text);
        const doc = mdastToTiptap(mdast as Parameters<typeof mdastToTiptap>[0]);
        editor.commands.setContent(doc, false);
        initialized.current = true;
      }
    });

    return () => {
      cleanup();
      unsubMessage();
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
}
