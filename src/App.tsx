import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, 
  History, 
  Star, 
  User, 
  Menu, 
  X, 
  Home as HomeIcon,
  Mic,
  Camera,
  MessageSquare,
  Settings,
  HelpCircle,
  LogIn,
  LogOut,
  Bell
} from 'lucide-react';
import { auth, signInWithGoogle, signOut } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// Pages
import Home from './pages/Home';
import Translator from './pages/Translator';
import VoiceTranslator from './pages/VoiceTranslator';
import ConversationMode from './pages/Conversation';
import CameraTranslator from './pages/CameraTranslator';
import HistoryPage from './pages/History';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import AdminDashboard from './pages/Admin';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-app-bg">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white border-b border-app-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex justify-between h-20 items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-tr from-brand-saffron via-white to-brand-green rounded-full border-2 border-brand-navy shadow-sm group-hover:scale-105 transition-transform"></div>
                <span className="text-2xl font-display font-black tracking-tighter text-brand-navy">
                  BHARAT<span className="font-light opacity-60">TRANSLATE</span>
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8">
                <NavLink to="/translate" label="Translate" />
                <NavLink to="/voice" label="Voice" />
                <NavLink to="/conversation" label="Conversation" />
                <NavLink to="/camera" label="Camera" />
                <NavLink to="/history" label="History" />
                
                <div className="flex items-center gap-2 bg-app-muted px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-tight opacity-70">Online • Low Data</span>
                </div>
                
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link to="/profile" className="w-10 h-10 bg-app-text rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity">
                      {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Link>
                  </div>
                ) : (
                  <button onClick={signInWithGoogle} className="btn-primary">
                    Sign In
                  </button>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center gap-4">
                {user && (
                   <Link to="/profile">
                     <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full" />
                   </Link>
                )}
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 bottom-0 w-72 bg-white z-[70] p-6 shadow-2xl md:hidden"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Bharat Translate</span>
                    <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full">
                      <X size={20} />
                    </button>
                  </div>

                  <MobileNavLink to="/" icon={<HomeIcon size={20} />} label="Home" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/translate" icon={<Languages size={20} />} label="Text Translate" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/voice" icon={<Mic size={20} />} label="Voice Translate" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/conversation" icon={<MessageSquare size={20} />} label="Conversation" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/camera" icon={<Camera size={20} />} label="Camera OCR" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/history" icon={<History size={20} />} label="History" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/favorites" icon={<Star size={20} />} label="Favorites" onClick={() => setIsMenuOpen(false)} />
                  
                  <div className="h-px bg-slate-100 my-2" />
                  
                  {user ? (
                    <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center gap-3 p-3 text-red-600 rounded-xl hover:bg-red-50 text-left font-medium">
                      <LogOut size={20} />
                      Sign Out
                    </button>
                  ) : (
                    <button onClick={() => { signInWithGoogle(); setIsMenuOpen(false); }} className="flex items-center gap-3 p-3 bg-brand-green text-white rounded-xl shadow-lg shadow-brand-green/20 font-medium">
                      <LogIn size={20} />
                      Sign In with Google
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/translate" element={<Translator user={user} />} />
            <Route path="/voice" element={<VoiceTranslator user={user} />} />
            <Route path="/conversation" element={<ConversationMode user={user} />} />
            <Route path="/camera" element={<CameraTranslator user={user} />} />
            <Route path="/history" element={<HistoryPage user={user} />} />
            <Route path="/favorites" element={<Favorites user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/admin" element={<AdminDashboard user={user} />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Languages className="text-brand-green w-6 h-6" />
                  <span className="text-white text-xl font-bold">Bharat Translate</span>
                </div>
                <p className="max-w-sm">
                  Breaking language barriers across India with AI-powered real-time translation for text, voice, and visual communication.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link to="/translate" className="hover:text-white transition-colors">Translator</Link></li>
                  <li><Link to="/voice" className="hover:text-white transition-colors">Voice Mod</Link></li>
                  <li><Link to="/camera" className="hover:text-white transition-colors">Camera OCR</Link></li>
                  <li><Link to="/help" className="hover:text-white transition-colors">Help & Support</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm">
              <p>© 2026 Bharat Translate. Locally made for Indian Citizens. 🇮🇳</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function NavLink({ to, label }: { to: string, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`nav-link ${isActive ? 'text-brand-saffron' : ''}`}>
      <span>{label}</span>
      {isActive && (
        <motion.div layoutId="nav-underline" className="absolute -bottom-7 left-0 right-0 h-0.5 bg-brand-saffron" />
      )}
    </Link>
  );
}

function MobileNavLink({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-brand-green/10 text-brand-green font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
    >
      {icon}
      {label}
    </Link>
  );
}
