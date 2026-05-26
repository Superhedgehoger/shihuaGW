import { useState, useCallback, useRef } from 'react';
import type { DocumentState, DocType, ProcessMode, MetadataForm } from '../types/document';
import { parseDocument } from '../core/ruleParser';
import { runDiagnostics } from '../core/diagnostics';
import { validateStructure } from '../core/validator';

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
    docType: '红头文件',
    processMode: 'full',
    structure: null,
    metadata: INITIAL_METADATA,
    diagnosticReport: null,
    validationResults: [],
    isProcessing: false,
    activeTemplate: null,
  });

  // NOTE: 用 ref 存储最新 state，让 processDocument 始终访问最新值，
  // 同时 useCallback 不需要依赖 state，避免快捷键 useEffect 频繁重建
  const stateRef = useRef(state);
  stateRef.current = state;

  const setRawText = useCallback((rawText: string) => {
    setState(prev => ({ ...prev, rawText }));
  }, []);

  const setDocType = useCallback((docType: DocType) => {
    setState(prev => ({ ...prev, docType }));
  }, []);

  const setProcessMode = useCallback((processMode: ProcessMode) => {
    setState(prev => ({ ...prev, processMode }));
  }, []);

  const updateMetadata = useCallback((patch: Partial<MetadataForm>) => {
    setState(prev => ({ ...prev, metadata: { ...prev.metadata, ...patch } }));
  }, []);

  /**
   * 触发执行核心处理引擎
   * NOTE: 通过 stateRef 读取最新值，依赖数组为空，确保引用稳定
   */
  const processDocument = useCallback(async () => {
    const { rawText, docType, metadata } = stateRef.current;
    if (!rawText.trim()) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    try {
      // 1. 结构解析
      const structure = parseDocument(rawText, docType);
      
      // 2. 结合解析内容自动填充元数据（如果为空）
      const newMetadata = { ...metadata };
      if (structure.salutation && !newMetadata.salutation) {
        newMetadata.salutation = structure.salutation;
      }
      if (structure.signoff) {
        if (!newMetadata.signoffOrg && structure.signoff.organization) {
          newMetadata.signoffOrg = structure.signoff.organization;
        }
        if (!newMetadata.signoffDate && structure.signoff.date) {
          newMetadata.signoffDate = structure.signoff.date;
        }
      }

      // 3. 运行诊断与校验
      const diagnosticReport = runDiagnostics(structure);
      const validationResults = validateStructure(structure);

      setState(prev => ({
        ...prev,
        structure,
        metadata: newMetadata,
        diagnosticReport,
        validationResults,
        isProcessing: false,
      }));
    } catch (error) {
      console.error('文档解析失败', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []); // NOTE: 无依赖，引用始终稳定

  /** 编辑某一段落块内容，并重新进行校验 */
  const updateBlock = useCallback((id: string, newText: string) => {
    setState(prev => {
      if (!prev.structure) return prev;
      
      const newBody = prev.structure.body.map(block =>
        block.id === id ? { ...block, text: newText, flagged: false } : block
      );
      
      const newStructure = { ...prev.structure, body: newBody };
      
      return {
        ...prev,
        structure: newStructure,
        diagnosticReport: runDiagnostics(newStructure),
        validationResults: validateStructure(newStructure)
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
  };
}
