import type { RequiredZTreeSetting, ZTreeSetting } from '../types';

const defaultSetting: RequiredZTreeSetting = {
  treeId: 'ztree',
  view: {
    addDiyDom: () => undefined,
    addHoverDom: () => undefined,
    autoCancelSelected: true,
    dblClickExpand: true,
    defaultExpanded: false,
    expandSpeed: 0,
    fontCss: {},
    nameIsHTML: false,
    nodeClasses: {},
    removeHoverDom: () => undefined,
    selectedMulti: true,
    showIcon: true,
    showLine: true,
    showTitle: true,
    txtSelectedEnable: false
  },
  data: {
    keep: {
      leaf: false,
      parent: false
    },
    key: {
      checked: 'checked',
      children: 'children',
      icon: 'icon',
      isHidden: 'isHidden',
      isParent: 'isParent',
      name: 'name',
      title: 'title',
      url: 'url'
    },
    render: {
      name: null,
      title: null
    },
    simpleData: {
      enable: false,
      idKey: 'id',
      pIdKey: 'pId',
      rootPId: null
    }
  },
  async: {
    autoParam: [],
    contentType: 'application/x-www-form-urlencoded',
    dataFilter: (_treeId, _parentNode, responseData) => responseData,
    dataType: 'json',
    enable: false,
    headers: {},
    otherParam: [],
    type: 'post',
    url: ''
  },
  check: {
    autoCheckTrigger: false,
    chkboxType: {
      Y: 'ps',
      N: 'ps'
    },
    chkStyle: 'checkbox',
    defaultChecked: false,
    enable: false,
    nocheckInherit: false,
    chkDisabledInherit: false,
    radioType: 'level'
  },
  edit: {
    drag: {
      autoExpandTrigger: true,
      autoOpenTime: 500,
      borderMax: 10,
      borderMin: -5,
      inner: true,
      isCopy: true,
      isMove: true,
      maxShowNodeNum: 5,
      minMoveSize: 5,
      next: true,
      prev: true
    },
    editNameSelectAll: false,
    enable: false,
    removeTitle: 'remove',
    renameTitle: 'rename',
    showRemoveBtn: true,
    showRenameBtn: true
  },
  search: {
    autoExpand: true,
    enable: false,
    keys: ['name', 'title'],
    minScore: 0.6,
    mode: 'fuzzy',
    placeholder: 'Pesquisar...',
    resultMode: 'matches',
    showInput: true,
    typeKey: 'type',
    types: []
  },
  cache: {
    enable: false
  },
  callback: {}
};

export function resolveSetting(input: ZTreeSetting = {}, treeId?: string): RequiredZTreeSetting {
  return {
    ...defaultSetting,
    ...input,
    treeId: treeId ?? input.treeId ?? defaultSetting.treeId,
    view: { ...defaultSetting.view, ...input.view },
    data: {
      ...defaultSetting.data,
      ...input.data,
      keep: { ...defaultSetting.data.keep, ...input.data?.keep },
      key: { ...defaultSetting.data.key, ...input.data?.key },
      render: { ...defaultSetting.data.render, ...input.data?.render },
      simpleData: { ...defaultSetting.data.simpleData, ...input.data?.simpleData }
    },
    async: { ...defaultSetting.async, ...input.async },
    check: {
      ...defaultSetting.check,
      ...input.check,
      chkboxType: { ...defaultSetting.check.chkboxType, ...input.check?.chkboxType }
    },
    edit: {
      ...defaultSetting.edit,
      ...input.edit,
      drag: { ...defaultSetting.edit.drag, ...input.edit?.drag }
    },
    search: { ...defaultSetting.search, ...input.search },
    cache: { ...defaultSetting.cache, ...input.cache },
    callback: { ...input.callback }
  };
}
