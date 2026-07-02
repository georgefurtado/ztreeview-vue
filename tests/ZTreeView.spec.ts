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

  it('applies node color to the rendered item text', () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [{ id: 1, name: 'Root', color: '#dc2626' }]
      }
    });

    expect(wrapper.find('.ztree-node-name').attributes('style')).toContain('color: rgb(220, 38, 38)');
  });

  it('renders node icon classes next to the item text', () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [{ id: 1, name: 'Root', icon: 'fa fa-folder' }]
      }
    });

    const textIcon = wrapper.find('.ztree-node-name .ztree-node-text-icon');

    expect(textIcon.exists()).toBe(true);
    expect(textIcon.classes()).toEqual(expect.arrayContaining(['ztree-node-text-icon', 'fa', 'fa-folder']));
    expect(wrapper.find('.ztree-icon img').exists()).toBe(false);
  });

  it('does not render legacy image icons from the icon property', () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [{ id: 1, name: 'Root', icon: 'material-symbols-outlined' }]
      }
    });

    expect(wrapper.find('.ztree-icon img').exists()).toBe(false);
    expect(wrapper.find('.ztree-node-name .ztree-node-text-icon').classes()).toContain('material-symbols-outlined');
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
    expect(button.text()).toContain('☑ All');
    expect(button.attributes('aria-label')).toBe('Desselecionar todos');

    await button.trigger('click');
    expect(instance.getSelectedNodes()).toHaveLength(0);
    expect(button.text()).toContain('☐ All');
    expect(button.attributes('aria-label')).toBe('Selecionar todos');
  });

  it('checks and unchecks all nodes from the toolbar when checkbox mode is enabled', async () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [
          {
            id: 1,
            name: 'Root',
            open: true,
            children: [{ id: 2, name: 'Child' }]
          }
        ],
        setting: { check: { enable: true } }
      }
    });

    const instance = wrapper.vm as unknown as ZTreeInstance;
    const button = wrapper.find('[data-testid="ztree-toggle-select-all"]');

    await button.trigger('click');
    expect(instance.getCheckedNodes().map((node) => node.name)).toEqual(['Root', 'Child']);
    expect(instance.getSelectedNodes().map((node) => node.name)).toEqual(['Root', 'Child']);
    expect(wrapper.findAll('.ztree-check.checked')).toHaveLength(2);
    expect(wrapper.emitted('update:checkedKeys')?.at(-1)?.[0]).toEqual([1, 2]);
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([1, 2]);

    await button.trigger('click');
    expect(instance.getCheckedNodes()).toHaveLength(0);
    expect(instance.getSelectedNodes()).toHaveLength(0);
    expect(wrapper.findAll('.ztree-check.checked')).toHaveLength(0);
    expect(wrapper.emitted('update:checkedKeys')?.at(-1)?.[0]).toEqual([]);
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([]);
  });

  it('treats a checked node as a selected node', async () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [{ id: 1, name: 'Root' }],
        setting: { check: { enable: true } }
      }
    });

    const instance = wrapper.vm as unknown as ZTreeInstance;

    await wrapper.find('.ztree-check').trigger('click');
    expect(instance.getCheckedNodes().map((node) => node.name)).toEqual(['Root']);
    expect(instance.getSelectedNodes().map((node) => node.name)).toEqual(['Root']);
    expect(wrapper.emitted('update:checkedKeys')?.at(-1)?.[0]).toEqual([1]);
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([1]);
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
    expect(button.text()).toContain('⊟ All');
    expect(button.attributes('aria-label')).toBe('Colapsar todos');

    await button.trigger('click');
    expect(root?.open).toBe(false);
    expect(button.text()).toContain('⊞ All');
    expect(button.attributes('aria-label')).toBe('Expandir todos');
  });

  it('filters search results by configured node types without duplicates', async () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [
          {
            id: 1,
            name: 'Financeiro',
            type: 'folder',
            open: true,
            children: [
              { id: 11, name: 'Financeiro contrato', type: 'document' },
              { id: 12, name: 'Financeiro painel', type: 'dashboard' }
            ]
          },
          { id: 2, name: 'Operacional contrato', type: 'document' }
        ],
        setting: {
          search: {
            enable: true,
            keys: ['name'],
            mode: 'contains',
            types: ['document']
          }
        }
      }
    });

    await wrapper.find('[data-testid="ztree-search-input"]').setValue('contrato');

    const renderedNames = wrapper.findAll('.ztree-node-name').map((item) => item.text());
    const instance = wrapper.vm as unknown as ZTreeInstance;

    expect(renderedNames).toEqual(['Financeiro contrato', 'Operacional contrato']);
    expect(new Set(renderedNames).size).toBe(renderedNames.length);
    expect(instance.getSearchMatches().map((node) => node.id)).toEqual([11, 2]);
  });

  it('supports fuzzy search and restores the tree when cleared', async () => {
    const wrapper = mount(ZTreeView, {
      props: {
        nodes: [
          {
            id: 1,
            name: 'Relatorios',
            open: false,
            children: [{ id: 11, name: 'Resumo mensal', type: 'document' }]
          },
          { id: 2, name: 'Usuarios', type: 'section' }
        ],
        setting: {
          search: {
            enable: true,
            keys: ['name'],
            types: ['document']
          }
        }
      }
    });

    const instance = wrapper.vm as unknown as ZTreeInstance;
    const matches = instance.searchNodes('rsm msl');
    await wrapper.vm.$nextTick();

    expect(matches.map((node) => node.name)).toEqual(['Resumo mensal']);
    expect(wrapper.findAll('.ztree-node-name').map((item) => item.text())).toEqual(['Resumo mensal']);
    expect(instance.getNodeByParam('id', 1)?.open).toBe(true);

    instance.clearSearch();
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.ztree-node-name').map((item) => item.text())).toEqual(['Relatorios', 'Usuarios']);
    expect(instance.getNodeByParam('id', 1)?.open).toBe(false);
  });
});
