import { useState } from 'react';
import type { DocumentStructure, BodyBlock } from '../../types/document';
import type { TemplateConfig, ElementStyle } from '../../types/template';
import pageStyles from '../pages/EditorPage.module.css';

interface Props {
  structure: DocumentStructure | null;
  template: TemplateConfig;
  onBlockEdit: (id: string, newText: string) => void;
}

export default function PreviewPanel({ structure, template, onBlockEdit }: Props) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!structure) {
    return (
      <div className={pageStyles.a4Preview}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '16px',
          color: 'var(--color-text-muted)'
        }}>
          <div style={{ fontSize: '48px', opacity: 0.3 }}>📄</div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 500 }}>尚未解析文档</div>
          <div style={{ fontSize: 'var(--text-sm)', textAlign: 'center', lineHeight: 1.8 }}>
            在左侧粘贴文字或上传文件<br />
            点击「解析文本内容」后，公文将在此预览
          </div>
        </div>
      </div>
    );
  }

  // 工具函数：将 ElementStyle 转换为 React 的 CSSProperties
  const getStyleObj = (styleRule: ElementStyle): React.CSSProperties => ({
    fontFamily: `"${styleRule.fontCn}", "${styleRule.fontEn}", serif`,
    fontSize: `${styleRule.size}pt`,
    textAlign: styleRule.align,
    textIndent: `${styleRule.indentPt}pt`,
    fontWeight: styleRule.isBold ? 'bold' : 'normal',
    lineHeight: styleRule.lineSpacingPt ? `${styleRule.lineSpacingPt}pt` : 1.5,
    margin: 0,
    marginBottom: '2px',
  });

  const handleEditStart = (block: BodyBlock) => {
    setEditingBlockId(block.id);
    setEditText(block.text);
  };

  const commitEdit = () => {
    if (editingBlockId) {
      onBlockEdit(editingBlockId, editText);
    }
    setEditingBlockId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditingBlockId(null);
    }
  };

  return (
    <div
      className={pageStyles.a4Preview}
      style={{ background: '#d0d0d0', padding: '32px', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
    >
      <div
        style={{
          width: '595px',
          minHeight: '842px',
          background: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          paddingTop: `${template.page.top}cm`,
          paddingBottom: `${template.page.bottom}cm`,
          paddingLeft: `${template.page.left}cm`,
          paddingRight: `${template.page.right}cm`,
          position: 'relative',
        }}
      >
        {/* 红头线 */}
        {structure.docType === '红头文件' && (
          <div style={{ borderBottom: '3px solid #cc0000', marginBottom: '16px' }} />
        )}

        {/* 标题 */}
        {structure.title && (
          <h1 style={{ ...getStyleObj(template.styles.title), marginBottom: '12px' }}>
            {structure.title}
          </h1>
        )}

        {/* 主送机关 */}
        {structure.salutation && (
          <div style={{ ...getStyleObj(template.styles.salutation), marginBottom: '8px' }}>
            {structure.salutation}
          </div>
        )}

        {/* 正文块 */}
        {structure.body.map((block) => {
          let st = template.styles.body;
          if (block.type === 'h1') st = template.styles.heading1;
          else if (block.type === 'h2') st = template.styles.heading2;
          else if (block.type === 'h3') st = template.styles.heading3;
          else if (block.type === 'h4') st = template.styles.heading4;
          else if (block.type === 'h5') st = template.styles.heading5;
          else if (block.type === 'attachment') st = template.styles.attachment;

          const isEditing = editingBlockId === block.id;

          return (
            <div
              key={block.id}
              style={{
                position: 'relative',
                ...getStyleObj(st),
                backgroundColor: block.flagged ? 'rgba(255,200,0,0.2)' : 'transparent',
                cursor: 'pointer',
                outline: isEditing ? '1px dashed var(--color-primary)' : '1px dashed transparent',
                borderRadius: '2px',
              }}
              onClick={() => { if (!isEditing) handleEditStart(block); }}
              title={block.flagged ? '⚠️ 规则引擎对此行层级不确定，请核查' : '点击修改内容'}
            >
              {isEditing ? (
                <input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{
                    width: '100%',
                    font: 'inherit',
                    border: 'none',
                    outline: 'none',
                    background: 'rgba(240,248,255,0.95)',
                    color: '#000',
                    padding: '1px 2px',
                  }}
                />
              ) : (
                block.text
              )}
            </div>
          );
        })}

        {/* 落款区 */}
        {structure.signoff && (
          <div style={{ marginTop: '28pt' }}>
            <div style={getStyleObj(template.styles.signoffOrg)}>
              {structure.signoff.organization}
            </div>
            <div style={getStyleObj(template.styles.signoffDate)}>
              {structure.signoff.date}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
