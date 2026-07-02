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

describe('default state settings', () => {
  it('applies check.defaultChecked to nodes with no explicit checked value', () => {
    const setting = resolveSetting({ check: { defaultChecked: true } }, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root' }];

    normalizeTree(setting, nodes);

    expect(nodes[0].checked).toBe(true);
  });

  it('does not let check.defaultChecked override an explicit checked:false', () => {
    const setting = resolveSetting({ check: { defaultChecked: true } }, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root', checked: false }];

    normalizeTree(setting, nodes);

    expect(nodes[0].checked).toBe(false);
  });

  it('does not let check.defaultChecked override an explicit checked:true', () => {
    const setting = resolveSetting({ check: { defaultChecked: false } }, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root', checked: true }];

    normalizeTree(setting, nodes);

    expect(nodes[0].checked).toBe(true);
  });

  it('applies view.defaultExpanded to parent nodes with no explicit open value', () => {
    const setting = resolveSetting({ view: { defaultExpanded: true } }, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root', children: [{ name: 'Child' }] }];

    normalizeTree(setting, nodes);

    expect(nodes[0].open).toBe(true);
  });

  it('does not apply view.defaultExpanded to leaf nodes', () => {
    const setting = resolveSetting({ view: { defaultExpanded: true } }, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root', children: [{ name: 'Child' }] }];

    normalizeTree(setting, nodes);

    expect(nodes[0].children?.[0].open).toBe(false);
  });

  it('does not let view.defaultExpanded override an explicit open:false', () => {
    const setting = resolveSetting({ view: { defaultExpanded: true } }, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root', open: false, children: [{ name: 'Child' }] }];

    normalizeTree(setting, nodes);

    expect(nodes[0].open).toBe(false);
  });

  it('preserves current behavior when defaults are unset', () => {
    const setting = resolveSetting({}, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root', children: [{ name: 'Child' }] }];

    normalizeTree(setting, nodes);

    expect(nodes[0].checked).toBe(false);
    expect(nodes[0].open).toBe(false);
    expect(nodes[0].children?.[0].checked).toBe(false);
    expect(nodes[0].children?.[0].open).toBe(false);
  });

  it('detects explicit checked values through a remapped data.key.checked', () => {
    const setting = resolveSetting({
      check: { defaultChecked: true },
      data: { key: { checked: 'isChecked' } }
    }, 'unit');
    const nodes: ZTreeNode[] = [{ name: 'Root', isChecked: false }];

    normalizeTree(setting, nodes);

    expect(nodes[0].checked).toBe(false);
  });
});
