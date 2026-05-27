import { useRef, useState, useCallback } from 'react';
import { parseDocxToText } from '../../parsers/docxParser';
import { parseDocToText } from '../../parsers/docParser';
import { parseTxt } from '../../parsers/txtParser';

interface Props {
  text: string;
  onTextChange: (text: string) => void;
}

export default function InputPanel({ text, onTextChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 文件大小限制：20MB
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('文件过大，请上传小于 20MB 的文件');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      let extractedText = '';
      const filenameLower = file.name.toLowerCase();
      if (filenameLower.endsWith('.docx')) {
        extractedText = await parseDocxToText(file);
      } else if (filenameLower.endsWith('.doc')) {
        extractedText = await parseDocToText(file);
      } else if (filenameLower.endsWith('.txt') || filenameLower.endsWith('.md') || filenameLower.endsWith('.markdown')) {
        extractedText = await parseTxt(file);
      } else {
        setUploadError('仅支持 .docx、.doc、.txt 或 .md 格式的文件');
        return;
      }

      if (extractedText.trim()) {
        // 追加到已有文本（如果有），或直接覆盖
        onTextChange(text ? `${text}\n${extractedText}` : extractedText);
      } else {
        setUploadError('文件内容为空，请检查文件');
      }
    } catch (err) {
      console.error('文件解析失败', err);
      setUploadError('文件解析失败，请确认文件格式正确后重试');
    } finally {
      setIsUploading(false);
      // 清空 input 状态，允许重复上传同一文件
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [text, onTextChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // 创建一个假的 change 事件来复用上传逻辑
    const dt = new DataTransfer();
    dt.items.add(file);
    const fakeEvent = { target: { files: dt.files, value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileUpload(fakeEvent);
  }, [handleFileUpload]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', flex: 1, minHeight: 0 }}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexShrink: 0 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{ flex: 1 }}
        >
          {isUploading ? '⏳ 解析中...' : '📂 上传 .docx / .doc / .txt / .md'}
        </button>
        <input
          type="file"
          accept=".docx,.doc,.txt,.md,.markdown"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { onTextChange(''); setUploadError(null); }}
          disabled={!text}
        >
          清空
        </button>
      </div>

      {/* 错误提示 */}
      {uploadError && (
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-error)',
          background: 'var(--color-error-light)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          flexShrink: 0,
        }}>
          ⚠️ {uploadError}
        </div>
      )}

      {/* 文本输入区 */}
      <textarea
        className="input"
        style={{
          flex: 1,
          resize: 'none',
          fontFamily: 'var(--font-doc)',
          fontSize: '14px',
          lineHeight: '1.8',
          padding: 'var(--space-md)',
          minHeight: '200px',
        }}
        placeholder={'在此粘贴公文文字...\n\n或将 .docx / .doc / .txt / .md 文件拖拽至此区域\n\n解析快捷键：Ctrl+Enter'}
        value={text}
        onChange={e => onTextChange(e.target.value)}
      />

      {/* 字数统计 */}
      {text && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0, textAlign: 'right' }}>
          {text.length} 字符 · {text.split('\n').filter(l => l.trim()).length} 行
        </div>
      )}
    </div>
  );
}
