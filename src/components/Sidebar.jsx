import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Book,
  Flame,
  ArrowDownCircle,
  Star,
  Eye,
  EyeOff,
  Shuffle,
  Inbox,
  User,
  List,
  FolderHeart,
  Plus,
  Info,
  X,
  Upload,
  ListChecks,
  Settings,
  Shield
} from 'lucide-react';

export const BROWSE_ITEMS = [
  { id: 'books', labelKey: 'sidebar.books', label: 'Books', icon: Book },
  { id: 'hot', labelKey: 'sidebar.hot', label: 'Hot Books', icon: Flame },
  { id: 'downloaded', labelKey: 'sidebar.downloaded', label: 'Downloaded / Borrowed', icon: ArrowDownCircle },
  { id: 'top-rated', labelKey: 'sidebar.topRated', label: 'Top Rated Books', icon: Star },
  { id: 'read', labelKey: 'sidebar.read', label: 'Read Books', icon: Eye },
  { id: 'unread', labelKey: 'sidebar.unread', label: 'Unread Books', icon: EyeOff },
  { id: 'discover', labelKey: 'sidebar.discover', label: 'Discover (Random)', icon: Shuffle }
];

export const TAXONOMY_ITEMS = [
  { id: 'categories', labelKey: 'sidebar.categories', label: 'Categories', icon: Inbox },
  { id: 'authors', labelKey: 'sidebar.authors', label: 'Authors', icon: User },
  { id: 'ratings', labelKey: 'sidebar.ratings', label: 'Ratings (1–5 stars)', icon: Star },
  { id: 'books-list', labelKey: 'sidebar.booksList', label: 'Books List', icon: List }
];

