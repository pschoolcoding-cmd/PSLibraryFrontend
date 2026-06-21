import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';

const Search = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inputTerm, setInputTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGenre, setFilterGenre] = useState('');
    const [allGenres, setAllGenres] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBooks, setTotalBooks] = useState(0);
    const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'name'

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const fetchGenres = async () => {
        try {
            const cachedGenres = sessionStorage.getItem('library_genres');
            if (cachedGenres) {
                setAllGenres(JSON.parse(cachedGenres));
                return;
            }

            const response = await fetch(`${API_BASE_URL}/books/genres`, {
                headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' }
            });
            if (response.ok) {
                const data = await response.json();
                setAllGenres(data);
                sessionStorage.setItem('library_genres', JSON.stringify(data));
            }
        } catch (err) {
            console.error('Failed to fetch genres:', err);
        }
    };

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page,
                limit: 24,
                sortBy: sortBy
            });
            if (searchTerm) queryParams.append('q', searchTerm);
            if (filterGenre) queryParams.append('genre', filterGenre);

            const response = await fetch(`${API_BASE_URL}/books?${queryParams.toString()}`, {
                headers: {
                    'x-api-key': import.meta.env.VITE_API_KEY || ''
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch books');
            
            const result = await response.json();
            // Expected backend format: { data: [...], total: X, page: Y, pages: Z }
            // Backend now handles grouping and pagination via aggregation
            if (result && result.data) {
                setBooks(result.data);
                setTotalPages(result.pages);
                setTotalBooks(result.total);
            } else {
                // Fallback if backend does not return pagination yet
                setBooks(result);
                setTotalPages(1);
                setTotalBooks(result.length || 0);
            }
            
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGenres();
    }, []);

    useEffect(() => {
        fetchBooks();
    }, [page, searchTerm, filterGenre, sortBy]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setSearchTerm(inputTerm);
            setPage(1); // Reset to first page on new search
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(p => p - 1);
    };

    return (
        <div className='min-h-screen w-full bg-black text-white p-4 md:p-8'>
            {error && (
                <div className='fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-[50] animate-pulse'>
                    <span>⚠️</span>
                    <span>Network Error: {error}</span>
                </div>
            )}
            
            <div className='max-w-[1200px] mx-auto'>
                <div className='flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6'>
                    <div>
                        <h1 className='text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic tracking-tighter mb-2 uppercase font-[Outfit]'>
                            {searchTerm ? 'Search Results' : 'Recommended'}
                        </h1>
                        <p className='text-gray-500 font-medium'>Discover your next favorite read</p>
                    </div>
                    <button 
                        onClick={() => navigate('/scan')}
                        className='bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl shadow-blue-600/30'
                    >
                        <span className='text-xl'>📷</span> Smart ID Search
                    </button>
                </div>
                
                {/* Search and Filter Section */}
                <div className='bg-gray-900/40 backdrop-blur-xl p-6 rounded-3xl mb-12 border border-gray-800/50 shadow-2xl'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div className='space-y-2'>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1'>Quick Search</label>
                            <div className='relative'>
                                <input
                                    type='text'
                                    placeholder='Search by title or author...'
                                    value={inputTerm}
                                    onChange={(e) => setInputTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className='w-full p-4 pl-12 rounded-2xl bg-black/50 text-white border border-gray-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-hidden transition-all'
                                />
                                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl'>🔍</span>
                            </div>
                        </div>
                        <div className='space-y-2'>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1'>Category</label>
                            <select
                                value={filterGenre}
                                onChange={(e) => {
                                    setFilterGenre(e.target.value);
                                    setPage(1);
                                }}
                                className='w-full p-4 rounded-2xl bg-black/50 text-white border border-gray-800 focus:border-blue-500/50 outline-hidden transition-all appearance-none cursor-pointer'
                            >
                                <option value=''>All Genres</option>
                                {allGenres.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </select>
                        </div>
                        <div className='space-y-2'>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1'>Sort Order</label>
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setPage(1);
                                }}
                                className='w-full p-4 rounded-2xl bg-black/50 text-white border border-gray-800 focus:border-blue-500/50 outline-hidden transition-all appearance-none cursor-pointer'
                            >
                                <option value='recent'>Recently Added</option>
                                <option value='name'>Name (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Books Grid */}
                {loading ? (
                    <div className='flex flex-col items-center justify-center py-32'>
                        <Loader text="Curating the library's best..." />
                    </div>
                ) : books.length > 0 ? (
                    <>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8'>
                            {books.map((book) => (
                                <div 
                                    key={book.bid || book._id} 
                                    className='group flex flex-col sm:flex-row bg-[#0f172a] rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border border-gray-800/50 hover:border-blue-500/30'
                                    style={{ height: 'auto', minHeight: '18rem' }}
                                >
                                    {/* Book Cover */}
                                    <div className='w-full sm:w-[45%] h-64 sm:h-auto shrink-0 relative overflow-hidden'>
                                        {book.image ? (
                                            <img 
                                                src={book.image} 
                                                alt={book.name} 
                                                className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110' 
                                            />
                                        ) : (
                                            <div className='bg-gradient-to-br from-gray-800 to-gray-900 h-full flex flex-col items-center justify-center p-4'>
                                                <span className='text-5xl mb-3'>📖</span>
                                                <span className='text-[10px] text-gray-500 font-bold uppercase text-center'>{book.name}</span>
                                            </div>
                                        )}
                                        <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4'>
                                            <span className='text-white text-xs font-bold px-3 py-1 bg-blue-600 rounded-full'>Featured</span>
                                        </div>
                                    </div>

                                    {/* Book Info */}
                                    <div className='w-full sm:w-[55%] p-6 flex flex-col'>
                                        <div className='mb-auto'>
                                            <h3 className='text-white text-xl font-black line-clamp-2 leading-tight mb-2 group-hover:text-blue-400 transition-colors uppercase italic font-[Outfit]'>{book.name}</h3>
                                            
                                            <div className='mb-3'>
                                                <p className='text-gray-500 text-[10px] font-bold uppercase tracking-widest'>Author</p>
                                                <p className='text-gray-300 text-base font-semibold line-clamp-1'>{book.author || 'Anonymous'}</p>
                                            </div>

                                            <div className='flex flex-wrap gap-1.5 mb-4'>
                                                {book.copyCount > 1 && (
                                                    <span className='bg-blue-500/10 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-blue-500/20'>
                                                        {book.copyCount} COPIES
                                                    </span>
                                                )}
                                                {Array.isArray(book.genre) && book.genre.slice(0, 2).map((g, idx) => (
                                                    <span key={idx} className='bg-gray-800 text-gray-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-700 capitalize'>
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className='mt-4 space-y-4'>
                                            <p className='text-gray-400 text-xs line-clamp-2 leading-relaxed'>
                                                {book.description || 'Dive into this fascinating read and explore new worlds through literature.'}
                                            </p>
                                            <button 
                                                onClick={() => navigate(`/book/${book._id}`)}
                                                className='w-full bg-white hover:bg-blue-50 text-black py-3 rounded-2xl text-xs font-black transition-all active:scale-95 uppercase tracking-widest'
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className='flex items-center justify-center gap-4 mt-12 bg-gray-900 py-4 px-6 rounded-2xl w-fit mx-auto'>
                                <button 
                                    onClick={handlePrevPage}
                                    disabled={page === 1}
                                    className='px-4 py-2 bg-gray-800 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-gray-800 text-white rounded transition-colors'
                                >
                                    Previous
                                </button>
                                <span className='text-white font-medium'>
                                    Page {page} of {totalPages}
                                </span>
                                <button 
                                    onClick={handleNextPage}
                                    disabled={page === totalPages}
                                    className='px-4 py-2 bg-gray-800 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-gray-800 text-white rounded transition-colors'
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className='text-center py-12'>
                        <div className='text-gray-400 text-xl mb-4'>No books found</div>
                        <p className='text-gray-500'>Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;