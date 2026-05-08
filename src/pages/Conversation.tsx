import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, AlertCircle, ArrowLeftRight, User, RotateCcw } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageName } from '../constants';
import { translateText } from '../services/aiService';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { speakText, getLocale } from '../lib/voice';

export default function ConversationMode({ user }: { user: any }) {
  const [person1, setPerson1] = useState({ lang: 'en', transcript: '', interim: '', translated: '' });
  const [person2, setPerson2] = useState({ lang: 'hi', transcript: '', interim: '', translated: '' });
  const [activeSpeaker, setActiveSpeaker] = useState<1 | 2 | null>(null);
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
        
        if (activeSpeaker === 1) {
          setPerson1(prev => ({ ...prev, interim: interim }));
          if (final) setPerson1(prev => ({ ...prev, transcript: prev.transcript + final + ' ' }));
        } else if (activeSpeaker === 2) {
          setPerson2(prev => ({ ...prev, interim: interim }));
          if (final) setPerson2(prev => ({ ...prev, transcript: prev.transcript + final + ' ' }));
        }
      };

      recognition.onend = () => {
        // Handle unexpected termination
        if (activeSpeaker !== null) {
           // We might want to restart if activeSpeaker is still intended to be on
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied.');
        }
        setActiveSpeaker(null);
      };

      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition not supported.');
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [activeSpeaker]);

  const startListening = (personId: 1 | 2) => {
    setError(null);
    if (!recognitionRef.current) return;

    if (activeSpeaker === personId) {
      // Stop listening and translate
      recognitionRef.current.stop();
      const current = personId === 1 ? person1 : person2;
      const fullText = (current.transcript + current.interim).trim();
      handleTranslate(fullText, personId);
      setActiveSpeaker(null);
    } else {
      // Switch speaker or start
      if (activeSpeaker !== null) recognitionRef.current.stop();
      
      // Reset the speaker who is about to talk
      if (personId === 1) setPerson1(p => ({ ...p, transcript: '', interim: '', translated: '' }));
      else setPerson2(p => ({ ...p, transcript: '', interim: '', translated: '' }));

      setTimeout(() => {
        const lang = personId === 1 ? person1.lang : person2.lang;
        recognitionRef.current.lang = getLocale(lang);
        try {
          recognitionRef.current.start();
          setActiveSpeaker(personId);
        } catch (e) {
          console.error(e);
          setActiveSpeaker(null);
        }
      }, 100);
    }
  };

  const handleTranslate = async (text: string, personId: 1 | 2) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    const sourceLang = personId === 1 ? person1.lang : person2.lang;
    const targetLang = personId === 1 ? person2.lang : person1.lang;

    try {
      const result = await translateText(text, sourceLang, targetLang);
      
      if (personId === 1) setPerson2(prev => ({ ...prev, translated: result.translatedText }));
      else setPerson1(prev => ({ ...prev, translated: result.translatedText }));
      
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
            type: 'voice_conversation',
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    } catch (err) {
      setError('Translation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetConversation = () => {
    setPerson1(p => ({ ...p, transcript: '', interim: '', translated: '' }));
    setPerson2(p => ({ ...p, transcript: '', interim: '', translated: '' }));
    setActiveSpeaker(null);
  };

  return (
    <div className="h-[calc(100vh-80px)] max-w-7xl mx-auto flex flex-col bg-app-bg overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-app-border bg-white">
        <div className="flex items-center gap-4">
          <div className="status-badge">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span>Active Multi-Speaker Node</span>
          </div>
        </div>
        
        <button 
          onClick={resetConversation}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-text/40 hover:text-brand-saffron transition-colors"
        >
          <RotateCcw size={14} />
          Reset Dialogue
        </button>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 flex flex-col md:flex-row gap-0">
        {/* Person 1 / Side A */}
        <div className={cn(
          "flex-1 flex flex-col relative transition-all duration-700",
          activeSpeaker === 2 ? "opacity-30 blur-[2px]" : "opacity-100"
        )}>
          <div className="p-10 border-b border-app-border flex justify-between items-center bg-white">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-app-text/20 mb-1">Speaker One</span>
                <select 
                  value={person1.lang}
                  onChange={(e) => setPerson1(p => ({ ...p, lang: e.target.value }))}
                  className="text-2xl font-black tracking-tighter uppercase focus:outline-none bg-transparent cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
             </div>
             <User size={24} className="text-app-text/10" />
          </div>

          <div className="flex-1 p-10 flex flex-col justify-center text-center overflow-y-auto">
             <AnimatePresence mode="wait">
               {activeSpeaker === 1 ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <Waveform color="brand-navy" />
                    <p className="text-4xl font-black tracking-tighter leading-none text-app-text uppercase">
                      {person1.transcript}
                      <span className="opacity-20 italic">{person1.interim}</span>
                    </p>
                 </motion.div>
               ) : person1.translated ? (
                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-green mb-2">Translation (From Speaker 2)</div>
                    <p className="text-5xl font-black tracking-tighter leading-[0.9] text-app-text uppercase">{person1.translated}</p>
                    <button onClick={() => speakText(person1.translated, person1.lang)} className="mx-auto flex items-center justify-center p-4 bg-app-muted rounded-full hover:bg-brand-green hover:text-white transition-all">
                       <Volume2 size={24} />
                    </button>
                 </motion.div>
               ) : (
                 <div className="opacity-10 uppercase font-black text-6xl tracking-tighter -rotate-6">Speaker A</div>
               )}
             </AnimatePresence>
          </div>

          <div className="p-10 flex justify-center">
             <MicButton 
              active={activeSpeaker === 1} 
              onClick={() => startListening(1)} 
              disabled={activeSpeaker === 2 || isProcessing}
             />
          </div>
        </div>

        {/* Middle Divider */}
        <div className="w-px bg-app-border hidden md:flex items-center justify-center relative">
           <div className="absolute w-12 h-12 bg-white border border-app-border rounded-full flex items-center justify-center z-10 shadow-sm">
              <ArrowLeftRight size={16} className="text-app-text/20" />
           </div>
        </div>

        {/* Person 2 / Side B */}
        <div className={cn(
          "flex-1 flex flex-col relative transition-all duration-700 bg-app-sidebar/20",
          activeSpeaker === 1 ? "opacity-30 blur-[2px]" : "opacity-100"
        )}>
          <div className="p-10 border-b border-app-border flex justify-between items-center bg-white">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-app-text/20 mb-1">Speaker Two</span>
                <select 
                  value={person2.lang}
                  onChange={(e) => setPerson2(p => ({ ...p, lang: e.target.value }))}
                  className="text-2xl font-black tracking-tighter uppercase focus:outline-none bg-transparent cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
             </div>
             <User size={24} className="text-app-text/10" />
          </div>

          <div className="flex-1 p-10 flex flex-col justify-center text-center overflow-y-auto">
             <AnimatePresence mode="wait">
               {activeSpeaker === 2 ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <Waveform color="brand-saffron" />
                    <p className="text-4xl font-black tracking-tighter leading-none text-app-text uppercase">
                      {person2.transcript}
                      <span className="opacity-20 italic">{person2.interim}</span>
                    </p>
                 </motion.div>
               ) : person2.translated ? (
                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-green mb-2">Translation (From Speaker 1)</div>
                    <p className="text-5xl font-black tracking-tighter leading-[0.9] text-app-text uppercase">{person2.translated}</p>
                    <button onClick={() => speakText(person2.translated, person2.lang)} className="mx-auto flex items-center justify-center p-4 bg-app-muted rounded-full hover:bg-brand-green hover:text-white transition-all">
                       <Volume2 size={24} />
                    </button>
                 </motion.div>
               ) : (
                 <div className="opacity-10 uppercase font-black text-6xl tracking-tighter rotate-6">Speaker B</div>
               )}
             </AnimatePresence>
          </div>

          <div className="p-10 flex justify-center">
             <MicButton 
              active={activeSpeaker === 2} 
              onClick={() => startListening(2)} 
              disabled={activeSpeaker === 1 || isProcessing}
             />
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full text-xs font-bold uppercase flex items-center gap-2 shadow-xl z-50">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}

function MicButton({ active, onClick, disabled }: { active: boolean, onClick: () => void, disabled: boolean }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all relative",
        active ? "bg-red-500 shadow-red-500/40" : "bg-app-text shadow-black/20",
        disabled && "opacity-20 cursor-not-allowed"
      )}
    >
      {active ? <MicOff size={32} className="text-white z-10" /> : <Mic size={32} className="text-white z-10" />}
      {active && (
        <motion.div 
          animate={{ scale: [1, 2], opacity: [0.3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 bg-white"
        />
      )}
    </motion.button>
  );
}

function Waveform({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 h-12">
      {[...Array(8)].map((_, i) => (
        <motion.div 
          key={i}
          animate={{ height: [10, 48, 10] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
          className={cn("w-1.5 rounded-full bg-app-text", color === 'brand-navy' ? "bg-brand-navy" : "bg-brand-saffron")}
        />
      ))}
    </div>
  );
}
