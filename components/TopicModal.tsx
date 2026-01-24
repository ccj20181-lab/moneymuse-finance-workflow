import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar } from 'lucide-react';
import { Topic, SeriesType, SERIES_LABELS } from '../types';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (topic: Topic) => void;
  initialTopic?: Partial<Topic> | null;
  hideDate?: boolean;
  defaultSeries?: SeriesType;
}

const TopicModal: React.FC<TopicModalProps> = ({ isOpen, onClose, onSave, initialTopic, hideDate, defaultSeries }) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [series, setSeries] = useState<SeriesType>('knowledge');
  const [isUrgent, setIsUrgent] = useState(false);
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (initialTopic) {
            setTitle(initialTopic.title || '');
            setNote(initialTopic.note || '');
            setSeries(initialTopic.series || defaultSeries || 'knowledge');
            setIsUrgent(initialTopic.is_urgent || false);
            setTargetDate(initialTopic.target_date || '');
        } else {
            setTitle('');
            setNote('');
            setSeries(defaultSeries || 'knowledge');
            setIsUrgent(false);
            setTargetDate('');
        }
    }
  }, [initialTopic, isOpen, defaultSeries]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
        alert('请输入选题标题');
        return;
    }

    // Determine status
    let status = (initialTopic as Topic)?.status || 'idea';
    const isNew = !initialTopic?.id;

    if (isNew && targetDate) {
        status = 'scripting';
    } else if (!isNew && status === 'idea' && targetDate) {
        status = 'scripting';
    }

    const topicData: Topic = {
      id: initialTopic?.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
      title: title.trim(),
      note: note.trim(),
      series: series,
      status: status,
      created_at: (initialTopic as Topic)?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_urgent: isUrgent,
      target_date: targetDate || undefined
    };

    onSave(topicData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {initialTopic?.id ? '编辑选题' : '记录新灵感'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选题标题</label>
            <div className="relative">
                <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：为什么硅谷银行会倒闭？"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-gray-800"
                autoFocus
                />
                 <div className="absolute right-3 top-3 text-brand-500 opacity-50">
                    <Sparkles size={18} />
                 </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">所属系列</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(SERIES_LABELS) as SeriesType[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSeries(key)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    series === key
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium">{SERIES_LABELS[key]}</span>
                  {series === key && <div className="w-2 h-2 rounded-full bg-brand-500"></div>}
                </button>
              ))}
            </div>
          </div>
          
          {!hideDate && (
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">计划发布日期 (可选)</label>
                 <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-gray-800 text-sm"
                    />
                 </div>
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注 / 大纲思路</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="核心观点、数据来源、参考链接..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-gray-800 text-sm"
            />
          </div>
          
           <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                id="urgent" 
                checked={isUrgent} 
                onChange={e => setIsUrgent(e.target.checked)}
                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="urgent" className="text-sm text-gray-600 select-none cursor-pointer">这是一个突发热点，需要优先处理</label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-500/30"
            >
              保存选题
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicModal;