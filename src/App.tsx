import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppHeader from './ui/layout/AppHeader';
import WelcomeModal from './ui/editor/WelcomeModal';

const EditorPage = lazy(() => import('./ui/pages/EditorPage'));
const TemplateManagerPage = lazy(() => import('./ui/template-manager/TemplateManagerPage'));

/**
 * 根组件
 */
export default function App() {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppHeader />
      <WelcomeModal />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Suspense fallback={<div style={{ padding: '2rem' }}>正在加载本地模块…</div>}>
          <Routes>
            <Route path="/" element={<EditorPage />} />
            <Route path="/templates" element={<TemplateManagerPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
