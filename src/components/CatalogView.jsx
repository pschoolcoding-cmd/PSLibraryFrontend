import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar, { BROWSE_ITEMS, TAXONOMY_ITEMS } from './Sidebar';
import BookCard from './BookCard';
import { useTheme } from '../context/ThemeContext';
import { MOCK_BOOKS, createBookCoverSvg } from '../data/mockBooks';
import {
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  ArrowDownAZ,
  ArrowUpZA,
  UserCheck,
  Star,
  Shuffle,
  SlidersHorizontal,
  X,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizeBook = (raw, idx = 0) => {
  const title = raw.name || raw.title || 'Untitled Volume';
  const author = raw.author || 'Unknown Author';
  let genres = [];
  if (Array.isArray(raw.genre)) {
    genres = raw.genre.map((g) => String(g).replace(/^#+/, '').replace(/_/g, ' ').trim()).filter(Boolean);
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
      : ((title.length + idx) % 2 === 0 ? 5 : 4);

  const publishedYear =
    raw.publishedYear ||
    (raw.whentaken && /\b(19|20)\d{2}\b/.test(raw.whentaken)
      ? parseInt(raw.whentaken.match(/\b(19|20)\d{2}\b/)[0], 10)
      : 2020 - (idx % 15));

  const dateAdded = raw.dateAdded || raw.createdAt || `2026-10-${String(10 + (idx % 20)).padStart(2, '0')}`;
  const formats = Array.isArray(raw.formats) && raw.formats.length > 0 ? raw.formats : ['EPUB', 'PDF'];
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
  const { advancedSearchOpen, setAdvancedSearchOpen } = useTheme();

  const urlQuery = searchParams.get('q') || '';
  const urlSection = searchParams.get('section') || initialSection;
  const urlShelf = searchParams.get('shelf') || null;

  const [activeSection, setActiveSection] = useState(urlSection);
  const [activeShelf, setActiveShelf] = useState(urlShelf);
  const [viewMode, setViewMode] = useState(urlSection === 'books-list' ? 'table' : 'grid');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedTaxonomyValue, setSelectedTaxonomyValue] = useState('');
  const [randomSeed, setRandomSeed] = useState(1);

  // Advanced search state
  const [advTitle, setAdvTitle] = useState(urlQuery);
  const [advAuthor, setAdvAuthor] = useState('');
  const [advCategory, setAdvCategory] = useState('');
  const [advFormat, setAdvFormat] = useState('');
  const [advAvailability, setAdvAvailability] = useState('all'); // 'all' | 'available' | 'borrowed'
  const [advLanguage, setAdvLanguage] = useState('all'); // 'all' | 'UZ' | 'RU' | 'EN'
  const [advYearFrom, setAdvYearFrom] = useState('');
  const [advYearTo, setAdvYearTo] = useState('');

  // Quick search term
  const [quickSearch, setQuickSearch] = useState(urlQuery);

  // Live API books merged with sample multilingual books
  const [apiBooks, setApiBooks] = useState([]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const sec = searchParams.get('section');
    const sh = searchParams.get('shelf');
    setQuickSearch(q);
    setAdvTitle(q);
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
        const res = await fetch(`${API_BASE_URL}/books?limit=36`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' }
        });
        if (!res.ok) return;
        const result = await res.json();
        const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
        if (!ignore && list.length > 0) {
          setApiBooks(list.map((b, i) => normalizeBook(b, i + 100)));
        }
      } catch (e) {
        // Fallback silently to MOCK_BOOKS when backend is unreachable
      }
    };
    fetchLiveBooks();
    return () => {
      ignore = true;
    };
  }, []);

  const allBooks = useMemo(() => {
    const mockNormalized = MOCK_BOOKS.map((b, i) => normalizeBook(b, i));
    if (apiBooks.length === 0) return mockNormalized;
    const existingBids = new Set(mockNormalized.map((b) => b.bid));
    const uniqueApi = apiBooks.filter((b) => !existingBids.has(b.bid));
    return [...mockNormalized, ...uniqueApi];
  }, [apiBooks]);

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

  const allCategories = useMemo(() => {
    const set = new Set();
    allBooks.forEach((b) => (b.genre || []).forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [allBooks]);

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
          // Deterministic shuffle based on randomSeed
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
            list = list.filter((b) => b.author === selectedTaxonomyValue);
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

    // 3. Quick Search filter
    if (quickSearch.trim()) {
      const q = quickSearch.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.bid && b.bid.toLowerCase().includes(q)) ||
          (b.series && b.series.toLowerCase().includes(q)) ||
          (b.genre || []).some((g) => g.toLowerCase().includes(q))
      );
    }

    // 4. Advanced Search filters
    if (advTitle.trim() && advTitle.trim() !== quickSearch.trim()) {
      const t = advTitle.toLowerCase().trim();
      list = list.filter((b) => b.name.toLowerCase().includes(t));
    }
    if (advAuthor.trim()) {
      const a = advAuthor.toLowerCase().trim();
      list = list.filter((b) => b.author.toLowerCase().includes(a));
    }
    if (advCategory) {
      list = list.filter((b) => (b.genre || []).includes(advCategory));
    }
    if (advFormat) {
      list = list.filter((b) => (b.formats || []).includes(advFormat));
    }
    if (advAvailability === 'available') {
      list = list.filter((b) => !b.borrowed || String(b.borrowed) === '0');
    } else if (advAvailability === 'borrowed') {
      list = list.filter((b) => b.borrowed && String(b.borrowed) !== '0');
    }
    if (advLanguage !== 'all') {
      list = list.filter((b) => (b.language || 'EN').toUpperCase() === advLanguage);
    }
    if (advYearFrom) {
      const yf = parseInt(advYearFrom, 10);
      if (!isNaN(yf)) list = list.filter((b) => (b.publishedYear || 0) >= yf);
    }
    if (advYearTo) {
      const yt = parseInt(advYearTo, 10);
      if (!isNaN(yt)) list = list.filter((b) => (b.publishedYear || 9999) <= yt);
    }

    // 5. Sorting (unless in random 'discover' mode with no custom sort clicked)
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
    advTitle,
    advAuthor,
    advCategory,
    advFormat,
    advAvailability,
    advLanguage,
    advYearFrom,
    advYearTo,
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
    setAdvTitle('');
    setAdvAuthor('');
    setAdvCategory('');
    setAdvFormat('');
    setAdvAvailability('all');
    setAdvLanguage('all');
    setAdvYearFrom('');
    setAdvYearTo('');
    setSelectedTaxonomyValue('');
    setSearchParams({});
  };

  const sectionHeading = useMemo(() => {
    if (activeShelf) return `Shelf: ${activeShelf}`;
    const browseMatch = BROWSE_ITEMS.find((i) => i.id === activeSection);
    if (browseMatch) return browseMatch.label;
    const taxMatch = TAXONOMY_ITEMS.find((i) => i.id === activeSection);
    if (taxMatch) return taxMatch.label;
    return 'Books';
  }, [activeSection, activeShelf]);

  const isTaxonomySection = ['categories', 'authors', 'ratings'].includes(
    activeSection
  );

  return (
    <div className="cw-page flex flex-col min-h-screen">
      {/* 1. Top Navigation Bar */}
      <Navbar
        onSearchSubmit={(term) => {
          setQuickSearch(term);
          setAdvTitle(term);
        }}
      />

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
          {/* Header with Active Category Name & Total Count */}
          <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4 border-b cw-border">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-normal tracking-tight cw-text-primary">
                {sectionHeading}
              </h1>
              <span className="cw-badge-info font-mono">
                {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
              </span>
              {selectedTaxonomyValue && (
                <button
                  type="button"
                  onClick={() => setSelectedTaxonomyValue('')}
                  className="cw-badge-available cursor-pointer"
                  title="Clear taxonomy filter"
                >
                  <span>Filter: {selectedTaxonomyValue}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {quickSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickSearch('');
                    setAdvTitle('');
                    setSearchParams({});
                  }}
                  className="cw-badge-info cursor-pointer"
                >
                  <span>Search: &ldquo;{quickSearch}&rdquo;</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Language Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="cw-text-muted text-[11px] mr-1">Catalog Lang:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'UZ', label: "O'zbek (UZ)" },
                { id: 'RU', label: 'Русский (RU)' },
                { id: 'EN', label: 'English (EN)' }
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setAdvLanguage(l.id)}
                  className={
                    advLanguage === l.id
                      ? 'cw-btn-primary px-2.5 py-1 text-[11px]'
                      : 'cw-btn px-2.5 py-1 text-[11px]'
                  }
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Advanced Search Panel */}
          {advancedSearchOpen && (
            <div className="my-4 p-4 cw-surface cw-secondary-bg space-y-3">
              <div className="flex items-center justify-between border-b cw-border pb-2">
                <div className="flex items-center gap-2 text-xs font-bold cw-text-primary uppercase tracking-wider">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>Advanced Catalog Search</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdvancedSearchOpen(false)}
                  className="cw-btn px-2 py-0.5 text-[11px]"
                >
                  <X className="w-3 h-3" /> Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold cw-text-secondary mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={advTitle}
                    onChange={(e) => {
                      setAdvTitle(e.target.value);
                      setQuickSearch(e.target.value);
                    }}
                    placeholder="Title keywords..."
                    className="cw-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold cw-text-secondary mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={advAuthor}
                    onChange={(e) => setAdvAuthor(e.target.value)}
                    placeholder="Author name..."
                    className="cw-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold cw-text-secondary mb-1">
                    Category
                  </label>
                  <select
                    value={advCategory}
                    onChange={(e) => setAdvCategory(e.target.value)}
                    className="cw-select w-full"
                  >
                    <option value="">All Categories</option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold cw-text-secondary mb-1">
                    Availability
                  </label>
                  <select
                    value={advAvailability}
                    onChange={(e) => setAdvAvailability(e.target.value)}
                    className="cw-select w-full"
                  >
                    <option value="all">All Holdings</option>
                    <option value="available">Available Only</option>
                    <option value="borrowed">Borrowed Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold cw-text-secondary mb-1">
                    Pub. Year (From – To)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={advYearFrom}
                      onChange={(e) => setAdvYearFrom(e.target.value)}
                      placeholder="1850"
                      className="cw-input w-1/2"
                    />
                    <input
                      type="number"
                      value={advYearTo}
                      onChange={(e) => setAdvYearTo(e.target.value)}
                      placeholder="2026"
                      className="cw-input w-1/2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t cw-border">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="cw-btn text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              </div>
            </div>
          )}

          {/* Taxonomy Sub-Filter Bar (when Categories, Series, Authors, Publishers, Ratings, or Formats is active) */}
          {isTaxonomySection && taxonomyOptions.length > 0 && (
            <div className="my-4 p-3.5 cw-surface cw-secondary-bg">
              <div className="text-[11px] font-semibold uppercase tracking-wider cw-text-secondary mb-2.5">
                Select {sectionHeading} to Filter:
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
                  All ({allBooks.length})
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
                    <span>{opt.name}</span>
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
                title="Sort by Date Added (Newest First)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>↓9..1</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('date-asc')}
                className={`cw-sort-btn ${sortBy === 'date-asc' ? 'is-active' : ''}`}
                title="Sort by Date Added (Oldest First)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>↓1..9</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('title-asc')}
                className={`cw-sort-btn ${sortBy === 'title-asc' ? 'is-active' : ''}`}
                title="Sort by Title (A–Z)"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>A↓Z</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('title-desc')}
                className={`cw-sort-btn ${sortBy === 'title-desc' ? 'is-active' : ''}`}
                title="Sort by Title (Z–A)"
              >
                <ArrowUpZA className="w-3.5 h-3.5" />
                <span>Z↓A</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('author-asc')}
                className={`cw-sort-btn ${sortBy === 'author-asc' ? 'is-active' : ''}`}
                title="Sort by Author (A–Z)"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>A↓Z</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('author-desc')}
                className={`cw-sort-btn ${sortBy === 'author-desc' ? 'is-active' : ''}`}
                title="Sort by Author (Z–A)"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Z↓A</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('year-desc')}
                className={`cw-sort-btn ${sortBy === 'year-desc' ? 'is-active' : ''}`}
                title="Sort by Publication Year (Newest)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Pub↓9</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('rating-desc')}
                className={`cw-sort-btn ${sortBy === 'rating-desc' ? 'is-active' : ''}`}
                title="Sort by Highest Rating"
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
                  <span>Shuffle Random</span>
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
                  Sort:
                </label>
                <select
                  id="cw-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="cw-select text-xs py-1 px-2"
                >
                  <option value="date-desc">Date Added (Newest)</option>
                  <option value="date-asc">Date Added (Oldest)</option>
                  <option value="title-asc">Title (A–Z)</option>
                  <option value="title-desc">Title (Z–A)</option>
                  <option value="author-asc">Author (A–Z)</option>
                  <option value="author-desc">Author (Z–A)</option>
                  <option value="rating-desc">Rating (High to Low)</option>
                  <option value="year-desc">Publication Year (Newest)</option>
                  <option value="year-asc">Publication Year (Oldest)</option>
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
                  title="Grid Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
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
                  title="Tabular List View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Books Display: Grid Card View vs. Dense Tabular List View */}
          {filteredBooks.length === 0 ? (
            <div className="my-12 p-10 cw-surface text-center space-y-3">
              <p className="text-base font-semibold cw-text-primary">
                No books match the selected criteria
              </p>
              <p className="text-xs cw-text-secondary max-w-md mx-auto">
                Try clearing your active search query, switching shelves, or resetting the
                advanced catalog filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="cw-btn-primary text-xs px-4 py-1.5"
              >
                Reset Filters
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
                      <th className="w-12">Cover</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Categories</th>
                      <th>Lang</th>
                      <th>Year</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
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
                                <span key={g} className="cw-badge-info">
                                  {g}
                                </span>
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
                              <span className="cw-badge-borrowed">Borrowed</span>
                            ) : (
                              <span className="cw-badge-available">Available</span>
                            )}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => navigate(`/book/${book._id || book.bid}`)}
                              className="cw-btn text-xs py-1 px-2.5"
                            >
                              <span>Details</span>
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

