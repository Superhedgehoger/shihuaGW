import type { ValidationResult } from '../../types/document';

interface Props {
  results: ValidationResult[];
}

export default function ValidationPanel({ results }: Props) {
  if (!results || results.length === 0) return null;

  const hasErrors = results.some(r => r.level === 'error' && !r.passed);

  return (
    <div className="card" style={{ padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
        核心内容校验
        {hasErrors && <span style={{ color: 'var(--color-error)', marginLeft: '8px', fontSize: '12px' }}>需要补充才能安全导出</span>}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {results.map(res => (
          <div 
            key={res.id} 
            style={{ 
              fontSize: 'var(--text-xs)', 
              color: res.passed 
                ? 'var(--color-success)' 
                : (res.level === 'error' ? 'var(--color-error)' : 'var(--color-warning)'),
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {res.message}
          </div>
        ))}
      </div>
    </div>
  );
}
