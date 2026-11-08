import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Book,
    Flame,
    Download,
    Star,
    Eye,
    EyeOff,
    Compass,
    FolderKanban,
    Bookmark,
    Users,
    Building2,
    FileCode2,
    Archive,
    List,
    Plus,
    Info,
    Search as SearchIcon,
    SlidersHorizontal,
    X,
    Check,
    Heart,
    LayoutGrid,
    LayoutList,
    Table2,
    ArrowDownAZ,
    ArrowUpZA,
    CalendarArrowDown,
    CalendarArrowUp,
    UserCheck,
    Sparkles,
    ScanLine,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    FolderPlus,
    Trash2,
    Sun,
    Moon,
    BookOpen,
    Filter,
    CheckCircle2,
    Clock,
    Layers,
    ExternalLink
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ALPHABET = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

const BROWSE_NAV = [
    { id: 'books', label: 'Books', icon: Book },
    { id: 'hot', label: 'Hot Books', icon: Flame },
    { id: 'available', label: 'Available Books', icon: Download },
    { id: 'top-rated', label: 'Top Rated Books', icon: Star },
    { id: 'read', label: 'Read Books', icon: Eye },
    { id: 'unread', label: 'Unread Books', icon: EyeOff },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'categories', label: 'Categories', icon: FolderKanban },
    { id: 'authors', label: 'Authors', icon: Users },
    { id: 'ratings', label: 'Ratings', icon: Star },
    { id: 'archived', label: 'Archived Books', icon: Archive },
    { id: 'books-list', label: 'Books List', icon: List }
];

const STORAGE_KEYS = {
    SHELVES: 'ps_library_custom_shelves_v1',
    READ_BOOKS: 'ps_library_read_books_v1',
    RATINGS: 'ps_library_book_ratings_v1',
    ARCHIVED: 'ps_library_archived_books_v1',
    CATALOG_THEME: 'ps_library_catalog_theme_v1'
};

