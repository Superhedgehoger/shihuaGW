import { useState } from 'react';
import type { TemplateConfig, ElementStyle, PageMargin } from '../../types/template';
import styles from './TemplateDetailPanel.module.css';

interface Props {
  template: TemplateConfig;
  isActive: boolean;
  onUpdate: (patch: Partial<Omit<TemplateConfig, 'id' | 'isBuiltin'>>) => void;
  onClone: () => void;
  onDelete: () => void;
  onSetActive: () => void;
}

/** 各元素的中文显示名映射 */
const ELEMENT_LABELS: Record<string, string> = {
  title: '主标题',
  salutation: '主送机关',
  heading1: '一级标题（一、）',
  heading2: '二级标题（（一））',
  heading3: '三级标题（1．）',
  heading4: '四级标题（（1））',
  heading5: '五级标题（①）',
  body: '正文',
  signoffOrg: '落款机关',
  signoffDate: '落款日期',
  attachment: '附件说明',
  colophon: '版记',
};

/** 对齐方式选项 */
const ALIGN_OPTIONS = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
  { value: 'justify', label: '两端对齐' },
];

/** Word 预设标准选项 */
const PRESET_OPTIONS = [
  { value: 'qsh', label: 'Q/SH 0758—2019（石化标准）' },
  { value: 'gb', label: 'GB/T 9704—2012（国家标准）' },
  { value: 'none', label: '无绑定（纯参数导出）' },
];

/**
 * 模板详情面板
 * 内置模板：只读展示
 * 用户模板：全字段可编辑
 */
