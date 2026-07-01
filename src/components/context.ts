import type { InjectionKey } from 'vue';
import type { useZTree } from '../composables/useZTree';

export type ZTreeContext = ReturnType<typeof useZTree>;

export const zTreeContextKey: InjectionKey<ZTreeContext> = Symbol('ZTreeContext');
