export const PRODUCT_PALETTES = {
  'ultra-pro': { background: '#faf5e7', accent: '#806326' },
  'power-max': { background: '#eef2fa', accent: '#405d91' },
  'rapid-boost': { background: '#fceee9', accent: '#a4483c' },
  'her-power': { background: '#faeeeb', accent: '#a36855' },
  'her-energy': { background: '#f4eef9', accent: '#72568b' },
  'daily-vitality': { background: '#f2f4e9', accent: '#657341' },
  'alpha-prime': { background: '#f8f0e8', accent: '#8a5e37' },
  'titan-force': { background: '#faf1e9', accent: '#975e32' },
};
export const productPalette = slug => PRODUCT_PALETTES[slug] || { background: '#f5f5f4', accent: '#57534e' };
