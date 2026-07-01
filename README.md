# zTreeView Vue

Vue 3 native port of zTree v3 with TypeScript types and Tailwind-ready theming.

This repository starts from the original jQuery zTree v3.5.48 API surface, but the active implementation removes jQuery entirely and renders with Vue state, props, emits, slots and exposed instance methods.

## Install

```bash
npm install ztreeview-vue
```

When installing from GitHub Packages, configure npm for the `@georgefurtado` scope:

```bash
npm config set @georgefurtado:registry https://npm.pkg.github.com
npm install @georgefurtado/ztreeview-vue
```

## Basic Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ZTreeView, type ZTreeNode, type ZTreeSetting } from '@georgefurtado/ztreeview-vue';
import '@georgefurtado/ztreeview-vue/style.css';

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
import { ZTreeView, type ZTreeInstance } from '@georgefurtado/ztreeview-vue';

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
import zTreePreset from '@georgefurtado/ztreeview-vue/tailwind-preset';

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

## Publishing to GitHub Packages

This package is configured for GitHub Packages under the `@georgefurtado` scope.

Local publish requires a GitHub token with package permissions:

```bash
npm login --scope=@georgefurtado --registry=https://npm.pkg.github.com
npm publish
```

CI publishing is handled by `.github/workflows/publish.yml` on GitHub Release publication or manual workflow dispatch.

The original `demo/` folder is kept as a migration reference for porting examples incrementally. Legacy jQuery runtime/API/style folders were removed so the active package surface stays focused on the Vue-native implementation.
