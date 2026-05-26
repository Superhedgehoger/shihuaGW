import type { ProcessMode, DocType } from '../../types/document';

interface Props {
  mode: ProcessMode;
  onModeChange: (mode: ProcessMode) => void;
  docType: DocType;
  onDocTypeChange: (type: DocType) => void;
}

/**
 * 公文类型选项按标准分组定义
 * 分为：石化内部专用、法定公文类型（GB/T 9704—2012 §4）、特殊格式
 */
const DOC_TYPE_GROUPS: Array<{ label: string; types: DocType[] }> = [
  {
    label: '石化内部专用',
    types: ['红头文件', '工作表单'],
  },
  {
    label: '法定公文类型',
    types: [
      '报告', '公报', '公告', '函', '会议纪要',
      '决定', '决议', '命令', '批复', '请示',
      '通报', '通告', '通知', '议案', '意见',
    ],
  },
  {
    label: '特殊格式',
    types: ['桌签'],
  },
];

export default function ModeSelector({ mode, onModeChange, docType, onDocTypeChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* 公文类型选项 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          公文类型：
        </span>
        <select
          className="input"
          style={{ width: '180px' }}
          value={docType}
          onChange={e => onDocTypeChange(e.target.value as DocType)}
        >
          {DOC_TYPE_GROUPS.map(group => (
            <optgroup key={group.label} label={group.label}>
              {group.types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 模式切换 */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        {(['full', 'diagnose', 'quickfix'] as ProcessMode[]).map(m => {
          const isSelected = mode === m;
          const label = m === 'full' ? '全功能排版' : m === 'diagnose' ? '格式诊断' : '快速修复';
          return (
            <button
              key={m}
              className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => onModeChange(m)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
