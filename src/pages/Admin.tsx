import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { BarChart3, Users, Languages, Activity, MessageSquare, AlertCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTranslations: 0,
    dailyActive: 0,
    errorRate: '0.2%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if admin (simplified for demo)
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // In a real app, these would be aggregated queries or a separate stats collection
      setStats({
        totalUsers: 1420,
        totalTranslations: 45290,
        dailyActive: 312,
        errorRate: '0.15%'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-12 pb-20">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Bharat Control</h1>
          <p className="text-slate-600">Platform analytics and system health monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary py-2 px-4 flex items-center gap-2">
            <Activity size={18} /> System Status: <span className="text-brand-green font-bold">Good</span>
          </button>
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<Users className="text-blue-500" />} label="Total Users" value={stats.totalUsers.toLocaleString()} delta="+12%" />
        <StatCard icon={<Languages className="text-orange-500" />} label="Translations" value={stats.totalTranslations.toLocaleString()} delta="+24%" />
        <StatCard icon={<Activity className="text-emerald-500" />} label="Daily Active" value={stats.dailyActive.toLocaleString()} delta="+5%" />
        <StatCard icon={<AlertCircle className="text-red-500" />} label="Error Rate" value={stats.errorRate} delta="-2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-card p-8 rounded-[32px]">
             <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <BarChart3 className="text-brand-green" /> Translation Trends
                </h3>
                <select className="bg-slate-50 text-xs font-bold border-none rounded-lg p-2 outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
             </div>
             <div className="h-64 flex items-end gap-2 md:gap-4">
                {[45, 60, 40, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="w-full bg-slate-100 group-hover:bg-brand-green transition-colors rounded-t-xl"
                    />
                    <span className="text-[10px] font-bold text-slate-400">Day {i+1}</span>
                  </div>
                ))}
             </div>
           </div>

           <div className="glass-card p-8 rounded-[32px]">
             <h3 className="font-bold text-lg mb-6">Language Usage Breakdown</h3>
             <div className="space-y-4">
                <UsageProgress label="Hindi" percentage={45} color="bg-brand-saffron" />
                <UsageProgress label="English" percentage={30} color="bg-brand-navy" />
                <UsageProgress label="Tamil" percentage={15} color="bg-brand-green" />
                <UsageProgress label="Other" percentage={10} color="bg-slate-300" />
             </div>
           </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-8 rounded-[32px]">
             <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
               <MessageSquare size={20} className="text-brand-green" /> Latest Feedback
             </h3>
             <div className="space-y-6">
                <FeedbackItem user="Rahul S." text="Hindi translations are very accurate now. Great work!" time="2m ago" />
                <FeedbackItem user="Priya M." text="Interface is very easy for my parents to use." time="15m ago" />
                <FeedbackItem user="Anuj V." text="Feature request: Offline village mode for farmers." time="1h ago" />
             </div>
          </div>
          
          <div className="bg-brand-navy p-8 rounded-[32px] text-white">
             <h3 className="font-bold mb-4 opacity-70">Infrastructure Alert</h3>
             <p className="text-sm leading-relaxed mb-6">
                The Gemini API rate limits are approaching 80% capacity. Consider upgrading to the Enterprise Tier for unrestricted Indian language scaling.
             </p>
             <button className="w-full py-3 bg-brand-green rounded-xl font-bold hover:scale-105 transition-transform">
               Upgrade Pipeline
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, delta }: { icon: React.ReactNode, label: string, value: string, delta: string }) {
  const isUp = delta.startsWith('+');
  return (
    <div className="glass-card p-8 rounded-[32px] flex flex-col items-center">
      <div className="p-3 bg-slate-50 rounded-2xl mb-4">{icon}</div>
      <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{label}</div>
      <div className="text-3xl font-display font-black text-slate-900 mb-2">{value}</div>
      <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        {delta}
      </div>
    </div>
  );
}

function UsageProgress({ label, percentage, color }: { label: string, percentage: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="text-slate-400">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function FeedbackItem({ user, text, time }: { user: string, text: string, time: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-slate-900 uppercase">{user}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase">{time}</span>
      </div>
      <p className="text-sm text-slate-600 italic">"{text}"</p>
    </div>
  );
}
