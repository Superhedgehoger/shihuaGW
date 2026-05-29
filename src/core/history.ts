import { DocType, MetadataForm } from '../types/document';

const HISTORY_KEY = 'shihua_doc_history';
const MAX_HISTORY = 20;

export interface HistoryItem {
  id: string;
  title: string;
  inputText: string;
  docType: DocType;
  templateId: string;
  metadata: MetadataForm;
  timestamp: string;
}

export function addToHistory(doc: {
  title?: string;
  inputText: string;
  docType: DocType;
  templateId: string;
  metadata: MetadataForm;
}): HistoryItem | undefined {
  if (!doc.inputText?.trim()) return undefined;
  
  const history = getHistory();
  const title = doc.title || doc.inputText.substring(0, 30) + '...';
  
  const newItem: HistoryItem = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    title,
    inputText: doc.inputText,
    docType: doc.docType,
    templateId: doc.templateId,
    metadata: doc.metadata,
    timestamp: new Date().toISOString(),
  };
  
  const existingIndex = history.findIndex(h => h.inputText === doc.inputText);
  if (existingIndex !== -1) {
    history.splice(existingIndex, 1);
  }
  
  history.unshift(newItem);
  
  if (history.length > MAX_HISTORY) {
    history.pop();
  }
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return newItem;
}

export function getHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  const history = getHistory().filter(item => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function getHistoryItem(id: string): HistoryItem | undefined {
  const history = getHistory();
  return history.find(item => item.id === id);
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
