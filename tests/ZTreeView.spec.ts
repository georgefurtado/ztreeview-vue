import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ZTreeView from '../src/components/ZTreeView.vue';
import type { ZTreeNode, ZTreeInstance } from '../src/types';

describe('ZTreeView', () => {
  it('renders nodes and exposes zTree-compatible methods', async () => {
    const nodes: ZTreeNode[] = [
      { id: 1, name: 'Root', open: true, children: [{ id: 2, name: 'Child' }] }
    ];
    const wrapper = mount(ZTreeView, {
      props: {
        nodes,
        setting: { check: { enable: true } }
      }
    });

    expect(wrapper.text()).toContain('Root');
    expect(wrapper.text()).toContain('Child');

    const instance = wrapper.vm as unknown as ZTreeInstance;
    const child = instance.getNodeByParam('id', 2);
    expect(child?.name).toBe('Child');

    instance.checkNode(child!, true);
    expect(instance.getCheckedNodes()).toHaveLength(2);
  });

  it('selects a node through DOM interaction', async () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [{ id: 1, name: 'Root' }]
      }
    });

    await wrapper.find('.ztree-node-row').trigger('click');

    const instance = wrapper.vm as unknown as ZTreeInstance;
    expect(instance.getSelectedNodes().map((node) => node.name)).toEqual(['Root']);
  });

  it('applies level-based indentation to each rendered row', () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [
          {
            id: 1,
            name: 'Root',
            open: true,
            children: [
              {
                id: 2,
                name: 'Child',
                open: true,
                children: [{ id: 3, name: 'Grandchild' }]
              }
            ]
          }
        ]
      }
    });

    const rows = wrapper.findAll('.ztree-node-row');

    expect(rows[0].attributes('style')).toContain('calc(0 * var(--ztree-indent) + 4px)');
    expect(rows[1].attributes('style')).toContain('calc(1 * var(--ztree-indent) + 4px)');
    expect(rows[2].attributes('style')).toContain('calc(2 * var(--ztree-indent) + 4px)');
  });
});
