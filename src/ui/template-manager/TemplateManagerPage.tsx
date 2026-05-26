import { useState, useRef } from 'react';
import type { TemplateConfig } from '../../types/template';
import { useTemplateStore } from '../../store/useTemplateStore';
import TemplateList from './TemplateList';
import TemplateDetailPanel from './TemplateDetailPanel';
import styles from './TemplateManagerPage.module.css';

/**
 * 模板管理页
 * 左：模板列表（内置 + 用户自定义）
 * 右：参数查看/编辑面板
 */
export default function TemplateManagerPage() {
  const {
    getAllTemplates,
    getActiveTemplate,
    setActiveTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    exportUserTemplates,
    importUserTemplates,
  } = useTemplateStore();

  const allTemplates = getAllTemplates();
  const [selectedId, setSelectedId] = useState<string>(getActiveTemplate().id);
  const selectedTemplate = allTemplates.find(t => t.id === selectedId) ?? allTemplates[0];

  // 导入文件 input ref
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  /** 从内置模板另存为新自定义模板 */
  const handleCloneTemplate = (id: string, sourceName: string) => {
    const name = prompt(`请输入新模板名称：`, `${sourceName} 副本`);
    if (!name?.trim()) return;
    const newTmpl = createTemplate(name.trim(), id);
    setSelectedId(newTmpl.id);
  };

  /** 新建空白自定义模板 */
  const handleCreateNew = () => {
    const name = prompt('请输入新模板名称：', '自定义模板');
    if (!name?.trim()) return;
    const newTmpl = createTemplate(name.trim());
    setSelectedId(newTmpl.id);
  };

  /** 删除自定义模板 */
  const handleDelete = (id: string) => {
    const tmpl = allTemplates.find(t => t.id === id);
    if (!tmpl || tmpl.isBuiltin) return;
    if (!confirm(`确定要删除模板「${tmpl.name}」吗？此操作不可撤销。`)) return;
    deleteTemplate(id);
    setSelectedId(getActiveTemplate().id);
  };

  /** 导出所有用户模板为 JSON */
  const handleExport = () => {
    const json = exportUserTemplates();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shihua-templates-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** 触发导入文件选择 */
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  /** 处理导入文件 */
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = importUserTemplates(text);
      setImportResult(result);
      setTimeout(() => setImportResult(null), 4000);
    } catch {
      setImportResult({ imported: 0, errors: ['文件读取失败'] });
    }
    // 重置 input 以便再次选择同一文件
    e.target.value = '';
  };

  /** 更新模板字段 */
  const handleUpdate = (patch: Partial<Omit<TemplateConfig, 'id' | 'isBuiltin'>>) => {
    if (selectedTemplate?.isBuiltin) return;
    updateTemplate(selectedTemplate.id, patch);
  };

  return (
    <div className={styles.page}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1 className={styles.pageTitle}>模板管理</h1>
          <span className={styles.pageDesc}>
            管理公文格式模板，支持自定义字体、字号、边距等参数
          </span>
        </div>
        <div className={styles.toolbarRight}>
          <button className="btn btn-ghost btn-sm" onClick={handleImportClick}>
            📥 导入 JSON
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>
            📤 导出 JSON
          </button>
          <button className="btn btn-accent btn-sm" onClick={handleCreateNew}>
            ＋ 新建模板
          </button>
        </div>
      </div>

      {/* 导入结果提示 */}
      {importResult && (
        <div className={`${styles.importToast} ${importResult.errors.length ? styles.importToastWarn : styles.importToastSuccess}`}>
          {importResult.errors.length === 0
            ? `✅ 成功导入 ${importResult.imported} 个模板`
            : `⚠️ 导入完成：${importResult.imported} 个成功，${importResult.errors.length} 个失败（${importResult.errors.join('；')}）`
          }
        </div>
      )}

      {/* 主体：左列表 + 右详情 */}
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <TemplateList
            templates={allTemplates}
            selectedId={selectedId}
            activeId={getActiveTemplate().id}
            onSelect={setSelectedId}
            onClone={handleCloneTemplate}
            onDelete={handleDelete}
            onSetActive={setActiveTemplate}
          />
        </aside>

        <main className={styles.detail}>
          {selectedTemplate ? (
            <TemplateDetailPanel
              template={selectedTemplate}
              isActive={selectedTemplate.id === getActiveTemplate().id}
              onUpdate={handleUpdate}
              onClone={() => handleCloneTemplate(selectedTemplate.id, selectedTemplate.name)}
              onDelete={() => handleDelete(selectedTemplate.id)}
              onSetActive={() => setActiveTemplate(selectedTemplate.id)}
            />
          ) : (
            <div className={styles.emptyDetail}>
              <p>请从左侧选择一个模板</p>
            </div>
          )}
        </main>
      </div>

      {/* 隐藏的导入 input */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
    </div>
  );
}
