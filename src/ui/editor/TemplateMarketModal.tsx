import { useState, useRef } from 'react';
import type { TemplateConfig } from '../../types/template';
import { useTemplateStore } from '../../store/useTemplateStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateMarketModal({ isOpen, onClose }: Props) {
  const { getAllTemplates, getActiveTemplate, setActiveTemplate, createTemplate, updateTemplate, deleteTemplate } = useTemplateStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;

  const templates = getAllTemplates();
  const activeTemplate = getActiveTemplate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const newName = file.name.replace('.docx', '');
      
      // Create a new template based on default, but with this custom docx
      const newTmpl = createTemplate(newName);
      updateTemplate(newTmpl.id, {
        description: '用户上传的自定义 Word 模板',
        base64Docx: base64Data,
        wordTemplatePreset: 'none',
      });
      
      setActiveTemplate(newTmpl.id);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      alert('文件读取失败');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container animate-fade-in" 
        style={{ width: '100%', maxWidth: '800px', padding: 'var(--space-xl)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
          <h2 className="modal-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>模板市场 & 管理</h2>
          <button onClick={onClose} className="modal-close-btn" title="关闭">
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => fileInputRef.current?.click()}
          >
            ➕ 上传 .docx 自定义模板
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".docx" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
            （支持上传带有 {'{{BODY_PLACEHOLDER}}'} 的 Word 模板，最大 5MB，将保存在本地缓存中）
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-lg)' }}>
          {templates.map(tmpl => {
            const isActive = tmpl.id === activeTemplate.id;
            return (
              <div 
                key={tmpl.id} 
                className={`card ${isActive ? 'active' : ''}`}
                style={{ 
                  padding: 'var(--space-md)', 
                  border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={() => setActiveTemplate(tmpl.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>
                    {tmpl.name}
                  </h3>
                  {tmpl.isBuiltin && <span className="badge badge-builtin" style={{ fontSize: '10px' }}>内置</span>}
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', flex: 1, margin: '0 0 var(--space-md) 0' }}>
                  {tmpl.description || '暂无描述'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {tmpl.rulesStandard === 'gb' ? '国家标准' : '石化标准'}
                  </span>
                  {!tmpl.isBuiltin && (
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确认删除此模板吗？')) {
                          deleteTemplate(tmpl.id);
                        }
                      }}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
