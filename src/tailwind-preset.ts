import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        ztree: {
          text: 'var(--ztree-color-text)',
          muted: 'var(--ztree-color-muted)',
          selected: 'var(--ztree-color-selected-bg)',
          check: 'var(--ztree-color-check)',
          border: 'var(--ztree-color-border)'
        }
      },
      borderRadius: {
        ztree: 'var(--ztree-radius)'
      },
      spacing: {
        ztree: 'var(--ztree-indent)'
      }
    }
  }
};

export default preset;
