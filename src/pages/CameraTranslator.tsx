import React, { useState, useRef } from 'react';
import { Camera as CameraIcon, Upload, Languages, RefreshCcw, Scan, Image as ImageIcon, AlertCircle, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translateImage } from '../services/aiService';
import { SUPPORTED_LANGUAGES } from '../constants';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { speakText } from '../lib/voice';

export default function CameraTranslator({ user }: { user: any }) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [targetLang, setTargetLang] = useState('hi');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);
    try {
      const data = await translateImage(image, targetLang);
      setResult(data);

      if (user) {
        const path = 'translations';
        try {
          await addDoc(collection(db, path), {
            userId: user.uid,
            sourceText: data.originalText,
            translatedText: data.translatedText,
            sourceLang: 'detected',
            targetLang,
            type: 'camera',
            isFavorite: false,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    } catch (err) {
      setError("Could not read text from image. Make sure the text is clear.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <header className="mb-12 text-left">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-saffron mb-4">Visual OCR Engine</h2>
        <h1 className="text-6xl font-display font-black text-app-text tracking-tighter leading-none">
          SEE AND<br />
          <span className="opacity-30">UNDERSTAND.</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Upload/View Area */}
        <div className="flex flex-col gap-4">
           <div className="glass-card rounded-[32px] overflow-hidden min-h-[400px] flex flex-col relative group">
             {image ? (
               <div className="relative h-full flex-1">
                 <img src={image} alt="Target" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={() => setImage(null)}
                      className="btn-secondary py-2 px-4 text-red-600 border-red-100 flex items-center gap-2"
                    >
                      <RefreshCcw size={18} /> Replace
                    </button>
                 </div>
                 {isProcessing && (
                   <motion.div 
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-brand-green shadow-[0_0_15px_rgba(19,136,8,0.5)] z-10"
                   />
                 )}
               </div>
             ) : (
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center p-12 cursor-pointer border-4 border-dashed border-slate-100 hover:border-brand-green/20 hover:bg-slate-50 transition-all rounded-[32px]"
               >
                 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                   <ImageIcon size={40} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-700 mb-2">Upload or Snap</h3>
                 <p className="text-slate-500 text-center max-w-[240px]">Support low-light docs, posters, and handwritten notes.</p>
               </div>
             )}
             <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
             />
           </div>

           <div className="flex items-center gap-3">
             <div className="flex-1">
               <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none"
               >
                 {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>Translate to {l.name}</option>)}
               </select>
             </div>
             <button 
              onClick={processImage}
              disabled={!image || isProcessing}
              className={cn(
                "w-16 h-16 flex items-center justify-center rounded-2xl transition-all",
                (!image || isProcessing) ? "bg-slate-200 text-slate-400" : "bg-brand-green text-white shadow-lg shadow-brand-green/20"
              )}
             >
                <Scan size={32} />
             </button>
           </div>
        </div>

        {/* Result Area */}
        <div className="flex flex-col gap-4">
           <div className="glass-card rounded-[32px] overflow-hidden min-h-[400px] flex flex-col bg-slate-900 text-white">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Translation Result</span>
                {result && (
                  <div className="px-3 py-1 bg-brand-green/20 text-brand-green text-[10px] font-bold rounded-lg border border-brand-green/30">
                    {Math.round(result.confidenceScore * 100)}% Confidence
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-8 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div 
                      key="res"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Original Text</span>
                        <p className="text-slate-300 italic">{result.originalText}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-green uppercase">Translated Text</span>
                          <button 
                            onClick={() => speakText(result.translatedText, targetLang)}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-brand-green"
                            title="Listen"
                          >
                            <Volume2 size={24} />
                          </button>
                        </div>
                        <p className="text-3xl font-display font-black leading-tight tracking-tighter">{result.translatedText}</p>
                      </div>

                      {result.detectedElements?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {result.detectedElements.map((el: string) => (
                            <span key={el} className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-slate-400 uppercase font-bold">{el}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      {isProcessing ? (
                        <motion.div 
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="space-y-4"
                        >
                          <Scan size={64} />
                          <p>Scanning Pixels...</p>
                        </motion.div>
                      ) : (
                        <>
                          <Languages size={64} className="mb-4" />
                          <p>Scan an image to see the translation results here.</p>
                        </>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
           </div>

           {error && (
             <div className="p-4 bg-red-900/10 border border-red-900/20 rounded-2xl flex items-center gap-3 text-red-500">
               <AlertCircle size={20} />
               <span className="text-sm font-medium">{error}</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
