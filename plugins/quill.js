import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import 'quill/dist/quill.snow.css'; // 使用了 snow 主题色

// 使用 cursors 插件
Quill.register('modules/cursors', QuillCursors);

const quill = new Quill(document.querySelector('#app'), {
  modules: {
    cursors: true,
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      ['image', 'code-block'],
    ],
    history: {
      userOnly: true, // 用户自己实现历史记录
    },
  },
  placeholder: '前端西瓜哥...',
  theme: 'snow',
});

export default ({ app }, inject) => {
  // 可以在这里进行全局Quill配置
  inject('Quill', Quill);
}
