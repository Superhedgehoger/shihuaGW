import { useState, useEffect } from 'react';
import { getSettings, setSetting, AppSettings } from '../../core/configManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setLocalSettings] = useState<AppSettings>({});

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(getSettings());
    }
  }, [isOpen]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setLocalSettings(updated);
    setSetting(key, value);
  };

  if (!isOpen) return null;

  const isAutoSave = settings.autoSave !== false;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container animate-fade-in" 
        style={{ width: '100%', maxWidth: '440px', padding: 'var(--space-xl)' }}
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
        
        {/* Body */}
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
                cursor: 'pointer'
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
                  boxShadow: 'var(--shadow-sm)'
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
