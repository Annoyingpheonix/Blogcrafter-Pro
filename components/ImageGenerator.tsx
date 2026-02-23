import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Loader2, Download, Upload, Wand2, Zap, Crown } from 'lucide-react';
import { generateFeaturedImage, editImage } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');
  
  // Generation State
  const [prompt, setPrompt] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  
  // Edit State
  const [editSource, setEditSource] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64 = await generateFeaturedImage(prompt, { 
        usePro: isPro,
        size: isPro ? imageSize : undefined
      });
      setGeneratedImage(base64);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !editSource) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64 = await editImage(editSource, editPrompt);
      setGeneratedImage(base64);
    } catch (err: any) {
      setError(err.message || 'Failed to edit image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditSource(reader.result as string);
        setGeneratedImage(null); // Reset output when new input is selected
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 inline-flex">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'generate' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <Wand2 size={16} /> Generate
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <ImageIcon size={16} /> Edit Image
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Controls Column */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
             
             {activeTab === 'generate' ? (
               <form onSubmit={handleGenerate}>
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-slate-800 dark:text-slate-100">Image Generation</h3>
                     <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5">
                        <button 
                          type="button" 
                          onClick={() => setIsPro(false)} 
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${!isPro ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                          title="Flash - Faster"
                        >
                          <Zap size={12} /> Fast
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setIsPro(true)} 
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${isPro ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow text-white' : 'text-slate-500'}`}
                          title="Pro - Higher Quality & Sizes"
                        >
                          <Crown size={12} /> Pro
                        </button>
                     </div>
                  </div>

                  <div className="mb-4">
                     <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Prompt</label>
                     <textarea
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                       className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none text-sm placeholder:text-slate-400"
                       placeholder="A futuristic workspace with holographic displays..."
                     />
                  </div>

                  {isPro && (
                    <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Resolution</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['1K', '2K', '4K'] as const).map(size => (
                           <button
                             type="button"
                             key={size}
                             onClick={() => setImageSize(size)}
                             className={`py-2 rounded-lg text-sm font-semibold border ${imageSize === size ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'}`}
                           >
                             {size}
                           </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Using <strong>gemini-3-pro-image-preview</strong> for high-fidelity rendering.
                      </p>
                    </div>
                  )}

                  {!isPro && (
                     <p className="text-xs text-slate-400 mb-6">
                        Using <strong>gemini-2.5-flash-image</strong> for rapid generation.
                     </p>
                  )}
                  
                  <button
                      type="submit"
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={20} /> : 'Generate Image'}
                  </button>
               </form>
             ) : (
               <form onSubmit={handleEdit}>
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-slate-800 dark:text-slate-100">Magic Editor</h3>
                  </div>

                  <div className="mb-4">
                     <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">1. Upload Source Image</label>
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors group"
                     >
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           accept="image/*" 
                           onChange={handleFileUpload}
                        />
                        {editSource ? (
                           <div className="relative h-32 w-full rounded-lg overflow-hidden">
                              <img src={editSource} alt="Source" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <p className="text-white text-xs font-bold">Change Image</p>
                              </div>
                           </div>
                        ) : (
                           <div className="py-4">
                             <Upload className="mx-auto text-slate-400 mb-2 group-hover:text-indigo-500" size={24} />
                             <p className="text-sm text-slate-500">Click to upload</p>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="mb-6">
                     <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">2. Edit Instruction</label>
                     <textarea
                       value={editPrompt}
                       onChange={(e) => setEditPrompt(e.target.value)}
                       className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px] resize-none text-sm placeholder:text-slate-400"
                       placeholder="e.g. Add a retro filter, remove the background person..."
                     />
                  </div>

                  <button
                      type="submit"
                      disabled={isGenerating || !editPrompt.trim() || !editSource}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={20} /> : 'Apply Edits'}
                  </button>
               </form>
             )}

             {error && <p className="text-red-500 dark:text-red-400 mt-4 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">{error}</p>}
          </div>
        </div>

        {/* Output Column */}
        <div className="md:col-span-7 flex flex-col">
          <div className="bg-slate-900 rounded-2xl aspect-video w-full flex items-center justify-center overflow-hidden relative shadow-lg group border border-slate-800">
             
             {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                   <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Wand2 size={24} className="text-indigo-400 animate-pulse" />
                      </div>
                   </div>
                   <p className="font-medium mt-4 text-indigo-200">Processing Pixels...</p>
                </div>
             )}

             {generatedImage ? (
               <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain bg-slate-950" />
             ) : (
               <div className="text-center p-8">
                 <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
                   <ImageIcon size={32} />
                 </div>
                 <p className="text-slate-500 font-medium">
                   {activeTab === 'generate' ? 'Your masterpiece will appear here' : 'Edited image will appear here'}
                 </p>
               </div>
             )}
             
             {generatedImage && !isGenerating && (
               <div className="absolute bottom-4 right-4 flex gap-2">
                 <a 
                   href={generatedImage} 
                   download={`blogcraft-${activeTab}-${Date.now()}.png`}
                   className="bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-lg font-medium shadow-lg transition-all flex items-center gap-2"
                 >
                   <Download size={18} /> Download
                 </a>
               </div>
             )}
          </div>

          <div className="mt-4 px-2">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Capabilities Guide</h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
               <div className="flex gap-2 items-start">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded text-indigo-600 shrink-0 mt-0.5"><Zap size={12}/></div>
                  <p><strong>Flash Image:</strong> Best for rapid concept art and quick edits. (Used for Standard Gen & Editing)</p>
               </div>
               <div className="flex gap-2 items-start">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-1 rounded text-purple-600 shrink-0 mt-0.5"><Crown size={12}/></div>
                  <p><strong>Pro Image:</strong> Best for final assets. Supports 1K/2K/4K resolution. (Used for Pro Gen)</p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageGenerator;