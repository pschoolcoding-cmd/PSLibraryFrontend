import React, { useState, useEffect } from 'react';

const Search = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGenre, setFilterGenre] = useState('');
    const [allGenres, setAllGenres] = useState([]);

    const fetchBooks = async () => {
        try {
            const response = await fetch('https://pslibrarybackend.onrender.com/books', {
                headers: {
                    'x-api-key': import.meta.env.VITE_API_KEY
                }
            });
            if (!response.ok) throw new Error('Failed to fetch books');
            const data = await response.json();
            setBooks(data);
            extractGenres(data);
            setError(null); // Clear error on success
        } catch (err) {
            setError(err.message);
            // Don't set loading to false here to keep showing previous data
        }
    };

    const extractGenres = (booksData) => {
        const genres = new Set();
        booksData.forEach(book => {
            if (Array.isArray(book.genre)) {
                book.genre.forEach(g => genres.add(g));
            }
        });
        setAllGenres(Array.from(genres).sort());
    };

    useEffect(() => {
        fetchBooks();
        
        // Fetch books every second
        const interval = setInterval(() => {
            fetchBooks();
            console.log("fetch")
        }, 3000);
        
        return () => clearInterval(interval);
    }, []);

    const filteredBooks = books.filter(book => {
        const matchesSearch = 
            book.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesGenre = !filterGenre || 
            (Array.isArray(book.genre) && book.genre.includes(filterGenre));
        
        return matchesSearch && matchesGenre;
    });

    if (loading && books.length === 0) {
        return (
            <div className='h-screen w-full bg-black flex items-center justify-center'>
                <div className='text-white text-2xl'>Loading books...</div>
            </div>
        );
    }

    return (
        <div className='min-h-screen w-full bg-black text-white p-8'>
            {/* Error Notification */}
            {error && (
                <div className='fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse'>
                    <span>⚠️</span>
                    <span>Network Error: {error}</span>
                </div>
            )}
            <div className='max-w-7xl mx-auto'>
                <h1 className='text-4xl font-bold mb-8'>Book Library</h1>
                
                {/* Search and Filter Section */}
                <div className='bg-gray-900 p-6 rounded-lg mb-8'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium mb-2'>Search by Title or Author</label>
                            <input
                                type='text'
                                placeholder='Search books...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 outline-none'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium mb-2'>Filter by Genre</label>
                            <select
                                value={filterGenre}
                                onChange={(e) => setFilterGenre(e.target.value)}
                                className='w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 outline-none'
                            >
                                <option value=''>All Genres</option>
                                {allGenres.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Books Count */}
                <div className='mb-6 text-gray-400'>
                    Showing {filteredBooks.length} of {books.length} books
                </div>

                {/* Books Grid */}
                {filteredBooks.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {filteredBooks.map((book) => (
                            <div key={book.bid} className='bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-blue-500/50 transition-shadow duration-300'>
                                {/* Book Cover */}
                                <div className='h-48 w-full overflow-hidden'>
                                    {book.image ? (
                                        <img 
                                            src={book.image} 
                                            alt={book.name} 
                                            className='w-full h-full object-cover transition-transform duration-500 hover:scale-110' 
                                        />
                                    ) : (
                                        <div className='bg-linear-to-br from-blue-600 to-purple-600 h-full flex items-center justify-center'>
                                            <div className='text-center text-white'>
                                                <div className='text-4xl mb-2'>📚</div>
                                                <div className='text-sm font-semibold px-4'>{book.name}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Book Info */}
                                <div className='p-4'>
                                    <h3 className='text-xl font-bold mb-2 line-clamp-2'>{book.name}</h3>
                                    
                                    <div className='mb-3'>
                                        <p className='text-gray-400 text-sm mb-1'>Author</p>
                                        <p className='text-white font-medium'>{book.author || 'Unknown'}</p>
                                    </div>

                                    {/* Genres */}
                                    {Array.isArray(book.genre) && book.genre.length > 0 && (
                                        <div className='mb-3'>
                                            <p className='text-gray-400 text-sm mb-2'>Genres</p>
                                            <div className='flex flex-wrap gap-2'>
                                                {book.genre.map((g, idx) => (
                                                    <span key={idx} className='bg-blue-600 text-white text-xs px-2 py-1 rounded-full'>
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {book.description && (
                                        <div className='mb-4'>
                                            <p className='text-gray-400 text-sm line-clamp-3'>{book.description}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className='flex gap-2'>
                                        <button className='flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded transition-colors'>
                                            View Details
                                        </button>
                                        <button className='flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded transition-colors'>
                                            Borrow
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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