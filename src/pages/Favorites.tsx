import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Languages, ChevronRight, Share2, Trash2 } from 'lucide-react';
import { getLanguageName } from '../constants';

export default function Favorites({ user }: { user: any }) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'translations'),
        where('userId', '==', user.uid),
        where('isFavorite', '==', true)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFavorites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await updateDoc(doc(db, 'translations', id), { isFavorite: false });
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 pb-20">
      <header className="mb-12">
        <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Favorites</h1>
        <p className="text-slate-600">Quickly access your most used and important translations.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {[1,2,3,4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-[32px] animate-pulse" />)}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {favorites.map((item) => (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="glass-card p-8 rounded-[32px] flex flex-col justify-between hover:border-yellow-200 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full uppercase">Favorite phrase</div>
                    </div>
                    <button 
                      onClick={() => removeFavorite(item.id)}
                      className="p-2 text-yellow-400 hover:text-slate-300 transition-colors"
                    >
                      <Star size={24} className="fill-current" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">{getLanguageName(item.sourceLang)}</div>
                      <p className="text-slate-700 font-medium">{item.sourceText}</p>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-green mb-1 uppercase tracking-widest">{getLanguageName(item.targetLang)}</div>
                      <p className="text-xl font-bold text-slate-900">{item.translatedText}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-3 text-slate-400 hover:text-brand-green hover:bg-slate-50 rounded-2xl transition-all">
                     <Share2 size={20} />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-400">
            <Star size={40} className="fill-current" />
          </div>
          <h3 className="text-xl font-bold text-slate-400">No Favorites Yet</h3>
          <p className="text-slate-500">Tap the star icon on any translation to save it here.</p>
        </div>
      )}
    </div>
  );
}
