import { Routes, Route } from 'react-router-dom';
import AppHeader from './ui/layout/AppHeader';
import WelcomeModal from './ui/editor/WelcomeModal';
import EditorPage from './ui/pages/EditorPage';
import TemplateManagerPage from './ui/template-manager/TemplateManagerPage';

/**
 * 根组件
 */
export default function App() {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppHeader />
      <WelcomeModal />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/templates" element={<TemplateManagerPage />} />
        </Routes>
      </div>
    </div>
  );
}
