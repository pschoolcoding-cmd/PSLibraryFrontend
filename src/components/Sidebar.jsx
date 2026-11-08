import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Bookmark,
  User,
  Type,
  FileText,
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
  { id: 'books', label: 'Books', icon: Book },
  { id: 'hot', label: 'Hot Books', icon: Flame },
  { id: 'downloaded', label: 'Downloaded / Borrowed', icon: ArrowDownCircle },
  { id: 'top-rated', label: 'Top Rated Books', icon: Star },
  { id: 'read', label: 'Read Books', icon: Eye },
  { id: 'unread', label: 'Unread Books', icon: EyeOff },
  { id: 'discover', label: 'Discover (Random)', icon: Shuffle }
];

export const TAXONOMY_ITEMS = [
  { id: 'categories', label: 'Categories', icon: Inbox },
  { id: 'authors', label: 'Authors', icon: User },
  { id: 'ratings', label: 'Ratings (1–5 stars)', icon: Star },
  { id: 'books-list', label: 'Books List', icon: List }
];

export default function Sidebar({
  activeSection = 'books',
  onSelectSection,
  activeShelf = null,
  onSelectShelf
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    shelves,
    createShelf,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    language,
    setLanguage
  } = useTheme();

  const [creatingShelf, setCreatingShelf] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleNavClick = (sectionId) => {
    if (onSelectSection) {
      onSelectSection(sectionId);
    } else {
      navigate(`/?section=${encodeURIComponent(sectionId)}`);
    }
    setMobileSidebarOpen(false);
  };

  const handleShelfClick = (shelf) => {
    if (onSelectShelf) {
      onSelectShelf(shelf.name);
    } else if (onSelectSection) {
      onSelectSection(`shelf:${shelf.name}`);
    } else {
      navigate(`/?shelf=${encodeURIComponent(shelf.name)}`);
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
            BROWSE
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
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] rounded transition-colors cursor-pointer text-left border-l-2 ${isSelected
                        ? 'font-semibold cw-text-primary bg-[var(--bg-active)] border-[var(--accent-primary)]'
                        : 'font-normal cw-text-secondary hover:cw-text-primary hover:bg-[var(--bg-hover)] border-transparent'
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* TAXONOMY SECTION */}
        <div>
          <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider cw-text-muted">
            TAXONOMY
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
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] rounded transition-colors cursor-pointer text-left border-l-2 ${isSelected
                        ? 'font-semibold cw-text-primary bg-[var(--bg-active)] border-[var(--accent-primary)]'
                        : 'font-normal cw-text-secondary hover:cw-text-primary hover:bg-[var(--bg-hover)] border-transparent'
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* SHELVES SECTION */}
        <div className="pt-2 border-t cw-border">
          <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider cw-text-muted">
            SHELVES
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
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13px] rounded transition-colors cursor-pointer text-left border-l-2 ${isSelected
                        ? 'font-semibold cw-text-primary bg-[var(--bg-active)] border-[var(--accent-teal)]'
                        : 'font-normal cw-text-secondary hover:cw-text-primary hover:bg-[var(--bg-hover)] border-transparent'
                      }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FolderHeart className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{shelf.name}</span>
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
                <span>Create a Shelf</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCreateShelfSubmit}
              className="p-2 rounded cw-surface space-y-2 mx-1"
            >
              <label className="block text-[11px] font-semibold cw-text-secondary">
                New Shelf Name
              </label>
              <input
                type="text"
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="e.g. Grade 11 Physics"
                autoFocus
                className="cw-input w-full text-xs py-1 px-2"
              />
              <div className="flex items-center gap-1.5">
                <button type="submit" className="cw-btn-teal flex-1 py-1 text-[11px]">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingShelf(false);
                    setNewShelfName('');
                  }}
                  className="cw-btn py-1 px-2 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Mobile-Only Utility Shortcuts */}
        <div className="lg:hidden pt-3 border-t cw-border space-y-2">
          <div className="px-2.5 text-[11px] font-semibold uppercase tracking-wider cw-text-muted">
            LIBRARY TOOLS
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
              <span>Upload</span>
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
              <span>Tasks</span>
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
              <span>Settings</span>
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
              <span>Admin</span>
            </button>
          </div>

          <div className="px-1 pt-1 flex items-center justify-between">
            <span className="text-[11px] cw-text-muted font-medium">Language:</span>
            <div className="flex items-center gap-1">
              {['UZ', 'RU', 'EN'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 text-[11px] rounded border ${language === lang
                      ? 'cw-btn-primary'
                      : 'cw-btn'
                    }`}
                >
                  {lang}
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
          <span>About</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Persistent Desktop Left Sidebar */}
      <aside className="hidden lg:block w-56 xl:w-60 shrink-0 cw-sidebar min-h-[calc(100vh-3.5rem)]">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
          {renderSidebarContent()}
        </div>
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
                Catalog Navigation
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
                About PS Library (Calibre-Web Edition)
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
              <p>
                <strong>PS School Library Management System</strong> provides an academic digital
                catalog inspired by Calibre-Web for indexing holdings, tracking student loans,
                organizing canonical genres, and curating curriculum shelves.
              </p>
              <div className="cw-secondary-bg border cw-border rounded p-3 font-mono text-[11px] space-y-1">
                <div>Catalog Engine: Calibre-Web UI v2.5</div>
                <div>Languages Supported: O&apos;zbek (UZ) • Русский (RU) • English (EN)</div>
                <div>Formats Indexed: EPUB, PDF, MOBI, FB2, Physical Holdings</div>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t cw-border">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="cw-btn-primary px-4 py-1.5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

