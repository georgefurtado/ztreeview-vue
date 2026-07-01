import { createApp, ref } from 'vue';
import ZTreeView from '../components/ZTreeView.vue';
import '../styles.css';
import type { ZTreeNode, ZTreeSetting } from '../types';

const nodes = ref<ZTreeNode[]>([
  {
    id: 1,
    name: 'Root',
    open: true,
    children: [
      { id: 11, name: 'Child checked', checked: true },
      { id: 12, name: 'Child editable' }
    ]
  },
  {
    id: 2,
    name: 'Async-ready branch',
    isParent: true
  }
]);

const setting: ZTreeSetting = {
  check: { enable: true },
  edit: { enable: true },
  view: { selectedMulti: true }
};

createApp({
  components: { ZTreeView },
  setup() {
    return { nodes, setting };
  },
  template: `
    <main style="padding: 24px">
      <h1>zTreeView Vue</h1>
      <ZTreeView tree-id="demoTree" :nodes="nodes" :setting="setting" />
    </main>
  `
}).mount('#app');
