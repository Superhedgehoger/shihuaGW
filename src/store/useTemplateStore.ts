import { useState, useEffect, useCallback } from 'react';
import type { TemplateConfig, TemplateStore } from '../types/template';
import { BUILTIN_TEMPLATES, DEFAULT_TEMPLATE_ID } from '../constants/defaultTemplates';

const STORAGE_KEY = 'shihua_template_store';

/**
 * 从 localStorage 加载模板仓库，合并内置模板（内置始终以代码为准）
 */
function loadStore(): TemplateStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<TemplateStore>;
      return {
        builtin: BUILTIN_TEMPLATES,
        user: saved.user ?? {},
        activeTemplateId: saved.activeTemplateId ?? DEFAULT_TEMPLATE_ID,
      };
    }
  } catch {
    // 读取失败时使用默认值
  }
  return {
    builtin: BUILTIN_TEMPLATES,
    user: {},
    activeTemplateId: DEFAULT_TEMPLATE_ID,
  };
}

function saveStore(store: TemplateStore): void {
  // NOTE: 只持久化 user 区和 activeTemplateId，builtin 始终从代码读取
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user: store.user, activeTemplateId: store.activeTemplateId })
  );
}

/** 生成 UUID v4 简化版 */
function generateId(): string {
  return 'tmpl_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now().toString(36);
}

/**
 * 模板仓库 Hook
 * 提供增删改查、激活管理、导入/导出能力
 */
export function useTemplateStore() {
  const [store, setStore] = useState<TemplateStore>(loadStore);

  // 状态变更时自动持久化
  useEffect(() => {
    saveStore(store);
  }, [store]);

  /** 获取所有模板（内置 + 用户自定义），按内置优先排列 */
  const getAllTemplates = useCallback((): TemplateConfig[] => {
    const builtinList = Object.values(store.builtin);
    const userList = Object.values(store.user).sort(
      (a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
    );
    return [...builtinList, ...userList];
  }, [store]);

  /** 根据 ID 获取模板 */
  const getTemplateById = useCallback(
    (id: string): TemplateConfig | undefined => {
      return store.builtin[id] ?? store.user[id];
    },
    [store]
  );

  /** 获取当前激活的模板 */
  const getActiveTemplate = useCallback((): TemplateConfig => {
    return (
      getTemplateById(store.activeTemplateId) ??
      store.builtin[DEFAULT_TEMPLATE_ID]
    );
  }, [store, getTemplateById]);

  /** 设置当前激活的模板 */
  const setActiveTemplate = useCallback((id: string) => {
    setStore(prev => ({ ...prev, activeTemplateId: id }));
  }, []);

  /**
   * 新建自定义模板（从空白或克隆已有模板）
   * @param basedOnId - 克隆来源模板ID，不传则从内置 Q/SH 克隆
   * @param name - 新模板名称
   */
  const createTemplate = useCallback(
    (name: string, basedOnId?: string): TemplateConfig => {
      const base = basedOnId
        ? (getTemplateById(basedOnId) ?? store.builtin[DEFAULT_TEMPLATE_ID])
        : store.builtin[DEFAULT_TEMPLATE_ID];
      const now = new Date().toISOString();
      const newTemplate: TemplateConfig = {
        ...base,
        id: generateId(),
        name,
        description: `基于「${base.name}」创建`,
        isBuiltin: false,
        createdAt: now,
        updatedAt: now,
      };
      setStore(prev => ({
        ...prev,
        user: { ...prev.user, [newTemplate.id]: newTemplate },
      }));
      return newTemplate;
    },
    [store, getTemplateById]
  );

  /**
   * 更新用户自定义模板
   * 内置模板不可修改，调用时会静默忽略
   */
  const updateTemplate = useCallback(
    (id: string, patch: Partial<Omit<TemplateConfig, 'id' | 'isBuiltin'>>) => {
      setStore(prev => {
        if (!prev.user[id]) return prev; // 内置模板不允许修改
        const updated: TemplateConfig = {
          ...prev.user[id],
          ...patch,
          id,
          isBuiltin: false,
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, user: { ...prev.user, [id]: updated } };
      });
    },
    []
  );

  /**
   * 删除用户自定义模板
   * 若被删除的是当前激活模板，自动切换回默认
   */
  const deleteTemplate = useCallback((id: string) => {
    setStore(prev => {
      if (prev.builtin[id]) return prev; // 内置模板不可删除
      const { [id]: _removed, ...remainingUser } = prev.user;
      const newActiveId = prev.activeTemplateId === id
        ? DEFAULT_TEMPLATE_ID
        : prev.activeTemplateId;
      return { ...prev, user: remainingUser, activeTemplateId: newActiveId };
    });
  }, []);

  /**
   * 将当前所有用户模板导出为 JSON 字符串
   */
  const exportUserTemplates = useCallback((): string => {
    return JSON.stringify({ version: 1, user: store.user }, null, 2);
  }, [store]);

  /**
   * 从 JSON 字符串导入用户模板（合并，不覆盖同名）
   */
  const importUserTemplates = useCallback((json: string): { imported: number; errors: string[] } => {
    const errors: string[] = [];
    let imported = 0;
    try {
      const parsed = JSON.parse(json) as { version?: number; user?: Record<string, TemplateConfig> };
      if (!parsed.user || typeof parsed.user !== 'object') {
        return { imported: 0, errors: ['JSON 格式不正确，缺少 user 字段'] };
      }
      const newUser: Record<string, TemplateConfig> = {};
      for (const [key, tmpl] of Object.entries(parsed.user)) {
        // 简单校验必填字段
        if (!tmpl.name || !tmpl.styles || !tmpl.page) {
          errors.push(`模板 "${key}" 缺少必填字段，已跳过`);
          continue;
        }
        // 生成新ID避免冲突
        const newId = generateId();
        newUser[newId] = { ...tmpl, id: newId, isBuiltin: false };
        imported++;
      }
      setStore(prev => ({ ...prev, user: { ...prev.user, ...newUser } }));
    } catch {
      return { imported: 0, errors: ['JSON 解析失败，请检查文件格式'] };
    }
    return { imported, errors };
  }, []);

  return {
    store,
    getAllTemplates,
    getTemplateById,
    getActiveTemplate,
    setActiveTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    exportUserTemplates,
    importUserTemplates,
  };
}
