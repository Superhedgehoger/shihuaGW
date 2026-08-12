import { useState, useCallback, useRef } from 'react';
import type { DocumentState, DocType, ProcessMode, MetadataForm } from '../types/document';
import { runDiagnostics } from '../core/diagnostics';
import { validateStructure } from '../core/validator';
import { addToHistory } from '../core/history';
import { getSetting, addRecentMetadata } from '../core/configManager';
import { checkAllFonts } from '../core/fontChecker';
import type { FontMapItem } from '../core/fontExtractor';
import { applyMetadataToStructure, populateMetadataFromStructure } from '../core/documentMetadata';
import { processDocumentCore } from '../core/documentProcessor';
import type { RulesStandard } from '../core/templateStandard';

const INITIAL_METADATA: MetadataForm = {
  fileNumber: '', salutation: '', signoffOrg: '', signoffDate: '', cc: '',
  meetingNumber: '', drafter: '', dept: '', phone: '',
  deptReviewer: '', officeReviewer: '', approver: ''
};

/**
 * 文档状态管理 Hook
 * 使用 ref 持有最新状态，避免 useCallback 依赖 state 导致快捷键监听频繁重建
 */
export function useDocumentStore() {
  const [state, setState] = useState<DocumentState>({
    rawText: '',
    docType: '报告', // 注意：必须保留为 '报告' 默认值以保持主版本的一致性特征
    processMode: 'full',
    structure: null,
    metadata: INITIAL_METADATA,
    diagnosticReport: null,
    validationResults: [],
    isProcessing: false,
    activeTemplate: null,
  });

  const [importedFonts, setImportedFonts] = useState<FontMapItem[]>([]);

  // NOTE: 用 ref 存储最新 state，让 processDocument 始终访问最新值，
  // 同时 useCallback 不需要依赖 state，避免快捷键 useEffect 频繁重建
  const stateRef = useRef(state);
  stateRef.current = state;

  const setRawText = useCallback((rawText: string) => {
    setState(prev => ({ ...prev, rawText }));
    // Font positions are only valid for the exact DOCX text they came from.
    setImportedFonts([]);
  }, []);

  const setDocType = useCallback((docType: DocType) => {
    setState(prev => ({ ...prev, docType }));
  }, []);

  const setProcessMode = useCallback((processMode: ProcessMode) => {
    setState(prev => ({ ...prev, processMode }));
  }, []);

  const updateMetadata = useCallback((patch: Partial<MetadataForm>, rulesPreset: RulesStandard = 'qsh') => {
    setState(prev => {
      const metadata = { ...prev.metadata, ...patch };
      if (!prev.structure) return { ...prev, metadata };

      const structure = applyMetadataToStructure(prev.structure, metadata);
      const fontReport = checkAllFonts(structure.body, structure.fontInfos, rulesPreset);
      structure.body = fontReport.blocks;

      return {
        ...prev,
        metadata,
        structure,
        diagnosticReport: runDiagnostics(structure, rulesPreset),
        validationResults: validateStructure(structure, fontReport, rulesPreset),
        fontReport,
      };
    });
  }, []);

  /**
   * 触发执行核心处理引擎
   * NOTE: 通过 stateRef 读取最新值，依赖数组为空，确保引用稳定
   */
  const processDocument = useCallback(async (activeTemplateId: string = 'default', rulesPreset: RulesStandard = 'qsh') => {
    const { rawText, docType, processMode, metadata } = stateRef.current;
    if (!rawText.trim()) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    try {
      const {
        structure,
        metadata: newMetadata,
        diagnosticReport,
        validationResults,
        fontReport,
      } = processDocumentCore({
        rawText,
        docType,
        processMode,
        metadata,
        importedFonts,
        rulesStandard: rulesPreset,
      });

      setState(prev => ({
        ...prev,
        structure,
        metadata: newMetadata,
        diagnosticReport,
        validationResults,
        fontReport,
        isProcessing: false,
      }));

      // 如果开启了自动保存，则存入历史记录
      if (getSetting('autoSave', true)) {
        await addToHistory({
          inputText: rawText,
          docType,
          templateId: activeTemplateId,
          metadata: newMetadata,
          title: structure.title || rawText.substring(0, 30),
        });
        // NOTE: 同时将当前元数据写入最近元数据库，供配置导出使用
        addRecentMetadata(newMetadata);
      }
    } catch (error) {
      console.error('文档解析失败', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [importedFonts]); // 依赖于 importedFonts

  /** 编辑某一段落块内容，并重新进行校验 */
  const updateBlock = useCallback((id: string, newText: string, rulesPreset: RulesStandard = 'qsh') => {
    setState(prev => {
      if (!prev.structure) return prev;
      
      const newBody = prev.structure.body.map(block =>
        block.id === id ? { ...block, text: newText, flagged: false } : block
      );
      
      const newStructure = { ...prev.structure, body: newBody };
      const newFontReport = checkAllFonts(newBody, newStructure.fontInfos, rulesPreset);
      newStructure.body = newFontReport.blocks;
      
      return {
        ...prev,
        structure: newStructure,
        diagnosticReport: runDiagnostics(newStructure, rulesPreset),
        validationResults: validateStructure(newStructure, newFontReport, rulesPreset),
        fontReport: newFontReport
      };
    });
  }, []);

  return {
    state,
    setRawText,
    setDocType,
    setProcessMode,
    updateMetadata,
    processDocument,
    updateBlock,
    setImportedFonts,
  };
}
