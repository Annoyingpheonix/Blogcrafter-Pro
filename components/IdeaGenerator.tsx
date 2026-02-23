import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, Plus, Clock, X, Trash2 } from 'lucide-react';
import { generateBlogIdeas } from '../services/geminiService';
import { Idea } from '../types';

interface IdeaGeneratorProps {
  onSelectIdea: (idea: Idea) => void;
}

interface RecentSearch {
  topic: string;
  ideas: Idea[];
  timestamp: number;
}

const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ onSelectIdea }) => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('blogcraft_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveSearch = (newTopic: string, newIdeas: Idea[]) => {
    const newSearch: RecentSearch = { topic: newTopic, ideas: newIdeas, timestamp: Date.now() };
    
    // Filter out existing searches with the same topic to avoid duplicates, then prepend new one
    const updated = [
      newSearch, 
      ...recentSearches.filter(s => s.topic.toLowerCase() !== newTopic.toLowerCase())
    ].slice(0, 5); // Limit to 5 recent searches

    setRecentSearches(updated);
    localStorage.setItem('blogcraft_recent_searches', JSON.stringify(updated));
  };

  const deleteSearch = (e: React.MouseEvent, topicToDelete: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s.topic !== topicToDelete);
    setRecentSearches(updated);
    localStorage.setItem('blogcraft_recent_searches', JSON.stringify(updated));
  };

  const loadRecent = (search: RecentSearch) => {
    setTopic(search.topic);
    setIdeas(search.ideas);
    setError(null);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError(null);
    setIdeas([]);

    try {
      const result = await generateBlogIdeas(topic);
      setIdeas(result);
      saveSearch(topic, result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate ideas');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center transition-colors">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
          <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Generate Blog Ideas</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
          Enter a broad topic, niche, or keyword, and AI will brainstorm outlines for you.
        </p>

        <form onSubmit={handleGenerate} className="max-w-xl mx-auto flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Sustainable Gardening, React Performance..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : 'Generate'}
          </button>
        </form>
        {error && <p className="text-red-500 dark:text-red-400 mt-4 text-sm">{error}</p>}

        {/* Recent Searches Section */}
        {recentSearches.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-center gap-2 mb-3 text-slate-400 dark:text-slate-500">
               <Clock size={14} />
               <p className="text-xs font-semibold uppercase tracking-wider">Recent Brainstorms</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {recentSearches.map((search, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-full pl-4 pr-1 py-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group cursor-pointer"
                  onClick={() => loadRecent(search)}
                >
                   <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mr-2 transition-colors">
                     {search.topic}
                   </span>
                   <button 
                     onClick={(e) => deleteSearch(e, search.topic)}
                     className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                     title="Remove from history"
                   >
                     <X size={14} />
                   </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {ideas.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {ideas.map((idea, index) => (
            <div 
              key={index} 
              className="group bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {idea.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-3 flex-1">
                {idea.summary}
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 mb-6">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Outline Preview</p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  {idea.outline.slice(0, 3).map((point, i) => (
                    <li key={i} className="truncate">{point}</li>
                  ))}
                  {idea.outline.length > 3 && <li>...and {idea.outline.length - 3} more</li>}
                </ul>
              </div>

              <button
                onClick={() => onSelectIdea(idea)}
                className="w-full mt-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-slate-500 hover:text-indigo-700 dark:hover:text-indigo-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Create Draft
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IdeaGenerator;