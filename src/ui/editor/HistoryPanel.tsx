import { useState, useEffect } from 'react';
import { getHistory, deleteHistoryItem, formatTimestamp, clearHistory, HistoryItem } from '../../core/history';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
}

export default function HistoryPanel({ isOpen, onClose, onSelect }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setHistory(getHistory());
    }
  }, [isOpen]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClear = () => {
    if (window.confirm('确定清空所有历史记录？')) {
      clearHistory();
      setHistory([]);
    }
  };

  const filteredHistory = filter 
    ? history.filter(h => h.title.toLowerCase().includes(filter.toLowerCase()) || h.inputText.toLowerCase().includes(filter.toLowerCase()))
    : history;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container animate-fade-in" 
        style={{ width: '100%', maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-title-icon">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="modal-title">历史记录</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="关闭">
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg 
              style={{ width: '18px', height: '18px', color: 'var(--color-text-muted)', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="搜索历史记录..."
              className="input"
              style={{ paddingLeft: '38px' }}
            />
          </div>
          {history.length > 0 && (
            <button onClick={handleClear} className="btn btn-danger btn-sm">
              清空
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)' }}>
          {filteredHistory.length === 0 ? (
            <div className="history-empty-state">
              <div style={{ width: '64px', height: '64px', background: 'var(--color-bg-sidebar)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-lg) auto' }}>
                <svg style={{ width: '32px', height: '32px', color: 'var(--color-text-muted)', margin: '16px auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>{filter ? '未找到匹配的记录' : '暂无历史记录'}</p>
              {!filter && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>处理过的文档会自动保存到此处</p>}
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => { onSelect(item); onClose(); }}
                  className="history-item"
                >
                  <div className="history-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span className="badge badge-builtin">{item.docType}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{formatTimestamp(item.timestamp)}</span>
                    </div>
                  </div>
                  <h3 className="history-item-title">{item.title}</h3>
                  <p className="history-item-snippet">{item.inputText}</p>
                  
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="history-delete-btn"
                    title="删除"
                  >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
