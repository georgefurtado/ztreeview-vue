<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue';
import type { StyleValue } from 'vue';
import type { ZTreeMoveType, ZTreeNode } from '../types';
import { zTreeContextKey } from './context';

const props = defineProps<{
  node: ZTreeNode;
}>();

defineSlots<{
  switch(props: { node: ZTreeNode; open?: boolean; isParent?: boolean }): unknown;
  icon(props: { node: ZTreeNode; open?: boolean }): unknown;
  checkbox(props: { node: ZTreeNode; checked?: boolean; half?: boolean }): unknown;
  node(props: { node: ZTreeNode; selected: boolean; checked?: boolean }): unknown;
  actions(props: { node: ZTreeNode; rename: () => void; remove: (event: Event) => void }): unknown;
}>();

const injectedTree = inject(zTreeContextKey);
if (!injectedTree) throw new Error('ZTreeNodeItem must be used inside ZTreeView.');
const tree = injectedTree;

const renameValue = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const isSelected = computed(() => tree.selectedNodes.value.includes(props.node));
const children = computed(() => tree.getVisibleChildren(props.node));
const isEditing = computed(() => tree.editingNode.value === props.node);
const nodeName = computed(() => {
  const render = tree.setting.value.data.render?.name;
  const key = tree.setting.value.data.key.name ?? 'name';
  return render?.(props.node) ?? String(props.node[key] ?? props.node.name ?? '');
});
const nodeTitle = computed(() => {
  const render = tree.setting.value.data.render?.title;
  const key = tree.setting.value.data.key.title ?? 'title';
  return render?.(props.node) ?? String(props.node[key] ?? props.node.title ?? nodeName.value);
});
const nodeUrl = computed(() => String(props.node[tree.setting.value.data.key.url ?? 'url'] ?? props.node.url ?? ''));
const iconUrl = computed(() => String(props.node[tree.setting.value.data.key.icon ?? 'icon'] ?? props.node.icon ?? ''));
const fontCss = computed(() => {
  const css = tree.setting.value.view.fontCss;
  return typeof css === 'function' ? css(tree.setting.value.treeId, props.node) : css;
});
const rowStyle = computed<StyleValue>(() => [
  fontCss.value,
  {
    paddingInlineStart: `calc(${props.node.level ?? 0} * var(--ztree-indent) + 4px)`
  }
]);
const nodeClasses = computed(() => {
  const configured = tree.setting.value.view.nodeClasses;
  const classes = typeof configured === 'function' ? configured(tree.setting.value.treeId, props.node) : configured;
  return classes?.add ?? [];
});

function emitNodeCallback(eventName: string, callbackName: string, event: Event, ...args: unknown[]): void {
  tree.emitCallback(eventName, callbackName as never, event, props.node, ...args);
}

async function onClick(event: MouseEvent): Promise<void> {
  const before = tree.setting.value.callback.beforeClick;
  if (before && await before(tree.setting.value.treeId, props.node, 1) === false) return;
  tree.selectNode(props.node, event.metaKey || event.ctrlKey);
  emitNodeCallback('node-click', 'onClick', event, 1);
  props.node.click?.(event, tree.setting.value.treeId, props.node);
}

async function onDblClick(event: MouseEvent): Promise<void> {
  const before = tree.setting.value.callback.beforeDblClick;
  if (before && await before(tree.setting.value.treeId, props.node) === false) return;
  const dblClickExpand = tree.setting.value.view.dblClickExpand;
  const shouldExpand = typeof dblClickExpand === 'function' ? dblClickExpand(tree.setting.value.treeId, props.node) : dblClickExpand;
  if (shouldExpand && props.node.isParent) onToggle(event);
  emitNodeCallback('node-dblclick', 'onDblClick', event);
}

function onToggle(event: Event): void {
  if (!props.node.isParent) return;
  const nextOpen = !props.node.open;
  tree.expandNode(props.node, nextOpen, false, false, true);
  emitNodeCallback(nextOpen ? 'node-expand' : 'node-collapse', nextOpen ? 'onExpand' : 'onCollapse', event);
}

function onCheck(event: Event): void {
  tree.checkNode(props.node, !props.node.checked, true, true);
  emitNodeCallback('node-check', 'onCheck', event);
}

async function beginRename(): Promise<void> {
  const before = tree.setting.value.callback.beforeEditName;
  if (before && await before(tree.setting.value.treeId, props.node) === false) return;
  renameValue.value = nodeName.value;
  tree.editName(props.node);
  await nextTick();
  inputRef.value?.focus();
  if (tree.setting.value.edit.editNameSelectAll) inputRef.value?.select();
}

async function commitRename(event: Event): Promise<void> {
  const before = tree.setting.value.callback.beforeRename;
  if (before && await before(tree.setting.value.treeId, props.node, renameValue.value, false) === false) return;
  props.node.name = renameValue.value;
  tree.cancelEditName();
  tree.emitCallback('node-rename', 'onRename', event, props.node, false);
}

function cancelRename(event: Event): void {
  tree.cancelEditName();
  tree.emitCallback('node-rename', 'onRename', event, props.node, true);
}

