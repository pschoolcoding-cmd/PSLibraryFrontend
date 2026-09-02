import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookHero from '../components/BookHero';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Search, ScanLine, BookOpen, Sparkles, Layers, ShieldCheck, ArrowUpRight, UserCheck, BookmarkCheck, Library, Tag } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [stats, setStats] = useState({
    totalBooks: 0,
    uniqueTitles: 0,
    totalReaders: 0,
    activeBorrows: 0,
    categoriesCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/books/stats`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY || 'supersecret' }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch real stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [API_BASE_URL]);

  return (
    <div className="w-full bg-[#030303] text-white overflow-x-clip">
      <Navbar />

      {/* 3D BOOK PROLOGUE HERO SECTION */}
      <BookHero title="THE LIBRARY CHRONICLES" />

      {/* ADDITIONAL FEATURES SECTION */}
      <section className="relative z-50 bg-black min-h-screen py-24 sm:py-32 px-6 border-t border-gray-900">
        {/* Decorative Grid Lines Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-50" />
        <div className="absolute inset-0 bg-radial-gradient from-blue-900/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header Introduction */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="w-fit mx-auto px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
              <Sparkles className="w-3 h-3" />
              Advanced Inventory System
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent uppercase italic tracking-tighter font-[Outfit] leading-none">
              A Complete Literary Ecosystem
            </h2>
            
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Our library system bridges the gap between classic volumes and state-of-the-art catalog tracking. Manage holdings, discover editions, and scan barcode IDs seamlessly.
            </p>
          </div>

          {/* REAL DYNAMIC SYSTEM STATS STRIP */}
          <div className="mb-20 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#0b0b0f] border border-blue-500/20 p-5 rounded-3xl text-center space-y-2 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-[Outfit] text-white">
                {loadingStats ? '...' : stats.totalBooks}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Book Copies</p>
            </div>

            <div className="bg-[#0b0b0f] border border-violet-500/20 p-5 rounded-3xl text-center space-y-2 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/40 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500" />
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
                <Library className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-[Outfit] text-white">
                {loadingStats ? '...' : stats.uniqueTitles}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unique Titles</p>
            </div>

            <div className="bg-[#0b0b0f] border border-emerald-500/20 p-5 rounded-3xl text-center space-y-2 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-[Outfit] text-white">
                {loadingStats ? '...' : stats.totalReaders}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Readers</p>
            </div>

            <div className="bg-[#0b0b0f] border border-amber-500/20 p-5 rounded-3xl text-center space-y-2 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-[Outfit] text-white">
                {loadingStats ? '...' : stats.activeBorrows}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Books Checked Out</p>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[#0b0b0f] border border-rose-500/20 p-5 rounded-3xl text-center space-y-2 backdrop-blur-xl relative overflow-hidden group hover:border-rose-500/40 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <Tag className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-[Outfit] text-white">
                {loadingStats ? '...' : stats.categoriesCount}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Genres & Topics</p>
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            
            {/* Card 1: Catalog Search */}
            <div className="group bg-[#0d0d0d] hover:bg-[#121212] border border-gray-800/80 hover:border-blue-500/30 p-8 rounded-[2.5rem] transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-blue-600/10" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
                  <Search className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold font-[Outfit] text-white uppercase italic tracking-tight mb-3">
                  Catalog Search
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Search library holdings by author, book titles, or curated category tags. Employs ultra-fast database aggregation systems for immediate results.
                </p>
              </div>
              <button 
                onClick={() => navigate('/search')}
                className="mt-8 flex items-center gap-2 text-xs font-black uppercase text-blue-400 group-hover:text-blue-300 transition-colors w-fit"
              >
                Launch Catalog
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Card 2: Barcode Scanning */}
            <div className="group bg-[#0d0d0d] hover:bg-[#121212] border border-gray-800/80 hover:border-violet-500/30 p-8 rounded-[2.5rem] transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-violet-600/10" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-6">
                  <ScanLine className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold font-[Outfit] text-white uppercase italic tracking-tight mb-3">
                  Barcode Scanner
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Scan book barcodes or custom RFID labels directly utilizing user-facing camera feeds relative to ISBN reference lookups.
                </p>
              </div>
              <button 
                onClick={() => navigate('/scan')}
                className="mt-8 flex items-center gap-2 text-xs font-black uppercase text-violet-400 group-hover:text-violet-300 transition-colors w-fit"
              >
                Scan Barcode
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Card 3: Gated based on isAdmin */}
            {isAdmin ? (
              <div className="group bg-[#0d0d0d] hover:bg-[#121212] border border-gray-800/80 hover:border-emerald-500/30 p-8 rounded-[2.5rem] transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-emerald-600/10" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                    <Layers className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold font-[Outfit] text-white uppercase italic tracking-tight mb-3">
                    Inventory Management
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Easily register newly acquired books, audit page copy logs, check-in borrowed sheets and review catalog numbers.
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/add')}
                  className="mt-8 flex items-center gap-2 text-xs font-black uppercase text-emerald-400 group-hover:text-emerald-300 transition-colors w-fit"
                >
                  Add New Book
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="group bg-[#0d0d0d] hover:bg-[#121212] border border-gray-800/80 hover:border-emerald-500/30 p-8 rounded-[2.5rem] transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-emerald-600/10" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                    <BookmarkCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold font-[Outfit] text-white uppercase italic tracking-tight mb-3">
                    Reader Account & Loans
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Track your active borrowed books, check loan return dates, view saved favorites, and manage your reader profile.
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/account')}
                  className="mt-8 flex items-center gap-2 text-xs font-black uppercase text-emerald-400 group-hover:text-emerald-300 transition-colors w-fit"
                >
                  View My Account
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            )}

          </div>

          {/* Call-to-action Block */}
          <div className="bg-radial from-gray-900/40 to-black/80 border border-gray-850 p-8 sm:p-12 rounded-[3rem] text-center max-w-4xl mx-auto space-y-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-[Outfit] font-black uppercase italic">
              Digital Archiving Excellence
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Our library stack utilizes cryptographically secure ISBN lookups connected immediately with active shelf indexes.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => navigate('/search')}
                className="bg-white hover:bg-gray-100 text-black font-extrabold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-white/5 active:scale-95 text-sm uppercase tracking-wider"
              >
                Access Catalog Database
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-gray-950 py-12 text-center text-gray-600 text-xs">
        <p className="font-medium">© {new Date().getFullYear()} Grand Library Digital Archives. All systems operational.</p>
      </footer>
    </div>
  );
}
