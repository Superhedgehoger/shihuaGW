import type { ProcessMode, DocType } from '../../types/document';
import type { TemplateConfig } from '../../types/template';

interface Props {
  mode: ProcessMode;
  onModeChange: (mode: ProcessMode) => void;
  docType: DocType;
  onDocTypeChange: (type: DocType) => void;
  activeTemplateId: string;
  onTemplateChange: (id: string) => void;
  templates: TemplateConfig[]; // 动态同步的可用模板列表
  onOpenTemplateMarket: () => void;
}

/**
 * 扁平化的公文类型定义（去掉分组层级）
 * 将高频常用类型如报告、请示、通知置于最前
 */
const ALL_DOC_TYPES: DocType[] = [
  '报告',
  '请示',
  '通知',
  '意见',
  '函',
  '会议纪要',
  '决定',
  '决议',
  '命令',
  '批复',
  '通报',
  '通告',
  '公告',
  '公报',
  '议案',
  '红头文件',
  '工作表单',
  '桌签',
  '其他'
];

export default function ModeSelector({
  mode,
  onModeChange,
  docType,
  onDocTypeChange,
  activeTemplateId,
  onTemplateChange,
  templates,
  onOpenTemplateMarket
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* 公文标准与类型并排双列选项 */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        {/* 公文标准切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            公文标准：
          </span>
          <select
            className="input"
            style={{ flex: 1, minWidth: '110px' }}
            value={activeTemplateId}
            onChange={e => onTemplateChange(e.target.value)}
          >
            {templates.map(tmpl => (
              <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
            ))}
          </select>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
            onClick={onOpenTemplateMarket}
            title="管理模板与上传"
          >
            ⚙️
          </button>
        </div>

        {/* 公文类型选项（去分组） */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            公文类型：
          </span>
          <select
            className="input"
            style={{ flex: 1, minWidth: '110px' }}
            value={docType}
            onChange={e => onDocTypeChange(e.target.value as DocType)}
          >
            {ALL_DOC_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
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
