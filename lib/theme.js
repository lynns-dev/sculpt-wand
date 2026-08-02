// Sunbeam Body — design tokens: goop-inspired editorial palette (cream, sage, ink)
export const T = {
  white: '#FBF8F1',
  paper: '#F1EEE0',
  blush: '#E3E2D2',
  rose: '#6E7658',
  roseDeep: '#1C1B17',
  ink: '#1C1B17',
  soft: '#7A7568',
  line: 'rgba(28,27,23,0.12)',
  dline: 'rgba(251,248,241,0.24)',
  maxw: '1280px',
  display: "'Fraunces', serif",
  sans: "'Inter', system-ui, sans-serif",
};

// Shared style fragments reused across pages
export const S = {
  label: {
    fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
    color: T.rose, fontWeight: 600,
  },
  h2: {
    fontFamily: T.sans, fontWeight: 600,
    fontSize: 'clamp(28px,3.4vw,42px)', lineHeight: 1.2, letterSpacing: '-0.01em',
    color: T.ink,
  },
  it: { fontFamily: T.display, fontWeight: 500, fontStyle: 'normal', color: T.roseDeep },
  btnFill: {
    display: 'inline-flex', alignItems: 'center', height: 52, padding: '0 32px',
    background: T.roseDeep, color: T.white, border: 'none', cursor: 'pointer',
    fontFamily: T.sans, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
    borderRadius: 999, boxShadow: '0 8px 20px rgba(23,20,18,0.18)',
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  btnOutline: {
    display: 'inline-flex', alignItems: 'center', height: 52, padding: '0 32px',
    background: 'transparent', color: T.roseDeep, border: `1.5px solid ${T.roseDeep}`, cursor: 'pointer',
    fontFamily: T.sans, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
    borderRadius: 999, transition: 'all .2s ease',
  },
  link: {
    fontSize: 13, fontWeight: 600, letterSpacing: '0.01em',
    borderBottom: `1.5px solid ${T.rose}`, paddingBottom: 3, cursor: 'pointer', color: T.ink,
  },
  wrap: { maxWidth: T.maxw, margin: '0 auto', padding: '0 32px' },
};
