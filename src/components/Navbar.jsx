import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, ScanLine, PlusCircle, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reader, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] bg-black/70 backdrop-blur-xl border-b border-gray-800/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center group-hover:border-blue-500 transition-all shadow-md shadow-blue-600/10">
            <BookOpen className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-[Outfit] font-black tracking-tight text-lg uppercase bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent group-hover:to-white transition-all italic">
            Grand Library
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5 bg-gray-900/60 border border-gray-800/80 p-1 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => navigate('/search')}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              isActive('/search')
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Browse Catalog
          </button>

          <button
            onClick={() => navigate('/scan')}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              isActive('/scan')
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            Scanner
          </button>

          <button
            onClick={() => navigate('/add')}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              isActive('/add')
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Book
          </button>
        </div>

        {/* Right Section: Auth State */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 bg-[#121212] hover:bg-[#181818] border border-gray-800 hover:border-blue-500/40 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl transition-all cursor-pointer shadow-lg"
              >
                <img
                  src={reader?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reader?.name || 'Reader')}`}
                  alt={reader?.name}
                  className="w-7 h-7 rounded-xl object-cover border border-blue-500/30 bg-blue-950/40"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reader?.name || 'R')}`;
                  }}
                />
                <span className="hidden sm:inline-block text-xs font-bold text-gray-200 font-[Outfit]">
                  {reader?.name || 'Reader'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#0f0f10] border border-gray-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-gray-800/80 mb-1">
                      <p className="text-xs font-bold text-white truncate font-[Outfit]">{reader?.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{reader?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/account');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-blue-600/10 hover:border-blue-500/20 border border-transparent transition-all flex items-center gap-2.5"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-400" />
                      Account Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent transition-all flex items-center gap-2.5 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-gray-300 hover:text-white px-3.5 py-2 rounded-xl transition-all hover:bg-white/5 border border-transparent hover:border-gray-800"
              >
                Sign In
              </button>

              <button
                onClick={() => navigate('/signup')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/30 hover:scale-[1.03] active:scale-95 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
