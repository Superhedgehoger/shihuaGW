import type { TemplateConfig } from '../../types/template';
import styles from './TemplateList.module.css';

interface Props {
  templates: TemplateConfig[];
  selectedId: string;
  activeId: string;
  onSelect: (id: string) => void;
  onClone: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSetActive: (id: string) => void;
}

/**
 * 模板列表
 * 分组展示内置模板和用户自定义模板
 */
export default function TemplateList({
  templates,
  selectedId,
  activeId,
  onSelect,
  onClone,
  onDelete,
  onSetActive,
}: Props) {
  const builtinTemplates = templates.filter(t => t.isBuiltin);
  const userTemplates = templates.filter(t => !t.isBuiltin);

  const renderItem = (tmpl: TemplateConfig) => {
    const isSelected = tmpl.id === selectedId;
    const isActive = tmpl.id === activeId;

    return (
      <div
        key={tmpl.id}
        className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
        onClick={() => onSelect(tmpl.id)}
      >
        <div className={styles.itemHeader}>
          <span className={styles.itemName}>{tmpl.name}</span>
          <div className={styles.itemBadges}>
            {isActive && <span className="badge badge-active">使用中</span>}
            {tmpl.isBuiltin && <span className="badge badge-builtin">内置</span>}
            {!tmpl.isBuiltin && <span className="badge badge-user">自定义</span>}
          </div>
        </div>
        {tmpl.description && (
          <p className={styles.itemDesc}>{tmpl.description}</p>
        )}

        {/* 悬停操作按钮（仅在选中时显示） */}
        {isSelected && (
          <div className={styles.itemActions} onClick={e => e.stopPropagation()}>
            {!isActive && (
              <button
                className={`btn btn-sm ${styles.actionBtn}`}
                style={{ background: 'var(--color-accent)', color: '#1a1a1a' }}
                onClick={() => onSetActive(tmpl.id)}
                title="设为当前使用"
              >
                ✓ 启用
              </button>
            )}
            <button
              className={`btn btn-ghost btn-sm ${styles.actionBtn}`}
              onClick={() => onClone(tmpl.id, tmpl.name)}
              title="另存为新模板"
            >
              复制
            </button>
            {!tmpl.isBuiltin && (
              <button
                className={`btn btn-danger btn-sm ${styles.actionBtn}`}
                onClick={() => onDelete(tmpl.id)}
                title="删除此模板"
              >
                删除
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.list}>
      {/* 内置模板分组 */}
      <div className={styles.group}>
        <div className={styles.groupLabel}>内置标准</div>
        {builtinTemplates.map(renderItem)}
      </div>

      {/* 用户自定义分组 */}
      <div className={styles.group}>
        <div className={styles.groupLabel}>
          自定义模板
          {userTemplates.length > 0 && (
            <span className={styles.groupCount}>{userTemplates.length}</span>
          )}
        </div>
        {userTemplates.length === 0 ? (
          <div className={styles.emptyGroup}>
            暂无自定义模板<br />
            <span style={{ color: 'var(--color-accent)', fontSize: 'var(--text-xs)' }}>
              点击右上角「新建模板」或从内置模板「复制」
            </span>
          </div>
        ) : (
          userTemplates.map(renderItem)
        )}
      </div>
    </div>
  );
}
