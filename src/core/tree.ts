import type { RequiredZTreeSetting, ZTreeCheckStatus, ZTreeNode, ZTreeNodeKey } from '../types';

export interface TreeIndexes {
  cache: Map<string, ZTreeNode>;
  parentByTid: Map<string, ZTreeNode | null>;
}

export function cloneNodes(nodes: ZTreeNode[] | ZTreeNode | undefined): ZTreeNode[] {
  if (!nodes) return [];
  return cloneValue(Array.isArray(nodes) ? nodes : [nodes]) as ZTreeNode[];
}

function cloneValue(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  const raw = '__v_raw' in value ? (value as { __v_raw?: object }).__v_raw ?? value : value;
  if (seen.has(raw as object)) return seen.get(raw as object);
  if (Array.isArray(raw)) {
    const copy: unknown[] = [];
    seen.set(raw, copy);
    for (const item of raw) copy.push(cloneValue(item, seen));
    return copy;
  }
  const copy: Record<string, unknown> = {};
  seen.set(raw as object, copy);
  for (const [key, item] of Object.entries(raw as Record<string, unknown>)) {
    copy[key] = typeof item === 'function' ? item : cloneValue(item, seen);
  }
  return copy;
}

export function getNodeKey(setting: RequiredZTreeSetting, node: ZTreeNode): ZTreeNodeKey | undefined {
  const idKey = setting.data.simpleData.idKey ?? 'id';
  return (node[idKey] ?? node.id ?? node.key ?? node.tId) as ZTreeNodeKey | undefined;
}

export function getChildren(setting: RequiredZTreeSetting, node: ZTreeNode | null): ZTreeNode[] {
  const childrenKey = setting.data.key.children ?? 'children';
  if (!node) return [];
  const children = node[childrenKey];
  return Array.isArray(children) ? children as ZTreeNode[] : [];
}

export function setChildren(setting: RequiredZTreeSetting, node: ZTreeNode, children: ZTreeNode[]): void {
  const childrenKey = setting.data.key.children ?? 'children';
  node[childrenKey] = children;
  node.children = children;
}

export function transformSimpleToTree(setting: RequiredZTreeSetting, simpleNodes: ZTreeNode[]): ZTreeNode[] {
  const idKey = setting.data.simpleData.idKey ?? 'id';
  const pIdKey = setting.data.simpleData.pIdKey ?? 'pId';
  const rootPId = setting.data.simpleData.rootPId ?? null;
  const byId = new Map<unknown, ZTreeNode>();
  const roots: ZTreeNode[] = [];

  for (const node of simpleNodes) {
    byId.set(node[idKey], node);
    setChildren(setting, node, getChildren(setting, node));
  }

  for (const node of simpleNodes) {
    const parentId = node[pIdKey] ?? null;
    const parent = byId.get(parentId);
    if (parent && parent !== node) {
      const children = getChildren(setting, parent);
      if (!children.includes(node)) children.push(node);
      setChildren(setting, parent, children);
    } else if (parentId === rootPId || parentId == null || !parent) {
      roots.push(node);
    }
  }

  return roots;
}

export function flatten(nodes: ZTreeNode[] | ZTreeNode, setting: RequiredZTreeSetting): ZTreeNode[] {
  const result: ZTreeNode[] = [];
  const visit = (node: ZTreeNode) => {
    result.push(node);
    for (const child of getChildren(setting, node)) visit(child);
  };
  for (const node of Array.isArray(nodes) ? nodes : [nodes]) visit(node);
  return result;
}

export function normalizeTree(setting: RequiredZTreeSetting, nodes: ZTreeNode[]): TreeIndexes {
  const indexes: TreeIndexes = {
    cache: new Map(),
    parentByTid: new Map()
  };
  let nextId = 1;

  const visit = (node: ZTreeNode, parent: ZTreeNode | null, level: number, index: number, siblings: ZTreeNode[]) => {
    node.tId = node.tId ?? `${setting.treeId}_${nextId++}`;
    node.level = level;
    node.parentTId = parent?.tId ?? null;
    node.isFirstNode = index === 0;
    node.isLastNode = index === siblings.length - 1;
    const checkedKey = setting.data.key.checked ?? 'checked';
    const rawChecked = node[checkedKey] ?? node.checked;
    node.checked = rawChecked === undefined ? Boolean(setting.check.defaultChecked) : Boolean(rawChecked);
    node.checkedOld = node.checkedOld ?? node.checked;
    node.isHidden = Boolean(node[setting.data.key.isHidden ?? 'isHidden'] ?? node.isHidden);
    const children = getChildren(setting, node);
    node.isParent = Boolean(node[setting.data.key.isParent ?? 'isParent'] ?? node.isParent ?? children.length > 0);
    node.open = node.open === undefined
      ? (node.isParent ? Boolean(setting.view.defaultExpanded) : false)
      : Boolean(node.open);

    indexes.cache.set(node.tId, node);
    indexes.parentByTid.set(node.tId, parent);

    node.getParentNode = () => indexes.parentByTid.get(node.tId ?? '') ?? null;
    node.getIndex = () => (parent ? getChildren(setting, parent) : nodes).indexOf(node);
    node.getPreNode = () => (parent ? getChildren(setting, parent) : nodes)[(node.getIndex?.() ?? -1) - 1] ?? null;
    node.getPrevNode = node.getPreNode;
    node.getNextNode = () => (parent ? getChildren(setting, parent) : nodes)[(node.getIndex?.() ?? -1) + 1] ?? null;
    node.getPath = () => {
      const path: ZTreeNode[] = [];
      let current: ZTreeNode | null = node;
      while (current) {
        path.unshift(current);
        current = current.getParentNode?.() ?? null;
      }
      return path;
    };
    node.getCheckStatus = (): ZTreeCheckStatus => ({
      checked: Boolean(node.checked),
      half: Boolean(node.halfCheck || (node.check_Child_State !== undefined && node.check_Child_State > 0 && node.check_Child_State < 2))
    });

    children.forEach((child, childIndex) => visit(child, node, level + 1, childIndex, children));
  };

  nodes.forEach((node, index) => visit(node, null, 0, index, nodes));
  return indexes;
}

export function getSiblings(setting: RequiredZTreeSetting, node: ZTreeNode, indexes: TreeIndexes): ZTreeNode[] {
  const parent = indexes.parentByTid.get(node.tId ?? '') ?? null;
  return parent ? getChildren(setting, parent) : [];
}

export function findNodeByParam(setting: RequiredZTreeSetting, nodes: ZTreeNode[], key: string, value: unknown): ZTreeNode | null {
  return flatten(nodes, setting).find((node) => node[key] === value) ?? null;
}

export function findNodesByParam(setting: RequiredZTreeSetting, nodes: ZTreeNode[], key: string, value: unknown): ZTreeNode[] {
  return flatten(nodes, setting).filter((node) => node[key] === value);
}

export function removeFromParent(setting: RequiredZTreeSetting, roots: ZTreeNode[], node: ZTreeNode, indexes: TreeIndexes): boolean {
  const parent = indexes.parentByTid.get(node.tId ?? '') ?? null;
  const siblings = parent ? getChildren(setting, parent) : roots;
  const index = siblings.indexOf(node);
  if (index < 0) return false;
  siblings.splice(index, 1);
  if (parent) {
    setChildren(setting, parent, siblings);
    parent.isParent = siblings.length > 0 || Boolean(setting.data.keep.parent);
  }
  return true;
}
