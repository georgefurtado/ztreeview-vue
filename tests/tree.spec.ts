import { describe, expect, it } from 'vitest';
import { resolveSetting } from '../src/core/defaults';
import { cloneNodes, flatten, normalizeTree, transformSimpleToTree } from '../src/core/tree';
import type { ZTreeNode } from '../src/types';

describe('tree core', () => {
  it('transforms simpleData into nested zTree nodes', () => {
    const setting = resolveSetting({
      data: { simpleData: { enable: true } }
    }, 'unit');
    const nodes: ZTreeNode[] = [
      { id: 1, pId: null, name: 'Root' },
      { id: 2, pId: 1, name: 'Child' }
    ];

    const tree = transformSimpleToTree(setting, cloneNodes(nodes));

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children?.[0].name).toBe('Child');
  });

  it('normalizes ids, levels and helper methods', () => {
    const setting = resolveSetting({}, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root', children: [{ name: 'Child' }] }];

    const indexes = normalizeTree(setting, nodes);
    const all = flatten(nodes, setting);

    expect(indexes.cache.size).toBe(2);
    expect(all[1].level).toBe(1);
    expect(all[1].getParentNode?.()).toBe(all[0]);
    expect(all[1].getPath?.().map((node) => node.name)).toEqual(['Root', 'Child']);
  });
});
