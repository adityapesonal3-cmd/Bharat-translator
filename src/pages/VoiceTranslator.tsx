import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mic, MicOff, Volume2, ArrowRight, History, CornerDownRight, AlertCircle, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageName } from '../constants';
import { translateText } from '../services/aiService';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { speakText, getLocale } from '../lib/voice';

export default function VoiceTranslator({ user }: { user: any }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        setInterimTranscript(interim);
        if (final) {
          setTranscript(prev => prev + final + ' ');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please enable it in your browser.');
        } else {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition is not supported in this browser.');
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Effect to handle translation when user stops talking (if we want auto-translate)
  // For now, let's keep it manual or triggered by a "Stop" action to avoid half-baked translations

  const toggleListening = () => {
    setError(null);
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      const finalFullText = (transcript + interimTranscript).trim();
      if (finalFullText) handleTranslate(finalFullText);
    } else {
      setTranscript('');
      setInterimTranscript('');
      setTranslatedText('');
      recognitionRef.current.lang = getLocale(sourceLang);
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error('Recognition start error:', err);
        // Recognition might already be running or in a bad state
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
          setIsListening(true);
        }, 100);
      }
    }
  };

  const handleTranslate = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await translateText(text, sourceLang, targetLang);
      setTranslatedText(result.translatedText);
      speakText(result.translatedText, targetLang);

      if (user) {
        const path = 'translations';
        try {
          await addDoc(collection(db, path), {
            userId: user.uid,
            sourceText: text,
            translatedText: result.translatedText,
            sourceLang,
            targetLang,
            type: 'voice',
            isFavorite: false,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <header className="mb-12">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-saffron mb-4">Voice Interpretation Engine</h2>
        <h1 className="text-6xl font-display font-black text-app-text tracking-tighter leading-none">
          SPEAK AND BE<br />
          <span className="opacity-30">UNDERSTOOD.</span>
        </h1>
      </header>

      <div className="glass-card rounded-[40px] overflow-hidden shadow-2xl relative bg-white">
        <div className="p-8 md:p-12">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] uppercase font-bold text-slate-400">My Language</span>
               <select 
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-slate-100 border-none rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
               >
                 {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
               </select>
            </div>

            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <ArrowRight />
            </div>

            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] uppercase font-bold text-slate-400">Their Language</span>
               <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-100 border-none rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
               >
                 {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
               </select>
            </div>
          </div>

          {/* Visualization / Display */}
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-8">
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: [10, 40, 10] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1.5 bg-brand-green rounded-full"
                      />
                    ))}
                  </div>
                  <p className="text-slate-400 font-medium">Listening for {getLanguageName(sourceLang)}...</p>
                  <p className="text-2xl font-semibold text-slate-800 transition-all">
                    {transcript}
                    <span className="opacity-40">{interimTranscript}</span>
                  </p>
                </motion.div>
              ) : transcript || translatedText ? (
                 <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-8"
                 >
                   <div className="bg-slate-50 p-6 rounded-3xl text-left border border-slate-100">
                     <span className="text-xs font-bold text-slate-400 uppercase mb-2 block">You said:</span>
                     <p className="text-xl text-slate-600 font-medium">{transcript + interimTranscript}</p>
                   </div>

                   <div className="bg-brand-green/5 p-8 rounded-3xl text-left border border-brand-green/10 relative">
                     <div className="absolute -top-3 left-6 px-3 py-1 bg-brand-green text-white text-[10px] uppercase font-black rounded-lg">Translated</div>
                     <p className="text-2xl font-bold text-slate-900 leading-tight">{translatedText || 'Thinking...'}</p>
                     
                     {translatedText && (
                       <button 
                        onClick={() => speakText(translatedText, targetLang)}
                        className="mt-6 flex items-center gap-2 text-brand-green font-bold hover:opacity-70 transition-opacity"
                       >
                         <Volume2 size={24} />
                         <span>Play Audio</span>
                       </button>
                     )}
                   </div>
                 </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <Mic size={40} />
                  </div>
                  <p className="text-slate-400 max-w-xs">Tap the button and start speaking. We'll handle the rest.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Mic Button */}
          <div className="mt-12 flex flex-col items-center gap-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-tight"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all relative overflow-hidden",
                isListening ? "bg-red-500 shadow-red-500/40" : "bg-brand-green shadow-brand-green/40"
              )}
            >
              {isListening ? (
                <MicOff size={40} className="text-white z-10" />
              ) : (
                <Mic size={40} className="text-white z-10" />
              )}
              {isListening && (
                <motion.div 
                  animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-white"
                />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/conversation" className="p-6 rounded-3xl bg-brand-navy text-white flex items-start gap-4 hover:scale-[1.02] transition-all">
          <Sparkles className="text-brand-saffron" />
          <div>
            <h4 className="font-bold text-sm">New Conversation Mode</h4>
            <p className="text-xs opacity-70">Switch back-and-forth between speakers for free-flowing dialogue.</p>
          </div>
        </Link>
        <div className="p-6 rounded-3xl bg-slate-100 flex items-start gap-4">
          <History className="text-slate-400" />
          <div>
            <h4 className="font-bold text-sm">Offline Mode</h4>
            <p className="text-xs text-slate-500">Download language packs for remote villages.</p>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-slate-100 flex items-start gap-4">
          <CornerDownRight className="text-slate-400" />
          <div>
            <h4 className="font-bold text-sm">History Logs</h4>
            <p className="text-xs text-slate-500">Your spoken translations are saved automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
