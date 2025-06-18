export default defineNuxtPlugin((nuxtApp) => {
  let Quill = null;
  let QuillCursors = null;

  if (process.client) {
    // 动态导入
    import('quill').then((module) => {
      Quill = module.default;
      import('quill-cursors').then((cursorsModule) => {
        QuillCursors = cursorsModule.default;
        Quill.register('modules/cursors', QuillCursors);
      });
    });
  }

  return {
    provide: {
      createQuill: async (element, options = {}) => {
        if (process.client) {
          // 确保模块已加载
          if (!Quill) {
            const module = await import('quill');
            Quill = module.default;
            await import('quill/dist/quill.snow.css');
          }
          if (!QuillCursors) {
            const cursorsModule = await import('quill-cursors');
            QuillCursors = cursorsModule.default;
            Quill.register('modules/cursors', QuillCursors);
          }

          return new Quill(element, {
            modules: {
              cursors: true,
              toolbar: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                ['image', 'code-block'],
              ],
              history: {
                userOnly: true,
              },
              ...options.modules
            },
            placeholder: '开始写作...',
            theme: 'snow',
            ...options
          });
        }
        return null;
      }
    }
  }
});
