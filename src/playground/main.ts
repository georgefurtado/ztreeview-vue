import { createApp, ref } from 'vue';
import ZTreeView from '../components/ZTreeView.vue';
import '../styles.css';
import type { ZTreeNode, ZTreeSetting } from '../types';

const nodes = ref<ZTreeNode[]>([
  {
    id: 1,
    name: 'Financeiro',
    type: 'folder',
    open: true,
    children: [
      { id: 11, name: 'Contrato mensal', type: 'document', checked: true },
      { id: 12, name: 'Painel de recebimentos', type: 'dashboard' },
      { id: 13, name: 'Configuracao financeira', type: 'setting' }
    ]
  },
  {
    id: 2,
    name: 'Operacional',
    type: 'folder',
    open: true,
    children: [
      { id: 21, name: 'Contrato de campo', type: 'document' },
      { id: 22, name: 'Indicadores de equipes', type: 'dashboard' },
      { id: 23, name: 'Usuarios internos', type: 'user' }
    ]
  }
]);

const setting: ZTreeSetting = {
  check: { enable: true },
  edit: { enable: true },
  search: {
    enable: true,
    keys: ['name'],
    types: ['document', 'dashboard']
  },
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
