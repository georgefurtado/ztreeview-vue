export type ZTreeNodeKey = string | number;

export type ZTreeAjaxType = 'get' | 'post';
export type ZTreeDataType = 'text' | 'json' | 'jsonp' | 'html' | 'xml' | 'script';
export type ZTreeApplicationType = 'application/x-www-form-urlencoded' | 'application/json';
export type ZTreeMoveType = 'prev' | 'next' | 'inner';
export type ZTreeCheckStyle = 'checkbox' | 'radio';

export interface ZTreeNode {
  id?: ZTreeNodeKey;
  pId?: ZTreeNodeKey | null;
  key?: ZTreeNodeKey;
  checked?: boolean;
  checkedOld?: boolean;
  children?: ZTreeNode[];
  chkDisabled?: boolean;
  click?: ZTreeCallbackOn;
  halfCheck?: boolean;
  icon?: string;
  iconClose?: string;
  iconOpen?: string;
  iconSkin?: string;
  isHidden?: boolean;
  isParent?: boolean;
  name?: string;
  nocheck?: boolean;
  open?: boolean;
  target?: string;
  title?: string;
  url?: string;
  check_Child_State?: number;
  check_Focus?: boolean;
  editNameFlag?: boolean;
  isAjaxing?: boolean;
  isFirstNode?: boolean;
  isHover?: boolean;
  isLastNode?: boolean;
  level?: number;
  parentTId?: string | null;
  tId?: string;
  getCheckStatus?: () => ZTreeCheckStatus;
  getIndex?: () => number;
  getNextNode?: () => ZTreeNode | null;
  getParentNode?: () => ZTreeNode | null;
  getPath?: () => ZTreeNode[];
  getPreNode?: () => ZTreeNode | null;
  getPrevNode?: () => ZTreeNode | null;
  [key: string]: unknown;
}

export interface ZTreeCheckStatus {
  checked: boolean;
  half: boolean;
}

export type ZTreeCallbackBefore = (treeId: string, treeNode: ZTreeNode) => boolean | Promise<boolean>;
export type ZTreeCallbackOn = (event: Event, treeId: string, treeNode: ZTreeNode) => void | Promise<void>;

export interface ZTreeCallback {
  beforeAsync?: ZTreeCallbackBefore;
  beforeCheck?: ZTreeCallbackBefore;
  beforeClick?: (treeId: string, treeNode: ZTreeNode, clickFlag: number) => boolean | Promise<boolean>;
  beforeCollapse?: ZTreeCallbackBefore;
  beforeDblClick?: ZTreeCallbackBefore;
  beforeDrag?: (treeId: string, treeNodes: ZTreeNode[]) => boolean | Promise<boolean>;
  beforeDragOpen?: ZTreeCallbackBefore;
  beforeDrop?: (treeId: string, treeNodes: ZTreeNode[], targetNode: ZTreeNode, moveType: ZTreeMoveType, isCopy: boolean) => boolean | Promise<boolean>;
  beforeEditName?: ZTreeCallbackBefore;
  beforeExpand?: ZTreeCallbackBefore;
  beforeMouseDown?: ZTreeCallbackBefore;
  beforeMouseUp?: ZTreeCallbackBefore;
  beforeRemove?: ZTreeCallbackBefore;
  beforeRename?: (treeId: string, treeNode: ZTreeNode, newName: string, isCancel: boolean) => boolean | Promise<boolean>;
  beforeRightClick?: ZTreeCallbackBefore;
  onAsyncError?: (event: Event, treeId: string, treeNode: ZTreeNode | null, error: unknown) => void | Promise<void>;
  onAsyncSuccess?: (event: Event, treeId: string, treeNode: ZTreeNode | null, msg: unknown) => void | Promise<void>;
  onCheck?: ZTreeCallbackOn;
  onClick?: (event: Event, treeId: string, treeNode: ZTreeNode, clickFlag: number) => void | Promise<void>;
  onCollapse?: ZTreeCallbackOn;
  onDblClick?: ZTreeCallbackOn;
  onDrag?: (event: Event, treeId: string, treeNodes: ZTreeNode[]) => void | Promise<void>;
  onDragMove?: (event: Event, treeId: string, treeNodes: ZTreeNode[]) => void | Promise<void>;
  onDrop?: (event: Event, treeId: string, treeNodes: ZTreeNode[], targetNode: ZTreeNode, moveType: ZTreeMoveType, isCopy: boolean) => void | Promise<void>;
  onExpand?: ZTreeCallbackOn;
  onMouseDown?: ZTreeCallbackOn;
  onMouseUp?: ZTreeCallbackOn;
  onNodeCreated?: ZTreeCallbackOn;
  onRemove?: ZTreeCallbackOn;
  onRename?: (event: Event, treeId: string, treeNode: ZTreeNode, isCancel: boolean) => void | Promise<void>;
  onRightClick?: ZTreeCallbackOn;
}

