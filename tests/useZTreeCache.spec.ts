import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache, readCache, writeCache } from '../src/composables/useZTreeCache';
import type { ZTreeCachePayload } from '../src/types';

describe('useZTreeCache storage helpers', () => {
  beforeEach(() => localStorage.clear());

  const payload: ZTreeCachePayload = {
    version: 1,
    checkedKeys: [1, 2],
    selectedKeys: [1],
    openKeys: [3],
    searchQuery: 'foo'
  };

  it('round-trips a payload through writeCache/readCache', () => {
    writeCache('unit', payload);

    expect(readCache('unit')).toEqual(payload);
  });

  it('uses the ztreeview:<treeId> key format', () => {
    writeCache('my-tree', payload);

    expect(localStorage.getItem('ztreeview:my-tree')).toBe(JSON.stringify(payload));
  });

  it('returns null when no cache entry exists', () => {
    expect(readCache('missing')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    localStorage.setItem('ztreeview:broken', '{not valid json');

    expect(readCache('broken')).toBeNull();
  });

  it('returns null when the stored version does not match', () => {
    localStorage.setItem('ztreeview:old', JSON.stringify({ ...payload, version: 99 }));

    expect(readCache('old')).toBeNull();
  });

  it('clearCache removes the stored entry', () => {
    writeCache('to-clear', payload);
    clearCache('to-clear');

    expect(localStorage.getItem('ztreeview:to-clear')).toBeNull();
  });

  it('writeCache does not throw when localStorage.setItem fails', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => writeCache('quota', payload)).not.toThrow();

    setItemSpy.mockRestore();
  });
});
