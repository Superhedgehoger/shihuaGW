import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: assetsInclude 让 Vite 将 .docx 识别为静态资源，
// 开发时直接返回本地路径，构建时复制到 dist/assets 并注入哈希文件名
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.docx'],
});
