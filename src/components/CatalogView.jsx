import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar, { BROWSE_ITEMS, TAXONOMY_ITEMS } from './Sidebar';
import BookCard from './BookCard';
import { useTheme } from '../context/ThemeContext';
import { createBookCoverSvg } from '../data/mockBooks';
import { matchesDualScript, matchesBookQuery } from '../utils/searchEngine';
import {
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  ArrowDownAZ,
  ArrowUpZA,
  UserCheck,
  Star,
  Shuffle,
  X,
  ExternalLink,
  RotateCcw,
  Search as SearchIcon
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizeBook = (raw, idx = 0) => {
  const title = raw.name || raw.title || 'Untitled Volume';
  const author = raw.author || 'Unknown Author';
  let genres = [];
  if (Array.isArray(raw.genre)) {
    genres = raw.genre
      .map((g) => String(g).replace(/^#+/, '').replace(/_/g, ' ').trim())
      .filter(Boolean);
  } else if (typeof raw.genre === 'string' && raw.genre.trim()) {
    genres = raw.genre
      .split(/[,#]/)
      .map((g) => g.replace(/_/g, ' ').trim())
      .filter(Boolean);
  }
  if (genres.length === 0) genres = ['General Literature'];

  const rating =
    typeof raw.rating === 'number'
      ? Math.min(5, Math.max(1, Math.round(raw.rating)))
      : (title.length + idx) % 2 === 0
      ? 5
      : 4;

  const publishedYear =
    raw.publishedYear ||
    (raw.whentaken && /\b(19|20)\d{2}\b/.test(raw.whentaken)
      ? parseInt(raw.whentaken.match(/\b(19|20)\d{2}\b/)[0], 10)
      : 2020 - (idx % 15));

  const dateAdded =
    raw.dateAdded || raw.createdAt || `2026-10-${String(10 + (idx % 20)).padStart(2, '0')}`;
  const formats =
    Array.isArray(raw.formats) && raw.formats.length > 0 ? raw.formats : ['EPUB', 'PDF'];
  const shelves = Array.isArray(raw.shelves) ? raw.shelves : [];
  const isBorrowed =
    raw.borrowed &&
    String(raw.borrowed) !== '0' &&
    String(raw.borrowed).toLowerCase() !== 'available' &&
    String(raw.borrowed).trim() !== '';

  return {
    ...raw,
    _id: raw._id || raw.bid || `book-${idx}`,
    bid: raw.bid || `9780000000${String(idx).padStart(3, '0')}-1`,
    name: title,
    author,
    language: raw.language || 'EN',
    genre: genres,
    genres,
    series: raw.series || 'Standard Library Collection',
    publisher: raw.publisher || 'Academic Press',
    publishedYear,
    dateAdded,
    rating,
    formats,
    shelves,
    borrowed: isBorrowed ? raw.borrowed : '0',
    isRead: typeof raw.isRead === 'boolean' ? raw.isRead : idx % 2 === 0,
    isHot: typeof raw.isHot === 'boolean' ? raw.isHot : rating === 5
  };
};

export default function CatalogView({ initialSection = 'books' }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, translateCategory, translateShelf } = useTheme();

  const urlQuery = searchParams.get('q') || '';
  const urlSection = searchParams.get('section') || initialSection;
  const urlShelf = searchParams.get('shelf') || null;

  const [activeSection, setActiveSection] = useState(urlSection);
  const [activeShelf, setActiveShelf] = useState(urlShelf);
  const [viewMode, setViewMode] = useState(urlSection === 'books-list' ? 'table' : 'grid');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedTaxonomyValue, setSelectedTaxonomyValue] = useState('');
  const [randomSeed, setRandomSeed] = useState(1);

  // Quick search term
  const [quickSearch, setQuickSearch] = useState(urlQuery);

  // Live API books only (no demo books)
  const [apiBooks, setApiBooks] = useState([]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const sec = searchParams.get('section');
    const sh = searchParams.get('shelf');
    setQuickSearch(q);
    if (sh) {
      setActiveShelf(sh);
      setActiveSection(`shelf:${sh}`);
    } else if (sec) {
      setActiveShelf(null);
      setActiveSection(sec);
      if (sec === 'books-list') setViewMode('table');
    }
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;
    const fetchLiveBooks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/books?limit=1000`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' }
        });
        if (!res.ok) return;
        const result = await res.json();
        const list = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
          ? result
          : [];
        if (!ignore) {
          setApiBooks(list.map((b, i) => normalizeBook(b, i)));
        }
      } catch {
        // Backend unreachable
      }
    };
    fetchLiveBooks();
    return () => {
      ignore = true;
    };
  }, []);

  const allBooks = apiBooks;

  // Taxonomy values for the active taxonomy section
  const taxonomyOptions = useMemo(() => {
    const counts = new Map();
    const bump = (key) => {
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    };

    allBooks.forEach((b) => {
      if (activeSection === 'categories') {
        (b.genre || []).forEach(bump);
      } else if (activeSection === 'series') {
        bump(b.series);
      } else if (activeSection === 'authors') {
        bump(b.author);
      } else if (activeSection === 'publishers') {
        bump(b.publisher);
      } else if (activeSection === 'ratings') {
        bump(`${b.rating} Stars`);
      } else if (activeSection === 'formats') {
        (b.formats || []).forEach(bump);
      }
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allBooks, activeSection]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let list = [...allBooks];

    // 1. Shelf filter
    if (activeShelf) {
      list = list.filter((b) => (b.shelves || []).includes(activeShelf));
    } else {
      // 2. Browse / Taxonomy section filter
      switch (activeSection) {
        case 'hot':
          list = list.filter((b) => b.isHot || (b.downloads && b.downloads >= 120));
          break;
        case 'downloaded':
          list = list.filter((b) => b.borrowed && String(b.borrowed) !== '0');
          break;
        case 'top-rated':
          list = list.filter((b) => (b.rating || 0) >= 5);
          break;
        case 'read':
          list = list.filter((b) => b.isRead);
          break;
        case 'unread':
          list = list.filter((b) => !b.isRead);
          break;
        case 'discover': {
          list = [...list].sort((a, b) => {
            const hashA = (a._id.charCodeAt(a._id.length - 1) * 31 + randomSeed * 17) % 97;
            const hashB = (b._id.charCodeAt(b._id.length - 1) * 31 + randomSeed * 17) % 97;
            return hashA - hashB;
          });
          break;
        }
        case 'categories':
          if (selectedTaxonomyValue) {
            list = list.filter((b) => (b.genre || []).includes(selectedTaxonomyValue));
          }
          break;
        case 'series':
          if (selectedTaxonomyValue) {
            list = list.filter((b) => b.series === selectedTaxonomyValue);
          }
          break;
        case 'authors':
          if (selectedTaxonomyValue) {
            list = list.filter((b) => matchesDualScript(b.author, selectedTaxonomyValue));
          }
          break;
        case 'publishers':
          if (selectedTaxonomyValue) {
            list = list.filter((b) => b.publisher === selectedTaxonomyValue);
          }
          break;
        case 'ratings':
          if (selectedTaxonomyValue) {
            const targetStars = parseInt(selectedTaxonomyValue, 10);
            if (!isNaN(targetStars)) {
              list = list.filter((b) => b.rating === targetStars);
            }
          }
          break;
        case 'formats':
          if (selectedTaxonomyValue) {
            list = list.filter((b) => (b.formats || []).includes(selectedTaxonomyValue));
          }
          break;
        default:
          break;
      }
    }

    // 3. Dual-Script Quick Search filter
    if (quickSearch.trim()) {
      list = list.filter((b) => matchesBookQuery(b, quickSearch, 'all'));
    }

    // 4. Sorting
    if (activeSection !== 'discover' || sortBy !== 'date-desc') {
      list.sort((a, b) => {
        switch (sortBy) {
          case 'title-asc':
            return a.name.localeCompare(b.name);
          case 'title-desc':
            return b.name.localeCompare(a.name);
          case 'author-asc':
            return a.author.localeCompare(b.author);
          case 'author-desc':
            return b.author.localeCompare(a.author);
          case 'date-asc':
            return String(a.dateAdded).localeCompare(String(b.dateAdded));
          case 'date-desc':
            return String(b.dateAdded).localeCompare(String(a.dateAdded));
          case 'rating-desc':
            return (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name);
          case 'rating-asc':
            return (a.rating || 0) - (b.rating || 0) || a.name.localeCompare(b.name);
          case 'year-desc':
            return (b.publishedYear || 0) - (a.publishedYear || 0);
          case 'year-asc':
            return (a.publishedYear || 0) - (b.publishedYear || 0);
          default:
            return 0;
        }
      });
    }

    return list;
  }, [
    allBooks,
    activeShelf,
    activeSection,
    selectedTaxonomyValue,
    randomSeed,
    quickSearch,
    sortBy
  ]);

  const handleSelectSection = (sectionId) => {
    setActiveShelf(null);
    setActiveSection(sectionId);
    setSelectedTaxonomyValue('');
    if (sectionId === 'books-list') {
      setViewMode('table');
    } else if (viewMode === 'table' && sectionId === 'books') {
      setViewMode('grid');
    }
    if (sectionId === 'discover') {
      setRandomSeed((s) => s + 1);
    }
  };

  const handleSelectShelf = (shelfName) => {
    setActiveShelf(shelfName);
    setActiveSection(`shelf:${shelfName}`);
    setSelectedTaxonomyValue('');
  };

  const handleResetFilters = () => {
    setQuickSearch('');
    setSelectedTaxonomyValue('');
    setSearchParams({});
  };

  const sectionHeading = useMemo(() => {
    if (activeShelf) return `${t('catalog.chips.shelf', 'Shelf')}: ${translateShelf(activeShelf)}`;
    const browseMatch = BROWSE_ITEMS.find((i) => i.id === activeSection);
    if (browseMatch) return t(browseMatch.labelKey, browseMatch.label);
    const taxMatch = TAXONOMY_ITEMS.find((i) => i.id === activeSection);
    if (taxMatch) return t(taxMatch.labelKey, taxMatch.label);
    return t('sidebar.books', 'Books');
  }, [activeSection, activeShelf, t, translateShelf]);

  const isTaxonomySection = ['categories', 'authors', 'ratings'].includes(activeSection);

  return (
    <div className="cw-page flex flex-col min-h-screen pt-14">
      {/* 1. Top Navigation Bar */}
      <Navbar />

      {/* 2. Main Two-Column Calibre-Web Shell */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Persistent Left Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          activeShelf={activeShelf}
          onSelectShelf={handleSelectShelf}
        />

        {/* 3. Catalog View (Main Content Area) */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">
          {/* PROMINENT ALWAYS-VISIBLE BOOK SEARCH INPUT (Desktop & Mobile) */}
          <div className="mb-5">
            <div className="flex items-center w-full rounded border-2 cw-border bg-[var(--bg-input)] focus-within:border-[var(--accent-primary)] overflow-hidden">
              <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-3 text-[var(--accent-primary)] shrink-0" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={t(
                  'catalog.searchPlaceholder',
                  'Search book name, author, or ISBN (Latin or Кирилл)...'
                )}
                className="w-full py-2.5 sm:py-3 px-3 text-sm sm:text-base font-medium bg-transparent cw-text-primary outline-none border-none shadow-none"
              />
              {quickSearch && (
                <button
                  type="button"
                  onClick={() => setQuickSearch('')}
                  className="pr-3 cw-text-muted hover:cw-text-primary cursor-pointer shrink-0"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Header with Active Category Name & Total Count */}
          <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4 border-b cw-border">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-normal tracking-tight cw-text-primary">
                {sectionHeading}
              </h1>
              <span className="cw-badge-info font-mono">
                {filteredBooks.length}{' '}
                {filteredBooks.length === 1
                  ? t('catalog.bookSingular', 'book')
                  : t('catalog.bookPlural', 'books')}
              </span>
              {selectedTaxonomyValue && (
                <button
                  type="button"
                  onClick={() => setSelectedTaxonomyValue('')}
                  className="cw-badge-available cursor-pointer"
                  title="Clear taxonomy filter"
                >
                  <span>
                    {activeSection === 'categories'
                      ? translateCategory(selectedTaxonomyValue)
                      : selectedTaxonomyValue}
                  </span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {quickSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickSearch('');
                    setSearchParams({});
                  }}
                  className="cw-badge-info cursor-pointer"
                >
                  <span>
                    {t('catalog.chips.query', 'Search')}: &ldquo;{quickSearch}&rdquo;
                  </span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Taxonomy Sub-Filter Bar (when Categories, Authors, or Ratings is active) */}
          {isTaxonomySection && taxonomyOptions.length > 0 && (
            <div className="my-4 p-3.5 cw-surface cw-secondary-bg">
              <div className="text-[11px] font-semibold uppercase tracking-wider cw-text-secondary mb-2.5">
                {t('catalog.selectTaxonomyToFilter', 'Select to Filter:')} ({sectionHeading})
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedTaxonomyValue('')}
                  className={
                    !selectedTaxonomyValue
                      ? 'cw-btn-primary text-xs px-2.5 py-1'
                      : 'cw-btn text-xs px-2.5 py-1'
                  }
                >
                  {t('catalog.langAll', 'All')} ({allBooks.length})
                </button>
                {taxonomyOptions.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() =>
                      setSelectedTaxonomyValue(
                        selectedTaxonomyValue === opt.name ? '' : opt.name
                      )
                    }
                    className={
                      selectedTaxonomyValue === opt.name
                        ? 'cw-btn-primary text-xs px-2.5 py-1'
                        : 'cw-btn text-xs px-2.5 py-1'
                    }
                  >
                    <span>
                      {activeSection === 'categories' ? translateCategory(opt.name) : opt.name}
                    </span>
                    <span className="opacity-75 font-mono text-[10px]">({opt.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View & Sort Toolbar (Calibre-Web Classic Toolbar) */}
          <div className="my-4 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Calibre-Web Blue Sort Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSortBy('date-desc')}
                className={`cw-sort-btn ${sortBy === 'date-desc' ? 'is-active' : ''}`}
                title={t('sort.dateDesc', 'Sort by Date Added (Newest First)')}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>↓9..1</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('date-asc')}
                className={`cw-sort-btn ${sortBy === 'date-asc' ? 'is-active' : ''}`}
                title={t('sort.dateAsc', 'Sort by Date Added (Oldest First)')}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>↓1..9</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('title-asc')}
                className={`cw-sort-btn ${sortBy === 'title-asc' ? 'is-active' : ''}`}
                title={t('sort.titleAsc', 'Sort by Title (A–Z)')}
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>A↓Z</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('title-desc')}
                className={`cw-sort-btn ${sortBy === 'title-desc' ? 'is-active' : ''}`}
                title={t('sort.titleDesc', 'Sort by Title (Z–A)')}
              >
                <ArrowUpZA className="w-3.5 h-3.5" />
                <span>Z↓A</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('author-asc')}
                className={`cw-sort-btn ${sortBy === 'author-asc' ? 'is-active' : ''}`}
                title={t('sort.authorAsc', 'Sort by Author (A–Z)')}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>A↓Z</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('author-desc')}
                className={`cw-sort-btn ${sortBy === 'author-desc' ? 'is-active' : ''}`}
                title={t('sort.authorDesc', 'Sort by Author (Z–A)')}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Z↓A</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('year-desc')}
                className={`cw-sort-btn ${sortBy === 'year-desc' ? 'is-active' : ''}`}
                title={t('sort.yearDesc', 'Sort by Publication Year (Newest)')}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Pub↓9</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('rating-desc')}
                className={`cw-sort-btn ${sortBy === 'rating-desc' ? 'is-active' : ''}`}
                title={t('sort.ratingDesc', 'Sort by Highest Rating')}
              >
                <Star className="w-3.5 h-3.5" />
                <span>5★</span>
              </button>

              {activeSection === 'discover' && (
                <button
                  type="button"
                  onClick={() => setRandomSeed((s) => s + 1)}
                  className="cw-btn-teal text-xs py-1 px-2.5 ml-1"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>{t('sort.shuffle', 'Shuffle Books')}</span>
                </button>
              )}
            </div>

            {/* Right: Explicit Sort Select & Grid vs. Table View Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="cw-sort-select"
                  className="text-xs cw-text-secondary hidden sm:inline"
                >
                  {t('sort.label', 'Sort:')}
                </label>
                <select
                  id="cw-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="cw-select text-xs py-1 px-2"
                >
                  <option value="date-desc">{t('sort.dateDesc')}</option>
                  <option value="date-asc">{t('sort.dateAsc')}</option>
                  <option value="title-asc">{t('sort.titleAsc')}</option>
                  <option value="title-desc">{t('sort.titleDesc')}</option>
                  <option value="author-asc">{t('sort.authorAsc')}</option>
                  <option value="author-desc">{t('sort.authorDesc')}</option>
                  <option value="rating-desc">{t('sort.ratingDesc')}</option>
                  <option value="year-desc">{t('sort.yearDesc')}</option>
                  <option value="year-asc">{t('sort.yearAsc')}</option>
                </select>
              </div>

              {/* Grid vs. Table View Toggle */}
              <div
                className="flex items-center border rounded overflow-hidden"
                style={{ borderColor: 'var(--border-color)' }}
                role="group"
                aria-label="View Mode Toggle"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className="px-2.5 py-1 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  style={{
                    backgroundColor:
                      viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: viewMode === 'grid' ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('catalog.viewGrid', 'Grid')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className="px-2.5 py-1 text-xs flex items-center gap-1 cursor-pointer transition-colors border-l"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor:
                      viewMode === 'table' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: viewMode === 'table' ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('catalog.viewTable', 'Table')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Books Display: Grid Card View vs. Dense Tabular List View */}
          {filteredBooks.length === 0 ? (
            <div className="my-12 p-10 cw-surface text-center space-y-3">
              <p className="text-base font-semibold cw-text-primary">
                {t('catalog.noBooksTitle', 'No books match the selected criteria')}
              </p>
              <p className="text-xs cw-text-secondary max-w-md mx-auto">
                {t('catalog.noBooksSubtitle')}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="cw-btn-primary text-xs px-4 py-1.5"
              >
                {t('catalog.clearAllFilters', 'Reset Filters')}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-8 pt-2 pb-12">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book._id || book.bid}
                  book={book}
                  onAuthorClick={(authorName) => {
                    setActiveShelf(null);
                    setActiveSection('authors');
                    setSelectedTaxonomyValue(authorName);
                  }}
                />
              ))}
            </div>
          ) : (
            /* Tabular List View (Dense 1px Bordered Library Table) */
            <div className="cw-surface overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="cw-table">
                  <thead>
                    <tr>
                      <th className="w-12">{t('catalog.table.cover', 'Cover')}</th>
                      <th>{t('catalog.table.title', 'Title')}</th>
                      <th>{t('catalog.table.author', 'Author')}</th>
                      <th>{t('catalog.table.categories', 'Categories')}</th>
                      <th>{t('catalog.table.lang', 'Lang')}</th>
                      <th>{t('catalog.table.year', 'Year')}</th>
                      <th>{t('catalog.table.rating', 'Rating')}</th>
                      <th>{t('catalog.table.status', 'Status')}</th>
                      <th className="text-right">{t('catalog.table.actions', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => {
                      const isBorrowed =
                        book.borrowed &&
                        String(book.borrowed) !== '0' &&
                        String(book.borrowed).toLowerCase() !== 'available';
                      const fallbackCover = createBookCoverSvg({
                        title: book.name,
                        author: book.author
                      });
                      return (
                        <tr key={book._id || book.bid}>
                          <td>
                            <img
                              src={book.image || fallbackCover}
                              alt={book.name}
                              onClick={() => navigate(`/book/${book._id || book.bid}`)}
                              className="w-8 h-12 object-cover rounded-[2px] border cw-border cursor-pointer"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackCover;
                              }}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => navigate(`/book/${book._id || book.bid}`)}
                              className="font-bold text-left cw-text-primary hover:underline cursor-pointer block"
                            >
                              {book.name}
                            </button>
                            <span className="text-[11px] font-mono cw-text-muted">
                              ISBN: {(book.bid || '').split('-')[0]}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveShelf(null);
                                setActiveSection('authors');
                                setSelectedTaxonomyValue(book.author);
                              }}
                              className="cw-link-teal font-medium cursor-pointer text-left"
                            >
                              {book.author}
                            </button>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {(book.genre || []).slice(0, 2).map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => {
                                    setActiveShelf(null);
                                    setActiveSection('categories');
                                    setSelectedTaxonomyValue(g);
                                  }}
                                  className="cw-badge-info cursor-pointer"
                                >
                                  {translateCategory(g)}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className="font-mono text-xs font-semibold cw-text-secondary">
                              {book.language || 'EN'}
                            </span>
                          </td>
                          <td className="font-mono text-xs cw-text-secondary">
                            {book.publishedYear || '—'}
                          </td>
                          <td>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className="w-3 h-3"
                                  style={{
                                    color:
                                      s <= (book.rating || 4)
                                        ? 'var(--star-filled)'
                                        : 'var(--star-empty)',
                                    fill:
                                      s <= (book.rating || 4)
                                        ? 'var(--star-filled)'
                                        : 'transparent'
                                  }}
                                />
                              ))}
                            </div>
                          </td>
                          <td>
                            {isBorrowed ? (
                              <span className="cw-badge-borrowed">
                                {t('status.borrowed', 'Borrowed')}
                              </span>
                            ) : (
                              <span className="cw-badge-available">
                                {t('status.available', 'Available')}
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => navigate(`/book/${book._id || book.bid}`)}
                              className="cw-btn text-xs py-1 px-2.5"
                            >
                              <span>{t('catalog.details', 'Details')}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
