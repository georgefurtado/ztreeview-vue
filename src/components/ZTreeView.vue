<script setup lang="ts">
import { provide } from 'vue';
import { useZTree } from '../composables/useZTree';
import type { ZTreeNode, ZTreeNodeKey, ZTreeSetting } from '../types';
import ZTreeNodeItem from './ZTreeNodeItem.vue';
import { zTreeContextKey } from './context';

const props = withDefaults(defineProps<{
  nodes?: ZTreeNode[];
  setting?: ZTreeSetting;
  treeId?: string;
  modelValue?: ZTreeNodeKey | ZTreeNodeKey[] | null;
  checkedKeys?: ZTreeNodeKey[];
  selectedKeys?: ZTreeNodeKey[];
}>(), {
  nodes: () => [],
  setting: () => ({}),
  treeId: 'ztree',
  modelValue: null,
  checkedKeys: () => [],
  selectedKeys: () => []
});

const emit = defineEmits<{
  'update:checkedKeys': [keys: ZTreeNodeKey[]];
  'update:selectedKeys': [keys: ZTreeNodeKey[]];
  'nodes-change': [nodes: ZTreeNode[]];
  'node-click': [node: ZTreeNode, event?: Event];
  'node-dblclick': [node: ZTreeNode, event?: Event];
  'node-check': [node: ZTreeNode, event?: Event];
  'node-expand': [node: ZTreeNode, event?: Event];
  'node-collapse': [node: ZTreeNode, event?: Event];
  'node-created': [node: ZTreeNode];
  'node-remove': [node: ZTreeNode, event?: Event];
  'node-rename': [node: ZTreeNode, isCancel: boolean, event?: Event];
  'async-success': [node: ZTreeNode | null, data: unknown];
  'async-error': [node: ZTreeNode | null, error: unknown];
  'drop': [nodes: ZTreeNode[], target: ZTreeNode, moveType: string, isCopy: boolean];
}>();

const emitAny = emit as (event: string, ...args: unknown[]) => void;

const tree = useZTree({
  nodes: () => props.nodes,
  setting: () => props.setting,
  treeId: () => props.treeId,
  checkedKeys: () => props.checkedKeys,
  selectedKeys: () => props.selectedKeys,
  emit: (event, ...args) => emitAny(event, ...args)
});

provide(zTreeContextKey, tree);
defineExpose(tree.api);
</script>

<template>
  <div class="ztree-shell">
    <div class="ztree-toolbar" role="toolbar" :aria-label="`${tree.setting.value.treeId} controls`">
      <label
        v-if="tree.setting.value.search.enable && tree.setting.value.search.showInput"
        class="ztree-search"
      >
        <span class="ztree-search-icon" aria-hidden="true">⌕</span>
        <input
          class="ztree-search-input"
          data-testid="ztree-search-input"
          type="search"
          :value="tree.searchQuery.value"
          :placeholder="tree.setting.value.search.placeholder"
          :aria-label="tree.setting.value.search.placeholder"
          @input="tree.searchQuery.value = ($event.target as HTMLInputElement).value"
        />
        <button
          v-if="tree.searchQuery.value"
          type="button"
          class="ztree-search-clear"
          data-testid="ztree-search-clear"
          aria-label="Limpar pesquisa"
          @click="tree.api.clearSearch"
        >
          ×
        </button>
      </label>
      <button
        type="button"
        class="ztree-toolbar-button"
        data-testid="ztree-toggle-select-all"
        :disabled="tree.visibleRoots.value.length === 0"
        :aria-pressed="tree.allNodesSelected.value"
        :aria-label="tree.allNodesSelected.value ? 'Desselecionar todos' : 'Selecionar todos'"
        @click="tree.toggleSelectAll"
      >
        <span class="ztree-toolbar-icon" aria-hidden="true">{{ tree.allNodesSelected.value ? '☑' : '☐' }}</span>
        All
      </button>
      <button
        type="button"
        class="ztree-toolbar-button"
        data-testid="ztree-toggle-expand-all"
        :disabled="tree.visibleRoots.value.length === 0"
        :aria-pressed="tree.allNodesExpanded.value"
        :aria-label="tree.allNodesExpanded.value ? 'Colapsar todos' : 'Expandir todos'"
        @click="tree.toggleExpandAll"
      >
        <span class="ztree-toolbar-icon" aria-hidden="true">{{ tree.allNodesExpanded.value ? '⊟' : '⊞' }}</span>
        All
      </button>
    </div>

    <ul
      :id="tree.setting.value.treeId"
      class="ztree ztree-vue"
      role="tree"
      :aria-multiselectable="tree.setting.value.view.selectedMulti"
    >
      <ZTreeNodeItem
        v-for="node in tree.visibleRoots.value"
        :key="node.tId"
        :node="node"
      >
        <template #switch="slotProps">
          <slot name="switch" v-bind="slotProps" />
        </template>
        <template #icon="slotProps">
          <slot name="icon" v-bind="slotProps" />
        </template>
        <template #checkbox="slotProps">
          <slot name="checkbox" v-bind="slotProps" />
        </template>
        <template #node="slotProps">
          <slot name="node" v-bind="slotProps" />
        </template>
        <template #actions="slotProps">
          <slot name="actions" v-bind="slotProps" />
        </template>
      </ZTreeNodeItem>
    </ul>
  </div>
</template>