export default function Sidebar({
  activeSection = 'books',
  onSelectSection,
  activeShelf = null,
  onSelectShelf
}) {
  const navigate = useNavigate();
  const {
    shelves,
    createShelf,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    language,
    setLanguage,
    supportedLanguages,
    t,
    translateShelf
  } = useTheme();

  const [creatingShelf, setCreatingShelf] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleNavClick = (sectionId) => {
    if (onSelectSection) {
      onSelectSection(sectionId);
    } else {
      navigate(`/search?section=${encodeURIComponent(sectionId)}`);
    }
    setMobileSidebarOpen(false);
  };

  const handleShelfClick = (shelf) => {
    if (onSelectShelf) {
      onSelectShelf(shelf.name);
    } else if (onSelectSection) {
      onSelectSection(`shelf:${shelf.name}`);
    } else {
      navigate(`/search?shelf=${encodeURIComponent(shelf.name)}`);
    }
    setMobileSidebarOpen(false);
  };

  const handleCreateShelfSubmit = (e) => {
    e.preventDefault();
    const created = createShelf(newShelfName);
    if (created) {
      setNewShelfName('');
      setCreatingShelf(false);
      handleShelfClick(created);
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between py-4 px-3 select-none overflow-y-auto">
      <div className="space-y-5">
        {/* BROWSE SECTION */}
        <div>
          <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider cw-text-muted">
            {t('sidebar.browseHeader', 'BROWSE')}
          </div>
          <ul className="space-y-0.5">
            {BROWSE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = !activeShelf && activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] rounded transition-colors cursor-pointer text-left border-l-2 ${
                      isSelected
                        ? 'font-semibold cw-text-primary bg-[var(--bg-active)] border-[var(--accent-primary)]'
                        : 'font-normal cw-text-secondary hover:cw-text-primary hover:bg-[var(--bg-hover)] border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t(item.labelKey, item.label)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* TAXONOMY SECTION */}
        <div>
          <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider cw-text-muted">
            {t('sidebar.taxonomyHeader', 'TAXONOMY')}
          </div>
          <ul className="space-y-0.5">
            {TAXONOMY_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = !activeShelf && activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] rounded transition-colors cursor-pointer text-left border-l-2 ${
                      isSelected
                        ? 'font-semibold cw-text-primary bg-[var(--bg-active)] border-[var(--accent-primary)]'
                        : 'font-normal cw-text-secondary hover:cw-text-primary hover:bg-[var(--bg-hover)] border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t(item.labelKey, item.label)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* SHELVES SECTION */}
        <div className="pt-2 border-t cw-border">
          <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider cw-text-muted">
            {t('sidebar.shelvesHeader', 'SHELVES')}
          </div>

          <ul className="space-y-0.5 mb-3">
            {shelves.map((shelf) => {
              const isSelected =
                activeShelf === shelf.name || activeSection === `shelf:${shelf.name}`;
              return (
                <li key={shelf.id}>
                  <button
                    type="button"
                    onClick={() => handleShelfClick(shelf)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13px] rounded transition-colors cursor-pointer text-left border-l-2 ${
                      isSelected
                        ? 'font-semibold cw-text-primary bg-[var(--bg-active)] border-[var(--accent-teal)]'
                        : 'font-normal cw-text-secondary hover:cw-text-primary hover:bg-[var(--bg-hover)] border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FolderHeart className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{translateShelf(shelf.name)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* + Create a Shelf Action */}
          {!creatingShelf ? (
            <div className="px-1">
              <button
                type="button"
                onClick={() => setCreatingShelf(true)}
                className="cw-btn-teal w-full py-2 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('sidebar.createShelf', 'Create a Shelf')}</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCreateShelfSubmit}
              className="p-2 rounded cw-surface space-y-2 mx-1"
            >
              <label className="block text-[11px] font-semibold cw-text-secondary">
                {t('sidebar.newShelfName', 'New Shelf Name')}
              </label>
              <input
                type="text"
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder={t('sidebar.shelfPlaceholder', 'e.g. Grade 11 Physics')}
                autoFocus
                className="cw-input w-full text-xs py-1 px-2"
              />
              <div className="flex items-center gap-1.5">
                <button type="submit" className="cw-btn-teal flex-1 py-1 text-[11px]">
                  {t('sidebar.save', 'Save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingShelf(false);
                    setNewShelfName('');
                  }}
                  className="cw-btn py-1 px-2 text-[11px]"
                >
                  {t('sidebar.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Mobile-Only Utility Shortcuts */}
        <div className="lg:hidden pt-3 border-t cw-border space-y-2">
          <div className="px-2.5 text-[11px] font-semibold uppercase tracking-wider cw-text-muted">
            {t('sidebar.libraryTools', 'LIBRARY TOOLS')}
          </div>
          <div className="grid grid-cols-2 gap-1.5 px-1">
            <button
              type="button"
              onClick={() => {
                setMobileSidebarOpen(false);
                navigate('/add');
              }}
              className="cw-btn text-xs py-1.5 justify-start"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t('nav.addBook', 'Add Book')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileSidebarOpen(false);
                navigate('/admin/genres');
              }}
              className="cw-btn text-xs py-1.5 justify-start"
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>{t('nav.aiGenres', 'AI Genres')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileSidebarOpen(false);
                navigate('/account');
              }}
              className="cw-btn text-xs py-1.5 justify-start"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t('nav.accountDashboard', 'Account')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileSidebarOpen(false);
                navigate('/admin');
              }}
              className="cw-btn text-xs py-1.5 justify-start"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t('nav.adminPanel', 'Admin')}</span>
            </button>
          </div>

          <div className="px-1 pt-1 flex items-center justify-between">
            <span className="text-[11px] cw-text-muted font-medium">
              {t('nav.languageLabel', 'Language')}:
            </span>
            <div className="flex items-center gap-1">
              {supportedLanguages.map((langItem) => (
                <button
                  key={langItem.code}
                  type="button"
                  onClick={() => setLanguage(langItem.code)}
                  className={`px-2 py-0.5 text-[11px] rounded border ${
                    language === langItem.code ? 'cw-btn-primary' : 'cw-btn'
                  }`}
                >
                  {langItem.short}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom About Link (Calibre-Web Footer item) */}
      <div className="pt-4 mt-4 border-t cw-border">
        <button
          type="button"
          onClick={() => setShowAboutModal(true)}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] cw-text-secondary hover:cw-text-primary rounded hover:bg-[var(--bg-hover)] cursor-pointer text-left"
        >
          <Info className="w-4 h-4 shrink-0" />
          <span>{t('sidebar.about', 'About')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Persistent Desktop Left Sidebar */}
      <aside className="hidden lg:block w-56 xl:w-60 shrink-0 cw-sidebar min-h-[calc(100vh-3.5rem)]">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">{renderSidebarContent()}</div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] cw-sidebar h-full z-10 flex flex-col">
            <div className="flex items-center justify-between px-4 h-12 border-b cw-border">
              <span className="font-bold text-xs uppercase tracking-wider cw-text-secondary">
                {t('sidebar.catalogNavigation', 'Catalog Navigation')}
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="cw-btn p-1"
                aria-label="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderSidebarContent()}</div>
          </aside>
        </div>
      )}

      {/* Calibre-Web About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="cw-surface max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b cw-border pb-3">
              <h3 className="font-bold text-sm cw-text-primary flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>{t('sidebar.aboutTitle', 'About PS Library (Calibre-Web Edition)')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="cw-btn p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs cw-text-secondary space-y-2 leading-relaxed">
              <p>{t('sidebar.aboutDescription')}</p>
              <div className="cw-secondary-bg border cw-border rounded p-3 font-mono text-[11px] space-y-1">
                <div>Catalog Engine: Calibre-Web UI v2.5 + Dual-Script Search</div>
                <div>Languages: O‘zbekcha (uz) • Русский (ru) • English (en)</div>
                <div>Transliteration: Oʻzbek Lotin ↔ Кирилл • Русский • English</div>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t cw-border">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="cw-btn-primary px-4 py-1.5 text-xs"
              >
                {t('sidebar.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
