import type { DiagnosticReport } from '../../types/document';

interface Props {
  report: DiagnosticReport;
}

export default function DiagnosticsPanel({ report }: Props) {
  if (report.total === 0) {
    return (
      <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--color-success)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
        🎉 格式诊断通过，未发现明显的排版或标点错误。
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-xl)', background: 'var(--color-bg-app)', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          诊断报告（共发现 {report.total} 个问题）
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          请检查下方提示并在左侧编辑区进行修正。
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {report.issues.map((issue, idx) => (
          <div 
            key={idx} 
            className="card"
            style={{ 
              padding: 'var(--space-md)', 
              borderLeft: `4px solid ${issue.level === 'error' ? 'var(--color-error)' : 'var(--color-warning)'}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className={`badge ${issue.level === 'error' ? 'badge-danger' : 'badge-warning'}`} style={{ backgroundColor: issue.level === 'error' ? 'var(--color-error-light)' : 'var(--color-warning-light)', color: issue.level === 'error' ? 'var(--color-error)' : '#856404' }}>
                {issue.type === 'structure' ? '结构' : issue.type === 'punctuation' ? '标点' : '序号/缩进'}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {issue.message}
              </span>
            </div>
            
            {issue.examples && issue.examples.length > 0 && (
              <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                <strong>相关内容示例：</strong>
                <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
                  {issue.examples.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
