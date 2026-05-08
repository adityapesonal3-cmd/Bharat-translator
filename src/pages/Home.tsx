import React from 'react';
import { motion } from 'framer-motion';
import { Languages, Mic, Camera, ArrowRight, Shield, Zap, Globe, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="status-badge inline-flex mx-auto mb-8">
              <Sparkles size={14} className="text-brand-saffron" />
              <span>AI-Powered Indian Language Engine</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-display font-black text-app-text tracking-tighter leading-[0.9] mb-8">
              CONNECT INDIA,<br />
              <span className="opacity-40 uppercase">NO BARRIERS.</span>
            </h1>
            
            <p className="text-xl md:text-2xl font-medium text-app-text/60 max-w-3xl mx-auto mb-12 leading-tight">
              Bharat Translate uses advanced AI to help you communicate effortlessly in 13+ Indian languages. Modern, fast, and culturally expressive.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/translate" className="btn-primary text-sm px-10 py-5">
                Start Translating
              </Link>
              <Link to="/voice" className="btn-secondary text-sm px-10 py-5">
                Try Voice Mode
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-white border-t border-app-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40">Our Capabilities</h2>
            <div className="h-px flex-1 mx-8 bg-app-border"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <FeatureCard 
              icon={<Languages className="text-[#000080]" />}
              title="Smart Text"
              description="Contextual regional translation using Gemini AI."
              link="/translate"
              color="bg-blue-50"
            />
            <FeatureCard 
              icon={<Mic className="text-[#FF9933]" />}
              title="Voice Interpretation"
              description="Real-time spoken dialogue across dialects."
              link="/voice"
              color="bg-orange-50"
            />
            <FeatureCard 
              icon={<Sparkles className="text-brand-navy" />}
              title="Dialogue Mode"
              description="2-way real-time back and forth conversation."
              link="/conversation"
              color="bg-slate-100"
            />
            <FeatureCard 
              icon={<Camera className="text-[#138808]" />}
              title="Visual OCR"
              description="Instant visual scanning for signs and posters."
              link="/camera"
              color="bg-emerald-50"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="13+" label="Regional Languages" />
            <StatItem value="98%" label="AI Accuracy" />
            <StatItem value="1M+" label="Translations" />
            <StatItem value="0.5s" label="Avg. Response" />
          </div>
        </div>
      </section>

      {/* Languages Banner */}
      <section className="py-24 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-12">
            <Globe className="text-brand-navy mb-4" size={32} />
            <h2 className="text-3xl font-display font-bold">Supported Languages</h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese'].map((lang) => (
              <div key={lang} className="px-6 py-3 rounded-2xl bg-slate-100 font-medium text-slate-700 hover:bg-brand-navy hover:text-white transition-all cursor-default">
                {lang}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, link, color }: { icon: React.ReactNode, title: string, description: string, link: string, color: string }) {
  return (
    <Link to={link}>
      <motion.div 
        whileHover={{ y: -8 }}
        className="p-10 rounded-[40px] h-full border border-app-border hover:border-brand-saffron transition-all flex flex-col items-start bg-white shadow-sm"
      >
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-10`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 32 })}
        </div>
        <h3 className="text-2xl font-black text-app-text tracking-tighter mb-4 uppercase">{title}</h3>
        <p className="text-app-text/60 font-medium leading-tight mb-8 flex-1">{description}</p>
        <div className="text-[10px] uppercase font-black tracking-widest text-brand-saffron opacity-60 group-hover:opacity-100 transition-opacity">
          Launch Module +
        </div>
      </motion.div>
    </Link>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-display font-extrabold text-slate-900 mb-2">{value}</div>
      <div className="text-slate-500 font-medium">{label}</div>
    </div>
  );
}
