import React, { useState } from 'react';
import { Library, CalendarDays, PenTool, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const menuItems = [
    { id: 'library', label: '选题灵感库', icon: Library, desc: '分类管理备选选题' },
    { id: 'plan', label: '发布计划表', icon: CalendarDays, desc: '每周发布排期管理' },
  ];

  return (
    <aside className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-100 flex flex-col justify-between z-20 hidden md:flex">
      <div>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <PenTool size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-tight">MoneyMuse</h1>
            <p className="text-xs text-gray-400 font-medium">财经博主工作台</p>
          </div>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-50 ring-1 ring-brand-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                    <item.icon size={20} className={isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'} />
                    <span className={`font-bold ${isActive ? 'text-brand-700' : 'text-gray-700 group-hover:text-gray-900'}`}>{item.label}</span>
                </div>
                <p className={`text-xs ml-8 ${isActive ? 'text-brand-500/80' : 'text-gray-400'}`}>{item.desc}</p>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 底部设置按钮 */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50 group"
        >
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-gray-400 group-hover:text-gray-600" />
            <span className="font-medium text-gray-600 group-hover:text-gray-800">设置</span>
          </div>
        </button>
      </div>

      {/* 设置弹窗 */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  );
};

export default Sidebar;