function removeNode(event: Event): void {
  tree.api.removeNode(props.node, true);
  tree.emitCallback('node-remove', 'onRemove', event, props.node);
}

function dragStart(event: DragEvent): void {
  if (!tree.setting.value.edit.drag?.isMove) return;
  event.dataTransfer?.setData('text/plain', props.node.tId ?? '');
  tree.emitCallback('drag', 'onDrag', event, props.node, [props.node]);
}

function drop(event: DragEvent, moveType: ZTreeMoveType): void {
  event.preventDefault();
  const sourceTid = event.dataTransfer?.getData('text/plain');
  const source = sourceTid ? tree.api.getNodeByTId(sourceTid) : null;
  if (!source || source === props.node) return;
  tree.moveNode(props.node, source, moveType);
  tree.emitCallback('drop', 'onDrop', event, props.node, [source], props.node, moveType, false);
}
</script>

<template>
  <li
    v-show="!node.isHidden"
    :id="node.tId"
    class="ztree-node"
    :class="[
      `level${node.level ?? 0}`,
      {
        'is-open': node.open,
        'is-selected': isSelected,
        'is-disabled': node.chkDisabled,
        'is-checked': node.checked,
        'is-half-checked': node.halfCheck
      }
    ]"
    role="treeitem"
    :aria-expanded="node.isParent ? Boolean(node.open) : undefined"
    :aria-selected="isSelected"
  >
    <div
      class="ztree-node-row"
      :class="nodeClasses"
      :style="rowStyle"
      draggable="true"
      @click="onClick"
      @dblclick="onDblClick"
      @dragstart="dragStart"
      @dragover.prevent
      @drop="drop($event, 'inner')"
    >
      <button
        type="button"
        class="ztree-switch switch"
        :class="[node.open ? 'open' : 'close', node.isParent ? 'folder' : 'docu']"
        :aria-label="node.open ? 'Collapse' : 'Expand'"
        :disabled="!node.isParent"
        @click.stop="onToggle"
        @drop.stop="drop($event, 'prev')"
      >
        <slot name="switch" :node="node" :open="node.open" :is-parent="node.isParent">
          <span v-if="node.isParent">{{ node.open ? '▾' : '▸' }}</span>
        </slot>
      </button>

      <button
        v-if="tree.setting.value.check.enable"
        type="button"
        class="ztree-check"
        :class="[tree.setting.value.check.chkStyle, { checked: node.checked, half: node.halfCheck }]"
        :disabled="node.nocheck || node.chkDisabled"
        :aria-pressed="node.checked"
        @click.stop="onCheck"
      >
        <slot name="checkbox" :node="node" :checked="node.checked" :half="node.halfCheck">
          <span class="ztree-check-mark" />
        </slot>
      </button>

      <span
        v-if="tree.setting.value.view.showIcon"
        class="ztree-icon button ico"
        :class="[node.iconSkin, node.open ? 'open' : 'close']"
        aria-hidden="true"
      >
        <slot name="icon" :node="node" :open="node.open">
          <img v-if="iconUrl" :src="iconUrl" alt="" />
        </slot>
      </span>

      <input
        v-if="isEditing"
        ref="inputRef"
        v-model="renameValue"
        class="ztree-rename-input"
        @keyup.enter="commitRename"
        @keyup.esc="cancelRename"
        @blur="commitRename"
      />
      <a
        v-else-if="nodeUrl"
        class="ztree-node-name node_name"
        :href="nodeUrl"
        :target="node.target"
        :title="tree.setting.value.view.showTitle ? nodeTitle : undefined"
        @click.stop="onClick"
      >
        <slot name="node" :node="node" :selected="isSelected" :checked="node.checked">
          <span v-if="tree.setting.value.view.nameIsHTML" v-html="nodeName" />
          <span v-else>{{ nodeName }}</span>
        </slot>
      </a>
      <span
        v-else
        class="ztree-node-name node_name"
        :title="tree.setting.value.view.showTitle ? nodeTitle : undefined"
      >
        <slot name="node" :node="node" :selected="isSelected" :checked="node.checked">
          <span v-if="tree.setting.value.view.nameIsHTML" v-html="nodeName" />
          <span v-else>{{ nodeName }}</span>
        </slot>
      </span>

      <span v-if="tree.editable.value" class="ztree-actions">
        <slot name="actions" :node="node" :rename="beginRename" :remove="removeNode">
          <button
            v-if="tree.setting.value.edit.showRenameBtn"
            type="button"
            class="ztree-action ztree-rename"
            :title="String(tree.setting.value.edit.renameTitle)"
            @click.stop="beginRename"
          >
            Rename
          </button>
          <button
            v-if="tree.setting.value.edit.showRemoveBtn"
            type="button"
            class="ztree-action ztree-remove"
            :title="String(tree.setting.value.edit.removeTitle)"
            @click.stop="removeNode"
          >
            Remove
          </button>
        </slot>
      </span>
    </div>

    <ul v-if="node.open && children.length" class="ztree-children" role="group">
      <ZTreeNodeItem v-for="child in children" :key="child.tId" :node="child">
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
  </li>
</template>
