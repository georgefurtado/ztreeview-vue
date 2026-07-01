import type { App } from 'vue';
import ZTreeView from './components/ZTreeView.vue';
import './styles.css';

export { default as ZTreeView } from './components/ZTreeView.vue';
export { useZTree } from './composables/useZTree';
export { default as zTreeTailwindPreset } from './tailwind-preset';
export type {
  RequiredZTreeSetting,
  ZTreeAsyncSetting,
  ZTreeCallback,
  ZTreeCheckSetting,
  ZTreeCheckStatus,
  ZTreeDataSetting,
  ZTreeEditSetting,
  ZTreeInstance,
  ZTreeMoveType,
  ZTreeNode,
  ZTreeNodeClasses,
  ZTreeNodeKey,
  ZTreeSetting,
  ZTreeViewProps,
  ZTreeViewSetting
} from './types';

export default {
  install(app: App) {
    app.component('ZTreeView', ZTreeView);
  }
};
