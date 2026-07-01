# zTreeView Vue

Vue 3 native port of zTree v3 with TypeScript types and Tailwind-ready theming.

This repository starts from the original jQuery zTree v3.5.48 API surface, but the new implementation removes jQuery entirely and renders with Vue state, props, emits, slots and exposed instance methods.

## Install

```bash
npm install ztreeview-vue
```

## Basic Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ZTreeView, type ZTreeNode, type ZTreeSetting } from 'ztreeview-vue';
import 'ztreeview-vue/style.css';

const nodes = ref<ZTreeNode[]>([
  {
    id: 1,
    name: 'Root',
    open: true,
    children: [
      { id: 11, name: 'Child checked', checked: true },
      { id: 12, name: 'Child editable' }
    ]
  }
]);

const setting: ZTreeSetting = {
  check: { enable: true },
  edit: { enable: true },
  view: { selectedMulti: true }
};
</script>

<template>
  <ZTreeView tree-id="demoTree" :nodes="nodes" :setting="setting" />
</template>
```

## Vue API

`<ZTreeView />` accepts:

- `nodes`
- `setting`
- `treeId`
- `checkedKeys`
- `selectedKeys`
- `modelValue`

It emits Vue events for the main zTree interactions:

- `node-click`
- `node-dblclick`
- `node-check`
- `node-expand`
- `node-collapse`
- `node-remove`
- `node-rename`
- `async-success`
- `async-error`
- `drop`

Slots are available for `switch`, `icon`, `checkbox`, `node` and `actions`.

## zTree-Compatible Instance Methods

Use a component ref to access familiar zTree methods:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ZTreeView, type ZTreeInstance } from 'ztreeview-vue';

const tree = ref<ZTreeInstance>();

function expandEverything() {
  tree.value?.expandAll(true);
}
</script>

<template>
  <ZTreeView ref="tree" :nodes="[]" />
</template>
```

Implemented methods include `addNodes`, `removeNode`, `updateNode`, `expandNode`, `expandAll`, `selectNode`, `cancelSelectedNode`, `checkNode`, `checkAllNodes`, `getNodes`, `getSelectedNodes`, `getCheckedNodes`, `getNodeByParam`, `getNodesByFilter`, `transformTozTreeNodes`, `transformToArray`, `hideNode`, `showNode`, `moveNode`, `copyNode`, `editName`, `cancelEditName` and `reAsyncChildNodes`.

## Tailwind Theme

The package ships CSS variables and a Tailwind preset:

```ts
// tailwind.config.ts
import zTreePreset from 'ztreeview-vue/tailwind-preset';

export default {
  presets: [zTreePreset],
  content: ['./src/**/*.{vue,ts}']
};
```

The default stylesheet uses semantic variables such as `--ztree-color-check`, `--ztree-color-selected-bg`, `--ztree-radius` and `--ztree-indent`. You can override those variables globally or on a wrapping element.

Optional theme classes are included:

- `ztree-theme-metro`
- `ztree-theme-awesome`

## Development

```bash
npm install
npm run dev
npm run test
npm run build
```

The original `api/`, `demo/`, `js/` and `css/` folders are kept as migration references while the Vue-native implementation evolves.
