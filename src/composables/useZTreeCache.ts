import type { Ref, ShallowRef } from 'vue';
import { flatten, getNodeKey } from '../core/tree';
import type { RequiredZTreeSetting, ZTreeCachePayload, ZTreeNode, ZTreeNodeKey } from '../types';

const CACHE_VERSION = 1 as const;

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const probeKey = '__ztreeview_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

function cacheKey(treeId: string): string {
  return `ztreeview:${treeId}`;
}

export function readCache(treeId: string): ZTreeCachePayload | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(cacheKey(treeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ZTreeCachePayload>;
    if (parsed.version !== CACHE_VERSION) return null;
    return {
      version: CACHE_VERSION,
      checkedKeys: Array.isArray(parsed.checkedKeys) ? parsed.checkedKeys : [],
      selectedKeys: Array.isArray(parsed.selectedKeys) ? parsed.selectedKeys : [],
      openKeys: Array.isArray(parsed.openKeys) ? parsed.openKeys : [],
      searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : ''
    };
  } catch {
    return null;
  }
}

export function writeCache(treeId: string, payload: ZTreeCachePayload): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(cacheKey(treeId), JSON.stringify(payload));
  } catch {
    // localStorage quota exceeded or serialization error - persistence is best-effort
  }
}

export function clearCache(treeId: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(cacheKey(treeId));
  } catch {
    // ignore
  }
}

export interface UseZTreeCacheOptions {
  setting: Ref<RequiredZTreeSetting>;
  roots: Ref<ZTreeNode[]>;
  selectedNodes: ShallowRef<ZTreeNode[]>;
  searchQuery: Ref<string>;
  onRestore: (payload: ZTreeCachePayload) => void;
}

export function useZTreeCache(options: UseZTreeCacheOptions) {
  function collectPayload(): ZTreeCachePayload {
    const setting = options.setting.value;
    const allNodes = flatten(options.roots.value, setting);
    const checkedKeys: ZTreeNodeKey[] = [];
    const openKeys: ZTreeNodeKey[] = [];
    for (const node of allNodes) {
      const key = getNodeKey(setting, node);
      if (key === undefined) continue;
      if (node.checked) checkedKeys.push(key);
      if (node.open) openKeys.push(key);
    }
    const selectedKeys = options.selectedNodes.value
      .map((node) => getNodeKey(setting, node))
      .filter((key): key is ZTreeNodeKey => key !== undefined);
    return { version: CACHE_VERSION, checkedKeys, selectedKeys, openKeys, searchQuery: options.searchQuery.value };
  }

  function persist(): void {
    if (!options.setting.value.cache.enable) return;
    writeCache(options.setting.value.treeId, collectPayload());
  }

  let persistSearchTimer: ReturnType<typeof setTimeout> | undefined;
  function persistDebounced(): void {
    if (!options.setting.value.cache.enable) return;
    clearTimeout(persistSearchTimer);
    persistSearchTimer = setTimeout(persist, 300);
  }

  function restore(): void {
    if (!options.setting.value.cache.enable) return;
    const payload = readCache(options.setting.value.treeId);
    if (!payload) return;
    options.onRestore(payload);
  }

  return { persist, persistDebounced, restore, collectPayload };
}
