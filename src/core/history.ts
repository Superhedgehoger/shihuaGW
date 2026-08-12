import { DocType, MetadataForm } from '../types/document';
import { getBrowserValue, removeBrowserValue, setBrowserValue } from './browserStorage';

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

export async function addToHistory(doc: {
  title?: string;
  inputText: string;
  docType: DocType;
  templateId: string;
  metadata: MetadataForm;
}): Promise<HistoryItem | undefined> {
  if (!doc.inputText?.trim()) return undefined;
  
  const history = await getHistory();
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
  
  await setBrowserValue(HISTORY_KEY, JSON.stringify(history));
  return newItem;
}

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const stored = await getBrowserValue(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  await removeBrowserValue(HISTORY_KEY);
}

export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  const history = (await getHistory()).filter(item => item.id !== id);
  await setBrowserValue(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export async function getHistoryItem(id: string): Promise<HistoryItem | undefined> {
  const history = await getHistory();
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
