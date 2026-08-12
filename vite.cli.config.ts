import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist-cli',
    emptyOutDir: true,
    lib: {
      entry: 'src/cli/shihuaCoreCli.ts',
      formats: ['es'],
      fileName: () => 'shihua-core.mjs',
    },
    rollupOptions: {
      external: [/^node:/],
    },
  },
});
