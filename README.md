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
    icon: 'fa fa-folder',
    color: '#1d4ed8',
    open: true,
    children: [
      { id: 11, name: 'Child checked', checked: true, icon: 'fa fa-check' },
      { id: 12, name: 'Child editable', color: '#16a34a' }
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

## Node Display Properties

Each `ZTreeNode` supports display-oriented properties in addition to the zTree-compatible fields:

- `color`: applies an inline text color to the rendered item label.
- `icon`: renders an `<i>` before the item text when the value is not empty.

Example:

```ts
const nodes: ZTreeNode[] = [
  {
    id: 1,
    name: 'Financeiro',
    color: '#0f766e',
    icon: 'fa fa-folder'
  },
  {
    id: 2,
    name: 'Relatorio',
    icon: 'bi bi-file-earmark-text'
  }
];
```

`icon` is treated as a CSS class string, not as an image URL. The component renders it like this:

```html
<i class="ztree-node-text-icon fa fa-folder" aria-hidden="true"></i>
```

The component does not bundle an icon font and does not force `font-family` on `ztree-node-text-icon`. Load Font Awesome, Bootstrap Icons, Material Symbols or your own icon font/CSS in the parent application.

## Search

Enable `setting.search` to render a search input in the toolbar. The search hides non-matching items from the rendered result, keeps matches unique, and can restrict the search to configured node types.

```ts
const nodes: ZTreeNode[] = [
  { id: 1, name: 'Financeiro', type: 'folder' },
  { id: 2, name: 'Contrato mensal', type: 'document' },
  { id: 3, name: 'Painel financeiro', type: 'dashboard' }
];

const setting: ZTreeSetting = {
  search: {
    enable: true,
    keys: ['name', 'title'],
    mode: 'fuzzy',
    typeKey: 'type',
    types: ['document', 'dashboard']
  }
};
```

Useful options:

- `types`: only nodes whose type is in this list enter the search. Leave empty to search all types.
- `typeKey`: node property used as the type source. Defaults to `type`.
- `keys`: text properties searched on each node. Defaults to `name` and `title`.
- `mode`: `fuzzy` or `contains`.
- `resultMode`: `matches` shows only matched nodes; `path` also shows ancestors so the tree path remains visible.

The component instance also exposes `searchNodes(query)`, `clearSearch()` and `getSearchMatches()`.

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

Implemented methods include `addNodes`, `removeNode`, `updateNode`, `expandNode`, `expandAll`, `selectNode`, `cancelSelectedNode`, `checkNode`, `checkAllNodes`, `getNodes`, `getSelectedNodes`, `getCheckedNodes`, `getNodeByParam`, `getNodesByFilter`, `searchNodes`, `clearSearch`, `getSearchMatches`, `transformTozTreeNodes`, `transformToArray`, `hideNode`, `showNode`, `moveNode`, `copyNode`, `editName`, `cancelEditName` and `reAsyncChildNodes`.

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
