import type { Doc, Text } from 'yjs';
import type { QuillBinding } from 'y-quill';
import type Quill from 'quill';

export default defineNuxtPlugin((nuxtApp) => {
  let Y: typeof import('yjs') | null = null;
  let QuillBindingClass: typeof QuillBinding | null = null;
  let ydoc: Doc | null = null;
  let ytext: Text | null = null;

  if (process.client) {
    import('yjs').then((module) => {
      Y = module;
      ydoc = new Y.Doc();
      ytext = ydoc.getText('quill');
    });
  }

  return {
    provide: {
      createQuillBinding: async (quill: Quill) => {
        if (process.client) {
          if (!Y) {
            const module = await import('yjs');
            Y = module;
            ydoc = new Y.Doc();
            ytext = ydoc.getText('quill');
          }
          if (!QuillBindingClass) {
            const bindingModule = await import('y-quill');
            QuillBindingClass = bindingModule.QuillBinding;
          }
          if (ytext && QuillBindingClass) {
            return new QuillBindingClass(ytext, quill);
          }
        }
        return null;
      }
    }
  }
});
