import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { resolveSetting } from '../core/defaults';
import {
  cloneNodes,
  findNodeByParam,
  findNodesByParam,
  flatten,
  getChildren,
  getNodeKey,
  normalizeTree,
  removeFromParent,
  setChildren,
  transformSimpleToTree
} from '../core/tree';
import { clearCache as clearCacheEntry, useZTreeCache } from './useZTreeCache';
import type {
  RequiredZTreeSetting,
  ZTreeCachePayload,
  ZTreeInstance,
  ZTreeMoveType,
  ZTreeNode,
  ZTreeNodeKey,
  ZTreeSetting
} from '../types';

export interface UseZTreeOptions {
  nodes?: () => ZTreeNode[] | undefined;
  setting?: () => ZTreeSetting | undefined;
  treeId?: () => string | undefined;
  checkedKeys?: () => ZTreeNodeKey[] | undefined;
  selectedKeys?: () => ZTreeNodeKey[] | undefined;
  emit?: (event: string, ...args: unknown[]) => void;
}

export function useZTree(options: UseZTreeOptions = {}) {
  const setting = computed<RequiredZTreeSetting>(() => resolveSetting(options.setting?.(), options.treeId?.()));
  const roots = ref<ZTreeNode[]>([]);
  const selectedNodes = shallowRef<ZTreeNode[]>([]);
  const editingNode = shallowRef<ZTreeNode | null>(null);
  const searchQuery = ref('');
  const searchMatches = shallowRef<ZTreeNode[]>([]);
  const openStateBeforeSearch = shallowRef<Map<string, boolean> | null>(null);
  const editable = ref(Boolean(setting.value.edit.enable));
  const indexes = reactive({
    cache: new Map<string, ZTreeNode>(),
    parentByTid: new Map<string, ZTreeNode | null>()
  });

  function rebuildIndexes(): void {
    const next = normalizeTree(setting.value, roots.value);
    indexes.cache = next.cache;
    indexes.parentByTid = next.parentByTid;
    repairAllCheckState();
  }

  function setRootNodes(input: ZTreeNode[] | undefined): void {
    const cloned = cloneNodes(input);
    roots.value = setting.value.data.simpleData.enable ? transformSimpleToTree(setting.value, cloned) : cloned;
    rebuildIndexes();
    applyExternalState();
    cache.restore();
  }

  function applyExternalState(): void {
    const selected = options.selectedKeys?.();
    if (selected) {
      selectedNodes.value = flatten(roots.value, setting.value).filter((node) => {
        const key = getNodeKey(setting.value, node);
        return key !== undefined && selected.includes(key);
      });
    }

    const checked = options.checkedKeys?.();
    if (checked) {
      for (const node of flatten(roots.value, setting.value)) {
        const key = getNodeKey(setting.value, node);
        node.checked = key !== undefined && checked.includes(key);
      }
      repairAllCheckState();
    }
  }

  function onCacheRestore(payload: ZTreeCachePayload): void {
    const allNodes = flatten(roots.value, setting.value);
    const hasExternalChecked = options.checkedKeys?.() !== undefined;
    const hasExternalSelected = options.selectedKeys?.() !== undefined;

    if (setting.value.check.enable && !hasExternalChecked) {
      const keys = new Set(payload.checkedKeys);
      for (const node of allNodes) {
        if (node.chkDisabled || node.nocheck) continue;
        const key = getNodeKey(setting.value, node);
        node.checked = key !== undefined && keys.has(key);
      }
      repairAllCheckState();
    }

    const openKeys = new Set(payload.openKeys);
    for (const node of allNodes) {
      if (!node.isParent) continue;
      const key = getNodeKey(setting.value, node);
      node.open = key !== undefined && openKeys.has(key);
    }

    if (!hasExternalSelected) {
      const keys = new Set(payload.selectedKeys);
      selectedNodes.value = allNodes.filter((node) => {
        const key = getNodeKey(setting.value, node);
        return key !== undefined && keys.has(key);
      });
    }

    if (setting.value.search.enable && payload.searchQuery) {
      searchNodes(payload.searchQuery);
    }
  }

  const cache = useZTreeCache({
    setting,
    roots,
    selectedNodes,
    searchQuery,
    onRestore: onCacheRestore
  });

  watch([() => options.nodes?.(), setting], ([nodes]) => setRootNodes(nodes), { immediate: true, deep: true });
  watch(() => options.checkedKeys?.(), applyExternalState, { deep: true });
  watch(() => options.selectedKeys?.(), applyExternalState, { deep: true });

  function emitCallback(event: string, callbackName: keyof RequiredZTreeSetting['callback'], domEvent: Event, node: ZTreeNode | null, ...args: unknown[]) {
    options.emit?.(event, node, domEvent, ...args);
    const callback = setting.value.callback[callbackName] as ((...callbackArgs: unknown[]) => unknown) | undefined;
    if (callback && node) callback(domEvent, setting.value.treeId, node, ...args);
  }

  async function allow(callbackName: keyof RequiredZTreeSetting['callback'], node: ZTreeNode, ...args: unknown[]): Promise<boolean> {
    const callback = setting.value.callback[callbackName] as ((...callbackArgs: unknown[]) => boolean | Promise<boolean>) | undefined;
    if (!callback) return true;
    const result = await callback(setting.value.treeId, node, ...args);
    return result !== false;
  }

  const searchActive = computed(() => setting.value.search.enable && searchQuery.value.trim().length > 0);
  const searchMatchSet = computed(() => new Set(searchMatches.value));

  function hasMatchedDescendant(node: ZTreeNode): boolean {
    return getChildren(setting.value, node).some((child) => searchMatchSet.value.has(child) || hasMatchedDescendant(child));
  }

  function hasMatchedAncestor(node: ZTreeNode): boolean {
    let current = node.getParentNode?.() ?? null;
    while (current) {
      if (searchMatchSet.value.has(current)) return true;
      current = current.getParentNode?.() ?? null;
    }
    return false;
  }

  function isVisibleBySearch(node: ZTreeNode): boolean {
    if (!searchActive.value) return true;
    if (setting.value.search.resultMode === 'path') return searchMatchSet.value.has(node) || hasMatchedDescendant(node);
    return searchMatchSet.value.has(node);
  }

  function getVisibleChildren(node: ZTreeNode): ZTreeNode[] {
    return getChildren(setting.value, node).filter((child) => !child.isHidden && isVisibleBySearch(child));
  }

  function getCheckedNodes(checked = true): ZTreeNode[] {
    return flatten(roots.value, setting.value).filter((node) => Boolean(node.checked) === checked);
  }

  function getNodeKeys(nodes: ZTreeNode[]): ZTreeNodeKey[] {
    return nodes.map((node) => getNodeKey(setting.value, node)).filter((key): key is ZTreeNodeKey => key !== undefined);
  }

  function getSelectedNodes(): ZTreeNode[] {
    return selectedNodes.value;
  }

  function getSelectableNodes(): ZTreeNode[] {
    return flatten(roots.value, setting.value).filter((node) => !node.isHidden && isVisibleBySearch(node));
  }

  function getCheckableNodes(): ZTreeNode[] {
    return flatten(roots.value, setting.value).filter((node) => !node.isHidden && isVisibleBySearch(node) && !node.nocheck && !node.chkDisabled);
  }

  function getExpandableNodes(): ZTreeNode[] {
    return flatten(roots.value, setting.value).filter((node) => node.isParent && !node.isHidden && isVisibleBySearch(node));
  }

  const allNodesSelected = computed(() => {
    const nodes = setting.value.check.enable ? getCheckableNodes() : getSelectableNodes();
    return nodes.length > 0 && nodes.every((node) => setting.value.check.enable ? node.checked : selectedNodes.value.includes(node));
  });

  const allNodesExpanded = computed(() => {
    const nodes = getExpandableNodes();
    return nodes.length > 0 && nodes.every((node) => node.open);
  });

  function getChangeCheckedNodes(): ZTreeNode[] {
    return flatten(roots.value, setting.value).filter((node) => node.checked !== node.checkedOld);
  }

  function selectNode(node: ZTreeNode, addFlag = false, isSilent = false): void {
    if (!setting.value.view.selectedMulti || !addFlag) selectedNodes.value = [];
    if (!selectedNodes.value.includes(node)) selectedNodes.value = [...selectedNodes.value, node];
    if (!isSilent) options.emit?.('update:selectedKeys', getNodeKeys(selectedNodes.value));
    cache.persist();
  }

  function emitSelectedKeys(): void {
    options.emit?.('update:selectedKeys', getNodeKeys(selectedNodes.value));
    cache.persist();
  }

  function emitCheckedKeys(): void {
    options.emit?.('update:checkedKeys', getNodeKeys(getCheckedNodes(true)));
    cache.persist();
  }

  function syncSelectedFromChecked(isSilent = false): void {
    selectedNodes.value = getCheckedNodes(true).filter((node) => !node.isHidden);
    if (!isSilent) emitSelectedKeys();
  }

  function selectAllNodes(isSilent = false): void {
    if (setting.value.check.enable) {
      checkAllNodes(true, isSilent);
      return;
    }

    selectedNodes.value = getSelectableNodes();
    if (!isSilent) emitSelectedKeys();
  }

  function cancelSelectedNode(node?: ZTreeNode): void {
    if (setting.value.check.enable) {
      if (node) checkNode(node, false, true, false);
      else checkAllNodes(false);
      return;
    }

    selectedNodes.value = node ? selectedNodes.value.filter((selected) => selected !== node) : [];
    emitSelectedKeys();
  }

  function toggleSelectAll(): void {
    if (allNodesSelected.value) cancelSelectedNode();
    else selectAllNodes();
  }

  function setNodeAndChildrenChecked(node: ZTreeNode, checked: boolean): void {
    node.checked = checked;
    node.halfCheck = false;
    node.check_Child_State = checked ? 2 : 0;
    for (const child of getChildren(setting.value, node)) {
      if (!child.chkDisabled && !child.nocheck) setNodeAndChildrenChecked(child, checked);
    }
  }

  function repairParentCheckState(node: ZTreeNode | null): void {
    while (node) {
      const children = getChildren(setting.value, node).filter((child) => !child.nocheck && !child.isHidden);
      const checkedCount = children.filter((child) => child.checked).length;
      const halfCount = children.filter((child) => child.halfCheck).length;
      node.checked = children.length > 0 && checkedCount === children.length;
      node.halfCheck = !node.checked && (checkedCount > 0 || halfCount > 0);
      node.check_Child_State = node.checked ? 2 : node.halfCheck ? 1 : 0;
      node = node.getParentNode?.() ?? null;
    }
  }

  function repairAllCheckState(): void {
    const nodes = flatten(roots.value, setting.value).reverse();
    for (const node of nodes) {
      const children = getChildren(setting.value, node).filter((child) => !child.nocheck && !child.isHidden);
      if (!children.length) {
        node.check_Child_State = node.checked ? 2 : 0;
        node.halfCheck = false;
        continue;
      }
      const checkedCount = children.filter((child) => child.checked).length;
      const halfCount = children.filter((child) => child.halfCheck).length;
      node.checked = checkedCount === children.length;
      node.halfCheck = !node.checked && (checkedCount > 0 || halfCount > 0);
      node.check_Child_State = node.checked ? 2 : node.halfCheck ? 1 : 0;
    }
  }

  function uncheckRadioPeers(node: ZTreeNode): void {
    const scope = setting.value.check.radioType === 'all'
      ? flatten(roots.value, setting.value)
      : node.getParentNode?.() ? getChildren(setting.value, node.getParentNode?.() ?? null) : roots.value;
    for (const peer of scope) {
      if (peer !== node) peer.checked = false;
    }
  }

  function checkNode(node: ZTreeNode, checked = !node.checked, checkTypeFlag = true, callbackFlag = false): void {
    if (!setting.value.check.enable || node.nocheck || node.chkDisabled) return;
    if (callbackFlag) {
      void allow('beforeCheck', node).then((ok) => {
        if (ok) checkNode(node, checked, checkTypeFlag, false);
      });
      return;
    }
    if (setting.value.check.chkStyle === 'radio') {
      if (checked) uncheckRadioPeers(node);
      node.checked = checked;
      node.halfCheck = false;
      node.check_Child_State = checked ? 2 : 0;
    } else {
      if (checkTypeFlag) setNodeAndChildrenChecked(node, checked);
      else node.checked = checked;
      repairParentCheckState(node.getParentNode?.() ?? null);
    }
    if (setting.value.check.enable) syncSelectedFromChecked();
    emitCheckedKeys();
  }

  function checkAllNodes(checked: boolean, isSilent = false): void {
    for (const node of flatten(roots.value, setting.value)) {
      if (!node.nocheck && !node.chkDisabled) {
        node.checked = checked;
        node.halfCheck = false;
        node.check_Child_State = checked ? 2 : 0;
      }
    }
    if (setting.value.check.enable) syncSelectedFromChecked(true);
    if (!isSilent) {
      emitCheckedKeys();
      emitSelectedKeys();
    }
  }

  function expandNode(node: ZTreeNode, expandFlag = !node.open, sonSign = false, _focus = false, callbackFlag = false): boolean | null {
    if (!node || !node.isParent) return null;
    if (callbackFlag) {
      void allow(expandFlag ? 'beforeExpand' : 'beforeCollapse', node).then((ok) => {
        if (ok) expandNode(node, expandFlag, sonSign, _focus, false);
      });
      return null;
    }
    node.open = expandFlag;
    if (sonSign) {
      for (const child of getChildren(setting.value, node)) expandNode(child, expandFlag, true);
    }
    cache.persist();
    return true;
  }

  function expandAll(expandFlag: boolean): boolean | null {
    for (const node of flatten(roots.value, setting.value)) {
      if (node.isParent) node.open = expandFlag;
    }
    cache.persist();
    return true;
  }

  function toggleExpandAll(): boolean | null {
    return expandAll(!allNodesExpanded.value);
  }

  function addNodes(parentNode: ZTreeNode | null, index = -1, newNodes?: ZTreeNode[] | ZTreeNode, isSilent = false): ZTreeNode[] {
    const nodes = cloneNodes(newNodes);
    if (!nodes.length) return [];
    const target = parentNode ? getChildren(setting.value, parentNode) : roots.value;
    if (index < 0 || index > target.length) target.push(...nodes);
    else target.splice(index, 0, ...nodes);
    if (parentNode) {
      setChildren(setting.value, parentNode, target);
      parentNode.isParent = true;
    }
    rebuildIndexes();
    if (!isSilent) options.emit?.('nodes-change', roots.value);
    return nodes;
  }

  function removeChildNodes(parentNode: ZTreeNode): ZTreeNode[] {
    const removed = getChildren(setting.value, parentNode);
    setChildren(setting.value, parentNode, []);
    parentNode.isParent = Boolean(setting.value.data.keep.parent);
    rebuildIndexes();
    return removed;
  }

  function removeNode(node: ZTreeNode, callbackFlag = false): void {
    if (callbackFlag) {
      void allow('beforeRemove', node).then((ok) => {
        if (ok) removeNode(node, false);
      });
      return;
    }
    removeFromParent(setting.value, roots.value, node, indexes);
    selectedNodes.value = selectedNodes.value.filter((selected) => selected !== node);
    rebuildIndexes();
  }

  function moveNode(targetNode: ZTreeNode | null, node: ZTreeNode, moveType: ZTreeMoveType, isSilent = false): ZTreeNode | null {
    if (targetNode === node) return null;
    removeFromParent(setting.value, roots.value, node, indexes);
    const targetParent = moveType === 'inner' ? targetNode : targetNode?.getParentNode?.() ?? null;
    const targetSiblings = targetParent ? getChildren(setting.value, targetParent) : roots.value;
    if (moveType === 'inner') {
      targetSiblings.push(node);
      if (targetParent) {
        targetParent.open = true;
        targetParent.isParent = true;
        setChildren(setting.value, targetParent, targetSiblings);
      }
    } else {
      const targetIndex = targetNode ? targetSiblings.indexOf(targetNode) : targetSiblings.length;
      targetSiblings.splice(moveType === 'prev' ? targetIndex : targetIndex + 1, 0, node);
    }
    rebuildIndexes();
    if (!isSilent) options.emit?.('nodes-change', roots.value);
    return node;
  }

  function copyNode(targetNode: ZTreeNode | null, node: ZTreeNode, moveType: ZTreeMoveType, isSilent = false): ZTreeNode | null {
    const copy = cloneNodes(node)[0];
    return moveNode(targetNode, copy, moveType, isSilent);
  }

  function editName(node: ZTreeNode): void {
    if (editable.value) editingNode.value = node;
  }

  function cancelEditName(newName?: string): void {
    if (editingNode.value && newName !== undefined) editingNode.value.name = newName;
    editingNode.value = null;
  }

  function hideNode(node: ZTreeNode): void {
    node.isHidden = true;
    repairAllCheckState();
  }

  function showNode(node: ZTreeNode): void {
    node.isHidden = false;
    repairAllCheckState();
  }

  function normalizeSearchText(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase();
  }

  function fuzzyScore(text: string, query: string): number {
    if (!query) return 1;
    if (!text) return 0;
    if (text.includes(query)) return 1;

    let queryIndex = 0;
    let firstMatch = -1;
    let lastMatch = -1;

    for (let textIndex = 0; textIndex < text.length && queryIndex < query.length; textIndex += 1) {
      if (text[textIndex] !== query[queryIndex]) continue;
      if (firstMatch < 0) firstMatch = textIndex;
      lastMatch = textIndex;
      queryIndex += 1;
    }

    if (queryIndex < query.length) return 0;
    const span = Math.max(1, lastMatch - firstMatch + 1);
    const compactness = query.length / span;
    const coverage = query.length / text.length;
    return 0.25 + compactness * 0.6 + coverage * 0.15;
  }

  function nodeMatchesAllowedType(node: ZTreeNode): boolean {
    const types = setting.value.search.types;
    if (!types.length) return true;
    const rawType = node[setting.value.search.typeKey];
    const nodeTypes = Array.isArray(rawType) ? rawType : [rawType];
    return nodeTypes.some((type) => types.includes(String(type)));
  }

  function nodeMatchesQuery(node: ZTreeNode, query: string): boolean {
    if (!nodeMatchesAllowedType(node)) return false;
    const keys = setting.value.search.keys.length ? setting.value.search.keys : ['name'];
    const normalizedQuery = normalizeSearchText(query);

    return keys.some((key) => {
      const text = normalizeSearchText(node[key]);
      if (setting.value.search.mode === 'contains') return text.includes(normalizedQuery);
      return fuzzyScore(text, normalizedQuery) >= setting.value.search.minScore;
    });
  }

  function rememberOpenState(): void {
    if (openStateBeforeSearch.value) return;
    openStateBeforeSearch.value = new Map(
      flatten(roots.value, setting.value)
        .filter((node) => node.tId)
        .map((node) => [node.tId as string, Boolean(node.open)])
    );
  }

  function restoreOpenState(): void {
    const previous = openStateBeforeSearch.value;
    if (!previous) return;
    for (const node of flatten(roots.value, setting.value)) {
      if (node.tId && previous.has(node.tId)) node.open = previous.get(node.tId);
    }
    openStateBeforeSearch.value = null;
  }

  function expandSearchPaths(matches: ZTreeNode[]): void {
    if (!setting.value.search.autoExpand) return;
    for (const node of matches) {
      let parent = node.getParentNode?.() ?? null;
      while (parent) {
        parent.open = true;
        parent = parent.getParentNode?.() ?? null;
      }
    }
  }

  function searchNodes(query: string): ZTreeNode[] {
    searchQuery.value = query;
    const normalizedQuery = query.trim();
    if (!setting.value.search.enable || !normalizedQuery) {
      searchMatches.value = [];
      restoreOpenState();
      cache.persistDebounced();
      return [];
    }

    rememberOpenState();
    const matches = flatten(roots.value, setting.value).filter((node) => !node.isHidden && nodeMatchesQuery(node, normalizedQuery));
    searchMatches.value = Array.from(new Set(matches));
    expandSearchPaths(searchMatches.value);
    cache.persistDebounced();
    return searchMatches.value;
  }

  function clearSearch(): void {
    searchQuery.value = '';
    searchMatches.value = [];
    restoreOpenState();
    cache.persist();
  }

  const visibleRoots = computed(() => {
    if (!searchActive.value) return roots.value.filter((node) => !node.isHidden);
    if (setting.value.search.resultMode === 'path') {
      return roots.value.filter((node) => !node.isHidden && isVisibleBySearch(node));
    }
    return searchMatches.value.filter((node) => !node.isHidden && !hasMatchedAncestor(node));
  });

  watch(searchQuery, (query) => {
    if (query.trim()) searchNodes(query);
    else clearSearch();
  });

  async function reAsyncChildNodes(parentNode: ZTreeNode | null, reloadType = 'refresh', isSilent = false, callback?: () => void): Promise<void> {
    if (!setting.value.async.enable || !setting.value.async.url) return;
    if (parentNode && !(await allow('beforeAsync', parentNode))) return;

    const url = typeof setting.value.async.url === 'function' ? setting.value.async.url(setting.value.treeId, parentNode) : setting.value.async.url;
    if (!url) return;
    if (parentNode) parentNode.isAjaxing = true;

    try {
      const response = await fetch(url, {
        method: setting.value.async.type?.toUpperCase(),
        headers: setting.value.async.headers
      });
      const payload = setting.value.async.dataType === 'text' ? await response.text() : await response.json();
      const filtered = setting.value.async.dataFilter?.(setting.value.treeId, parentNode, payload) ?? payload;
      const nodes = cloneNodes(filtered as ZTreeNode[] | ZTreeNode);
      if (parentNode) {
        if (reloadType === 'refresh') setChildren(setting.value, parentNode, []);
        addNodes(parentNode, -1, nodes, true);
      } else {
        roots.value = nodes;
        rebuildIndexes();
      }
      if (!isSilent) options.emit?.('async-success', parentNode, filtered);
      callback?.();
    } catch (error) {
      options.emit?.('async-error', parentNode, error);
      throw error;
    } finally {
      if (parentNode) parentNode.isAjaxing = false;
    }
  }

  function setChkDisabled(node: ZTreeNode, disabled = true, _inheritParent = false, inheritChildren = false): void {
    node.chkDisabled = disabled;
    if (inheritChildren) {
      for (const child of getChildren(setting.value, node)) setChkDisabled(child, disabled, false, true);
    }
  }

  function updateNode(_node: ZTreeNode, checkTypeFlag = true): void {
    if (checkTypeFlag) repairAllCheckState();
    rebuildIndexes();
  }

  const api: ZTreeInstance = {
    get setting() {
      return setting.value;
    },
    addNodes,
    cancelEditName,
    cancelSelectedNode,
    checkAllNodes,
    checkNode,
    clearCache: () => clearCacheEntry(setting.value.treeId),
    copyNode,
    editName,
    expandAll,
    expandNode,
    getChangeCheckedNodes,
    getCheckedNodes,
    getNodeByParam: (key, value, parentNode = null) => findNodeByParam(setting.value, parentNode ? getChildren(setting.value, parentNode) : roots.value, key, value),
    getNodeByTId: (tId) => indexes.cache.get(tId) ?? null,
    getNodeIndex: (node) => node.getIndex?.() ?? -1,
    getNodes: () => roots.value,
    getNodesByFilter: (filter, isSingle = false, parentNode = null) => {
      const nodes = flatten(parentNode ? getChildren(setting.value, parentNode) : roots.value, setting.value).filter(filter);
      return isSingle ? nodes[0] ?? null : nodes;
    },
    getNodesByParam: (key, value, parentNode = null) => findNodesByParam(setting.value, parentNode ? getChildren(setting.value, parentNode) : roots.value, key, value),
    getNodesByParamFuzzy: (key, value, parentNode = null) => flatten(parentNode ? getChildren(setting.value, parentNode) : roots.value, setting.value).filter((node) => String(node[key] ?? '').includes(value)),
    getSelectedNodes,
    hideNode,
    hideNodes: (nodes) => nodes.forEach(hideNode),
    moveNode,
    reAsyncChildNodes,
    refresh: rebuildIndexes,
    removeChildNodes,
    removeNode,
    clearSearch,
    getSearchMatches: () => searchMatches.value,
    searchNodes,
    selectAllNodes,
    selectNode,
    setChkDisabled,
    setEditable: (nextEditable) => {
      editable.value = nextEditable;
    },
    showNode,
    showNodes: (nodes) => nodes.forEach(showNode),
    toggleExpandAll,
    toggleSelectAll,
    transformToArray: (nodes) => flatten(nodes, setting.value),
    transformTozTreeNodes: (nodes) => transformSimpleToTree(setting.value, cloneNodes(nodes)),
    updateNode
  };

  return {
    api,
    allNodesExpanded,
    allNodesSelected,
    editingNode,
    editable,
    getVisibleChildren,
    indexes,
    roots,
    visibleRoots,
    searchActive,
    searchMatches,
    searchQuery,
    selectedNodes,
    setting,
    emitCallback,
    checkNode,
    expandNode,
    selectNode,
    selectAllNodes,
    toggleExpandAll,
    toggleSelectAll,
    moveNode,
    editName,
    cancelEditName
  };
}
