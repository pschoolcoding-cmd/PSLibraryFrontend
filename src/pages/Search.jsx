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
            
            <div className='max-w-[90%] mx-auto'>
                <div className='flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4'>
                    <h1 className='text-4xl font-bold'>{searchTerm ? 'Search Results' : 'Recommended Books'}</h1>
                    <button 
                        onClick={() => navigate('/scan')}
                        className='bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-blue-600/20'
                    >
                        <span>📷</span> Scan or Pattern Search
                    </button>
                </div>
                
                {/* Search and Filter Section */}
                <div className='bg-gray-900 p-6 rounded-lg mb-8'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium mb-2'>Search by Title or Author (Press Enter)</label>
                            <input
                                type='text'
                                placeholder='Type and press Enter...'
                                value={inputTerm}
                                onChange={(e) => setInputTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className='w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 outline-hidden'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium mb-2'>Filter by Genre</label>
                            <select
                                value={filterGenre}
                                onChange={(e) => {
                                    setFilterGenre(e.target.value);
                                    setPage(1); // Reset page on filter
                                }}
                                className='w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 outline-hidden'
                            >
                                <option value=''>All Genres</option>
                                {allGenres.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className='block text-sm font-medium mb-2'>Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setPage(1);
                                }}
                                className='w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 outline-hidden'
                            >
                                <option value='recent'>Recently Added</option>
                                <option value='name'>Book Name (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Books Count */}
                <div className='mb-6 text-gray-400'>
                    Showing {books.length} unique titles {totalBooks > 0 ? `out of ${totalBooks}` : ''}
                </div>

                {/* Books Grid */}
                {loading ? (
                    <div className='flex justify-center py-20'>
                        <Loader text="Fetching the best books for you..." />
                    </div>
                ) : books.length > 0 ? (
                    <>
                        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                            {books.map((book) => (
                                <div key={book.bid || book._id} className='flex flex-row bg-[#0a1024] rounded-3xl overflow-hidden hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 h-72 border border-gray-800'>
                                    {/* Book Cover */}
                                    <div className='w-[40%] h-full shrink-0 bg-gray-800'>
                                        {book.image ? (
                                            <img 
                                                src={book.image} 
                                                alt={book.name} 
                                                className='w-full h-full object-cover' 
                                            />
                                        ) : (
                                            <div className='bg-gradient-to-br from-blue-900 to-[#0a1030] h-full flex items-center justify-center'>
                                                <div className='text-center text-white px-2'>
                                                    <div className='text-3xl mb-2'>📚</div>
                                                    <div className='text-xs font-semibold'>{book.name}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Book Info */}
                                    <div className='w-[60%] p-4 flex flex-col h-full'>
                                        <h3 className='text-white text-xl font-bold line-clamp-2 leading-tight'>{book.name}</h3>
                                        
                                        <div className='mt-2'>
                                            <p className='text-gray-300 text-xs font-light tracking-wide'>Author:</p>
                                            <p className='text-white text-lg font-medium line-clamp-1'>{book.author || 'Someone'}</p>
                                        </div>

                                        {book.copyCount > 1 && (
                                            <div className='mt-1'>
                                                <span className='bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full'>
                                                    {book.copyCount} Copies
                                                </span>
                                            </div>
                                        )}

                                        {/* Genres */}
                                        <div className='mt-2'>
                                            <p className='text-gray-300 text-xs font-light tracking-wide mb-1'>Genres:</p>
                                            <div className='flex flex-wrap gap-1'>
                                                {Array.isArray(book.genre) && book.genre.length > 0 ? (
                                                    book.genre.slice(0, 3).map((g, idx) => (
                                                        <span key={idx} className='bg-gray-200 text-[#0a1030] text-[10px] font-bold px-2 py-0.5 rounded-full'>
                                                            {g}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className='bg-gray-200 text-[#0a1030] text-[10px] font-bold px-2 py-0.5 rounded-full'>
                                                        Unknown
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className='mt-3 flex-1 flex flex-col min-h-0'>
                                            <p className='text-gray-400 text-xs line-clamp-3 leading-snug'>
                                                {book.description || 'No description available for this book.'}
                                            </p>
                                            <div className='border-b border-gray-600 border-dotted mt-2 mb-2 w-1/2'></div>
                                        </div>

                                        {/* Actions */}
                                        <div className='mt-auto pt-2'>
                                            <button 
                                                onClick={() => navigate(`/book/${book._id}`)}
                                                className='w-full bg-[#d9d9d9] hover:bg-white text-black py-2 rounded-xl text-sm font-semibold transition-colors'
                                            >
                                                View details
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