export default function TemplateDetailPanel({
  template,
  isActive,
  onUpdate,
  onClone,
  onDelete,
  onSetActive,
}: Props) {
  const [expandedElements, setExpandedElements] = useState<Set<string>>(
    new Set(['title', 'heading1', 'body'])
  );
  const isEditable = !template.isBuiltin;

  const toggleExpand = (key: string) => {
    setExpandedElements(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleStyleChange = (
    elementKey: keyof TemplateConfig['styles'],
    field: keyof ElementStyle,
    value: string | number | boolean
  ) => {
    if (!isEditable) return;
    onUpdate({
      styles: {
        ...template.styles,
        [elementKey]: {
          ...template.styles[elementKey],
          [field]: value,
        },
      },
    });
  };

  const handlePageChange = (field: keyof PageMargin, value: number) => {
    if (!isEditable) return;
    onUpdate({ page: { ...template.page, [field]: value } });
  };

  const handleNameChange = (value: string) => {
    if (!isEditable) return;
    onUpdate({ name: value });
  };

  const handleDescChange = (value: string) => {
    if (!isEditable) return;
    onUpdate({ description: value });
  };

  const handlePresetChange = (value: string) => {
    if (!isEditable) return;
    onUpdate({ wordTemplatePreset: value as TemplateConfig['wordTemplatePreset'] });
  };

  return (
    <div className={`${styles.panel} animate-fade-in`}>
      {/* 顶部：模板基本信息 + 操作按钮 */}
      <div className={`card ${styles.headerCard}`}>
        <div className={styles.headerTop}>
          <div className={styles.headerInfo}>
            {isEditable ? (
              <input
                className={`input ${styles.nameInput}`}
                value={template.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="模板名称"
              />
            ) : (
              <h2 className={styles.nameReadonly}>{template.name}</h2>
            )}
            <div className={styles.headerBadges}>
              {isActive && <span className="badge badge-active">✓ 当前使用</span>}
              {template.isBuiltin
                ? <span className="badge badge-builtin">内置只读</span>
                : <span className="badge badge-user">用户自定义</span>
              }
            </div>
          </div>

          <div className={styles.headerActions}>
            {!isActive && (
              <button className="btn btn-accent" onClick={onSetActive}>
                ✓ 设为当前使用
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClone} title="克隆此模板为新自定义模板">
              📄 另存为
            </button>
            {isEditable && (
              <button className="btn btn-danger" onClick={onDelete}>
                🗑 删除
              </button>
            )}
          </div>
        </div>

        {/* 描述 */}
        {isEditable ? (
          <input
            className={`input ${styles.descInput}`}
            value={template.description ?? ''}
            onChange={e => handleDescChange(e.target.value)}
            placeholder="模板说明（可选）"
          />
        ) : (
          template.description && (
            <p className={styles.descReadonly}>{template.description}</p>
          )
        )}

        {/* Word 模板绑定 */}
        <div className={styles.presetRow}>
          <label className={styles.fieldLabel}>绑定 Word 模板标准：</label>
          {isEditable ? (
            <select
              className={`input ${styles.presetSelect}`}
              value={template.wordTemplatePreset}
              onChange={e => handlePresetChange(e.target.value)}
            >
              {PRESET_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <span className={styles.presetReadonly}>
              {PRESET_OPTIONS.find(o => o.value === template.wordTemplatePreset)?.label ?? template.wordTemplatePreset}
            </span>
          )}
          {template.isBuiltin && (
            <span className={styles.readonlyHint}>
              💡 内置模板不可修改，可「另存为」后自定义
            </span>
          )}
        </div>
      </div>

      {/* 页面边距配置 */}
      <div className={`card ${styles.section}`}>
        <h3 className={styles.sectionTitle}>📐 页面边距（cm）</h3>
        <div className={styles.marginsGrid}>
          {(['top', 'bottom', 'left', 'right'] as (keyof PageMargin)[]).map(field => (
            <div key={field} className={styles.marginField}>
              <label className={styles.fieldLabel}>
                {{ top: '上', bottom: '下', left: '左', right: '右' }[field]}
              </label>
              {isEditable ? (
                <input
                  type="number"
                  className={`input ${styles.marginInput}`}
                  value={template.page[field]}
                  min={0.5}
                  max={10}
                  step={0.01}
                  onChange={e => handlePageChange(field, parseFloat(e.target.value) || 0)}
                />
              ) : (
                <span className={styles.valueReadonly}>{template.page[field]} cm</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 各元素格式配置 */}
      <div className={`card ${styles.section}`}>
        <h3 className={styles.sectionTitle}>📝 段落元素格式</h3>
        <div className={styles.elementList}>
          {(Object.keys(template.styles) as Array<keyof typeof template.styles>).map(key => {
            const isExpanded = expandedElements.has(key);
            const elemStyle = template.styles[key];
            return (
              <div key={key} className={styles.elementRow}>
                {/* 元素标题行（可展开） */}
                <button
                  className={styles.elementHeader}
                  onClick={() => toggleExpand(key)}
                >
                  <span className={styles.elementLabel}>{ELEMENT_LABELS[key] ?? key}</span>
                  <span className={styles.elementPreview}>
                    {elemStyle.fontCn} · {elemStyle.size}pt · {
                      ALIGN_OPTIONS.find(o => o.value === elemStyle.align)?.label
                    }
                    {elemStyle.lineSpacingPt ? ` · 行距 ${elemStyle.lineSpacingPt}pt` : ''}
                  </span>
                  <span className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* 展开的参数编辑区 */}
                {isExpanded && (
                  <div className={styles.elementDetail}>
                    <div className={styles.paramGrid}>
                      {/* 中文字体 */}
                      <div className={styles.paramField}>
                        <label className={styles.paramLabel}>中文字体</label>
                        {isEditable ? (
                          <select
                            className="input"
                            value={elemStyle.fontCn}
                            onChange={e => handleStyleChange(key, 'fontCn', e.target.value)}
                          >
                            {['仿宋', '仿宋_GB2312', '黑体', '楷体', '楷体_GB2312', '宋体',
                              '方正小标宋简体', '方正仿宋_GBK', 'Arial', '微软雅黑'].map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={styles.valueReadonly}>{elemStyle.fontCn}</span>
                        )}
                      </div>

                      {/* 英文字体 */}
                      <div className={styles.paramField}>
                        <label className={styles.paramLabel}>英文字体</label>
                        {isEditable ? (
                          <select
                            className="input"
                            value={elemStyle.fontEn}
                            onChange={e => handleStyleChange(key, 'fontEn', e.target.value)}
                          >
                            {['Times New Roman', 'Arial', 'Calibri', 'Georgia'].map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={styles.valueReadonly}>{elemStyle.fontEn}</span>
                        )}
                      </div>

                      {/* 字号 */}
                      <div className={styles.paramField}>
                        <label className={styles.paramLabel}>字号（pt）</label>
                        {isEditable ? (
                          <input
                            type="number"
                            className="input"
                            value={elemStyle.size}
                            min={8}
                            max={72}
                            step={0.5}
                            onChange={e => handleStyleChange(key, 'size', parseFloat(e.target.value) || 12)}
                          />
                        ) : (
                          <span className={styles.valueReadonly}>{elemStyle.size} pt</span>
                        )}
                      </div>

                      {/* 对齐 */}
                      <div className={styles.paramField}>
                        <label className={styles.paramLabel}>对齐方式</label>
                        {isEditable ? (
                          <select
                            className="input"
                            value={elemStyle.align}
                            onChange={e => handleStyleChange(key, 'align', e.target.value)}
                          >
                            {ALIGN_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={styles.valueReadonly}>
                            {ALIGN_OPTIONS.find(o => o.value === elemStyle.align)?.label}
                          </span>
                        )}
                      </div>

                      {/* 首行缩进 */}
                      <div className={styles.paramField}>
                        <label className={styles.paramLabel}>首行缩进（pt）</label>
                        {isEditable ? (
                          <input
                            type="number"
                            className="input"
                            value={elemStyle.indentPt}
                            min={0}
                            max={200}
                            step={1}
                            onChange={e => handleStyleChange(key, 'indentPt', parseInt(e.target.value) || 0)}
                          />
                        ) : (
                          <span className={styles.valueReadonly}>
                            {elemStyle.indentPt === 0 ? '无' : `${elemStyle.indentPt} pt`}
                          </span>
                        )}
                      </div>

                      {/* 行距 */}
                      <div className={styles.paramField}>
                        <label className={styles.paramLabel}>固定行距（pt）</label>
                        {isEditable ? (
                          <input
                            type="number"
                            className="input"
                            value={elemStyle.lineSpacingPt ?? ''}
                            min={12}
                            max={100}
                            step={1}
                            placeholder="自动"
                            onChange={e => {
                              const v = e.target.value.trim();
                              handleStyleChange(key, 'lineSpacingPt', v ? parseInt(v) : undefined as unknown as number);
                            }}
                          />
                        ) : (
                          <span className={styles.valueReadonly}>
                            {elemStyle.lineSpacingPt ? `${elemStyle.lineSpacingPt} pt` : '自动'}
                          </span>
                        )}
                      </div>

                      {/* 加粗 */}
                      <div className={`${styles.paramField} ${styles.paramFieldFull}`}>
                        <label className={styles.paramLabel}>加粗</label>
                        {isEditable ? (
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={elemStyle.isBold}
                              onChange={e => handleStyleChange(key, 'isBold', e.target.checked)}
                            />
                            <span>{elemStyle.isBold ? '是' : '否'}</span>
                          </label>
                        ) : (
                          <span className={styles.valueReadonly}>{elemStyle.isBold ? '是' : '否'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部元数据 */}
      {(template.createdAt || template.updatedAt) && (
        <div className={styles.metaInfo}>
          {template.createdAt && (
            <span>创建于 {new Date(template.createdAt).toLocaleString('zh-CN')}</span>
          )}
          {template.updatedAt && (
            <span>最后修改 {new Date(template.updatedAt).toLocaleString('zh-CN')}</span>
          )}
        </div>
      )}
    </div>
  );
}
