import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Calendar, CheckCircle2, Trash2, Edit2, Zap, CalendarDays, ArrowRight, Library, AlertCircle, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopicModal from './components/TopicModal';
import { getTopics, addTopic, updateTopicStatus, deleteTopic, updateTopicDetails } from './lib/supabase';
import { Topic, SeriesType, SERIES_LABELS, SERIES_COLORS, StatusType } from './types';

// --- Local Date Utils ---
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0,0,0,0);
  return date;
}

const addDays = (d: Date, days: number) => {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
}

const formatDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const formatDisplayDate = (d: Date) => {
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${weekdays[d.getDay()]} ${month}/${date}`;
}

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

interface TopicCardProps {
  topic: Topic;
  onEdit: (topic: Topic) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: StatusType) => void;
  viewMode: 'library' | 'plan';
  compact?: boolean;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onEdit, onDelete, onStatusChange, viewMode, compact }) => {
  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(topic.id);
  }
  const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(topic);
  }
  const handleStatus = (e: React.MouseEvent, status: StatusType) => {
      e.stopPropagation();
      onStatusChange(topic.id, status);
  }

  if (compact) {
      return (
          <div onClick={handleEdit} className={`bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group relative flex flex-col gap-1 ${topic.status === 'published' ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex justify-between items-start">
                 <div className={`w-2 h-2 rounded-full mt-1 ${SERIES_COLORS[topic.series].replace('text', 'bg').replace('bg', 'bg-opacity-50').split(' ')[0].replace('-100', '-500')}`}></div>
                  <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded">
                      <Trash2 size={12} />
                  </button>
              </div>
              <h4 className={`text-xs font-bold text-gray-800 leading-snug line-clamp-3 ${topic.status === 'published' ? 'line-through text-gray-400' : ''}`}>
                 {topic.is_urgent && <Zap size={10} className="inline text-amber-500 mr-0.5 fill-amber-500" />}
                 {topic.title}
              </h4>
              <div className="flex justify-end mt-1 pt-1 border-t border-gray-50">
                 {topic.status !== 'published' ? (
                     <button onClick={(e) => handleStatus(e, 'published')} className="text-[10px] text-gray-400 hover:text-green-600 font-medium flex items-center gap-0.5">
                        <div className="w-3 h-3 rounded-full border border-gray-300 group-hover:border-green-500"></div> 发布
                     </button>
                 ) : (
                    <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                        <CheckCircle2 size={12} className="fill-green-100" /> 已发
                    </div>
                 )}
              </div>
          </div>
      )
  }

  return (
    <div onClick={handleEdit} className={`bg-white rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-brand-200 transition-all cursor-pointer group relative ${topic.status === 'published' ? 'opacity-70 bg-gray-50' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${SERIES_COLORS[topic.series]}`}>
          {SERIES_LABELS[topic.series]}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(topic); }} className="p-1.5 text-gray-400 hover:text-brand-600 rounded-md hover:bg-brand-50 transition-colors">
                <Edit2 size={14} />
            </button>
            <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
            </button>
        </div>
      </div>
      <h3 className={`text-gray-900 font-bold mb-2 leading-snug text-[15px] ${topic.status === 'published' ? 'line-through text-gray-500' : ''}`}>
        {topic.is_urgent && <Zap size={16} className="inline text-amber-500 mr-1 -mt-1 fill-amber-500" />}
        {topic.title}
      </h3>
      {topic.note && <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{topic.note}</p>}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
        <div className="flex items-center gap-2">
             <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Calendar size={10} />
                {formatDisplayDate(new Date(topic.created_at)).split(' ')[1]}
             </span>
        </div>
        {viewMode === 'library' && (
             <button onClick={(e) => handleStatus(e, 'scripting')} className="text-xs bg-gray-900 text-white px-2 py-1 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-1">
             加入计划 <ArrowRight size={10} />
           </button>
        )}
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('library');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Partial<Topic> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [hideDateInModal, setHideDateInModal] = useState(false);
  const [defaultSeries, setDefaultSeries] = useState<SeriesType>('knowledge');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getTopics();
      setTopics(data);
    } catch (error) {
      console.error(error);
      setErrorMsg('数据同步异常，已为您加载本地版本。');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTopic = async (topic: Topic) => {
    try {
        if (topic.id && topics.find(t => t.id === topic.id)) {
            await updateTopicDetails(topic.id, topic);
        } else {
            await addTopic(topic);
        }
        await loadData();
        setIsModalOpen(false);
    } catch(e: any) {
        alert(`保存失败: ${e.message || '请检查网络或数据库连接'}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: StatusType) => {
    try {
        await updateTopicStatus(id, newStatus);
        loadData(); 
    } catch(e) {
        alert('状态更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个选题吗？')) {
      try {
        await deleteTopic(id);
        loadData();
      } catch(e) {
          alert('删除失败');
      }
    }
  };

  const openEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setHideDateInModal(currentView === 'plan');
    setIsModalOpen(true);
  };

  const openNew = (series?: SeriesType) => {
    setEditingTopic(null);
    setDefaultSeries(series || 'knowledge');
    setHideDateInModal(false);
    setIsModalOpen(true);
  }

  const searchedTopics = useMemo(() => {
    const safeTopics = Array.isArray(topics) ? topics : [];
    if (!searchQuery) return safeTopics;
    const q = searchQuery.toLowerCase();
    return safeTopics.filter(t => t.title.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q));
  }, [topics, searchQuery]);

  const LibraryColumn = ({ series, title, color }: any) => {
     const colTopics = searchedTopics.filter(t => t.series === series && (!t.target_date || t.status === 'idea'));
     return (
        <div className="flex-1 min-w-[320px] bg-white rounded-2xl border border-gray-200 flex flex-col h-full shadow-sm">
            <div className={`p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl`}>
                <h3 className={`font-bold text-gray-800 flex items-center gap-2`}>
                   <span className={`w-3 h-3 rounded-full ${color}`}></span>
                   {title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs font-mono">{colTopics.length}</span>
                    <button onClick={() => openNew(series)} className="p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-brand-600 transition-colors">
                        <Plus size={16} />
                    </button>
                </div>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30">
                {colTopics.map(topic => (
                  <TopicCard key={topic.id} topic={topic} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} viewMode="library" />
                ))}
                {colTopics.length === 0 && <EmptyState text="暂无灵感，快去挖掘！" />}
            </div>
        </div>
     )
  }

  const WeeklyCalendar = ({ title, startDate, topics, isCurrent }: { title: string, startDate: Date, topics: Topic[], isCurrent: boolean }) => {
      const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
      return (
        <div className="flex flex-col">
            <div className={`flex items-center justify-between mb-3 px-1`}>
                <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-bold ${isCurrent ? 'text-brand-900' : 'text-gray-700'}`}>{title}</h3>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                    {formatDisplayDate(startDate)} - {formatDisplayDate(addDays(startDate, 6))}
                </span>
            </div>
            <div className="grid grid-cols-7 gap-3">
                {days.map((day) => {
                    const dayKey = formatDateKey(day);
                    const dayTopics = topics.filter(t => t.target_date === dayKey);
                    const isToday = isSameDay(new Date(), day);
                    return (
                        <div key={dayKey} onClick={() => {
                                setEditingTopic({ target_date: dayKey, series: 'knowledge' });
                                setHideDateInModal(true);
                                setIsModalOpen(true);
                            }}
                            className={`flex flex-col gap-2 rounded-xl border p-2 transition-all min-h-[120px] cursor-pointer relative group/cell ${isToday ? 'bg-white border-brand-400 ring-2 ring-brand-100 shadow-sm' : 'bg-gray-50/50 border-gray-200 hover:border-brand-200 hover:bg-white'}`}
                        >
                            <div className={`text-xs font-bold text-center py-1 rounded-md mb-1 ${isToday ? 'bg-brand-50 text-brand-700' : 'text-gray-400'}`}>
                                {formatDisplayDate(day)}
                            </div>
                            <div className="flex flex-col gap-2">
                                {dayTopics.map(t => (
                                    <TopicCard key={t.id} topic={t} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} viewMode="plan" compact={true} />
                                ))}
                                <div className="flex items-center justify-center min-h-[20px] opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                    <Plus size={16} className="text-brand-300" />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      )
  }

  const EmptyState = ({ text }: {text: string}) => (
    <div className="h-32 flex flex-col items-center justify-center text-gray-300 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
        <Sparkles size={20} className="mb-2 opacity-50" />
        <p>{text}</p>
    </div>
  )

  const planData = useMemo(() => {
      const activeTopics = searchedTopics.filter(t => t.target_date);
      const now = new Date();
      const thisWeekStart = getMonday(now);
      const nextWeekStart = addDays(thisWeekStart, 7);
      return { thisWeekStart, nextWeekStart, allActiveTopics: activeTopics }
  }, [searchedTopics]);

  return (
    <div className="h-screen bg-paper flex font-sans text-gray-900 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 ml-0 md:ml-64 flex flex-col h-screen relative">
        <header className="px-8 py-6 bg-paper/90 backdrop-blur-md z-10 border-b border-gray-100/50 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    {currentView === 'library' ? <><Library className="text-gray-400" /> 选题灵感库</> : <><CalendarDays className="text-brand-500" /> 发布计划表</>}
                </h2>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input type="text" placeholder="搜索关键词..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none w-64 shadow-sm transition-all" />
                </div>
                <button onClick={() => openNew()} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-brand-500/20 transition-all active:scale-95 hover:-translate-y-0.5">
                <Plus size={18} /> 记录新灵感
                </button>
            </div>
            </div>
        </header>
        <div className="flex-1 overflow-hidden p-8 pt-6 flex flex-col relative">
            {errorMsg && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-2 text-sm"><AlertCircle size={16} />{errorMsg}</div>}
            {currentView === 'library' && (
                <div className="flex flex-col md:flex-row gap-6 h-full overflow-x-auto pb-2">
                    <LibraryColumn series="knowledge" title="秒懂金融小知识" color="bg-blue-500" />
                    <LibraryColumn series="hotspot" title="每天秒懂财经热点" color="bg-orange-500" />
                    <LibraryColumn series="diagram" title="一图学金融系列" color="bg-purple-500" />
                </div>
            )}
            {currentView === 'plan' && (
                <div className="flex flex-col gap-8 h-full overflow-y-auto pb-10 pr-2 custom-scrollbar">
                     <WeeklyCalendar title="本周待发" startDate={planData.thisWeekStart} topics={planData.allActiveTopics} isCurrent={true} />
                     <div className="border-t border-dashed border-gray-200"></div>
                     <WeeklyCalendar title="下周待发" startDate={planData.nextWeekStart} topics={planData.allActiveTopics} isCurrent={false} />
                </div>
            )}
        </div>
        {loading && <div className="absolute inset-0 bg-paper/80 backdrop-blur-sm z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>}
      </main>
      <TopicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTopic} initialTopic={editingTopic} hideDate={hideDateInModal} defaultSeries={defaultSeries} />
    </div>
  );
}

export default App;