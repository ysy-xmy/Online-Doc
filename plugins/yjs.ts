import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
// ...

const ydoc = new Y.Doc(); // y 文档对象，保存需要共享的数据
const ytext = ydoc.getText('quill'); // 创建名为 quill 的 Text 对象
const binding = new QuillBinding(ytext, quill); // 数据模型绑定
