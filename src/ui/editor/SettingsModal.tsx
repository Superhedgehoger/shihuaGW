import { useState, useEffect, useRef } from 'react';
import { getSettings, setSetting, AppSettings, exportConfig, importConfig } from '../../core/configManager';
import type { TemplateConfig } from '../../types/template';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 用于配置导出的用户自定义模板 */
  userTemplates?: Record<string, TemplateConfig>;
  /** 导入配置文件后回调，将新导入的模板合并到模板仓库 */
  onImportTemplates?: (templates: Record<string, TemplateConfig>) => void;
}

export default function SettingsModal({ isOpen, onClose, userTemplates = {}, onImportTemplates }: SettingsModalProps) {
  const [settings, setLocalSettings] = useState<AppSettings>({});
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(getSettings());
      setImportStatus(null);
    }
  }, [isOpen]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setLocalSettings(updated);
    setSetting(key, value);
  };

  const handleExportConfig = () => {
    exportConfig(userTemplates, {
      includeTemplates: true,
      includeMetadata: true,
      includeSettings: true,
    });
  };

  const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importConfig(file, {
        importTemplates: true,
        importMetadata: true,
        importSettings: true,
      });
      // 同步导入的设置到本地状态
      setLocalSettings(getSettings());
      // 将导入的模板通知父组件
      if (result.templates && onImportTemplates) {
        onImportTemplates(result.templates);
      }
      const parts: string[] = [];
      if (result.templates) parts.push(`模板 ${Object.keys(result.templates).length} 个`);
      if (result.metadata > 0) parts.push(`元数据 ${result.metadata} 条`);
      if (result.settings > 0) parts.push(`设置项 ${result.settings} 项`);
      setImportStatus(`✔️ 导入成功：${parts.join('、')}`);
    } catch (err: any) {
      setImportStatus(`❌ 导入失败：${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const isAutoSave = settings.autoSave !== false;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container animate-fade-in"
        style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-xl)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
          <h2 className="modal-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>系统设置</h2>
          <button onClick={onClose} className="modal-close-btn" title="关闭">
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 常规设置 */}
        <div className="settings-group">
          <h3 className="settings-group-title">常规设置</h3>

          {/* AutoSave Row */}
          <div className="setting-row" onClick={() => handleChange('autoSave', !isAutoSave)}>
            <div className="setting-info">
              <div className="setting-title">自动保存历史记录</div>
              <div className="setting-desc">每次处理文档后，自动留存至历史记录</div>
            </div>
            {/* Switch UI */}
            <div
              style={{
                width: '46px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: isAutoSave ? 'var(--color-primary)' : 'var(--color-border-strong)',
                position: 'relative',
                transition: 'background-color var(--transition-base)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: isAutoSave ? '25px' : '3px',
                  transition: 'left var(--transition-base)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
            </div>
          </div>

          {/* Theme Row */}
          <div className="setting-row" style={{ cursor: 'default' }}>
            <div className="setting-info">
              <div className="setting-title">深色模式</div>
              <div className="setting-desc">切换界面主题外观（后续支持）</div>
            </div>
            <select
              value={settings.theme || 'system'}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="input"
              style={{ width: '120px', padding: '5px 10px', fontSize: 'var(--text-sm)' }}
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色模式</option>
              <option value="dark">深色模式</option>
            </select>
          </div>
        </div>

        {/* 配置管理 */}
        <div className="settings-group" style={{ marginTop: 'var(--space-lg)' }}>
          <h3 className="settings-group-title">配置管理</h3>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
            完整配置包含：自定义模板、最近元数据、系统设置，可跨设备迁移。
          </div>

          {/* 导出/导入按钮 */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={handleExportConfig}
              title="将自定义模板、常用元数据、系统设置打包为 JSON 文件导出"
            >
              📤 导出全部配置
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => fileInputRef.current?.click()}
              title="导入之前导出的配置 JSON 文件（模板合并，设置覆盖）"
            >
              📥 导入配置文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportConfig}
            />
          </div>

          {/* 导入状态提示 */}
          {importStatus && (
            <div style={{
              marginTop: 'var(--space-sm)',
              fontSize: 'var(--text-xs)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: importStatus.startsWith('✔️') ? 'var(--color-success-light, rgba(40,167,69,0.1))' : 'var(--color-error-light)',
              color: importStatus.startsWith('✔️') ? 'var(--color-success, #28a745)' : 'var(--color-error)',
            }}>
              {importStatus}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '8px var(--space-xl)' }}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
