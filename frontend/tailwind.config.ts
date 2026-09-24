import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#12302A', paper: '#F2F5F3', leaf: '#1F6F5C', sun: '#F2B632', line: '#D3DDD8' },
      fontFamily: { display: ['var(--font-display)', 'sans-serif'], body: ['var(--font-body)', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
