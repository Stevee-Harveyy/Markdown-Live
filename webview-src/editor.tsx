import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { mdastToTiptap } from './mdastToTiptap';
import { postMessage, onMessage } from './vscodeApi';
import type { EditorConfig, HostMessage } from '../src/protocol';

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function Editor() {
  const initialized = useRef(false);
  const configRef = useRef<EditorConfig>({ spellCheck: false, syncDelay: 150 });
  const sendRef = useRef<((doc: unknown) => void) | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Link.configure({ openOnClick: false }),
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
      sendRef.current?.(e.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const rebuildSend = (delay: number) => {
      sendRef.current = debounce((doc: unknown) => {
        postMessage({ type: 'transaction', doc });
      }, delay);
    };
    rebuildSend(configRef.current.syncDelay);

    postMessage({ type: 'ready' });

    const unsubMessage = onMessage((msg: HostMessage) => {
      if (msg.type === 'init') {
        configRef.current = msg.config;
        rebuildSend(msg.config.syncDelay);
        // Apply spellcheck attribute
        const el = editor.view.dom as HTMLElement;
        el.setAttribute('spellcheck', String(msg.config.spellCheck));

        const mdast = unified().use(remarkParse).use(remarkGfm).parse(msg.text);
        const doc = mdastToTiptap(mdast as Parameters<typeof mdastToTiptap>[0]);
        editor.commands.setContent(doc, false);
        initialized.current = true;
      }

      if (msg.type === 'external_update') {
        const mdast = unified().use(remarkParse).use(remarkGfm).parse(msg.text);
        const doc = mdastToTiptap(mdast as Parameters<typeof mdastToTiptap>[0]);
        editor.commands.setContent(doc, false);
      }
    });

    return () => {
      unsubMessage();
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
}
