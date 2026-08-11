import type { DocumentStructure, MetadataForm } from '../types/document';

function splitCc(value: string): string[] | undefined {
  const entries = value
    .split(/[；;\n]+/)
    .map(item => item.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : undefined;
}

/**
 * Merge the editable metadata form into the canonical document structure.
 * Preview, validation, printing and DOCX export must all consume this result.
 */
export function applyMetadataToStructure(
  structure: DocumentStructure,
  metadata: MetadataForm
): DocumentStructure {
  const organization = metadata.signoffOrg.trim();
  const date = metadata.signoffDate.trim();
  const hasSignoff = Boolean(organization || date);

  return {
    ...structure,
    fileNumber: metadata.fileNumber.trim() || undefined,
    salutation: metadata.salutation.trim() || undefined,
    signoff: hasSignoff ? { organization, date } : undefined,
    cc: splitCc(metadata.cc),
    meetingNumber: metadata.meetingNumber.trim() || undefined,
    drafter: metadata.drafter.trim() || undefined,
    dept: metadata.dept.trim() || undefined,
    phone: metadata.phone.trim() || undefined,
    deptReviewer: metadata.deptReviewer.trim() || undefined,
    officeReviewer: metadata.officeReviewer.trim() || undefined,
    approver: metadata.approver.trim() || undefined,
  };
}

/** Fill empty form fields from values detected by the parser. */
export function populateMetadataFromStructure(
  metadata: MetadataForm,
  structure: DocumentStructure
): MetadataForm {
  return {
    ...metadata,
    fileNumber: metadata.fileNumber || structure.fileNumber || '',
    salutation: metadata.salutation || structure.salutation || '',
    signoffOrg: metadata.signoffOrg || structure.signoff?.organization || '',
    signoffDate: metadata.signoffDate || structure.signoff?.date || '',
    cc: metadata.cc || structure.cc?.join('；') || '',
    meetingNumber: metadata.meetingNumber || structure.meetingNumber || '',
    drafter: metadata.drafter || structure.drafter || '',
    dept: metadata.dept || structure.dept || '',
    phone: metadata.phone || structure.phone || '',
    deptReviewer: metadata.deptReviewer || structure.deptReviewer || '',
    officeReviewer: metadata.officeReviewer || structure.officeReviewer || '',
    approver: metadata.approver || structure.approver || '',
  };
}

export function getHeaderMetadataLines(structure: DocumentStructure): string[] {
  return [structure.fileNumber, structure.meetingNumber]
    .filter((value): value is string => Boolean(value?.trim()));
}

export function getColophonLines(structure: DocumentStructure): string[] {
  const lines: string[] = [];
  if (structure.cc?.length) lines.push(`抄送：${structure.cc.join('；')}`);

  const workForm = [
    structure.dept ? `拟稿部门：${structure.dept}` : '',
    structure.drafter ? `拟稿人：${structure.drafter}` : '',
    structure.phone ? `联系电话：${structure.phone}` : '',
    structure.deptReviewer ? `部门审核：${structure.deptReviewer}` : '',
    structure.officeReviewer ? `办公室审核：${structure.officeReviewer}` : '',
    structure.approver ? `签发人：${structure.approver}` : '',
  ].filter(Boolean);
  if (workForm.length) lines.push(workForm.join('　'));
  return lines;
}
