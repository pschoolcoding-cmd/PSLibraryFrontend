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
  Moon,
  Check
} from 'lucide-react';

const FlagIcon = ({ code, className = 'w-4 h-3 rounded-[2px] shrink-0 border border-black/10' }) => {
  if (code === 'uz') {
    return (
      <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
        <rect width="24" height="5" y="0" fill="#0099B5" />
        <rect width="24" height="0.6" y="5" fill="#CE1126" />
        <rect width="24" height="4.8" y="5.6" fill="#FFFFFF" />
        <rect width="24" height="0.6" y="10.4" fill="#CE1126" />
        <rect width="24" height="5" y="11" fill="#1EB53A" />
        <circle cx="4.5" cy="2.5" r="1.4" fill="#FFFFFF" />
        <circle cx="5" cy="2.5" r="1.15" fill="#0099B5" />
      </svg>
    );
  }
  if (code === 'ru') {
    return (
      <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
        <rect width="24" height="5.33" y="0" fill="#FFFFFF" />
        <rect width="24" height="5.33" y="5.33" fill="#0039A6" />
        <rect width="24" height="5.34" y="10.66" fill="#D52B1E" />
      </svg>
    );
  }
  // Default 'en' (UK Union Jack)
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#FFFFFF" strokeWidth="2.8" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M12,0 V16 M0,8 H24" stroke="#FFFFFF" strokeWidth="4.4" />
      <path d="M12,0 V16 M0,8 H24" stroke="#C8102E" strokeWidth="2.4" />
    </svg>
  );
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reader, logout, isAuthenticated, isAdmin, canAccessAdminPanel, canManageCirculation } = useAuth();
  const {
    isDay,
    toggleTheme,
    language,
    setLanguage,
    supportedLanguages,
    t
  } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const currentLangObj =
    supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  const getRoleBadge = (role) => {
    if (role === 'superadmin')
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-500 border border-purple-500/30">
          {t('nav.roles.superadmin', 'Super Admin')}
        </span>
      );
    if (role === 'librarian')
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          {t('nav.roles.librarian', 'Librarian')}
        </span>
      );
    if (role === 'admin')
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/15 text-rose-500 border border-rose-500/30">
          {t('nav.roles.admin', 'Admin')}
        </span>
      );
    if (role === 'subadmin')
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-500 border border-blue-500/30">
          {t('nav.roles.subadmin', 'Subadmin')}
        </span>
      );
    return (
      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
        {t('nav.roles.reader', 'Reader')}
      </span>
    );
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] bg-[var(--bg-navbar)] border-b border-[var(--border-color)] px-4 sm:px-8 py-2.5 transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-8 h-8 rounded bg-[var(--accent-primary-subtle)] border border-[var(--border-color)] flex items-center justify-center group-hover:border-[var(--accent-primary)] transition-colors">
            <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="font-bold tracking-tight text-base uppercase text-[var(--text-primary)]">
            {t('nav.brandName', 'PS Library')}
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 rounded">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              isActive('/search') || isActive('/catalog')
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('nav.browseCatalog', 'Browse Catalog')}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/scan')}
            className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              isActive('/scan')
                ? 'bg-[var(--accent-teal)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>{t('nav.scanner', 'Scanner')}</span>
          </button>

          {canAccessAdminPanel && (
            <>
              {canManageCirculation && (
                <button
                  type="button"
                  onClick={() => navigate('/admin?tab=taken-books')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    location.search.includes('tab=taken-books')
                      ? 'bg-[var(--accent-teal)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t('nav.takenBooks', 'Taken Books')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/admin')}
                className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive('/admin') || isActive('/admin/panel')
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t('nav.adminPanel', 'Admin Panel')}</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/genres')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive('/admin/genres') || isActive('/genres')
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('nav.aiGenres', 'AI Genres')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/add')}
                className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive('/add')
                    ? 'bg-[var(--accent-teal)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('nav.addBook', 'Add Book')}</span>
              </button>
            </>
          )}
        </div>

        {/* Right Section: Language Dropdown with Flags + Theme Switcher + Auth State */}
        <div className="flex items-center gap-2">
          {/* Compact Language Dropdown Menu with Flags */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition-colors cursor-pointer"
              aria-label={t('nav.languageLabel', 'Language')}
              title={t('nav.languageLabel', 'Language')}
            >
              <FlagIcon code={currentLangObj.code} />
              <span className="hidden sm:inline">{currentLangObj.label}</span>
              <span className="sm:hidden uppercase font-mono">{currentLangObj.short}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${
                  langDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-40 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded p-1 z-50 shadow-sm">
                  {supportedLanguages.map((langItem) => {
                    const isSelected = language === langItem.code;
                    return (
                      <button
                        key={langItem.code}
                        type="button"
                        onClick={() => {
                          setLanguage(langItem.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FlagIcon code={langItem.code} />
                          <span>{langItem.label}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Day / Night Mode Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-colors cursor-pointer"
            title={isDay ? t('nav.switchToNight') : t('nav.switchToDay')}
          >
            {isDay ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span className="hidden md:inline">{t('nav.nightMode', 'Night')}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">{t('nav.dayMode', 'Day')}</span>
              </>
            )}
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] p-1 sm:px-2.5 sm:py-1 rounded transition-colors cursor-pointer"
              >
                <img
                  src={
                    reader?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      reader?.name || 'Reader'
                    )}`
                  }
                  alt={reader?.name}
                  className="w-6 h-6 rounded object-cover border border-[var(--border-color)]"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      reader?.name || 'R'
                    )}`;
                  }}
                />
                <span className="hidden xl:inline-block text-xs font-bold text-[var(--text-primary)]">
                  {reader?.name || t('nav.roles.reader', 'Reader')}
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
                  <div className="absolute right-0 mt-2 w-60 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded p-2 z-50 shadow-sm">
                    <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1 flex items-center justify-between">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
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
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left px-3 py-2 rounded text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2.5 mb-1 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[var(--accent-primary)]" />
                        <span>{t('nav.adminConsole', 'Admin Console')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/account');
                      }}
                      className="w-full text-left px-3 py-2 rounded text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[var(--accent-teal)]" />
                      <span>{t('nav.accountDashboard', 'Account Dashboard')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 rounded text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-2.5 mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>{t('nav.signOut', 'Sign Out')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded transition-colors hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-color)] cursor-pointer"
              >
                {t('nav.signIn', 'Sign In')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="cw-btn-primary px-3 py-1.5 text-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav.signUp', 'Sign Up')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
