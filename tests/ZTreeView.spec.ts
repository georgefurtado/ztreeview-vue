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

  it('marks nested rows with a level guide class and CSS level variable', () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [
          {
            id: 1,
            name: 'Root',
            open: true,
            children: [{ id: 2, name: 'Child' }]
          }
        ]
      }
    });

    const rows = wrapper.findAll('.ztree-node-row');

    expect(rows[0].classes()).not.toContain('has-level-guide');
    expect(rows[1].classes()).toContain('has-level-guide');
    expect(rows[1].attributes('style')).toContain('--ztree-level: 1');
  });

  it('renders checkbox style separately from radio style', () => {
    const checkboxWrapper = mount(ZTreeView, {
      props: {
        nodes: [{ id: 1, name: 'Root' }],
        setting: { check: { enable: true, chkStyle: 'checkbox' } }
      }
    });
    const radioWrapper = mount(ZTreeView, {
      props: {
        nodes: [{ id: 1, name: 'Root' }],
        setting: { check: { enable: true, chkStyle: 'radio' } }
      }
    });

    expect(checkboxWrapper.find('.ztree-check').classes()).toContain('checkbox');
    expect(checkboxWrapper.find('.ztree-check').classes()).not.toContain('radio');
    expect(radioWrapper.find('.ztree-check').classes()).toContain('radio');
  });

  it('uses plus and minus symbols for collapsed and expanded parent nodes', async () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [
          {
            id: 1,
            name: 'Root',
            open: false,
            children: [{ id: 2, name: 'Child' }]
          }
        ]
      }
    });

    const switchButton = wrapper.find('.ztree-switch');

    expect(switchButton.text()).toBe('+');
    await switchButton.trigger('click');
    expect(wrapper.find('.ztree-switch').text()).toBe('-');
  });

  it('selects and deselects all nodes from the toolbar', async () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [
          {
            id: 1,
            name: 'Root',
            open: true,
            children: [{ id: 2, name: 'Child' }]
          }
        ]
      }
    });

    const instance = wrapper.vm as unknown as ZTreeInstance;
    const button = wrapper.find('[data-testid="ztree-toggle-select-all"]');

    await button.trigger('click');
    expect(instance.getSelectedNodes().map((node) => node.name)).toEqual(['Root', 'Child']);
    expect(button.text()).toContain('Desselecionar todos');

    await button.trigger('click');
    expect(instance.getSelectedNodes()).toHaveLength(0);
    expect(button.text()).toContain('Selecionar todos');
  });

  it('expands and collapses all parent nodes from the toolbar', async () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [
          {
            id: 1,
            name: 'Root',
            open: false,
            children: [{ id: 2, name: 'Child' }]
          }
        ]
      }
    });

    const instance = wrapper.vm as unknown as ZTreeInstance;
    const root = instance.getNodeByParam('id', 1);
    const button = wrapper.find('[data-testid="ztree-toggle-expand-all"]');

    expect(root?.open).toBe(false);
    await button.trigger('click');
    expect(root?.open).toBe(true);
    expect(button.text()).toContain('Colapsar todos');

    await button.trigger('click');
    expect(root?.open).toBe(false);
    expect(button.text()).toContain('Expandir todos');
  });
});
