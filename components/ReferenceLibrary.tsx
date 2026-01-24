import React, { useState, useEffect, useMemo } from 'react';
import { BookMarked, Search, Trash2, AlertCircle, ArrowUpDown, Filter, Heart, Bookmark, MessageCircle, FileSpreadsheet, Sparkles } from 'lucide-react';
import ExcelUploader from './ExcelUploader';
import ReferenceNoteCard from './ReferenceNoteCard';
import { ReferenceNote } from '../types';
import { getReferenceNotes, addReferenceNotes, deleteReferenceNote, clearReferenceNotes } from '../lib/supabase';
import { ParseResult } from '../lib/excel';

type SortField = 'likes' | 'favorites' | 'comments' | 'published_at';

const SORT_OPTIONS: { field: SortField; label: string; icon: React.ReactNode }[] = [
  { field: 'likes', label: '点赞量', icon: <Heart className="w-3.5 h-3.5" /> },
  { field: 'favorites', label: '收藏量', icon: <Bookmark className="w-3.5 h-3.5" /> },
  { field: 'comments', label: '评论量', icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { field: 'published_at', label: '发布时间', icon: <Filter className="w-3.5 h-3.5" /> },
];

const ReferenceLibrary: React.FC = () => {
  const [notes, setNotes] = useState<ReferenceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('likes');
  const [sortAsc, setSortAsc] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getReferenceNotes();
      setNotes(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (result: ParseResult) => {
    if (!result.success || result.notes.length === 0) return;

    setImporting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await addReferenceNotes(result.notes);
      if (res.success) {
        setSuccessMsg(`成功导入 ${res.added} 条笔记！`);
        await loadNotes();
        setShowUploader(false);
      } else {
        setErrorMsg(res.error || '导入失败');
      }
    } catch (err) {
      setErrorMsg('导入失败，请重试');
    } finally {
      setImporting(false);
    }

    // Auto clear success message
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条参考笔记吗？')) return;

    try {
      await deleteReferenceNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setErrorMsg('删除失败');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ 确定要清空整个参考库吗？此操作不可恢复！')) return;
    if (!window.confirm('再次确认：清空后所有导入的笔记数据将被删除！')) return;

    try {
      await clearReferenceNotes();
      setNotes([]);
      setSuccessMsg('参考库已清空');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('清空失败');
    }
  };

  // Filter & Sort
  const displayedNotes = useMemo(() => {
    let filtered = notes;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.author_name?.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortField === 'published_at') {
        aVal = a.published_at || '';
        bVal = b.published_at || '';
      } else {
        aVal = a[sortField] || 0;
        bVal = b[sortField] || 0;
      }

      if (sortAsc) {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [notes, searchQuery, sortField, sortAsc]);

  // Stats
  const stats = useMemo(() => {
    const totalLikes = notes.reduce((sum, n) => sum + (n.likes || 0), 0);
    const totalFavorites = notes.reduce((sum, n) => sum + (n.favorites || 0), 0);
    const authors = new Set(notes.map(n => n.author_id).filter(Boolean));
    return { totalLikes, totalFavorites, authorCount: authors.size };
  }, [notes]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-8 py-6 bg-paper/90 backdrop-blur-md z-10 border-b border-gray-100/50 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <BookMarked className="text-emerald-500" /> 优质笔记参考库
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              收集优质案例，学习爆款套路
              {notes.length > 0 && (
                <span className="ml-2 text-gray-500">
                  • {notes.length} 条笔记 • {stats.authorCount} 位博主 • 累计 {(stats.totalLikes / 10000).toFixed(1)}w 赞
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="搜索标题、内容、博主..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none w-64 shadow-sm transition-all"
              />
            </div>
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 hover:-translate-y-0.5"
            >
              <FileSpreadsheet size={18} /> 导入 Excel
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-8 pt-6 flex flex-col">
        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {errorMsg}
            <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 text-sm">
            <Sparkles size={16} /> {successMsg}
          </div>
        )}

        {/* Upload Section */}
        {showUploader && (
          <div className="mb-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-500" size={20} />
                导入小红书笔记数据
              </h3>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <ExcelUploader onUploadComplete={handleUploadComplete} isLoading={importing} />
            <p className="text-xs text-gray-400 mt-3">
              支持导入包含以下字段的 Excel：笔记ID、笔记标题、笔记内容、点赞量、收藏量、评论量、博主昵称 等
            </p>
          </div>
        )}

        {/* Toolbar */}
        {notes.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">排序：</span>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.field}
                  onClick={() => {
                    if (sortField === opt.field) {
                      setSortAsc(!sortAsc);
                    } else {
                      setSortField(opt.field);
                      setSortAsc(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    sortField === opt.field
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                  {sortField === opt.field && (
                    <ArrowUpDown className={`w-3 h-3 ml-0.5 ${sortAsc ? 'rotate-180' : ''} transition-transform`} />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={14} /> 清空参考库
            </button>
          </div>
        )}

        {/* Notes Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : displayedNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
              {displayedNotes.map(note => (
                <ReferenceNoteCard key={note.id} note={note} onDelete={handleDelete} />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BookMarked className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">参考库还是空的</p>
              <p className="text-sm mb-4">上传 Excel 文件导入优质笔记数据吧</p>
              <button
                onClick={() => setShowUploader(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet size={18} /> 开始导入
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">没有找到匹配的笔记</p>
              <p className="text-sm">试试其他关键词？</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceLibrary;