const formatGenreLabel = (g) => {
    if (!g) return '';
    return String(g)
        .replace(/^#+/, '')
        .replace(/_/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const extractGenres = (rawGenre) => {
    if (!rawGenre) return ['General'];
    const list = [];
    if (Array.isArray(rawGenre)) {
        rawGenre.forEach((item) => {
            if (typeof item === 'string') {
                item.split(/[,#]/).forEach((part) => {
                    const clean = formatGenreLabel(part);
                    if (clean) list.push(clean);
                });
            }
        });
    } else if (typeof rawGenre === 'string') {
        rawGenre.split(/[,#]/).forEach((part) => {
            const clean = formatGenreLabel(part);
            if (clean) list.push(clean);
        });
    }
    return list.length > 0 ? Array.from(new Set(list)) : ['General'];
};

const detectLanguage = (book) => {
    if (book.language) return book.language;
    const text = `${book.name || ''} ${book.author || ''} ${book.description || ''}`;
    if (/[А-Яа-яЁё]/.test(text)) return 'Russian';
    if (/[OʻoʻGʻgʻ]|(\b(va|uchun|bilan|kitob|roman|qissa|asar)\b)/i.test(text)) return 'Uzbek';
    return 'English';
};

const computeDefaultRating = (book) => {
    const str = `${book.name || ''}${book.author || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % 100;
    }
    if (hash > 75) return 5;
    if (hash > 35) return 4;
    if (hash > 12) return 3;
    return 4;
};

const parseSyncYear = (whentaken) => {
    if (!whentaken) return null;
    const match = String(whentaken).match(/\b(19\d{2}|20\d{2})\b/);
    return match ? parseInt(match[1], 10) : null;
};

const deriveSeries = (book, genres) => {
    if (book.series) return book.series;
    const title = String(book.name || '');
    const volMatch = title.match(/^(.+?)\s*(?:[:\-–]\s*(?:Vol(?:ume)?|Book|Part|Tom|Kitob)\b|\((?:Vol|Book|Part)[^)]+\))/i);
    if (volMatch && volMatch[1].length > 3) {
        return volMatch[1].trim();
    }
    if (genres && genres.length > 0 && genres[0] !== 'General') {
        return `${genres[0]} Collection`;
    }
    return 'General Library Holdings';
};

const deriveFormats = (book) => {
    const formats = ['Physical Copy'];
    const cleanBid = String(book.bid || '').split('-')[0].replace(/[^0-9X]/gi, '');
    if (cleanBid.length === 13) formats.push('ISBN-13');
    else if (cleanBid.length === 10) formats.push('ISBN-10');
    if ((book.copyCount || 1) > 1) formats.push('Multi-Copy Edition');
    if (book.description && book.description.length > 80) formats.push('Annotated');
    return formats;
};

const generateFallbackCover = (title = 'Untitled', author = 'Unknown Author') => {
    const palettes = [
        ['#1e293b', '#38bdf8'],
        ['#134e4a', '#2dd4bf'],
        ['#31102f', '#f472b6'],
        ['#1e1b4b', '#818cf8'],
        ['#3b1d11', '#fb923c'],
        ['#14281d', '#4ade80']
    ];
    const idx = (title.length + author.length) % palettes.length;
    const [bg, accent] = palettes[idx];
    const esc = (s) =>
        String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    const words = String(title).split(/\s+/);
    const lines = [];
    let curr = '';
    words.forEach((w) => {
        if ((curr + ' ' + w).trim().length > 15) {
            if (curr) lines.push(curr);
            curr = w;
        } else {
            curr = (curr + ' ' + w).trim();
        }
    });
    if (curr) lines.push(curr);
    const displayLines = lines.slice(0, 4);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">
    <rect width="300" height="450" fill="${bg}"/>
    <rect x="0" y="0" width="14" height="450" fill="rgba(0,0,0,0.28)"/>
    <rect x="24" y="24" width="254" height="402" fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.5"/>
    ${displayLines
            .map(
                (line, i) =>
                    `<text x="151" y="${130 + i * 34}" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#f8fafc" text-anchor="middle">${esc(line)}</text>`
            )
            .join('')}
    <line x1="90" y1="315" x2="210" y2="315" stroke="${accent}" stroke-width="2"/>
    <text x="151" y="350" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="${accent}" text-anchor="middle">${esc(author.slice(0, 28))}</text>
    <text x="151" y="405" font-family="Inter, sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle" letter-spacing="2">PS LIBRARY CATALOG</text>
  </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const Search = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { reader, isAuthenticated, toggleFavorite, borrowBook } = useAuth();
    const { isDay: isLight, toggleTheme: toggleCatalogTheme } = useTheme();

    // Raw data from API
    const [rawBooks, setRawBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Persistent user customizations (Shelves, Read status, Ratings, Archived)
    const [shelves, setShelves] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SHELVES);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error(e);
        }
        return [
            { id: 'want-to-read', name: 'Want to Read', bookIds: [] },
            { id: 'study-list', name: 'Study & Research', bookIds: [] },
            { id: 'favorites-shelf', name: 'Classics Shelf', bookIds: [] }
        ];
    });

    const [readBookIds, setReadBookIds] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.READ_BOOKS);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error(e);
        }
        return [];
    });

    const [userRatings, setUserRatings] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.RATINGS);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error(e);
        }
        return {};
    });

    const [archivedBookIds, setArchivedBookIds] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.ARCHIVED);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error(e);
        }
        return [];
    });

    // Sidebar & Navigation state
    const [activeBrowse, setActiveBrowse] = useState(searchParams.get('tab') || 'books');
    const [activeShelfId, setActiveShelfId] = useState(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showCreateShelfModal, setShowCreateShelfModal] = useState(false);
    const [newShelfName, setNewShelfName] = useState('');
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [shelfMenuBookId, setShelfMenuBookId] = useState(null);
    const [quickViewBook, setQuickViewBook] = useState(null);

    // Sorting & View Mode state
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, title_asc, title_desc, author_asc, author_desc, copies_desc, rating_desc
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'detailed' | 'list'
    const [discoverSeed, setDiscoverSeed] = useState(1);

    // Rich Filtration State ("with more filteration")
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [searchField, setSearchField] = useState('all'); // 'all' | 'title' | 'author' | 'isbn' | 'description'
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [genreMatchMode, setGenreMatchMode] = useState('OR'); // 'OR' | 'AND'
    const [selectedAuthor, setSelectedAuthor] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all' | 'available' | 'borrowed' | 'multi_copy' | 'single_copy'
    const [minRatingFilter, setMinRatingFilter] = useState(0); // 0, 5, 4, 3, 2, 1
    const [exactRatingFilter, setExactRatingFilter] = useState(0);
    const [readStatusFilter, setReadStatusFilter] = useState('all'); // 'all' | 'read' | 'unread' | 'favorited' | 'my_loans'
    const [languageFilter, setLanguageFilter] = useState('all'); // 'all' | 'English' | 'Uzbek' | 'Russian'
    const [letterFilter, setLetterFilter] = useState('ALL');
    const [letterTarget, setLetterTarget] = useState('title'); // 'title' | 'author'
    const [onlyWithCover, setOnlyWithCover] = useState(false);
    const [onlyWithDescription, setOnlyWithDescription] = useState(false);
    const [taxonomySearch, setTaxonomySearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(24);

    // Fetch all books from backend for instant multi-dimensional filtering & taxonomy browsing
    const fetchCatalog = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/books?limit=1000`, {
                headers: {
                    'x-api-key': import.meta.env.VITE_API_KEY || ''
                }
            });
            if (!response.ok) throw new Error('Failed to load library catalog');
            const result = await response.json();
            const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
            setRawBooks(list);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    // Sync URL ?q= parameter
    useEffect(() => {
        const qParam = searchParams.get('q');
        if (qParam !== null && qParam !== searchQuery) {
            setSearchQuery(qParam);
        }
    }, [searchParams]);

    // Enrich books with normalized fields, ratings, read state, favorite state, availability, etc.
    const enrichedBooks = useMemo(() => {
        const favSet = new Set(reader?.favoriteBooks || []);
        const activeLoanSet = new Set(
            (reader?.borrowedBooks || [])
                .filter((b) => b.status === 'active')
                .map((b) => b.bookId)
        );
        const returnedLoanSet = new Set(
            (reader?.borrowedBooks || [])
                .filter((b) => b.status === 'returned')
                .map((b) => b.bookId)
        );
        const localReadSet = new Set(readBookIds);
        const archivedSet = new Set(archivedBookIds);

        return rawBooks.map((book, index) => {
            const id = book._id || book.bid || `book-${index}`;
            const bid = String(book.bid || id);
            const isbn = bid.split('-')[0];
            const genres = extractGenres(book.genre);
            const isBorrowed =
                Boolean(book.borrowed) &&
                String(book.borrowed) !== '0' &&
                String(book.borrowed).toLowerCase() !== 'available' &&
                String(book.borrowed).trim() !== '';

            const isRead =
                localReadSet.has(id) ||
                localReadSet.has(bid) ||
                returnedLoanSet.has(id) ||
                returnedLoanSet.has(bid);

            const isFavorite = favSet.has(id) || favSet.has(bid);
            const isBorrowedByMe = activeLoanSet.has(id) || activeLoanSet.has(bid);
            const isArchived = archivedSet.has(id) || archivedSet.has(bid);

            const rating = userRatings[id] || userRatings[bid] || computeDefaultRating(book);
            const copyCount = Number(book.copyCount) || 1;
            const language = detectLanguage(book);
            const publisher =
                book.publisher ||
                (book.whoadded && book.whoadded !== 'none'
                    ? `Added by ${book.whoadded.split('@')[0]}`
                    : 'PS Library Press');
            const series = deriveSeries(book, genres);
            const formats = deriveFormats(book);
            const syncYear = parseSyncYear(book.whentaken);

            return {
                ...book,
                _id: id,
                bid,
                isbn,
                name: (book.name || 'Untitled Book').trim(),
                author: (book.author || 'Unknown Author').trim(),
                genres,
                isBorrowed,
                isAvailable: !isBorrowed,
                isRead,
                isFavorite,
                isBorrowedByMe,
                isArchived,
                rating,
                copyCount,
                language,
                publisher,
                series,
                formats,
                syncYear,
                hasCover: Boolean(book.image && String(book.image).trim().length > 5),
                hasDescription: Boolean(book.description && String(book.description).trim().length > 10),
                orderIndex: index
            };
        });
    }, [rawBooks, reader, readBookIds, userRatings, archivedBookIds]);

    // Facets / Taxonomy Aggregations for Sidebar & Filter Dropdowns
    const facets = useMemo(() => {
        const genreCounts = new Map();
        const authorCounts = new Map();
        const publisherCounts = new Map();
        const seriesCounts = new Map();
        const formatCounts = new Map();
        const ratingCounts = new Map([
            [5, 0],
            [4, 0],
            [3, 0],
            [2, 0],
            [1, 0]
        ]);
        const languageCounts = new Map();

        const bump = (map, key) => {
            if (!key) return;
            map.set(key, (map.get(key) || 0) + 1);
        };

        enrichedBooks.forEach((b) => {
            if (b.isArchived && activeBrowse !== 'archived') return;
            b.genres.forEach((g) => bump(genreCounts, g));
            bump(authorCounts, b.author);
            bump(publisherCounts, b.publisher);
            bump(seriesCounts, b.series);
            b.formats.forEach((f) => bump(formatCounts, f));
            bump(ratingCounts, b.rating);
            bump(languageCounts, b.language);
        });

        const toSortedArray = (map, sortByCount = false) =>
            Array.from(map.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => (sortByCount ? b.count - a.count || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)));

        return {
            genres: toSortedArray(genreCounts),
            authors: toSortedArray(authorCounts),
            publishers: toSortedArray(publisherCounts, true),
            series: toSortedArray(seriesCounts, true),
            formats: toSortedArray(formatCounts, true),
            ratings: Array.from(ratingCounts.entries())
                .map(([stars, count]) => ({ stars, name: `${stars} Stars`, count }))
                .sort((a, b) => b.stars - a.stars),
            languages: toSortedArray(languageCounts, true)
        };
    }, [enrichedBooks, activeBrowse]);

    // Persist user actions
    const handleToggleRead = (book, e) => {
        if (e) e.stopPropagation();
        const id = book._id;
        setReadBookIds((prev) => {
            const exists = prev.includes(id);
            const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
            localStorage.setItem(STORAGE_KEYS.READ_BOOKS, JSON.stringify(updated));
            return updated;
        });
    };

    const handleSetRating = (book, stars, e) => {
        if (e) e.stopPropagation();
        const id = book._id;
        setUserRatings((prev) => {
            const updated = { ...prev, [id]: stars };
            localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(updated));
            return updated;
        });
    };

    const handleToggleArchive = (book, e) => {
        if (e) e.stopPropagation();
        const id = book._id;
        setArchivedBookIds((prev) => {
            const exists = prev.includes(id);
            const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
            localStorage.setItem(STORAGE_KEYS.ARCHIVED, JSON.stringify(updated));
            return updated;
        });
    };

    const handleToggleFavorite = async (book, e) => {
        if (e) e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await toggleFavorite(book.bid || book._id);
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    const handleCreateShelf = (e) => {
        e.preventDefault();
        const trimmed = newShelfName.trim();
        if (!trimmed) return;
        const newShelf = {
            id: `shelf-${Date.now()}`,
            name: trimmed,
            bookIds: []
        };
        const updated = [...shelves, newShelf];
        setShelves(updated);
        localStorage.setItem(STORAGE_KEYS.SHELVES, JSON.stringify(updated));
        setNewShelfName('');
        setShowCreateShelfModal(false);
        setActiveShelfId(newShelf.id);
        setActiveBrowse('shelf');
        setPage(1);
    };

    const handleDeleteShelf = (shelfId, e) => {
        if (e) e.stopPropagation();
        const updated = shelves.filter((s) => s.id !== shelfId);
        setShelves(updated);
        localStorage.setItem(STORAGE_KEYS.SHELVES, JSON.stringify(updated));
        if (activeShelfId === shelfId) {
            setActiveShelfId(null);
            setActiveBrowse('books');
        }
    };

    const handleToggleBookInShelf = (shelfId, bookId, e) => {
        if (e) e.stopPropagation();
        const updated = shelves.map((shelf) => {
            if (shelf.id !== shelfId) return shelf;
            const exists = shelf.bookIds.includes(bookId);
            return {
                ...shelf,
                bookIds: exists
                    ? shelf.bookIds.filter((id) => id !== bookId)
                    : [...shelf.bookIds, bookId]
            };
        });
        setShelves(updated);
        localStorage.setItem(STORAGE_KEYS.SHELVES, JSON.stringify(updated));
    };

    const toggleGenreSelection = (genreName) => {
        setSelectedGenres((prev) =>
            prev.includes(genreName) ? prev.filter((g) => g !== genreName) : [...prev, genreName]
        );
        setPage(1);
    };

    const resetAllFilters = () => {
        setSearchQuery('');
        setSearchField('all');
        setSelectedGenres([]);
        setSelectedAuthor('');
        setAvailabilityFilter('all');
        setMinRatingFilter(0);
        setExactRatingFilter(0);
        setReadStatusFilter('all');
        setLanguageFilter('all');
        setLetterFilter('ALL');
        setOnlyWithCover(false);
        setOnlyWithDescription(false);
        setTaxonomySearch('');
        setSearchParams({});
        setPage(1);
    };

    // Handle sidebar navigation click
    const handleSelectBrowse = (browseId) => {
        setActiveShelfId(null);
        setActiveBrowse(browseId);
        setTaxonomySearch('');
        setMobileSidebarOpen(false);
        setPage(1);

        if (browseId === 'books-list') {
            setViewMode('list');
        } else if (viewMode === 'list' && browseId === 'books') {
            setViewMode('grid');
        }

        if (browseId === 'discover') {
            setDiscoverSeed((s) => s + 1);
        }
    };

    // Master Filtering & Sorting Pipeline
    const filteredBooks = useMemo(() => {
        let list = [...enrichedBooks];

        // Archive separation: unless browsing 'archived', hide archived books
        if (activeBrowse === 'archived') {
            list = list.filter((b) => b.isArchived);
        } else {
            list = list.filter((b) => !b.isArchived);
        }

        // 1. Active Shelf filter
        if (activeShelfId) {
            const currentShelf = shelves.find((s) => s.id === activeShelfId);
            const shelfSet = new Set(currentShelf?.bookIds || []);
            list = list.filter((b) => shelfSet.has(b._id) || shelfSet.has(b.bid));
        } else {
            // 2. Sidebar Browse Section filter
            switch (activeBrowse) {
                case 'hot':
                    list = list.filter((b) => b.copyCount > 1 || b.isBorrowed || b.rating === 5);
                    break;
                case 'available':
                    list = list.filter((b) => b.isAvailable);
                    break;
                case 'top-rated':
                    list = list.filter((b) => b.rating >= 4);
                    break;
                case 'read':
                    list = list.filter((b) => b.isRead);
                    break;
                case 'unread':
                    list = list.filter((b) => !b.isRead);
                    break;
                default:
                    break;
            }
        }

        // 3. Search Query & Field Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter((b) => {
                if (searchField === 'title') return b.name.toLowerCase().includes(q);
                if (searchField === 'author') return b.author.toLowerCase().includes(q);
                if (searchField === 'isbn') return b.bid.toLowerCase().includes(q) || b.isbn.toLowerCase().includes(q);
                if (searchField === 'description') return (b.description || '').toLowerCase().includes(q);
                return (
                    b.name.toLowerCase().includes(q) ||
                    b.author.toLowerCase().includes(q) ||
                    b.bid.toLowerCase().includes(q) ||
                    (b.description || '').toLowerCase().includes(q) ||
                    b.genres.some((g) => g.toLowerCase().includes(q))
                );
            });
        }

        // 4. Multi-Category / Genre Filter (with OR / AND mode)
        if (selectedGenres.length > 0) {
            list = list.filter((b) => {
                const lowerGenres = b.genres.map((g) => g.toLowerCase());
                if (genreMatchMode === 'AND') {
                    return selectedGenres.every((sel) => lowerGenres.includes(sel.toLowerCase()));
                }
                return selectedGenres.some((sel) => lowerGenres.includes(sel.toLowerCase()));
            });
        }

        // 5. Author Filter
        if (selectedAuthor) {
            list = list.filter((b) => b.author.toLowerCase() === selectedAuthor.toLowerCase());
        }

        // 6. Availability Filter
        if (availabilityFilter === 'available') {
            list = list.filter((b) => b.isAvailable);
        } else if (availabilityFilter === 'borrowed') {
            list = list.filter((b) => b.isBorrowed);
        } else if (availabilityFilter === 'multi_copy') {
            list = list.filter((b) => b.copyCount > 1);
        } else if (availabilityFilter === 'single_copy') {
            list = list.filter((b) => b.copyCount === 1);
        }

        // 7. Rating Filters
        if (exactRatingFilter > 0) {
            list = list.filter((b) => b.rating === exactRatingFilter);
        } else if (minRatingFilter > 0) {
            list = list.filter((b) => b.rating >= minRatingFilter);
        }

        // 8. Personal / Reading Status Filter
        if (readStatusFilter === 'read') {
            list = list.filter((b) => b.isRead);
        } else if (readStatusFilter === 'unread') {
            list = list.filter((b) => !b.isRead);
        } else if (readStatusFilter === 'favorited') {
            list = list.filter((b) => b.isFavorite);
        } else if (readStatusFilter === 'my_loans') {
            list = list.filter((b) => b.isBorrowedByMe);
        }

        // 9. Language Filter
        if (languageFilter !== 'all') {
            list = list.filter((b) => b.language === languageFilter);
        }

        // 10. Alphabetical Initial Letter Filter
        if (letterFilter !== 'ALL') {
            list = list.filter((b) => {
                const targetStr = (letterTarget === 'author' ? b.author : b.name).trim();
                if (!targetStr) return false;
                const firstChar = targetStr.charAt(0).toUpperCase();
                if (letterFilter === '#') {
                    return !/[A-Z]/.test(firstChar);
                }
                return firstChar === letterFilter;
            });
        }

        // 11. Metadata Quality Toggles
        if (onlyWithCover) {
            list = list.filter((b) => b.hasCover);
        }
        if (onlyWithDescription) {
            list = list.filter((b) => b.hasDescription);
        }

        // 12. Sorting
        if (activeBrowse === 'discover') {
            list.sort((a, b) => {
                const hashA = ((a._id.charCodeAt(0) + a.name.length) * 37 + discoverSeed * 19) % 101;
                const hashB = ((b._id.charCodeAt(0) + b.name.length) * 37 + discoverSeed * 19) % 101;
                return hashA - hashB;
            });
        } else {
            list.sort((a, b) => {
                switch (sortBy) {
                    case 'newest':
                        return a.orderIndex - b.orderIndex;
                    case 'oldest':
                        return b.orderIndex - a.orderIndex;
                    case 'title_asc':
                        return a.name.localeCompare(b.name);
                    case 'title_desc':
                        return b.name.localeCompare(a.name);
                    case 'author_asc':
                        return a.author.localeCompare(b.author) || a.name.localeCompare(b.name);
                    case 'author_desc':
                        return b.author.localeCompare(a.author) || a.name.localeCompare(b.name);
                    case 'copies_desc':
                        return b.copyCount - a.copyCount || a.name.localeCompare(b.name);
                    case 'rating_desc':
                        return b.rating - a.rating || b.copyCount - a.copyCount;
                    default:
                        return 0;
                }
            });
        }

        return list;
    }, [
        enrichedBooks,
        activeBrowse,
        activeShelfId,
        shelves,
        searchQuery,
        searchField,
        selectedGenres,
        genreMatchMode,
        selectedAuthor,
        availabilityFilter,
        minRatingFilter,
        exactRatingFilter,
        readStatusFilter,
        languageFilter,
        letterFilter,
        letterTarget,
        onlyWithCover,
        onlyWithDescription,
        sortBy,
        discoverSeed
    ]);

    // Pagination slice
    const totalPages = Math.max(1, Math.ceil(filteredBooks.length / itemsPerPage));
    const currentPage = Math.min(page, totalPages);
    const paginatedBooks = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredBooks.slice(start, start + itemsPerPage);
    }, [filteredBooks, currentPage, itemsPerPage]);

    // Active Filter Count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim()) count++;
        if (selectedGenres.length > 0) count += selectedGenres.length;
        if (selectedAuthor) count++;
        if (availabilityFilter !== 'all') count++;
        if (minRatingFilter > 0 || exactRatingFilter > 0) count++;
        if (readStatusFilter !== 'all') count++;
        if (languageFilter !== 'all') count++;
        if (letterFilter !== 'ALL') count++;
        if (onlyWithCover) count++;
        if (onlyWithDescription) count++;
        return count;
    }, [
        searchQuery,
        selectedGenres,
        selectedAuthor,
        availabilityFilter,
        minRatingFilter,
        exactRatingFilter,
        readStatusFilter,
        languageFilter,
        letterFilter,
        onlyWithCover,
        onlyWithDescription
    ]);

    // Dynamic Header Title
    const currentHeading = useMemo(() => {
        if (activeShelfId) {
            const s = shelves.find((item) => item.id === activeShelfId);
            return s ? s.name : 'Custom Shelf';
        }
        const navItem = BROWSE_NAV.find((item) => item.id === activeBrowse);
        return navItem ? navItem.label : 'Books';
    }, [activeBrowse, activeShelfId, shelves]);

    // Check if current view should show a Taxonomy Browser Directory panel
    const isTaxonomyView = ['categories', 'authors', 'ratings'].includes(activeBrowse);

    // Render Sidebar Content
    const renderSidebar = () => (
        <div className="flex flex-col h-full justify-between py-5 px-3 select-none">
            <div className="space-y-6">
                {/* BROWSE SECTION */}
                <div>
                    <div
                        className={`px-3 mb-2 text-[11px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-gray-500'
                            }`}
                    >
                        BROWSE
                    </div>
                    <ul className="space-y-0.5">
                        {BROWSE_NAV.map((item) => {
                            const Icon = item.icon;
                            const isSelected = !activeShelfId && activeBrowse === item.id;
                            return (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectBrowse(item.id)}
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-[13px] rounded-md transition-all cursor-pointer text-left ${isSelected
                                                ? isLight
                                                    ? 'bg-[#e2e8f0] text-slate-900 font-semibold border-l-3 border-[#2b6cb0]'
                                                    : 'bg-blue-600/20 text-blue-400 font-semibold border-l-3 border-blue-500'
                                                : isLight
                                                    ? 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 font-medium'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3 truncate">
                                            <Icon className="w-4 h-4 shrink-0 opacity-85" />
                                            <span className="truncate">{item.label}</span>
                                        </span>
                                        {item.id === 'books' && rawBooks.length > 0 && (
                                            <span
                                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-gray-800 text-gray-400'
                                                    }`}
                                            >
                                                {rawBooks.length}
                                            </span>
                                        )}
                                        {item.id === 'read' && readBookIds.length > 0 && (
                                            <span
                                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-950 text-emerald-400'
                                                    }`}
                                            >
                                                {readBookIds.length}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* SHELVES SECTION */}
                <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-gray-800/80'}`}>
                    <div
                        className={`px-3 mb-2 text-[11px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-gray-500'
                            }`}
                    >
                        SHELVES
                    </div>

                    <ul className="space-y-0.5 mb-3">
                        {shelves.map((shelf) => {
                            const isSelected = activeShelfId === shelf.id;
                            return (
                                <li key={shelf.id} className="group flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveShelfId(shelf.id);
                                            setActiveBrowse('shelf');
                                            setMobileSidebarOpen(false);
                                            setPage(1);
                                        }}
                                        className={`flex-1 flex items-center justify-between gap-2 px-3 py-1.5 text-[13px] rounded-md transition-all cursor-pointer text-left ${isSelected
                                                ? isLight
                                                    ? 'bg-[#e6fffa] text-[#234e52] font-semibold border-l-3 border-[#3b9c88]'
                                                    : 'bg-teal-500/20 text-teal-300 font-semibold border-l-3 border-teal-400'
                                                : isLight
                                                    ? 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2.5 truncate">
                                            <Bookmark className="w-3.5 h-3.5 shrink-0 text-[#3b9c88]" />
                                            <span className="truncate">{shelf.name}</span>
                                        </span>
                                        <span className="text-[10px] font-mono opacity-70">{shelf.bookIds.length}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteShelf(shelf.id, e)}
                                        title="Delete shelf"
                                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-500 transition-opacity cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="px-2">
                        <button
                            type="button"
                            onClick={() => setShowCreateShelfModal(true)}
                            className="w-full py-2.5 px-4 rounded bg-[#3b9c88] hover:bg-[#318473] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create a Shelf</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ABOUT FOOTER */}
            <div className={`pt-4 mt-6 border-t ${isLight ? 'border-slate-200' : 'border-gray-800/80'}`}>
                <button
                    type="button"
                    onClick={() => setShowAboutModal(true)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded-md transition-colors cursor-pointer ${isLight
                            ? 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <Info className="w-4 h-4 shrink-0" />
                    <span>About</span>
                </button>
            </div>
        </div>
    );

    return (
        <div
            className={`min-h-screen w-full pt-16 transition-colors duration-200 ${isLight ? 'bg-[#FFFFFF] text-[#0F172A]' : 'bg-[#0B1329] text-[#F8FAFC]'
                }`}
        >
            <Navbar />

            {error && (
                <div className="fixed bottom-4 right-4 bg-rose-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 z-50 text-xs font-semibold">
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button onClick={fetchCatalog} className="underline ml-2 cursor-pointer">
                        Retry
                    </button>
                </div>
            )}

            {/* MAIN TWO-COLUMN CALIBRE-WEB CATALOGUE SHELL */}
            <div className="flex min-h-[calc(100vh-4rem)]">
                {/* Desktop Persistent Left Sidebar */}
                <aside
                    className={`hidden lg:block w-56 xl:w-60 shrink-0 border-r ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#1E293B] border-[#334155]'
                        }`}
                >
                    <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">{renderSidebar()}</div>
                </aside>

                {/* Mobile Drawer Sidebar */}
                {mobileSidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                            onClick={() => setMobileSidebarOpen(false)}
                        />
                        <aside
                            className={`relative w-64 max-w-[82vw] h-full z-10 flex flex-col ${isLight ? 'bg-[#F8FAFC] text-[#0F172A]' : 'bg-[#1E293B] text-[#F8FAFC]'
                                }`}
                        >
                            <div
                                className={`flex items-center justify-between px-4 py-3 border-b ${isLight ? 'border-[#E2E8F0]' : 'border-[#334155]'
                                    }`}
                            >
                                <span className="font-bold text-xs uppercase tracking-wider">Library Navigation</span>
                                <button
                                    type="button"
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="p-1 rounded hover:bg-black/10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">{renderSidebar()}</div>
                        </aside>
                    </div>
                )}

                {/* MAIN CATALOGUE AREA */}
                <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6">
                    {/* Top Title Row & Quick Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileSidebarOpen(true)}
                                className={`lg:hidden p-2 rounded border cursor-pointer ${isLight
                                        ? 'bg-white border-slate-300 text-slate-700'
                                        : 'bg-gray-900 border-gray-700 text-gray-200'
                                    }`}
                                title="Open Browse Menu"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <h1
                                className={`text-2xl sm:text-3xl font-normal tracking-tight ${isLight ? 'text-slate-800' : 'text-white'
                                    }`}
                            >
                                {currentHeading}
                            </h1>
                            <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isLight
                                        ? 'bg-slate-200 text-slate-700'
                                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                    }`}
                            >
                                {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
                            </span>
                        </div>

                        {/* Right Quick Tools: Search Input, Filter Toggle, Scanner, Theme Switch */}
                        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                            {/* Combined Search Input with Field Selector */}
                            <div
                                className={`flex items-center flex-1 sm:w-80 rounded-md border overflow-hidden transition-all ${isLight
                                        ? 'bg-white border-slate-300 focus-within:border-[#2b6cb0]'
                                        : 'bg-[#111827] border-gray-700 focus-within:border-blue-500'
                                    }`}
                            >
                                <select
                                    value={searchField}
                                    onChange={(e) => {
                                        setSearchField(e.target.value);
                                        setPage(1);
                                    }}
                                    aria-label="Search field"
                                    className={`text-xs py-2 pl-2.5 pr-1 border-r outline-none cursor-pointer font-medium ${isLight
                                            ? 'bg-slate-100 border-slate-300 text-slate-700'
                                            : 'bg-gray-800 border-gray-700 text-gray-300'
                                        }`}
                                >
                                    <option value="all">All</option>
                                    <option value="title">Title</option>
                                    <option value="author">Author</option>
                                    <option value="isbn">ISBN</option>
                                    <option value="description">Summary</option>
                                </select>
                                <div className="relative flex-1 flex items-center">
                                    <SearchIcon className="w-3.5 h-3.5 ml-2.5 opacity-50 shrink-0" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Search books, authors, ISBN..."
                                        className="w-full py-1.5 px-2 text-xs bg-transparent outline-none"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setPage(1);
                                            }}
                                            className="pr-2 opacity-60 hover:opacity-100 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Toggle Advanced Filtration Button */}
                            <button
                                type="button"
                                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${showAdvancedFilters || activeFilterCount > 0
                                        ? 'bg-[#2b6cb0] text-white border-[#255892]'
                                        : isLight
                                            ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                            : 'bg-gray-900 text-gray-200 border-gray-700 hover:bg-gray-800'
                                    }`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="bg-white text-[#2b6cb0] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Barcode Scanner Button */}
                            <button
                                type="button"
                                onClick={() => navigate('/scan')}
                                className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 bg-[#3b9c88] hover:bg-[#318473] text-white transition-colors cursor-pointer"
                                title="Smart Barcode / ISBN Scanner"
                            >
                                <ScanLine className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Scan ID</span>
                            </button>

                            {/* Light / Dark Catalogue Theme Toggle */}
                            <button
                                type="button"
                                onClick={toggleCatalogTheme}
                                className={`p-1.5 rounded-md border transition-colors cursor-pointer ${isLight
                                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                                        : 'bg-gray-900 border-gray-700 text-amber-400 hover:bg-gray-800'
                                    }`}
                                title={isLight ? 'Switch to Dark Catalogue Theme' : 'Switch to Classic Light Catalogue Theme'}
                            >
                                {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* CALIBRE-WEB ICON SORT BUTTONS TOOLBAR + VIEW MODE SWITCHER */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        {/* Classic Blue Icon Sort Buttons (Matching Screenshot) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setSortBy('newest')}
                                title="Sort by Newest Added (9 → 1)"
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${sortBy === 'newest'
                                        ? 'bg-[#23527c] text-white border-[#1a3d5d] shadow-inner'
                                        : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                                    }`}
                            >
                                <CalendarArrowDown className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono leading-none">9↓1</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('oldest')}
                                title="Sort by Oldest Added (1 → 9)"
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${sortBy === 'oldest'
                                        ? 'bg-[#23527c] text-white border-[#1a3d5d] shadow-inner'
                                        : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                                    }`}
                            >
                                <CalendarArrowUp className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono leading-none">1↓9</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('title_asc')}
                                title="Sort Title A to Z"
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${sortBy === 'title_asc'
                                        ? 'bg-[#23527c] text-white border-[#1a3d5d] shadow-inner'
                                        : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                                    }`}
                            >
                                <ArrowDownAZ className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono leading-none">A↓Z</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('title_desc')}
                                title="Sort Title Z to A"
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${sortBy === 'title_desc'
                                        ? 'bg-[#23527c] text-white border-[#1a3d5d] shadow-inner'
                                        : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                                    }`}
                            >
                                <ArrowUpZA className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono leading-none">Z↓A</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('author_asc')}
                                title="Sort Author A to Z"
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${sortBy === 'author_asc'
                                        ? 'bg-[#23527c] text-white border-[#1a3d5d] shadow-inner'
                                        : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                                    }`}
                            >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono leading-none">A↓Z</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('author_desc')}
                                title="Sort Author Z to A"
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${sortBy === 'author_desc'
                                        ? 'bg-[#23527c] text-white border-[#1a3d5d] shadow-inner'
                                        : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                                    }`}
                            >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono leading-none">Z↓A</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('copies_desc')}
                                title="Sort by Most Copies Available"
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${sortBy === 'copies_desc'
                                        ? 'bg-[#23527c] text-white border-[#1a3d5d] shadow-inner'
                                        : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                                    }`}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono leading-none">Copies</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('rating_desc')}
                                title="Sort by Highest Star Rating"
                                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${sortBy === 'rating_desc'
                                        ? 'bg-[#23527c] text-white border-[#1a3d5d] shadow-inner'
                                        : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                                    }`}
                            >
                                <Star className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono leading-none">★5→1</span>
                            </button>

                            {activeBrowse === 'discover' && (
                                <button
                                    type="button"
                                    onClick={() => setDiscoverSeed((s) => s + 1)}
                                    className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 bg-[#3b9c88] hover:bg-[#318473] text-white cursor-pointer ml-1"
                                >
                                    <Compass className="w-3.5 h-3.5" />
                                    <span>Shuffle Books</span>
                                </button>
                            )}
                        </div>

                        {/* Right: Per-Page Selector & View Mode Toggle (Cover Grid / Detailed / Table) */}
                        <div className="flex items-center gap-2">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className={`text-xs py-1.5 px-2 rounded border outline-none cursor-pointer ${isLight
                                        ? 'bg-white border-slate-300 text-slate-700'
                                        : 'bg-gray-900 border-gray-700 text-gray-300'
                                    }`}
                                title="Books per page"
                            >
                                <option value={18}>18 / page</option>
                                <option value={24}>24 / page</option>
                                <option value={36}>36 / page</option>
                                <option value={48}>48 / page</option>
                                <option value={96}>96 / page</option>
                            </select>

                            <div
                                className={`flex items-center rounded border overflow-hidden ${isLight ? 'border-slate-300 bg-white' : 'border-gray-700 bg-gray-900'
                                    }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    title="Cover Grid View"
                                    className={`p-1.5 cursor-pointer transition-colors ${viewMode === 'grid'
                                            ? 'bg-[#337ab7] text-white'
                                            : isLight
                                                ? 'text-slate-600 hover:bg-slate-100'
                                                : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('detailed')}
                                    title="Detailed Cards View"
                                    className={`p-1.5 cursor-pointer transition-colors border-l ${isLight ? 'border-slate-300' : 'border-gray-700'
                                        } ${viewMode === 'detailed'
                                            ? 'bg-[#337ab7] text-white'
                                            : isLight
                                                ? 'text-slate-600 hover:bg-slate-100'
                                                : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    title="Compact Table View (Books List)"
                                    className={`p-1.5 cursor-pointer transition-colors border-l ${isLight ? 'border-slate-300' : 'border-gray-700'
                                        } ${viewMode === 'list'
                                            ? 'bg-[#337ab7] text-white'
                                            : isLight
                                                ? 'text-slate-600 hover:bg-slate-100'
                                                : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                >
                                    <Table2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ADVANCED MULTI-FACETED FILTRATION PANEL */}
                    {showAdvancedFilters && (
                        <div
                            className={`mb-6 p-4 rounded-lg border space-y-4 transition-all ${isLight
                                    ? 'bg-[#F8FAFC] border-[#E2E8F0] shadow-xs'
                                    : 'bg-[#1E293B] border-[#334155] shadow-md'
                                }`}
                        >
                            {/* Row 1: Primary Dropdown Filters */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {/* Availability Filter */}
                                <div>
                                    <label
                                        className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'
                                            }`}
                                    >
                                        Availability Status
                                    </label>
                                    <select
                                        value={availabilityFilter}
                                        onChange={(e) => {
                                            setAvailabilityFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className={`w-full text-xs py-2 px-2.5 rounded border outline-none cursor-pointer ${isLight
                                                ? 'bg-slate-50 border-slate-300 text-slate-800'
                                                : 'bg-[#161f33] border-gray-700 text-gray-200'
                                            }`}
                                    >
                                        <option value="all">All Holdings</option>
                                        <option value="available">✅ Available Now</option>
                                        <option value="borrowed">⏳ Currently Borrowed</option>
                                        <option value="multi_copy">📚 Multi-Copy (2+ Copies)</option>
                                        <option value="single_copy">📖 Single Copy Only</option>
                                    </select>
                                </div>

                                {/* Author Filter */}
                                <div>
                                    <label
                                        className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'
                                            }`}
                                    >
                                        Author ({facets.authors.length})
                                    </label>
                                    <select
                                        value={selectedAuthor}
                                        onChange={(e) => {
                                            setSelectedAuthor(e.target.value);
                                            setPage(1);
                                        }}
                                        className={`w-full text-xs py-2 px-2.5 rounded border outline-none cursor-pointer ${isLight
                                                ? 'bg-slate-50 border-slate-300 text-slate-800'
                                                : 'bg-[#161f33] border-gray-700 text-gray-200'
                                            }`}
                                    >
                                        <option value="">All Authors</option>
                                        {facets.authors.map((a) => (
                                            <option key={a.name} value={a.name}>
                                                {a.name} ({a.count})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Star Rating Filter */}
                                <div>
                                    <label
                                        className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'
                                            }`}
                                    >
                                        Star Rating
                                    </label>
                                    <select
                                        value={exactRatingFilter ? `exact-${exactRatingFilter}` : `min-${minRatingFilter}`}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.startsWith('exact-')) {
                                                setExactRatingFilter(Number(val.replace('exact-', '')));
                                                setMinRatingFilter(0);
                                            } else {
                                                setMinRatingFilter(Number(val.replace('min-', '')));
                                                setExactRatingFilter(0);
                                            }
                                            setPage(1);
                                        }}
                                        className={`w-full text-xs py-2 px-2.5 rounded border outline-none cursor-pointer ${isLight
                                                ? 'bg-slate-50 border-slate-300 text-slate-800'
                                                : 'bg-[#161f33] border-gray-700 text-gray-200'
                                            }`}
                                    >
                                        <option value="min-0">Any Rating</option>
                                        <option value="exact-5">★★★★★ (5 Stars Only)</option>
                                        <option value="min-4">★★★★☆ (4+ Stars)</option>
                                        <option value="min-3">★★★☆☆ (3+ Stars)</option>
                                        <option value="exact-4">★★★★☆ (Exact 4 Stars)</option>
                                        <option value="exact-3">★★★☆☆ (Exact 3 Stars)</option>
                                    </select>
                                </div>

                                {/* Reader Status Filter */}
                                <div>
                                    <label
                                        className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'
                                            }`}
                                    >
                                        Reading & Personal
                                    </label>
                                    <select
                                        value={readStatusFilter}
                                        onChange={(e) => {
                                            setReadStatusFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className={`w-full text-xs py-2 px-2.5 rounded border outline-none cursor-pointer ${isLight
                                                ? 'bg-slate-50 border-slate-300 text-slate-800'
                                                : 'bg-[#161f33] border-gray-700 text-gray-200'
                                            }`}
                                    >
                                        <option value="all">All Books</option>
                                        <option value="read">✓ Marked as Read</option>
                                        <option value="unread">○ Unread Books</option>
                                        <option value="favorited">❤️ Saved in Favorites</option>
                                        <option value="my_loans">📌 Borrowed by Me</option>
                                    </select>
                                </div>

                                {/* Language Filter */}
                                <div>
                                    <label
                                        className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'
                                            }`}
                                    >
                                        Language
                                    </label>
                                    <select
                                        value={languageFilter}
                                        onChange={(e) => {
                                            setLanguageFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className={`w-full text-xs py-2 px-2.5 rounded border outline-none cursor-pointer ${isLight
                                                ? 'bg-slate-50 border-slate-300 text-slate-800'
                                                : 'bg-[#161f33] border-gray-700 text-gray-200'
                                            }`}
                                    >
                                        <option value="all">All Languages</option>
                                        {facets.languages.map((l) => (
                                            <option key={l.name} value={l.name}>
                                                {l.name} ({l.count})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Multi-Select Category Chips Bar */}
                            <div className={`pt-3 border-t ${isLight ? 'border-slate-200' : 'border-gray-800'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'
                                                }`}
                                        >
                                            Categories (Click multiple to combine):
                                        </span>
                                        {selectedGenres.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setGenreMatchMode((m) => (m === 'OR' ? 'AND' : 'OR'))}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#337ab7] text-white cursor-pointer"
                                                title="Switch between matching ANY selected category (OR) or ALL selected categories (AND)"
                                            >
                                                Match: {genreMatchMode}
                                            </button>
                                        )}
                                    </div>
                                    {selectedGenres.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedGenres([])}
                                            className="text-[11px] text-[#3b9c88] hover:underline font-medium cursor-pointer"
                                        >
                                            Clear Categories ({selectedGenres.length})
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedGenres([]);
                                            setPage(1);
                                        }}
                                        className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${selectedGenres.length === 0
                                                ? 'bg-[#337ab7] text-white border-[#2e6da4]'
                                                : isLight
                                                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                    : 'bg-gray-800/70 text-gray-300 border-gray-700 hover:bg-gray-800'
                                            }`}
                                    >
                                        All Categories
                                    </button>
                                    {facets.genres.map((g) => {
                                        const isSelected = selectedGenres.includes(g.name);
                                        return (
                                            <button
                                                key={g.name}
                                                type="button"
                                                onClick={() => toggleGenreSelection(g.name)}
                                                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1 ${isSelected
                                                        ? 'bg-[#3b9c88] text-white border-[#318473]'
                                                        : isLight
                                                            ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                                            : 'bg-gray-800/70 text-gray-300 border-gray-700 hover:bg-gray-800'
                                                    }`}
                                            >
                                                <span>{g.name}</span>
                                                <span className="text-[10px] opacity-70 font-mono">({g.count})</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Row 3: A–Z Alphabetical Quick Jump & Metadata Toggles */}
                            <div
                                className={`pt-3 border-t flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${isLight ? 'border-slate-200' : 'border-gray-800'
                                    }`}
                            >
                                {/* A-Z Bar */}
                                <div className="flex items-center gap-1 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setLetterTarget((t) => (t === 'title' ? 'author' : 'title'))}
                                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded mr-1 border cursor-pointer ${isLight
                                                ? 'bg-slate-100 border-slate-300 text-slate-700'
                                                : 'bg-gray-800 border-gray-700 text-gray-300'
                                            }`}
                                        title="Click to switch A-Z filter between Book Title and Author Name"
                                    >
                                        {letterTarget === 'title' ? 'Title A-Z:' : 'Author A-Z:'}
                                    </button>
                                    {ALPHABET.map((char) => (
                                        <button
                                            key={char}
                                            type="button"
                                            onClick={() => {
                                                setLetterFilter(char);
                                                setPage(1);
                                            }}
                                            className={`min-w-[24px] h-6 px-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${letterFilter === char
                                                    ? 'bg-[#337ab7] text-white'
                                                    : isLight
                                                        ? 'text-slate-600 hover:bg-slate-200'
                                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                }`}
                                        >
                                            {char}
                                        </button>
                                    ))}
                                </div>

                                {/* Quality Checkboxes & Reset Button */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={onlyWithCover}
                                            onChange={(e) => {
                                                setOnlyWithCover(e.target.checked);
                                                setPage(1);
                                            }}
                                            className="rounded accent-[#3b9c88]"
                                        />
                                        <span className={isLight ? 'text-slate-600' : 'text-gray-300'}>With Cover Image</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={onlyWithDescription}
                                            onChange={(e) => {
                                                setOnlyWithDescription(e.target.checked);
                                                setPage(1);
                                            }}
                                            className="rounded accent-[#3b9c88]"
                                        />
                                        <span className={isLight ? 'text-slate-600' : 'text-gray-300'}>With Summary</span>
                                    </label>

                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={resetAllFilters}
                                            className="px-2.5 py-1 rounded text-xs font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Reset All ({activeFilterCount})</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTIVE FILTER CHIPS STRIP */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                Active Filters:
                            </span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#337ab7]/15 text-[#337ab7] border border-[#337ab7]/30">
                                    Search ({searchField}): &ldquo;{searchQuery}&rdquo;
                                    <X
                                        className="w-3 h-3 cursor-pointer"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchParams({});
                                        }}
                                    />
                                </span>
                            )}
                            {selectedGenres.map((g) => (
                                <span
                                    key={g}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3b9c88]/15 text-[#3b9c88] border border-[#3b9c88]/30"
                                >
                                    Category: {g}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => toggleGenreSelection(g)} />
                                </span>
                            ))}
                            {selectedAuthor && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3b9c88]/15 text-[#3b9c88] border border-[#3b9c88]/30">
                                    Author: {selectedAuthor}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedAuthor('')} />
                                </span>
                            )}
                            {availabilityFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                    Status: {availabilityFilter}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setAvailabilityFilter('all')} />
                                </span>
                            )}
                            {(minRatingFilter > 0 || exactRatingFilter > 0) && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                    Rating: {exactRatingFilter ? `${exactRatingFilter}★` : `${minRatingFilter}+ ★`}
                                    <X
                                        className="w-3 h-3 cursor-pointer"
                                        onClick={() => {
                                            setMinRatingFilter(0);
                                            setExactRatingFilter(0);
                                        }}
                                    />
                                </span>
                            )}
                            {readStatusFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                    Personal: {readStatusFilter}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setReadStatusFilter('all')} />
                                </span>
                            )}
                            {languageFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                    Language: {languageFilter}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setLanguageFilter('all')} />
                                </span>
                            )}
                            {letterFilter !== 'ALL' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                    Starts with ({letterTarget}): {letterFilter}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setLetterFilter('ALL')} />
                                </span>
                            )}
                        </div>
                    )}

                    {/* TAXONOMY DIRECTORY EXPLORER (When Categories, Authors, or Ratings is clicked in Sidebar) */}
                    {isTaxonomyView && (
                        <div
                            className={`mb-6 p-4 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#1E293B] border-[#334155]'
                                }`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3b9c88]">
                                    Browse by {currentHeading}
                                </h2>
                                <input
                                    type="text"
                                    value={taxonomySearch}
                                    onChange={(e) => setTaxonomySearch(e.target.value)}
                                    placeholder={`Filter ${currentHeading.toLowerCase()}...`}
                                    className={`text-xs py-1 px-2.5 rounded border outline-none ${isLight
                                            ? 'bg-slate-50 border-slate-300 text-slate-800'
                                            : 'bg-gray-900 border-gray-700 text-gray-200'
                                        }`}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                {activeBrowse === 'categories' &&
                                    facets.genres
                                        .filter((g) => g.name.toLowerCase().includes(taxonomySearch.toLowerCase()))
                                        .map((g) => {
                                            const active = selectedGenres.includes(g.name);
                                            return (
                                                <button
                                                    key={g.name}
                                                    type="button"
                                                    onClick={() => toggleGenreSelection(g.name)}
                                                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 border cursor-pointer transition-colors ${active
                                                            ? 'bg-[#3b9c88] text-white border-[#318473]'
                                                            : isLight
                                                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                                                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                                                        }`}
                                                >
                                                    <span>{g.name}</span>
                                                    <span className="text-[10px] font-mono opacity-75">({g.count})</span>
                                                </button>
                                            );
                                        })}

                                {activeBrowse === 'authors' &&
                                    facets.authors
                                        .filter((a) => a.name.toLowerCase().includes(taxonomySearch.toLowerCase()))
                                        .map((a) => {
                                            const active = selectedAuthor === a.name;
                                            return (
                                                <button
                                                    key={a.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedAuthor(active ? '' : a.name);
                                                        setPage(1);
                                                    }}
                                                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 border cursor-pointer transition-colors ${active
                                                            ? 'bg-[#3b9c88] text-white border-[#318473]'
                                                            : isLight
                                                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                                                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                                                        }`}
                                                >
                                                    <span>{a.name}</span>
                                                    <span className="text-[10px] font-mono opacity-75">({a.count})</span>
                                                </button>
                                            );
                                        })}

                                {activeBrowse === 'ratings' &&
                                    facets.ratings.map((r) => {
                                        const active = exactRatingFilter === r.stars;
                                        return (
                                            <button
                                                key={r.stars}
                                                type="button"
                                                onClick={() => {
                                                    setExactRatingFilter(active ? 0 : r.stars);
                                                    setMinRatingFilter(0);
                                                    setPage(1);
                                                }}
                                                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 border cursor-pointer transition-colors ${active
                                                        ? 'bg-[#3b9c88] text-white border-[#318473]'
                                                        : isLight
                                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                                                    }`}
                                            >
                                                <span>{'★'.repeat(r.stars) + '☆'.repeat(5 - r.stars)}</span>
                                                <span className="text-[10px] font-mono opacity-75">({r.count})</span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* MAIN BOOKS DISPLAY */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-28">
                            <Loader text="Loading library catalogue..." />
                        </div>
                    ) : paginatedBooks.length === 0 ? (
                        <div
                            className={`my-10 p-12 rounded-xl border text-center space-y-3 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e1526] border-gray-800'
                                }`}
                        >
                            <div className="text-4xl">📚</div>
                            <h3 className="text-lg font-bold">No matching books found</h3>
                            <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                Try clearing some filters, switching browse categories in the left sidebar, or searching with broader keywords.
                            </p>
                            <button
                                type="button"
                                onClick={resetAllFilters}
                                className="px-4 py-2 rounded bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-semibold cursor-pointer"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* 1. CALIBRE-WEB 6-COLUMN COVER GRID VIEW (Exact Screenshot Layout) */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-9 pt-1 pb-10">
                            {paginatedBooks.map((book) => {
                                const fallbackCover = generateFallbackCover(book.name, book.author);
                                return (
                                    <div key={book._id} className="group flex flex-col relative">
                                        {/* Book Cover Wrapper */}
                                        <div
                                            onClick={() => navigate(`/book/${book._id}`)}
                                            className={`relative w-full aspect-[2/3] rounded-[3px] overflow-hidden cursor-pointer transition-all duration-300 group-hover:-translate-y-1 ${isLight
                                                    ? 'bg-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.16)] group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.22)] border border-slate-300/80'
                                                    : 'bg-gray-900 shadow-[0_4px_14px_rgba(0,0,0,0.6)] group-hover:shadow-blue-500/20 border border-gray-800'
                                                }`}
                                        >
                                            <img
                                                src={book.image || fallbackCover}
                                                alt={book.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = fallbackCover;
                                                }}
                                            />

                                            {/* Bottom-Left Circular Read Checkmark Badge (Just like the screenshot!) */}
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleRead(book, e)}
                                                title={book.isRead ? 'Marked as Read (click to toggle)' : 'Mark as Read'}
                                                className={`absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${book.isRead
                                                        ? 'bg-white text-slate-900 opacity-100 scale-100'
                                                        : 'bg-black/65 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black'
                                                    }`}
                                            >
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </button>

                                            {/* Top-Right Status / Multi-Copy Indicator */}
                                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                                {book.isBorrowed && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/95 text-black shadow-xs">
                                                        Loaned
                                                    </span>
                                                )}
                                                {book.copyCount > 1 && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/75 text-white backdrop-blur-xs">
                                                        {book.copyCount}x
                                                    </span>
                                                )}
                                            </div>

                                            {/* Hover Quick Action Overlay Bar */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleToggleFavorite(book, e)}
                                                    title={book.isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-colors ${book.isFavorite
                                                            ? 'bg-rose-500 text-white'
                                                            : 'bg-black/70 text-white hover:bg-rose-500'
                                                        }`}
                                                >
                                                    <Heart className={`w-3.5 h-3.5 ${book.isFavorite ? 'fill-white' : ''}`} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShelfMenuBookId(shelfMenuBookId === book._id ? null : book._id);
                                                    }}
                                                    title="Add to Shelf"
                                                    className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#3b9c88] text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
                                                >
                                                    <FolderPlus className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setQuickViewBook(book);
                                                    }}
                                                    title="Quick Preview"
                                                    className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#337ab7] text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Add-to-Shelf Popover Menu */}
                                        {shelfMenuBookId === book._id && (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className={`absolute top-20 left-2 z-30 w-44 p-2 rounded-lg shadow-xl border text-xs ${isLight
                                                        ? 'bg-white border-slate-200 text-slate-800'
                                                        : 'bg-gray-900 border-gray-700 text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-700/40 font-bold text-[11px]">
                                                    <span>Add to Shelf</span>
                                                    <X
                                                        className="w-3.5 h-3.5 cursor-pointer"
                                                        onClick={() => setShelfMenuBookId(null)}
                                                    />
                                                </div>
                                                <div className="space-y-1 max-h-36 overflow-y-auto">
                                                    {shelves.map((shelf) => {
                                                        const inShelf = shelf.bookIds.includes(book._id);
                                                        return (
                                                            <button
                                                                key={shelf.id}
                                                                type="button"
                                                                onClick={(e) => handleToggleBookInShelf(shelf.id, book._id, e)}
                                                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-left cursor-pointer ${inShelf
                                                                        ? 'bg-[#3b9c88]/20 text-[#3b9c88] font-semibold'
                                                                        : 'hover:bg-black/5'
                                                                    }`}
                                                            >
                                                                <span className="truncate">{shelf.name}</span>
                                                                {inShelf && <Check className="w-3 h-3 shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Book Title, Teal Author Link, and Star Rating Below Cover (Matching Screenshot) */}
                                        <div className="pt-2.5 flex flex-col">
                                            <h3
                                                onClick={() => navigate(`/book/${book._id}`)}
                                                title={book.name}
                                                className={`text-[13px] font-bold leading-snug line-clamp-2 cursor-pointer hover:underline ${isLight ? 'text-slate-800' : 'text-gray-100'
                                                    }`}
                                            >
                                                {book.name}
                                            </h3>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAuthor(
                                                        selectedAuthor === book.author ? '' : book.author
                                                    );
                                                    setPage(1);
                                                }}
                                                title={`Filter by ${book.author}`}
                                                className="mt-0.5 text-left text-[12px] text-[#3b9c88] hover:text-[#2c7a69] hover:underline truncate cursor-pointer w-fit max-w-full"
                                            >
                                                {book.author}
                                            </button>

                                            {/* Interactive 5-Star Rating Row */}
                                            <div className="flex items-center gap-0.5 mt-1.5">
                                                {[1, 2, 3, 4, 5].map((star) => {
                                                    const filled = star <= book.rating;
                                                    return (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={(e) => handleSetRating(book, star, e)}
                                                            title={`Rate ${star} stars`}
                                                            className="cursor-pointer focus:outline-none"
                                                        >
                                                            <Star
                                                                className={`w-3.5 h-3.5 transition-transform hover:scale-125 ${filled
                                                                        ? isLight
                                                                            ? 'fill-slate-600 text-slate-600'
                                                                            : 'fill-amber-400 text-amber-400'
                                                                        : isLight
                                                                            ? 'text-slate-300'
                                                                            : 'text-gray-700'
                                                                    }`}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : viewMode === 'detailed' ? (
                        /* 2. DETAILED CARDS VIEW */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
                            {paginatedBooks.map((book) => {
                                const fallbackCover = generateFallbackCover(book.name, book.author);
                                return (
                                    <div
                                        key={book._id}
                                        className={`flex gap-4 p-4 rounded-xl border transition-all ${isLight
                                                ? 'bg-white border-slate-200 hover:shadow-md'
                                                : 'bg-[#0e1526] border-gray-800 hover:border-blue-500/40'
                                            }`}
                                    >
                                        <img
                                            src={book.image || fallbackCover}
                                            alt={book.name}
                                            onClick={() => navigate(`/book/${book._id}`)}
                                            className="w-28 h-40 object-cover rounded shadow-sm shrink-0 cursor-pointer"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = fallbackCover;
                                            }}
                                        />
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3
                                                        onClick={() => navigate(`/book/${book._id}`)}
                                                        className="font-bold text-sm line-clamp-2 cursor-pointer hover:underline"
                                                    >
                                                        {book.name}
                                                    </h3>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${book.isAvailable
                                                                ? 'bg-emerald-500/15 text-emerald-500'
                                                                : 'bg-amber-500/15 text-amber-500'
                                                            }`}
                                                    >
                                                        {book.isAvailable ? 'Available' : 'Borrowed'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedAuthor(book.author)}
                                                    className="text-xs text-[#3b9c88] hover:underline mt-0.5 block truncate cursor-pointer"
                                                >
                                                    {book.author}
                                                </button>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {book.genres.slice(0, 3).map((g) => (
                                                        <span
                                                            key={g}
                                                            onClick={() => toggleGenreSelection(g)}
                                                            className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${isLight
                                                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                                }`}
                                                        >
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p
                                                    className={`text-xs mt-2 line-clamp-2 ${isLight ? 'text-slate-500' : 'text-gray-400'
                                                        }`}
                                                >
                                                    {book.description || 'No summary provided for this volume.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-500/15 text-xs">
                                                <span className="font-mono text-[10px] opacity-70">
                                                    ISBN: {book.isbn} • {book.copyCount} {book.copyCount === 1 ? 'copy' : 'copies'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/book/${book._id}`)}
                                                    className="text-[#337ab7] font-semibold hover:underline cursor-pointer"
                                                >
                                                    Open →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* 3. COMPACT TABLE / BOOKS LIST VIEW */
                        <div
                            className={`rounded-lg border overflow-hidden mb-10 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e1526] border-gray-800'
                                }`}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr
                                            className={`border-b uppercase text-[10px] font-bold tracking-wider ${isLight
                                                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                                                    : 'bg-gray-900/90 border-gray-800 text-gray-400'
                                                }`}
                                        >
                                            <th className="py-3 px-3 w-12">Cover</th>
                                            <th className="py-3 px-3">Title</th>
                                            <th className="py-3 px-3">Author</th>
                                            <th className="py-3 px-3">Categories</th>
                                            <th className="py-3 px-3">ISBN</th>
                                            <th className="py-3 px-3">Copies</th>
                                            <th className="py-3 px-3">Status</th>
                                            <th className="py-3 px-3">Rating</th>
                                            <th className="py-3 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-500/15">
                                        {paginatedBooks.map((book) => {
                                            const fallbackCover = generateFallbackCover(book.name, book.author);
                                            return (
                                                <tr
                                                    key={book._id}
                                                    className={
                                                        isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'
                                                    }
                                                >
                                                    <td className="py-2 px-3">
                                                        <img
                                                            src={book.image || fallbackCover}
                                                            alt={book.name}
                                                            onClick={() => navigate(`/book/${book._id}`)}
                                                            className="w-8 h-12 object-cover rounded cursor-pointer"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = fallbackCover;
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 font-bold max-w-xs">
                                                        <div
                                                            onClick={() => navigate(`/book/${book._id}`)}
                                                            className="cursor-pointer hover:underline line-clamp-1"
                                                        >
                                                            {book.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedAuthor(book.author)}
                                                            className="text-[#3b9c88] hover:underline cursor-pointer text-left"
                                                        >
                                                            {book.author}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {book.genres.slice(0, 2).map((g) => (
                                                                <span
                                                                    key={g}
                                                                    onClick={() => toggleGenreSelection(g)}
                                                                    className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${isLight
                                                                            ? 'bg-slate-100 text-slate-700'
                                                                            : 'bg-gray-800 text-gray-300'
                                                                        }`}
                                                                >
                                                                    {g}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-[11px] opacity-75">
                                                        {book.isbn}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono">{book.copyCount}</td>
                                                    <td className="py-2 px-3">
                                                        <span
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${book.isAvailable
                                                                    ? 'bg-emerald-500/15 text-emerald-500'
                                                                    : 'bg-amber-500/15 text-amber-500'
                                                                }`}
                                                        >
                                                            {book.isAvailable ? 'Available' : 'Borrowed'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-amber-500 font-semibold">
                                                        {'★'.repeat(book.rating)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleToggleRead(book, e)}
                                                                title="Toggle Read"
                                                                className={`p-1 rounded cursor-pointer ${book.isRead ? 'text-emerald-500' : 'opacity-40 hover:opacity-100'
                                                                    }`}
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleToggleArchive(book, e)}
                                                                title={book.isArchived ? 'Unarchive' : 'Archive Book'}
                                                                className="p-1 rounded opacity-50 hover:opacity-100 cursor-pointer"
                                                            >
                                                                <Archive className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/book/${book._id}`)}
                                                                className="px-2.5 py-1 rounded bg-[#337ab7] text-white text-[11px] font-semibold cursor-pointer"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PAGINATION BAR */}
                    {totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-10 border-t border-gray-500/20">
                            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                Showing {(currentPage - 1) * itemsPerPage + 1}–
                                {Math.min(currentPage * itemsPerPage, filteredBooks.length)} of{' '}
                                <strong>{filteredBooks.length}</strong> books
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 border cursor-pointer disabled:opacity-40 ${isLight
                                            ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                                            : 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800'
                                        }`}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Prev</span>
                                </button>

                                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                    let pageNum = i + 1;
                                    if (totalPages > 7 && currentPage > 4) {
                                        pageNum = Math.min(totalPages - 6 + i, currentPage - 3 + i);
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            onClick={() => setPage(pageNum)}
                                            className={`w-8 h-8 rounded text-xs font-bold cursor-pointer transition-colors ${currentPage === pageNum
                                                    ? 'bg-[#337ab7] text-white'
                                                    : isLight
                                                        ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                                        : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 border cursor-pointer disabled:opacity-40 ${isLight
                                            ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                                            : 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800'
                                        }`}
                                >
                                    <span>Next</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* CREATE A SHELF MODAL */}
            {showCreateShelfModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div
                        className={`w-full max-w-sm rounded-xl p-6 border shadow-2xl ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f172a] border-gray-800 text-white'
                            }`}
                    >
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-500/20">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Bookmark className="w-4 h-4 text-[#3b9c88]" />
                                <span>Create a New Shelf</span>
                            </h3>
                            <button onClick={() => setShowCreateShelfModal(false)} className="cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateShelf} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5 opacity-80">Shelf Name</label>
                                <input
                                    type="text"
                                    value={newShelfName}
                                    onChange={(e) => setNewShelfName(e.target.value)}
                                    placeholder="e.g., Antarctic Expeditions, Exam Prep..."
                                    autoFocus
                                    required
                                    className={`w-full px-3 py-2 rounded border text-xs outline-none ${isLight
                                            ? 'bg-slate-50 border-slate-300 text-slate-900'
                                            : 'bg-gray-900 border-gray-700 text-white'
                                        }`}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateShelfModal(false)}
                                    className="px-4 py-2 rounded text-xs font-semibold border border-gray-500/30 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded text-xs font-semibold bg-[#3b9c88] hover:bg-[#318473] text-white cursor-pointer"
                                >
                                    Create Shelf
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QUICK PREVIEW MODAL */}
            {quickViewBook && (
                <div
                    className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setQuickViewBook(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-2xl rounded-2xl p-6 border shadow-2xl flex flex-col sm:flex-row gap-6 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f172a] border-gray-800 text-white'
                            }`}
                    >
                        <img
                            src={quickViewBook.image || generateFallbackCover(quickViewBook.name, quickViewBook.author)}
                            alt={quickViewBook.name}
                            className="w-40 h-60 object-cover rounded-lg shadow-md mx-auto sm:mx-0 shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-lg font-bold leading-snug">{quickViewBook.name}</h3>
                                    <button onClick={() => setQuickViewBook(null)} className="cursor-pointer p-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-[#3b9c88] font-medium mt-0.5">{quickViewBook.author}</p>

                                <div className="flex flex-wrap gap-1.5 my-3">
                                    {quickViewBook.genres.map((g) => (
                                        <span
                                            key={g}
                                            className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#337ab7]/15 text-[#337ab7]"
                                        >
                                            {g}
                                        </span>
                                    ))}
                                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-gray-500/15">
                                        ISBN: {quickViewBook.isbn}
                                    </span>
                                </div>

                                <p className="text-xs leading-relaxed opacity-80 max-h-32 overflow-y-auto">
                                    {quickViewBook.description ||
                                        'This volume is indexed in the PS Library catalogue. Click Full Details to inspect copy locations and loan history.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-gray-500/20">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/book/${quickViewBook._id}`)}
                                    className="px-4 py-2 rounded bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-semibold cursor-pointer"
                                >
                                    Open Full Book Page
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleToggleRead(quickViewBook, e)}
                                    className="px-3 py-2 rounded border border-gray-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{quickViewBook.isRead ? 'Read' : 'Mark Read'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleToggleArchive(quickViewBook, e)}
                                    className="px-3 py-2 rounded border border-gray-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>{quickViewBook.isArchived ? 'Unarchive' : 'Archive'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ABOUT CATALOGUE STATS MODAL */}
            {showAboutModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setShowAboutModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-md rounded-xl p-6 border shadow-2xl space-y-4 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f172a] border-gray-800 text-white'
                            }`}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-500/20">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Info className="w-4 h-4 text-[#337ab7]" />
                                <span>About PS Library Catalogue</span>
                            </h3>
                            <button onClick={() => setShowAboutModal(false)} className="cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-[#337ab7]/10">
                                <div className="opacity-70">Unique Titles</div>
                                <div className="text-xl font-black text-[#337ab7]">{enrichedBooks.length}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-[#3b9c88]/10">
                                <div className="opacity-70">Authors Indexed</div>
                                <div className="text-xl font-black text-[#3b9c88]">{facets.authors.length}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-500/10">
                                <div className="opacity-70">Categories</div>
                                <div className="text-xl font-black text-emerald-500">{facets.genres.length}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-500/10">
                                <div className="opacity-70">Custom Shelves</div>
                                <div className="text-xl font-black text-amber-500">{shelves.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
