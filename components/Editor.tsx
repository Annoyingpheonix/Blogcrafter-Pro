import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Wand2, RefreshCw, Copy, Download, Loader2, Bold, Italic, List, Heading2, CheckCircle, Strikethrough, Quote, Code, Microscope, Brain } from 'lucide-react';
import { BlogPost } from '../types';
import { generateFullDraft, refineText, analyzeContent } from '../services/geminiService';

interface EditorProps {
  initialPost?: BlogPost | null;
  onSave: (post: BlogPost) => void;
}

const Editor: React.FC<EditorProps> = ({ initialPost, onSave }) => {
  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);

  // AI State
  const [aiSidebarTab, setAiSidebarTab] = useState<'refine' | 'analyze'>('refine');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Refs for auto-save to access latest state without resetting interval
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  // Sync refs with state
  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
  }, [title, content]);

  // If initialPost changes (e.g. new draft created from Ideation), update state
  useEffect(() => {
    if (initialPost) {
      setTitle(initialPost.title);
      setContent(initialPost.content);
    }
  }, [initialPost]);

  // Auto-save logic (every 60 seconds)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const currentTitle = titleRef.current;
      const currentContent = contentRef.current;

      // Don't save if empty
      if (!currentTitle.trim() && !currentContent.trim()) return;

      const postToSave: BlogPost = {
        id: initialPost?.id || 'autosave_draft',
        title: currentTitle,
        content: currentContent,
        createdAt: initialPost?.createdAt || Date.now(),
        lastModified: Date.now(),
        tags: initialPost?.tags || [],
        featuredImage: initialPost?.featuredImage,
        summary: initialPost?.summary
      };

      localStorage.setItem('blogcraft_autosave', JSON.stringify(postToSave));
      setLastAutoSaved(new Date());
    }, 60000); // 60 seconds

    return () => clearInterval(autoSaveInterval);
  }, [initialPost]);

  const handleSave = () => {
    const post: BlogPost = {
      // If the current ID is the autosave placeholder, generate a real ID
      id: (initialPost?.id && initialPost.id !== 'autosave_draft') ? initialPost.id : Date.now().toString(),
      title,
      content,
      createdAt: initialPost?.createdAt || Date.now(),
      lastModified: Date.now(),
      tags: initialPost?.tags || [],
      featuredImage: initialPost?.featuredImage,
      summary: initialPost?.summary
    };
    onSave(post);
  };

  const handleAiRefine = async () => {
    if (!aiPrompt.trim() || !content) return;
    setAiLoading(true);
    try {
      const newContent = await refineText(content, aiPrompt);
      setContent(newContent);
    } catch (error) {
      alert("Failed to refine text");
    } finally {
      setAiLoading(false);
      setAiPrompt('');
    }
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const result = await analyzeContent(content);
      setAnalysisResult(result);
    } catch (error) {
      alert("Failed to analyze content");
    } finally {
      setAiLoading(false);
    }
  };

  const insertMarkdown = (syntax: string) => {
    setContent(prev => prev + syntax);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
      
      {/* Toolbar & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post Title..."
          className="text-xl font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-600 min-w-[300px]"
        />
        <div className="flex items-center gap-2">
           {lastAutoSaved && (
             <span className="text-xs text-slate-400 dark:text-slate-500 mr-2 hidden md:inline-block flex items-center gap-1">
               <CheckCircle size={12} />
               Saved {lastAutoSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
           )}
           <button 
             onClick={() => setActiveTab('write')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'write' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
           >
             Write
           </button>
           <button 
             onClick={() => setActiveTab('preview')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'preview' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
           >
             Preview
           </button>
           <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
           <button onClick={handleSave} className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">
             <Save size={16} /> Save
           </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          {/* Format Bar */}
          {activeTab === 'write' && (
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button onClick={() => insertMarkdown('**bold** ')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Bold"><Bold size={16}/></button>
              <button onClick={() => insertMarkdown('_italic_ ')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Italic"><Italic size={16}/></button>
              <button onClick={() => insertMarkdown('~~strikethrough~~ ')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Strikethrough"><Strikethrough size={16}/></button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button onClick={() => insertMarkdown('## ')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Heading"><Heading2 size={16}/></button>
              <button onClick={() => insertMarkdown('\n- ')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="List"><List size={16}/></button>
              <button onClick={() => insertMarkdown('\n> ')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Blockquote"><Quote size={16}/></button>
              <button onClick={() => insertMarkdown('\n```\ncode\n```\n')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Code Block"><Code size={16}/></button>
            </div>
          )}
          
          <div className="flex-1 relative">
            {activeTab === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your masterpiece..."
                className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            ) : (
              <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950/30">
                 <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 min-h-full shadow-sm p-8 md:p-12 transition-colors">
                    <header className="mb-10 pb-8 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                          Blog Post
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          • {Math.ceil(content.split(/\s+/).filter(w => w.length > 0).length / 200)} min read
                        </span>
                      </div>
                      
                      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 mb-6 leading-tight tracking-tight">
                        {title || "Untitled Post"}
                      </h1>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                          U
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">User Author</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Published on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </header>

                    <article className="prose prose-lg prose-indigo dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:leading-relaxed">
                      {content.split('\n').map((line, i) => {
                        if (line.trim() === '') return <br key={i} className="mb-4" />;
                        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">{line.replace('# ', '')}</h1>
                        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mb-4 mt-8 text-slate-800 dark:text-slate-200">{line.replace('## ', '')}</h2>
                        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mb-3 mt-6 text-slate-800 dark:text-slate-200">{line.replace('### ', '')}</h3>
                        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-indigo-500 pl-6 py-2 italic text-slate-600 dark:text-slate-400 my-6 bg-slate-50 dark:bg-slate-800/50 rounded-r-lg">{line.replace('> ', '')}</blockquote>
                        if (line.startsWith('```')) return null; // Simple skip
                        if (line.startsWith('- ')) return <div key={i} className="flex gap-3 mb-2 ml-4"><span className="text-indigo-500 font-bold">•</span><span>{line.replace('- ', '')}</span></div>
                        if (line.startsWith('~~') && line.endsWith('~~')) return <p key={i} className="mb-4 line-through text-slate-400">{line.replace(/~~/g, '')}</p>
                        
                        return <p key={i} className="mb-4 leading-7">{line}</p>
                      })}
                    </article>
                    
                    <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-400 text-sm">
                      <p>© {new Date().getFullYear()} BlogCraft Pro</p>
                      <div className="flex gap-4">
                        <button className="hover:text-indigo-600 transition-colors">Share</button>
                        <button className="hover:text-indigo-600 transition-colors">Tweet</button>
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="w-80 flex flex-col gap-4">
           <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg flex flex-col max-h-[500px]">
             <div className="flex items-center gap-2 mb-4">
               <Wand2 size={20} />
               <h3 className="font-bold">Gemini Intelligence</h3>
             </div>
             
             {/* Tabs */}
             <div className="flex bg-white/10 rounded-lg p-1 mb-4">
               <button 
                 onClick={() => setAiSidebarTab('refine')}
                 className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${aiSidebarTab === 'refine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/5'}`}
               >
                 <Brain size={14} /> Refine
               </button>
               <button 
                 onClick={() => setAiSidebarTab('analyze')}
                 className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${aiSidebarTab === 'analyze' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/5'}`}
               >
                 <Microscope size={14} /> Analyze
               </button>
             </div>

             {aiSidebarTab === 'refine' ? (
               <div className="space-y-3 flex-1 overflow-auto">
                 <p className="text-indigo-100 text-sm">
                   Rewrite or adjust specific parts of your content.
                 </p>
                 <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                   <label className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2 block">Instruction</label>
                   <textarea 
                     value={aiPrompt}
                     onChange={(e) => setAiPrompt(e.target.value)}
                     className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-indigo-300/50 resize-none h-20"
                     placeholder="e.g. Make the introduction more punchy..."
                   />
                   <button 
                     onClick={handleAiRefine}
                     disabled={aiLoading || !content}
                     className="w-full mt-2 bg-white text-indigo-600 py-2 rounded-md text-sm font-semibold hover:bg-indigo-50 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                   >
                     {aiLoading ? <Loader2 className="animate-spin" size={14}/> : 'Refine Text'}
                   </button>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col flex-1 min-h-0">
                 <p className="text-indigo-100 text-sm mb-3">
                   Get a deep critique from Gemini 3 Pro.
                 </p>
                 {!analysisResult ? (
                   <button 
                      onClick={handleAnalyze}
                      disabled={aiLoading || !content}
                      className="w-full bg-white text-indigo-600 py-2 rounded-md text-sm font-semibold hover:bg-indigo-50 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                   >
                     {aiLoading ? <Loader2 className="animate-spin" size={14}/> : 'Run Analysis'}
                   </button>
                 ) : (
                    <div className="flex-1 overflow-y-auto bg-white/10 p-3 rounded-lg backdrop-blur-sm text-sm text-indigo-50 custom-scrollbar">
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold text-white">Critique</h4>
                           <button onClick={() => setAnalysisResult(null)} className="text-xs text-indigo-200 hover:text-white underline">Clear</button>
                        </div>
                        <div className="space-y-2 text-xs leading-relaxed opacity-90">
                            {analysisResult.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                 )}
               </div>
             )}
           </div>

           <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex-1 transition-colors">
             <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Draft Stats</h4>
             <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Words</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">{content.split(/\s+/).filter(w => w.length > 0).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Characters</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">{content.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Reading Time</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">{Math.ceil(content.split(/\s+/).length / 200)} min</span>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;