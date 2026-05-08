import React, { useState } from 'react';
import { 
  Languages, 
  Copy, 
  Share2, 
  Download, 
  Volume2, 
  RefreshCcw, 
  Star,
  Check,
  AlertCircle,
  FileText,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUPPORTED_LANGUAGES, getLanguageName } from '../constants';
import { translateText } from '../services/aiService';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';

import { speakText } from '../lib/voice';

interface TranslatorProps {
  user: any;
}

export default function Translator({ user }: TranslatorProps) {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateText(sourceText, sourceLang, targetLang);
      setTranslatedText(result.translatedText);

      // Save to history if user is logged in
      if (user) {
        const path = 'translations';
        try {
          await addDoc(collection(db, path), {
            userId: user.uid,
            sourceText,
            translatedText: result.translatedText,
            sourceLang,
            targetLang,
            type: 'text',
            isFavorite: false,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    } catch (err) {
      setError('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.text(`Source (${getLanguageName(sourceLang)}):`, 10, 10);
    doc.text(sourceText, 10, 20);
    doc.text(`Translation (${getLanguageName(targetLang)}):`, 10, 40);
    doc.text(translatedText, 10, 50);
    doc.save(`translation-${Date.now()}.pdf`);
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const speak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang; // Simplistic lang mapping
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <header className="mb-12">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-saffron mb-4">Text Translation Engine</h2>
        <h1 className="text-6xl font-display font-black text-app-text tracking-tighter leading-none">
          WRITE IN ANY<br />
          <span className="opacity-30">LANGUAGE.</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-app-border rounded-[40px] overflow-hidden bg-white shadow-2xl">
        {/* Input Section */}
        <section className="flex flex-col border-r border-app-border">
          <div className="flex items-center justify-between px-10 py-6 border-b border-app-muted">
            <div className="flex items-center gap-4">
               <LanguageSelect value={sourceLang} onChange={setSourceLang} />
               <button onClick={handleSwap} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-app-muted transition-colors">
                  <RefreshCcw size={16} className="text-app-text/40" />
               </button>
               <LanguageSelect value={targetLang} onChange={setTargetLang} />
            </div>
          </div>

          <div className="flex-1 p-10 flex flex-col">
            <div className="text-xs font-black uppercase tracking-widest text-app-text/30 mb-6">Input Text</div>
            <textarea
              className="w-full flex-1 resize-none focus:outline-none text-4xl font-light leading-tight text-app-text placeholder:opacity-20"
              placeholder="What would you like to translate?"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            <div className="mt-8 pt-8 border-t border-app-muted flex items-center justify-between">
              <span className="text-[10px] font-bold text-app-text/30 uppercase tracking-widest">
                {sourceText.length} Characters
              </span>
              <button 
                onClick={handleTranslate}
                disabled={isTranslating || !sourceText}
                className="btn-primary"
              >
                {isTranslating ? "Translating..." : "Translate Now"}
              </button>
            </div>
          </div>
        </section>

        {/* Output Section */}
        <section className="flex flex-col bg-app-sidebar/30">
           <div className="flex-1 p-10 flex flex-col min-h-[500px]">
              <div className="text-xs font-black uppercase tracking-widest text-brand-green/60 mb-6">{getLanguageName(targetLang)} Translation</div>
              <AnimatePresence mode="wait">
                {translatedText ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex-1 text-5xl font-black leading-[1.1] text-app-text tracking-tighter">
                      {translatedText}
                    </div>
                    <div className="mt-8 pt-8 border-t border-app-border flex items-center gap-3">
                        <ActionButton icon={<Volume2 size={20} />} onClick={() => speakText(translatedText, targetLang)} label="Audio" />
                        <ActionButton icon={isCopied ? <Check size={20} /> : <Copy size={20} />} onClick={handleCopy} label={isCopied ? "Copied" : "Copy"} />
                        <ActionButton icon={<Share2 size={20} />} onClick={() => console.log('share')} label="Share" />
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center opacity-10">
                     <Languages size={120} />
                  </div>
                )}
              </AnimatePresence>
           </div>
        </section>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
        >
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <ToolCard 
          icon={<Volume2 className="text-brand-green" />}
          title="Voice Output"
          desc="Listen to translations in native accents."
        />
        <ToolCard 
          icon={<FileText className="text-brand-green" />}
          title="History Sync"
          desc="Access your past translations anywhere."
        />
        <ToolCard 
          icon={<Languages className="text-brand-green" />}
          title="Contextual AI"
          desc="Meaning-driven results, not just word swaps."
        />
      </section>
    </div>
  );
}

function LanguageSelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="text-xs font-black uppercase tracking-widest bg-transparent cursor-pointer focus:outline-none hover:text-brand-saffron transition-colors"
    >
      {SUPPORTED_LANGUAGES.map(lang => (
        <option key={lang.code} value={lang.code} className="text-app-text font-sans lowercase capitalize">
          {lang.name}
        </option>
      ))}
    </select>
  );
}

function ActionButton({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-app-border bg-white text-app-text transition-all hover:bg-app-text hover:text-white group"
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}

function ToolCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-[32px] border border-app-border bg-white shadow-sm flex flex-col items-start">
      <div className="w-12 h-12 flex items-center justify-center bg-app-muted rounded-xl mb-6">{icon}</div>
      <h3 className="text-lg font-black uppercase tracking-tighter mb-2">{title}</h3>
      <p className="text-app-text/60 text-sm font-medium leading-tight">{desc}</p>
    </div>
  );
}
