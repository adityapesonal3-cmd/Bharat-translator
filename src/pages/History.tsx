import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Trash2, Calendar, ChevronRight, Search, Volume2 } from 'lucide-react';
import { getLanguageName } from '../constants';
import { formatDate } from '../lib/utils';
import { speakText } from '../lib/voice';

export default function HistoryPage({ user }: { user: any }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    const path = 'translations';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const path = `translations/${id}`;
    try {
      await deleteDoc(doc(db, 'translations', id));
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const filteredHistory = history.filter(h => 
    h.sourceText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.translatedText?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-saffron mb-4">Activity Logs</h2>
          <h1 className="text-6xl font-display font-black text-app-text tracking-tighter leading-none">
            YOUR RECENT<br />
            <span className="opacity-30">PHRASES.</span>
          </h1>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text/30" size={18} />
          <input 
            type="text" 
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-app-border rounded-full text-sm font-bold uppercase tracking-tight outline-none focus:border-brand-saffron transition-colors"
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-app-muted rounded-[40px] animate-pulse" />)}
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredHistory.map((item) => (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group p-8 rounded-[40px] border border-app-border bg-white hover:border-brand-navy shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.type === 'voice' ? 'bg-orange-100 text-orange-600' : 
                        item.type === 'camera' ? 'bg-purple-100 text-purple-600' : 
                        'bg-blue-100 text-brand-navy'
                      }`}>
                        {item.type}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-app-text/30 uppercase tracking-widest">
                        <Calendar size={10} />
                        {item.createdAt?.toDate ? formatDate(item.createdAt.toDate()) : 'Recent'}
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <button 
                      onClick={() => speakText(item.translatedText, item.targetLang)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Listen"
                     >
                      <Volume2 size={16} />
                     </button>
                     <button 
                      onClick={() => deleteEntry(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-app-text/20 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                     >
                      <Trash2 size={16} />
                     </button>
                   </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] font-black text-app-text/20 uppercase tracking-widest mb-2">{getLanguageName(item.sourceLang)}</div>
                    <p className="text-xl font-medium text-app-text/80 line-clamp-1 leading-tight">{item.sourceText}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <ChevronRight size={16} className="text-app-text/10" />
                    <div className="flex-1">
                      <div className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">{getLanguageName(item.targetLang)}</div>
                      <p className="text-2xl font-black text-app-text line-clamp-1 tracking-tighter leading-tight">{item.translatedText}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[60px] border border-app-border border-dashed">
          <div className="w-24 h-24 bg-app-muted rounded-full flex items-center justify-center mx-auto mb-8 text-app-text/10">
            <HistoryIcon size={48} />
          </div>
          <h3 className="text-2xl font-black text-app-text tracking-tighter uppercase mb-2">History Empty</h3>
          <p className="text-app-text/40 font-medium max-w-sm mx-auto">Your journey through languages starts here. Every translation you make will be saved for later.</p>
        </div>
      )}
    </div>
  );
}
