import { MetadataForm } from '../types/document';
import { TemplateConfig } from '../types/template';

const CONFIG_VERSION = '1.0';
const SETTINGS_KEY = 'shihua_app_settings';
const RECENT_METADATA_KEY = 'shihua_recent_metadata';

export interface AppSettings {
  autoSave?: boolean;
  theme?: 'light' | 'dark' | 'system';
  [key: string]: any;
}

export interface ConfigExport {
  version: string;
  exportedAt: string;
  app: string;
  templates?: {
    user: Record<string, TemplateConfig>;
  };
  recentMetadata?: MetadataForm[];
  settings?: AppSettings;
}

export interface ImportOptions {
  importTemplates?: boolean;
  importMetadata?: boolean;
  importSettings?: boolean;
}

// ==========================================
// Settings Management
// ==========================================

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: AppSettings): void {
  const existing = getSettings();
  const merged = { ...existing, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

export function getSetting<T>(key: string, defaultValue: T): T {
  const settings = getSettings();
  return settings[key] !== undefined ? settings[key] : defaultValue;
}

export function setSetting(key: string, value: any): void {
  const settings = getSettings();
  settings[key] = value;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resetSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}

// ==========================================
// Metadata Management
// ==========================================

export function getRecentMetadata(): MetadataForm[] {
  try {
    const stored = localStorage.getItem(RECENT_METADATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentMetadata(metadata: MetadataForm[]): void {
  const existing = getRecentMetadata();
  const merged = [...metadata, ...existing].slice(0, 10);
  localStorage.setItem(RECENT_METADATA_KEY, JSON.stringify(merged));
}

export function addRecentMetadata(metadata: MetadataForm): void {
  const recent = getRecentMetadata();
  const exists = recent.findIndex(m => JSON.stringify(m) === JSON.stringify(metadata));
  if (exists !== -1) {
    recent.splice(exists, 1);
  }
  recent.unshift(metadata);
  if (recent.length > 10) recent.pop();
  localStorage.setItem(RECENT_METADATA_KEY, JSON.stringify(recent));
}

// ==========================================
// Import / Export
// ==========================================

export function exportConfig(
  userTemplates: Record<string, TemplateConfig>,
  options: { includeTemplates?: boolean; includeMetadata?: boolean; includeSettings?: boolean } = {}
): ConfigExport {
  const { includeTemplates = true, includeMetadata = true, includeSettings = true } = options;
  
  const config: ConfigExport = {
    version: CONFIG_VERSION,
    exportedAt: new Date().toISOString(),
    app: '石化公文排版工具',
  };
  
  if (includeTemplates) {
    config.templates = { user: userTemplates };
  }
  
  if (includeMetadata) {
    config.recentMetadata = getRecentMetadata();
  }
  
  if (includeSettings) {
    config.settings = getSettings();
  }
  
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `石化公文配置_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return config;
}

export function importConfig(file: File, options: ImportOptions = {}): Promise<{ templates: Record<string, TemplateConfig> | null, metadata: number, settings: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config: ConfigExport = JSON.parse(e.target?.result as string);
        
        if (!config.version) {
          throw new Error('无效的配置文件格式');
        }
        
        const results = { templates: null as Record<string, TemplateConfig> | null, metadata: 0, settings: 0 };
        
        if (options.importTemplates !== false && config.templates?.user) {
          const importedTemplates: Record<string, TemplateConfig> = {};
          Object.entries(config.templates.user).forEach(([key, template]) => {
            const newKey = `${key}_导入`;
            importedTemplates[newKey] = { ...template, id: newKey, name: `${template.name} (导入)` };
          });
          results.templates = importedTemplates;
        }
        
        if (options.importMetadata !== false && config.recentMetadata) {
          saveRecentMetadata(config.recentMetadata);
          results.metadata = config.recentMetadata.length;
        }
        
        if (options.importSettings !== false && config.settings) {
          saveSettings(config.settings);
          results.settings = Object.keys(config.settings).length;
        }
        
        resolve(results);
      } catch (err: any) {
        reject(new Error('配置文件解析失败：' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
