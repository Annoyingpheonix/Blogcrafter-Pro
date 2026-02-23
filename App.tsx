import React, { useState } from 'react';
import Layout from './components/Layout';
import IdeaGenerator from './components/IdeaGenerator';
import Editor from './components/Editor';
import ImageGenerator from './components/ImageGenerator';
import { AppView, BlogPost, Idea } from './types';
import { generateFullDraft } from './services/geminiService';
import { Loader2, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Handle creating a draft from an idea
  const handleSelectIdea = async (idea: Idea) => {
    setIsLoadingDraft(true);
    try {
      // 1. Generate content via Gemini
      const draftContent = await generateFullDraft(idea.title, idea.outline);
      
      // 2. Create post object
      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: idea.title,
        content: draftContent,
        summary: idea.summary,
        tags: [],
        createdAt: Date.now(),
        lastModified: Date.now()
      };
      
      // 3. Set Active Post & Switch to Editor
      setActivePost(newPost);
      setCurrentView(AppView.EDITOR);
    } catch (error) {
      console.error(error);
      alert("Failed to create draft. Please try again.");
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const handleLoadDraft = () => {
    const savedData = localStorage.getItem('blogcraft_autosave');
    if (savedData) {
      try {
        const post = JSON.parse(savedData);
        setActivePost(post);
        setCurrentView(AppView.EDITOR);
      } catch (e) {
        console.error("Failed to parse draft", e);
        alert("Corrupted draft found.");
      }
    } else {
      alert("No auto-saved draft found.");
    }
  };

  const renderContent = () => {
    if (isLoadingDraft) {
      return (
         <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Crafting your draft...</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">The AI is writing the initial structure based on your selected outline.</p>
         </div>
      );
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-lg col-span-2">
              <h2 className="text-3xl font-bold mb-4">Welcome back, Creator.</h2>
              <p className="text-indigo-100 max-w-2xl text-lg mb-8">
                Ready to create your next viral blog post? Start by generating unique ideas or jump straight into the editor.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentView(AppView.IDEATION)}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  Start Brainstorming
                </button>
                <button 
                  onClick={() => { setActivePost(null); setCurrentView(AppView.EDITOR); }}
                  className="bg-indigo-800/50 backdrop-blur-sm border border-indigo-400/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-800/70 transition-colors"
                >
                  Blank Draft
                </button>
              </div>
            </div>

            <div 
              onClick={() => setCurrentView(AppView.IMAGE_GEN)}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center text-pink-600 dark:text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">AI Image Studio</h3>
              <p className="text-slate-500 dark:text-slate-400">Generate featured images and diagrams for your posts using Gemini 2.5 Flash Image.</p>
            </div>

            <div 
              onClick={handleLoadDraft}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                 <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Load Last Draft</h3>
              <p className="text-slate-500 dark:text-slate-400">Recover your last auto-saved session instantly.</p>
            </div>
          </div>
        );
      case AppView.IDEATION:
        return <IdeaGenerator onSelectIdea={handleSelectIdea} />;
      case AppView.EDITOR:
        return (
          <Editor 
            initialPost={activePost} 
            onSave={(post) => {
              setActivePost(post);
              alert("Draft Saved! (In-memory only for this demo)");
            }} 
          />
        );
      case AppView.IMAGE_GEN:
        return <ImageGenerator />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;