import { Node, mergeAttributes } from '@tiptap/core';

export interface JapaneseTokenAttrs {
  text: string;
  furigana: string;
  meaning: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    japaneseToken: {
      insertJapaneseToken: (attrs: JapaneseTokenAttrs) => ReturnType;
    };
  }
}

export const JapaneseToken = Node.create({
  name: 'japaneseToken',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      text: { default: '' },
      furigana: { default: '' },
      meaning: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span.jp-token' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ class: 'jp-token' }, HTMLAttributes),
      ['span', { class: 'vn-meaning' }, HTMLAttributes.meaning || ''],
      ['span', { class: 'furigana' }, HTMLAttributes.furigana || ''],
      ['span', { class: 'jp-text' }, HTMLAttributes.text || ''],
    ];
  },

  addCommands() {
    return {
      insertJapaneseToken:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              text: attrs.text || '',
              furigana: attrs.furigana || '',
              meaning: attrs.meaning || '',
            },
          }),
    };
  },
});