export interface ZTreeAsyncSetting {
  autoParam?: string[];
  contentType?: ZTreeApplicationType;
  dataFilter?: (treeId: string, parentNode: ZTreeNode | null, responseData: unknown) => ZTreeNode[] | ZTreeNode | unknown;
  dataType?: ZTreeDataType;
  enable?: boolean;
  headers?: Record<string, string>;
  otherParam?: string[] | Record<string, unknown>;
  type?: ZTreeAjaxType;
  url?: ((treeId: string, treeNode: ZTreeNode | null) => string) | string;
}

export interface ZTreeCheckSetting {
  autoCheckTrigger?: boolean;
  chkboxType?: { Y?: string; N?: string };
  chkStyle?: ZTreeCheckStyle;
  enable?: boolean;
  nocheckInherit?: boolean;
  chkDisabledInherit?: boolean;
  radioType?: 'level' | 'all';
}

export interface ZTreeDataSetting {
  keep?: {
    leaf?: boolean;
    parent?: boolean;
  };
  key?: {
    checked?: string;
    children?: string;
    icon?: string;
    isHidden?: string;
    isParent?: string;
    name?: string;
    title?: string;
    url?: string;
  };
  render?: {
    name?: ((node: ZTreeNode) => string) | null;
    title?: ((node: ZTreeNode) => string) | null;
  };
  simpleData?: {
    enable?: boolean;
    idKey?: string;
    pIdKey?: string;
    rootPId?: unknown;
  };
}

export interface ZTreeEditSetting {
  drag?: {
    autoExpandTrigger?: boolean;
    autoOpenTime?: number;
    borderMax?: number;
    borderMin?: number;
    inner?: boolean;
    isCopy?: boolean;
    isMove?: boolean;
    maxShowNodeNum?: number;
    minMoveSize?: number;
    next?: boolean;
    prev?: boolean;
  };
  editNameSelectAll?: boolean;
  enable?: boolean;
  removeTitle?: string | ((treeId: string, treeNode: ZTreeNode) => string);
  renameTitle?: string | ((treeId: string, treeNode: ZTreeNode) => string);
  showRemoveBtn?: boolean | ((treeId: string, treeNode: ZTreeNode) => boolean);
  showRenameBtn?: boolean | ((treeId: string, treeNode: ZTreeNode) => boolean);
}

export interface ZTreeNodeClasses {
  add?: string[];
  remove?: string[];
}

export interface ZTreeViewSetting {
  addDiyDom?: (treeId: string, treeNode: ZTreeNode) => void;
  addHoverDom?: (treeId: string, treeNode: ZTreeNode) => void;
  autoCancelSelected?: boolean;
  dblClickExpand?: boolean | ((treeId: string, treeNode: ZTreeNode) => boolean);
  expandSpeed?: string | number;
  fontCss?: Record<string, string> | ((treeId: string, treeNode: ZTreeNode) => Record<string, string>);
  nameIsHTML?: boolean;
  nodeClasses?: ZTreeNodeClasses | ((treeId: string, treeNode: ZTreeNode) => ZTreeNodeClasses);
  removeHoverDom?: (treeId: string, treeNode: ZTreeNode) => void;
  selectedMulti?: boolean;
  showIcon?: boolean | ((treeId: string, treeNode: ZTreeNode) => boolean);
  showLine?: boolean;
  showTitle?: boolean | ((treeId: string, treeNode: ZTreeNode) => boolean);
  txtSelectedEnable?: boolean;
}

export interface ZTreeSetting {
  async?: ZTreeAsyncSetting;
  callback?: ZTreeCallback;
  check?: ZTreeCheckSetting;
  data?: ZTreeDataSetting;
  edit?: ZTreeEditSetting;
  treeId?: string;
  view?: ZTreeViewSetting;
}

