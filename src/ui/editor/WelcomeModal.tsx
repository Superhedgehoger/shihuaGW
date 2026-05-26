import { useState, useEffect } from 'react';

/**
 * 首次访问引导悬浮窗
 */
export default function WelcomeModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('shihua_doc_formatter_visited');
    if (!hasVisited) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('shihua_doc_formatter_visited', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="card" style={{ maxWidth: '500px', padding: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--text-lg)' }}>🎉 欢迎使用石化公文排版工具</h2>
        <p style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          此工具能够全自动、纯本地（无泄密风险）帮您把杂乱的文本变成合规的公文。
          <br /><br />
          <strong>主要使用步骤：</strong>
          <br />1. 在左侧粘贴文本或上传 `.docx` / `.txt`
          <br />2. 点击【解析文本内容】（快捷键 <code>Ctrl+Enter</code>）
          <br />3. 查看右侧 A4 预览页面或诊断报告
          <br />4. 点击【导出 .docx】（快捷键 <code>Ctrl+S</code>）
        </p>

        <div style={{ backgroundColor: 'var(--color-warning-light)', color: '#856404', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
          <strong>注意：</strong> 正常导出需要依赖管理员配置在后端的 Word 基础模板（例如 <code>/templates/qsh/红头文件.docx</code>）。如果导出报错，请联系管理员提供模板。
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleClose}>我了解了，开始使用</button>
        </div>
      </div>
    </div>
  );
}
