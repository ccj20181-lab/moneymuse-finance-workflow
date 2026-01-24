import * as XLSX from 'xlsx';
import { ReferenceNote } from '../types';

// Excel 列名与 ReferenceNote 属性的映射
const COLUMN_MAPPING: Record<string, keyof ReferenceNote> = {
  '笔记ID': 'note_id',
  '笔记链接': 'note_link',
  '笔记类型': 'note_type',
  '笔记标题': 'title',
  '笔记内容': 'content',
  '点赞量': 'likes',
  '收藏量': 'favorites',
  '评论量': 'comments',
  '分享量': 'shares',
  '发布时间': 'published_at',
  'IP地址': 'author_id', // 暂时映射，实际可能需要调整
  '博主ID': 'author_id',
  '博主链接': 'author_link',
  '博主昵称': 'author_name',
  '图片数量': 'image_count',
  '笔记封面链接': 'cover_url',
};

// 解析数值，处理空值和非法值
const parseNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// 解析字符串，处理空值
const parseString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

// 生成唯一ID
const generateId = (): string => {
  return `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export interface ParseResult {
  success: boolean;
  notes: ReferenceNote[];
  errors: string[];
  totalRows: number;
  parsedRows: number;
}

/**
 * 解析 Excel 文件并返回 ReferenceNote 数组
 */
export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  const errors: string[] = [];
  const notes: ReferenceNote[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, notes: [], errors: ['Excel 文件中没有找到工作表'], totalRows: 0, parsedRows: 0 };
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    if (jsonData.length === 0) {
      return { success: false, notes: [], errors: ['工作表中没有数据'], totalRows: 0, parsedRows: 0 };
    }

    // 获取表头
    const headers = Object.keys(jsonData[0]);

    // 检查必要字段
    const requiredFields = ['笔记标题', '笔记ID'];
    const missingFields = requiredFields.filter(f => !headers.includes(f));
    if (missingFields.length > 0) {
      errors.push(`缺少必要字段: ${missingFields.join(', ')}`);
    }

    // 解析每一行数据
    jsonData.forEach((row, index) => {
      try {
        const note: ReferenceNote = {
          id: generateId(),
          note_id: parseString(row['笔记ID']),
          note_link: parseString(row['笔记链接']),
          note_type: parseString(row['笔记类型']) || '图文',
          title: parseString(row['笔记标题']),
          content: parseString(row['笔记内容']),
          likes: parseNumber(row['点赞量']),
          favorites: parseNumber(row['收藏量']),
          comments: parseNumber(row['评论量']),
          shares: parseNumber(row['分享量']),
          published_at: parseString(row['发布时间']),
          author_id: parseString(row['博主ID']),
          author_link: parseString(row['博主链接']),
          author_name: parseString(row['博主昵称']),
          image_count: parseNumber(row['图片数量']),
          cover_url: parseString(row['笔记封面链接']),
          created_at: new Date().toISOString(),
        };

        // 验证必要字段
        if (!note.title && !note.note_id) {
          errors.push(`第 ${index + 2} 行: 标题和笔记ID都为空，已跳过`);
          return;
        }

        notes.push(note);
      } catch (err) {
        errors.push(`第 ${index + 2} 行解析失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    });

    return {
      success: notes.length > 0,
      notes,
      errors,
      totalRows: jsonData.length,
      parsedRows: notes.length,
    };
  } catch (err) {
    return {
      success: false,
      notes: [],
      errors: [`文件解析失败: ${err instanceof Error ? err.message : '未知错误'}`],
      totalRows: 0,
      parsedRows: 0,
    };
  }
};

/**
 * 验证文件类型
 */
export const isValidExcelFile = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];
  const validExtensions = ['.xlsx', '.xls', '.csv'];

  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  return hasValidType || hasValidExtension;
};
