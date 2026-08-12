#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import * as mammoth from 'mammoth';
import { GB_TEMPLATE, QSH_TEMPLATE } from '../constants/defaultTemplates';
import { processDocumentCore } from '../core/documentProcessor';
import { exportDocx } from '../core/templateInjector';
import type { RulesStandard } from '../core/templateStandard';
import type { DocType, MetadataForm, ProcessMode } from '../types/document';

const DOC_TYPES: DocType[] = [
  '红头文件', '工作表单', '报告', '公报', '公告', '函', '会议纪要',
  '决定', '决议', '命令', '批复', '请示', '通报', '通告', '通知',
  '议案', '意见', '桌签', '其他',
];
const MODES: ProcessMode[] = ['full', 'diagnose', 'quickfix'];
const STANDARDS: RulesStandard[] = ['qsh', 'gb'];

const EMPTY_METADATA: MetadataForm = {
  fileNumber: '', salutation: '', signoffOrg: '', signoffDate: '', cc: '',
  meetingNumber: '', drafter: '', dept: '', phone: '', deptReviewer: '',
  officeReviewer: '', approver: '',
};

function parseArguments(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      index++;
    }
  }
  return args;
}

function usage(): string {
  return [
    'Usage: node shihua-core.mjs --input <txt|md|docx> [options]',
    '  --doc-type <通知|报告|...>     default: 报告',
    '  --mode <full|diagnose|quickfix> default: full',
    '  --standard <qsh|gb>             default: qsh',
    '  --metadata <json>                optional MetadataForm JSON',
    '  --output-json <json>             write structured result (stdout if omitted)',
    '  --output-docx <docx>             additionally write a formatted Word file',
  ].join('\n');
}

async function loadRawText(path: string): Promise<string> {
  if (extname(path).toLowerCase() === '.docx') {
    const buffer = await readFile(path);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  return await readFile(path, 'utf8');
}

function requireChoice<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  if (args.help === true) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (typeof args.input !== 'string') throw new Error(`--input is required\n${usage()}`);

  const docType = args['doc-type'] === undefined
    ? '报告'
    : requireChoice(args['doc-type'], DOC_TYPES, '--doc-type');
  const processMode = args.mode === undefined
    ? 'full'
    : requireChoice(args.mode, MODES, '--mode');
  const rulesStandard = args.standard === undefined
    ? 'qsh'
    : requireChoice(args.standard, STANDARDS, '--standard');

  const rawText = await loadRawText(args.input);
  const metadata = typeof args.metadata === 'string'
    ? { ...EMPTY_METADATA, ...JSON.parse(await readFile(args.metadata, 'utf8')) as Partial<MetadataForm> }
    : EMPTY_METADATA;
  const result = processDocumentCore({ rawText, docType, processMode, metadata, rulesStandard });
  const json = `${JSON.stringify(result, null, 2)}\n`;

  if (typeof args['output-json'] === 'string') await writeFile(args['output-json'], json, 'utf8');
  else process.stdout.write(json);

  if (typeof args['output-docx'] === 'string') {
    const baseTemplate = rulesStandard === 'gb' ? GB_TEMPLATE : QSH_TEMPLATE;
    const template = {
      ...baseTemplate,
      wordTemplatePreset: 'none' as const,
      rulesStandard,
    };
    const blob = await exportDocx(result.structure, result.metadata, template);
    await writeFile(args['output-docx'], new Uint8Array(await blob.arrayBuffer()));
  }
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`shihua-core: ${message}\n`);
  process.exitCode = 1;
});
