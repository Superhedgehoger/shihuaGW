import { useEffect } from 'react';
import type { DocumentStructure } from '../../types/document';
import type { TemplateConfig } from '../../types/template';
import styles from './PrintPreviewModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  structure: DocumentStructure | null;
  template: TemplateConfig;
}

export default function PrintPreviewModal({ isOpen, onClose, structure, template }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-mode');
    } else {
      document.body.classList.remove('print-mode');
    }
    return () => {
      document.body.classList.remove('print-mode');
    };
  }, [isOpen]);

  if (!isOpen || !structure) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStyle = (key: keyof typeof template.styles) => {
    const s = template.styles[key];
    if (!s) return {};
    return {
      fontFamily: `'${s.fontCn}', '${s.fontEn}', sans-serif`,
      fontSize: `${s.size}pt`,
      fontWeight: s.isBold ? 'bold' : 'normal',
      textAlign: s.align as any,
      textIndent: s.indentPt > 0 ? `${s.indentPt}pt` : undefined,
      lineHeight: s.lineSpacingPt ? `${s.lineSpacingPt}pt` : '1.5',
    };
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.toolbar} no-print`}>
        <div className={styles.toolbarLeft}>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ 打印文档
          </button>
        </div>
        <div className={styles.toolbarRight}>
          <button className="btn btn-ghost" onClick={onClose}>
            关闭预览
          </button>
        </div>
      </div>

      <div className={styles.printContainer}>
        <div 
          className={styles.a4Page}
          style={{
            padding: `${template.page.top}cm ${template.page.right}cm ${template.page.bottom}cm ${template.page.left}cm`
          }}
        >
          {structure.title && (
            <div style={{ ...getStyle('title'), marginBottom: '24pt' }}>
              {structure.title}
            </div>
          )}
          
          {structure.salutation && (
            <div style={{ ...getStyle('salutation'), marginBottom: '12pt' }}>
              {structure.salutation}
            </div>
          )}

          {structure.body.map(block => {
            let styleKey: keyof typeof template.styles = 'body';
            if (block.type === 'h1') styleKey = 'heading1';
            else if (block.type === 'h2') styleKey = 'heading2';
            else if (block.type === 'h3') styleKey = 'heading3';
            else if (block.type === 'h4') styleKey = 'heading4';
            else if (block.type === 'h5') styleKey = 'heading5';
            else if (block.type === 'attachment') styleKey = 'attachment';

            return (
              <div key={block.id} style={getStyle(styleKey)}>
                {block.text}
              </div>
            );
          })}

          {structure.signoff && (
            <div style={{ marginTop: '36pt' }}>
              {structure.signoff.organization && (
                <div style={getStyle('signoffOrg')}>
                  {structure.signoff.organization}
                </div>
              )}
              {structure.signoff.date && (
                <div style={getStyle('signoffDate')}>
                  {structure.signoff.date}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
