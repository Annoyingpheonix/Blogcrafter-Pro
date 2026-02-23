import React, { useState, useEffect } from 'react';
import { PenTool, Image as ImageIcon, Lightbulb, LayoutDashboard, Settings, Github, Moon, Sun } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      // Default to system preference or false
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.IDEATION, label: 'Ideation', icon: Lightbulb },
    { id: AppView.EDITOR, label: 'Editor', icon: PenTool },
    { id: AppView.IMAGE_GEN, label: 'Visuals', icon: ImageIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10 flex-shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
              B
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">BlogCraft Pro</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500">
             <span className="text-xs">Powered by Gemini</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0 z-10 transition-colors duration-200">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {navItems.find(i => i.id === currentView)?.label}
          </h2>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsDark(!isDark)}
               className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
               title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
               {isDark ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
             <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Github size={20} />
             </a>
             <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-medium">
               U
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto custom-scrollbar p-8">
           <div className="max-w-6xl mx-auto h-full">
            {children}
           </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;