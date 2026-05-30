import { useState, useEffect, useCallback } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useTemplateStore } from '../../store/useTemplateStore';
import InputPanel from '../editor/InputPanel';
import ModeSelector from '../editor/ModeSelector';
import MetadataForm from '../editor/MetadataForm';
import PreviewPanel from '../editor/PreviewPanel';
import DiagnosticsPanel from '../editor/DiagnosticsPanel';
import ValidationPanel from '../editor/ValidationPanel';
import HistoryPanel from '../editor/HistoryPanel';
import SettingsModal from '../editor/SettingsModal';
import { exportDocx } from '../../core/templateInjector';

import styles from './EditorPage.module.css';

/**
 * 主编辑页
 * 左侧（42%）：模式选择 → 文本输入 → 元数据补充 → 操作按钮
 * 右侧（58%）：A4 实时预览 / 格式诊断报告 + 校验结果面板
 */
export default function EditorPage() {
  const {
    state,
    setRawText,
    setDocType,
    setProcessMode,
    updateMetadata,
    processDocument,
    updateBlock,
    setImportedFonts,
  } = useDocumentStore();

  const { getActiveTemplate, store: templateStore, setActiveTemplate, getAllTemplates, importUserTemplates } = useTemplateStore();
  const activeTemplate = getActiveTemplate();

  const [isExporting, setIsExporting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleOpenHistory = () => setIsHistoryOpen(true);
    const handleOpenSettings = () => setIsSettingsOpen(true);
    
    window.addEventListener('open-history', handleOpenHistory);
    window.addEventListener('open-settings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('open-history', handleOpenHistory);
      window.removeEventListener('open-settings', handleOpenSettings);
    };
  }, []);

  const handleExport = useCallback(async () => {
    if (!state.structure) {
      alert('请先解析文档');
      return;
    }

    // 检查强校验项
    const hasErrors = state.validationResults.some(r => r.level === 'error' && !r.passed);
    if (hasErrors) {
      const confirmForce = window.confirm(
        '当前文档存在核心校验错误，强制导出可能导致格式不符合公文标准。\n确定要继续吗？'
      );
      if (!confirmForce) return;
    }

    setIsExporting(true);
    try {
      const blob = await exportDocx(state.structure, state.metadata, activeTemplate);

      // 触发浏览器下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[生成]_${state.structure.title || state.docType}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`导出失败：\n\n${message}`);
    } finally {
      setIsExporting(false);
    }
  }, [state.structure, state.validationResults, state.metadata, state.docType, activeTemplate]);

  // 全局快捷键：Ctrl+Enter 解析，Ctrl+S 导出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!state.isProcessing && state.rawText.trim()) {
          processDocument(activeTemplate.id);
        }
      } else if (e.key === 's') {
        e.preventDefault();
        if (state.structure && !isExporting) {
          handleExport();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isProcessing, state.rawText, state.structure, isExporting, processDocument, handleExport]);

  const canExport = !!state.structure && !isExporting;
  const exportIsClean = canExport && !state.validationResults.some(r => r.level === 'error' && !r.passed);

  return (
    <div className={styles.page}>
      {/* ===== 左侧输入区 ===== */}
      <aside className={styles.inputPanel}>
        <div className={`card ${styles.panelCard}`}>
          <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <ModeSelector
              mode={state.processMode}
              onModeChange={setProcessMode}
              docType={state.docType}
              onDocTypeChange={setDocType}
              activeTemplateId={templateStore.activeTemplateId}
              onTemplateChange={setActiveTemplate}
              templates={getAllTemplates()}
            />
          </div>

          {/* 输入区（撑满剩余高度） */}
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <InputPanel text={state.rawText} onTextChange={setRawText} onFontsExtracted={setImportedFonts} />
          </div>

          {/* 元数据折叠区 */}
          <div style={{ padding: '0 var(--space-md)', flexShrink: 0 }}>
            <MetadataForm docType={state.docType} metadata={state.metadata} onChange={updateMetadata} />
          </div>

          {/* 操作按钮 */}
          <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-sm)', flexShrink: 0 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => processDocument(activeTemplate.id)}
              disabled={state.isProcessing || !state.rawText.trim()}
              title="Ctrl+Enter"
            >
              {state.isProcessing ? '⏳ 处理中...' : '▶ 解析文本内容'}
            </button>
            <button
              className={`btn ${exportIsClean ? 'btn-accent' : 'btn-ghost'}`}
              title={canExport ? 'Ctrl+S 导出' : '请先解析文档'}
              disabled={!canExport}
              onClick={handleExport}
            >
              {isExporting ? '⏳ 生成中...' : '📥 导出'}
            </button>
          </div>
        </div>
      </aside>

      {/* ===== 右侧展示区 ===== */}
      <main className={styles.previewPanel}>
        <div className={`card ${styles.panelCard}`}>
          {/* 头栏 */}
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              {state.processMode === 'diagnose' ? '🔍 格式诊断报告' : '📄 A4 实时预览'}
            </h2>
            <span className="badge badge-builtin" style={{ fontSize: '11px' }}>
              {activeTemplate.name}
            </span>
          </div>

          {/* 主体内容 */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {state.processMode === 'diagnose' && state.diagnosticReport ? (
              <DiagnosticsPanel report={state.diagnosticReport} />
            ) : (
              <PreviewPanel
                structure={state.structure}
                template={activeTemplate}
                onBlockEdit={updateBlock}
              />
            )}
          </div>
        </div>

        {/* 校验结果 */}
        {state.validationResults.length > 0 && (
          <ValidationPanel results={state.validationResults} />
        )}
      </main>

      <HistoryPanel 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        onSelect={(item) => {
          setDocType(item.docType);
          setRawText(item.inputText);
          updateMetadata(item.metadata);
          setActiveTemplate(item.templateId);
        }} 
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userTemplates={templateStore.user}
        onImportTemplates={(templates) => {
          // NOTE: importUserTemplates 返回实际导入数量和错误列表，回传给 SettingsModal 显示精确反馈
          const json = JSON.stringify({ version: 1, user: templates });
          return importUserTemplates(json);
        }}
      />
    </div>
  );
}
