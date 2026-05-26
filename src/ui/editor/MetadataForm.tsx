import { useState } from 'react';
import type { MetadataForm as MetadataFormType, DocType } from '../../types/document';

interface Props {
  docType: DocType;
  metadata: MetadataFormType;
  onChange: (patch: Partial<MetadataFormType>) => void;
}

export default function MetadataForm({ docType, metadata, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 根据当前类型决定开放哪些核心字段
  const renderFields = () => {
    switch (docType) {
      case '红头文件':
        return (
          <>
            <div style={styles.field}>
              <label>发文字号</label>
              <input className="input" style={styles.input} value={metadata.fileNumber} onChange={e => onChange({ fileNumber: e.target.value })} placeholder="如：石化股发〔2024〕1号" />
            </div>
            <div style={styles.field}>
              <label>主送机关</label>
              <input className="input" style={styles.input} value={metadata.salutation} onChange={e => onChange({ salutation: e.target.value })} />
            </div>
            <div style={styles.field}>
              <label>抄送机关</label>
              <input className="input" style={styles.input} value={metadata.cc} onChange={e => onChange({ cc: e.target.value })} placeholder="各直属企业等" />
            </div>
          </>
        );
      case '工作表单':
        return (
          <>
            <div style={styles.field}>
              <label>拟稿人</label>
              <input className="input" style={styles.input} value={metadata.drafter} onChange={e => onChange({ drafter: e.target.value })} />
            </div>
            <div style={styles.field}>
              <label>签发人</label>
              <input className="input" style={styles.input} value={metadata.approver} onChange={e => onChange({ approver: e.target.value })} />
            </div>
            <div style={styles.field}>
              <label>拟稿部门</label>
              <input className="input" style={styles.input} value={metadata.dept} onChange={e => onChange({ dept: e.target.value })} />
            </div>
          </>
        );
      case '会议纪要':
        return (
          <>
             <div style={styles.field}>
              <label>纪要编号</label>
              <input className="input" style={styles.input} value={metadata.meetingNumber} onChange={e => onChange({ meetingNumber: e.target.value })} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="card" style={{ padding: 'var(--space-md)', background: 'var(--color-bg-sidebar)' }}>
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          元数据补充填写（点击{isExpanded ? '折叠' : '展开'}）
        </span>
        <span style={{ fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
      </div>
      
      {isExpanded && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
           {renderFields()}
           {/* 通用属性 */}
           <div style={styles.field}>
              <label>落款机关 (导出使用)</label>
              <input className="input" style={styles.input} value={metadata.signoffOrg} onChange={e => onChange({ signoffOrg: e.target.value })} />
            </div>
            <div style={styles.field}>
              <label>落款日期 (导出使用)</label>
              <input className="input" style={styles.input} value={metadata.signoffDate} onChange={e => onChange({ signoffDate: e.target.value })} placeholder="如：2024年1月1日" />
            </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  field: { display: 'flex', flexDirection: 'column' as const, gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' },
  input: { padding: '4px 8px', fontSize: 'var(--text-sm)' }
};
