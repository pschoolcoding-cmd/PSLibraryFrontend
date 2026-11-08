import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BookOpen,
  Search,
  ScanLine,
  PlusCircle,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reader, logout, isAuthenticated, isAdmin, canAccessAdminPanel } = useAuth();
  const { isDay, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const getRoleBadge = (role) => {
    if (role === 'superadmin')
      return (
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 border border-purple-500/30">
          Super Admin
        </span>
      );
    if (role === 'admin')
      return (
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
          Admin
        </span>
      );
    if (role === 'subadmin')
      return (
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
          Subadmin
        </span>
      );
    return (
      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
        Reader
      </span>
    );
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] bg-[var(--bg-navbar)] backdrop-blur-xl border-b border-[var(--border-color)] px-4 sm:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary-subtle)] border border-[var(--border-color)] flex items-center justify-center group-hover:border-[var(--accent-primary)] transition-all">
            <BookOpen className="w-4 h-4 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-[Outfit] font-black tracking-tight text-lg uppercase text-[var(--text-primary)] italic">
            PS Library
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 rounded-xl">
          <button
            onClick={() => navigate('/search')}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              isActive('/search') || isActive('/catalog')
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Browse Catalog
          </button>

          <button
            onClick={() => navigate('/scan')}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              isActive('/scan')
                ? 'bg-[var(--accent-teal)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            Scanner
          </button>

          {canAccessAdminPanel && (
            <>
              <button
                onClick={() => navigate('/admin')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  isActive('/admin') || isActive('/admin/panel')
                    ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin Panel
              </button>

              {isAdmin && (
                <button
                  onClick={() => navigate('/admin/genres')}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                    isActive('/admin/genres') || isActive('/genres')
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Genres
                </button>
              )}

              <button
                onClick={() => navigate('/add')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  isActive('/add')
                    ? 'bg-[var(--accent-teal)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Book
              </button>
            </>
          )}
        </div>

        {/* Right Section: Global Theme Switcher + Auth State */}
        <div className="flex items-center gap-2.5">
          {/* Day / Night Mode Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all cursor-pointer"
            title={isDay ? 'Switch to Night Mode (Dark Navy)' : 'Switch to Day Mode (Crisp Slate)'}
          >
            {isDay ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span className="hidden sm:inline">Night</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Day</span>
              </>
            )}
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <img
                  src={
                    reader?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      reader?.name || 'Reader'
                    )}`
                  }
                  alt={reader?.name}
                  className="w-7 h-7 rounded-lg object-cover border border-[var(--border-color)]"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      reader?.name || 'R'
                    )}`;
                  }}
                />
                <span className="hidden sm:inline-block text-xs font-bold text-[var(--text-primary)] font-[Outfit]">
                  {reader?.name || 'Reader'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1 flex items-center justify-between">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate font-[Outfit]">
                          {reader?.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">
                          {reader?.email}
                        </p>
                      </div>
                      {getRoleBadge(reader?.role)}
                    </div>

                    {canAccessAdminPanel && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2.5 mb-1 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[var(--accent-primary)]" />
                        Admin Console
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/account');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[var(--accent-teal)]" />
                      Account Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all flex items-center gap-2.5 mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
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
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3.5 py-2 rounded-lg transition-all hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-color)] cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => navigate('/signup')}
                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-extrabold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
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
