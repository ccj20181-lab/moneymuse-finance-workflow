import React, { useState, useEffect } from 'react';
import { X, Cloud, Save, AlertTriangle, Database, Loader2, CheckCircle2, XCircle, Copy, Terminal } from 'lucide-react';
import { getStoredCredentials, saveCredentials, isCloudEnabled, testConnection } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABLE_SQL = `create table if not exists topics (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  note text,
  series text not null,
  status text not null,
  is_urgent boolean default false,
  target_date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table topics enable row level security;
create policy "Public Access" on topics for all using (true);`;

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isCloud, setIsCloud] = useState(false);
  const [showSql, setShowSql] = useState(false);
  
  // Status: idle, testing, success, error
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
        const creds = getStoredCredentials();
        setUrl(creds.url);
        setKey(creds.key);
        setIsCloud(isCloudEnabled());
        setStatus('idle');
        setStatusMsg('');
        setShowSql(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) {
        // Clearing credentials
        saveCredentials('', '');
        onClose();
        return;
    }

    setStatus('testing');
    const isConnected = await testConnection(cleanUrl, cleanKey);

    if (isConnected) {
        setStatus('success');
        setStatusMsg('连接成功！正在保存并刷新...');
        setTimeout(() => {
            saveCredentials(cleanUrl, cleanKey);
            onClose();
        }, 1000);
    } else {
        setStatus('error');
        setStatusMsg('连接失败。请检查 URL、Key 格式，并确保已运行建表 SQL。');
    }
  };

  const copySql = () => {
      navigator.clipboard.writeText(TABLE_SQL);
      alert('SQL 代码已复制，请前往 Supabase SQL Editor 运行。');
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <SettingsIcon size={20} /> 设置
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          <div className={`p-4 rounded-xl border ${isCloud ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isCloud ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {isCloud ? <Cloud size={20} /> : <Database size={20} />}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{isCloud ? '云同步已开启' : '当前使用本地模式'}</h3>
                    <p className="text-xs text-gray-500">{isCloud ? '数据正在通过 Supabase 实时同步' : '数据仅存储在当前浏览器中'}</p>
                </div>
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div className="space-y-4">
             <div className="flex flex-col gap-2 text-amber-800 bg-amber-50 p-3 rounded-lg text-xs border border-amber-100">
                <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                    <p className="font-medium">初次使用必读：</p>
                </div>
                <ol className="list-decimal list-inside pl-6 space-y-1 text-amber-700/80">
                    <li>登录 Supabase，进入 <strong>Project Settings &gt; API</strong>。</li>
                    <li>复制 URL 和 <code>sb_publishable_...</code> Key。</li>
                    <li>
                        <button onClick={() => setShowSql(!showSql)} className="text-amber-600 font-bold underline hover:text-amber-800">
                           点击查看建表代码 (SQL)
                        </button>，在 SQL Editor 中运行它。
                    </li>
                </ol>
             </div>

             {showSql && (
                 <div className="bg-gray-900 rounded-lg p-3 relative group">
                     <button onClick={copySql} className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-white bg-white/10 rounded transition-colors">
                         <Copy size={14} />
                     </button>
                     <div className="text-[10px] font-mono text-gray-400 mb-1 flex items-center gap-1">
                        <Terminal size={10} /> SQL Editor Code
                     </div>
                     <pre className="text-[10px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                         {TABLE_SQL}
                     </pre>
                 </div>
             )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supabase URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setStatus('idle'); }}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key / Anon Key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => { setKey(e.target.value); setStatus('idle'); }}
                placeholder="sb_publishable_..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono text-gray-600"
              />
            </div>
            
            {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded">
                    <XCircle size={14} /> {statusMsg}
                </div>
            )}
            {status === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 p-2 rounded">
                    <CheckCircle2 size={14} /> {statusMsg}
                </div>
            )}

          </div>

          <button
            onClick={handleSave}
            disabled={status === 'testing' || status === 'success'}
            className={`w-full py-2.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                status === 'success' 
                ? 'bg-green-500 text-white'
                : 'bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-70 disabled:cursor-not-allowed'
            }`}
          >
            {status === 'testing' ? (
                <>
                 <Loader2 size={18} className="animate-spin" /> 正在测试连接...
                </>
            ) : status === 'success' ? (
                <>
                 <CheckCircle2 size={18} /> 已保存
                </>
            ) : (
                <>
                 <Save size={18} /> 保存并连接
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = ({size}: {size: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
)

export default SettingsModal;