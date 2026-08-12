import type {
  DiagnosticReport,
  DocumentStructure,
  DocType,
  MetadataForm,
  ProcessMode,
  ValidationResult,
} from '../types/document';
import type { FontMapItem } from './fontExtractor';
import type { FontReport } from './fontChecker';
import type { RulesStandard } from './templateStandard';
import { runDiagnostics } from './diagnostics';
import { applyMetadataToStructure, populateMetadataFromStructure } from './documentMetadata';
import { checkAllFonts } from './fontChecker';
import { parseDocument } from './ruleParser';
import { validateStructure } from './validator';
import { applyQuickFixes, applyVbaFormatting } from './vbaFormatter';

export interface ProcessDocumentInput {
  rawText: string;
  docType: DocType;
  processMode: ProcessMode;
  metadata: MetadataForm;
  importedFonts?: FontMapItem[];
  rulesStandard?: RulesStandard;
}

export interface ProcessDocumentResult {
  structure: DocumentStructure;
  metadata: MetadataForm;
  diagnosticReport: DiagnosticReport;
  validationResults: ValidationResult[];
  fontReport: FontReport;
}

/**
 * UI-independent document processing pipeline shared by the Web app and future
 * command/Skill adapters. Diagnose mode preserves detected text; formatting
 * modes additionally apply the VBA-equivalent normalization pass.
 */
export function processDocumentCore(input: ProcessDocumentInput): ProcessDocumentResult {
  const rulesStandard = input.rulesStandard ?? 'qsh';
  const parsed = parseDocument(input.rawText, input.docType, input.importedFonts, rulesStandard);
  let structure = input.processMode === 'diagnose'
    ? parsed
    : input.processMode === 'quickfix'
      ? applyQuickFixes(parsed)
      : applyVbaFormatting(parsed);

  const metadata = populateMetadataFromStructure(input.metadata, structure);
  structure = applyMetadataToStructure(structure, metadata);

  const fontReport = checkAllFonts(structure.body, structure.fontInfos, rulesStandard);
  structure = { ...structure, body: fontReport.blocks };

  return {
    structure,
    metadata,
    diagnosticReport: runDiagnostics(structure, rulesStandard),
    validationResults: validateStructure(structure, fontReport, rulesStandard),
    fontReport,
  };
}
