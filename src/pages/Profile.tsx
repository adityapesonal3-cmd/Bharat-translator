import React, { useState, useEffect } from 'react';
import { db, signOut, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, Settings, Globe, Shield, Bell, LogOut, ChevronRight, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const path = `users/${user.uid}`;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          preferredLanguage: 'hi',
          isAdmin: false
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div className="max-w-7xl mx-auto px-6 py-32 text-center">
       <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Please Sign In</h1>
       <p className="opacity-40 font-medium">Access your personalized dashboard and history.</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <header className="mb-16">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-saffron mb-4">Account Dashboard</h2>
        <h1 className="text-6xl font-display font-black text-app-text tracking-tighter leading-none">
          HELLO, {user.displayName?.split(' ')[0].toUpperCase()}.
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
           <section>
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xs font-black uppercase tracking-widest text-app-text/30">Personal Identity</h3>
                 <button className="text-[10px] font-black uppercase tracking-widest text-brand-saffron">Edit Details</button>
              </div>
              <div className="flex items-center gap-8 p-10 bg-white border border-app-border rounded-[40px] shadow-sm">
                 <img 
                   src={user.photoURL} 
                   alt={user.displayName} 
                   className="w-24 h-24 rounded-full grayscale hover:grayscale-0 transition-all border-4 border-app-muted"
                 />
                 <div>
                   <h4 className="text-3xl font-black tracking-tighter text-app-text mb-1 uppercase">{user.displayName}</h4>
                   <p className="text-sm font-medium text-app-text/40">{user.email}</p>
                 </div>
              </div>
           </section>

           <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-app-text/30 mb-8">System Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MenuOption icon={<Globe size={20} />} label="Language" value="Hindi (Native)" />
                <MenuOption icon={<Phone size={20} />} label="Connection" value="Mobile data optimized" />
                <MenuOption icon={<Shield size={20} />} label="Privacy" value="Encrypted logs" />
                <MenuOption icon={<Bell size={20} />} label="Alerts" value="Conversational mode" />
              </div>
           </section>
        </div>

        <div className="space-y-12">
           <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-app-text/30 mb-8">Engine Usage</h3>
              <div className="p-10 bg-brand-navy rounded-[40px] text-white text-center">
                 <div className="text-6xl font-display font-black mb-2">5.4K</div>
                 <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-8">Characters Processed</div>
                 <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
                    View Analytics
                 </button>
              </div>
           </section>

           <section className="pt-12 border-t border-app-border">
              <button 
                onClick={signOut}
                className="w-full flex items-center justify-between p-8 rounded-[40px] bg-app-muted hover:bg-red-50 text-app-text hover:text-red-500 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <LogOut size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
                </div>
                <ChevronRight size={16} className="opacity-20 group-hover:translate-x-1" />
              </button>
           </section>
        </div>
      </div>
    </div>
  );
}

function MenuOption({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-6 rounded-[32px] bg-white border border-app-border hover:border-brand-saffron transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-app-muted flex items-center justify-center text-brand-navy">
          {icon}
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-app-text/30 mb-1">{label}</h4>
          <p className="text-xs font-bold text-app-text">{value}</p>
        </div>
      </div>
    </div>
  );
}
