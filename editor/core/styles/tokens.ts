// Design Tokens - Slate 设计系统的设计 token
//
// 这个文件导出项目的设计 token，包括颜色、间距、圆角等。
// 这些 token与 styles/theme.css 中的 CSS 变量保持同步。

/**
 * 颜色 Token - 与 CSS 变量 --color-* 对应
 */
export const colors = {
  // 主色调
  obsidian: '#0A0A0A',
  charcoal: '#121212',
  graphite: '#262626',

  // 强调色
  fogBlue: '#5E7BA3',
  dustyPurple: '#7C6F91',
  warmGray: '#4A4A4A',

  // 背景和前景
  background: 'var(--background)',
  foreground: '#E5E7EB',
} as const;

/**
 * 间距 Token
 */
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
} as const;

/**
 * 圆角 Token
 */
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

/**
 * 字体大小 Token
 */
export const fontSize = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
} as const;

/**
 * 阴影 Token
 */
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  glass: '0 8px 32px 0 rgb(0 0 0 / 0.3)',
} as const;

/**
 * Z-index Token
 */
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  max: 9999,
} as const;

/**
 * 过渡动画 Token
 */
export const transition = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * 完整的设计 token 对象
 */
export const tokens = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  boxShadow,
  zIndex,
  transition,
} as const;

/**
 * CSS 类名辅助函数 - 生成语义化的类名
 */
export function createColorClass(type: 'bg' | 'text' | 'border', color: keyof typeof colors): string {
  const colorMap: Record<keyof typeof colors, string> = {
    obsidian: 'obsidian',
    charcoal: 'charcoal',
    graphite: 'graphite',
    fogBlue: 'fog-blue',
    dustyPurple: 'dusty-purple',
    warmGray: 'warm-gray',
    background: 'obsidian',
    foreground: 'zinc-200',
  };
  return `${type}-${colorMap[color]}`;
}