export interface ZTreeInstance {
  setting: RequiredZTreeSetting;
  addNodes: (parentNode: ZTreeNode | null, index?: number, newNodes?: ZTreeNode[] | ZTreeNode, isSilent?: boolean) => ZTreeNode[];
  cancelEditName: (newName?: string) => void;
  cancelSelectedNode: (treeNode?: ZTreeNode) => void;
  checkAllNodes: (checked: boolean, isSilent?: boolean) => void;
  checkNode: (treeNode: ZTreeNode, checked?: boolean, checkTypeFlag?: boolean, callbackFlag?: boolean) => void;
  copyNode: (targetNode: ZTreeNode | null, treeNode: ZTreeNode, moveType: ZTreeMoveType, isSilent?: boolean) => ZTreeNode | null;
  editName: (treeNode: ZTreeNode) => void;
  expandAll: (expandFlag: boolean) => boolean | null;
  expandNode: (treeNode: ZTreeNode, expandFlag?: boolean, sonSign?: boolean, focus?: boolean, callbackFlag?: boolean) => boolean | null;
  getChangeCheckedNodes: () => ZTreeNode[];
  getCheckedNodes: (checked?: boolean) => ZTreeNode[];
  getNodeByParam: (key: string, value: unknown, parentNode?: ZTreeNode | null) => ZTreeNode | null;
  getNodeByTId: (tId: string) => ZTreeNode | null;
  getNodeIndex: (treeNode: ZTreeNode) => number;
  getNodes: () => ZTreeNode[];
  getNodesByFilter: (filter: (node: ZTreeNode) => boolean, isSingle?: boolean, parentNode?: ZTreeNode | null, invokeParam?: unknown) => ZTreeNode[] | ZTreeNode | null;
  getNodesByParam: (key: string, value: unknown, parentNode?: ZTreeNode | null) => ZTreeNode[];
  getNodesByParamFuzzy: (key: string, value: string, parentNode?: ZTreeNode | null) => ZTreeNode[];
  getSelectedNodes: () => ZTreeNode[];
  hideNode: (treeNode: ZTreeNode) => void;
  hideNodes: (treeNodes: ZTreeNode[]) => void;
  moveNode: (targetNode: ZTreeNode | null, treeNode: ZTreeNode, moveType: ZTreeMoveType, isSilent?: boolean) => ZTreeNode | null;
  reAsyncChildNodes: (parentNode: ZTreeNode | null, reloadType?: string, isSilent?: boolean, callback?: () => void) => Promise<void>;
  refresh: () => void;
  removeChildNodes: (parentNode: ZTreeNode) => ZTreeNode[];
  removeNode: (treeNode: ZTreeNode, callbackFlag?: boolean) => void;
  selectAllNodes: (isSilent?: boolean) => void;
  selectNode: (treeNode: ZTreeNode, addFlag?: boolean, isSilent?: boolean) => void;
  setChkDisabled: (treeNode: ZTreeNode, disabled?: boolean, inheritParent?: boolean, inheritChildren?: boolean) => void;
  setEditable: (editable: boolean) => void;
  showNode: (treeNode: ZTreeNode) => void;
  showNodes: (treeNodes: ZTreeNode[]) => void;
  toggleExpandAll: () => boolean | null;
  toggleSelectAll: () => void;
  transformToArray: (treeNodes: ZTreeNode[] | ZTreeNode) => ZTreeNode[];
  transformTozTreeNodes: (simpleNodes: ZTreeNode[] | ZTreeNode) => ZTreeNode[];
  updateNode: (treeNode: ZTreeNode, checkTypeFlag?: boolean) => void;
}

export interface RequiredZTreeSetting extends Omit<ZTreeSetting, 'async' | 'callback' | 'check' | 'data' | 'edit' | 'view' | 'treeId'> {
  treeId: string;
  async: Required<ZTreeAsyncSetting>;
  callback: ZTreeCallback;
  check: Required<ZTreeCheckSetting> & {
    chkboxType: Required<NonNullable<ZTreeCheckSetting['chkboxType']>>;
  };
  data: Required<ZTreeDataSetting> & {
    keep: Required<NonNullable<ZTreeDataSetting['keep']>>;
    key: Required<NonNullable<ZTreeDataSetting['key']>>;
    render: Required<NonNullable<ZTreeDataSetting['render']>>;
    simpleData: Required<NonNullable<ZTreeDataSetting['simpleData']>>;
  };
  edit: Required<ZTreeEditSetting> & {
    drag: Required<NonNullable<ZTreeEditSetting['drag']>>;
  };
  view: Required<ZTreeViewSetting>;
};

export interface ZTreeViewProps {
  nodes?: ZTreeNode[];
  setting?: ZTreeSetting;
  treeId?: string;
  modelValue?: ZTreeNodeKey | ZTreeNodeKey[] | null;
  checkedKeys?: ZTreeNodeKey[];
  selectedKeys?: ZTreeNodeKey[];
}
