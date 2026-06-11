import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Viewbook = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pslibrarybackend.onrender.com';

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/books/${id}`, {
                    headers: { 'x-api-key': import.meta.env.VITE_API_KEY || 'supersecret' }
                });
                if (!response.ok) {
                    if (response.status === 404) throw new Error('Book not found');
                    throw new Error('Failed to fetch book details');
                }
                const data = await response.json();
                setBook(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    if (loading) {
        return (
            <div className='min-h-screen w-full bg-black text-white p-8 flex items-center justify-center'>
                <div className='text-xl animate-pulse'>Loading book details...</div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className='min-h-screen w-full bg-black text-white p-8 flex flex-col items-center justify-center gap-4'>
                <div className='text-red-500 text-xl'>Error: {error || 'Book not found'}</div>
                <button onClick={() => navigate('/')} className='bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors'>
                    Back to Search
                </button>
            </div>
        );
    }

    return (
        <div className='min-h-screen w-full bg-black text-white p-4 md:p-8 overflow-y-auto'>
            <div className='max-w-5xl mx-auto'>
                <button onClick={() => navigate(-1)} className='mb-6 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'>
                    <span>&larr;</span> Back
                </button>

                <div className='flex flex-col md:flex-row gap-8 bg-gray-900 p-6 md:p-10 rounded-3xl'>
                    {/* Book Cover */}
                    <div className='w-full md:w-1/3 shrink-0'>
                        <div className='w-full aspect-[2/3] bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700'>
                            {book.image ? (
                                <img src={book.image} alt={book.name} className='w-full h-full object-cover' />
                            ) : (
                                <div className='bg-gradient-to-br from-blue-900 to-[#0a1030] h-full flex flex-col items-center justify-center text-center p-4'>
                                    <div className='text-6xl mb-4'>📚</div>
                                    <div className='text-lg font-semibold'>{book.name}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Book Details */}
                    <div className='w-full md:w-2/3 flex flex-col'>
                        <div className='flex justify-between items-start gap-4'>
                            <h1 className='text-4xl md:text-5xl font-bold leading-tight'>{book.name}</h1>
                        </div>
                        
                        <div className='mt-4 flex flex-col gap-2'>
                            <p className='text-xl text-gray-300'>by <span className='text-white font-medium'>{book.author || 'Unknown Author'}</span></p>
                            <div className='flex items-center gap-2'>
                                <span className='text-gray-400'>Book ID:</span>
                                <span className='font-mono bg-gray-800 px-3 py-1 rounded text-sm text-gray-200'>{book.bid}</span>
                            </div>
                        </div>

                        <div className='mt-6'>
                            <h3 className='text-lg font-semibold text-gray-300 mb-2'>Genres</h3>
                            <div className='flex flex-wrap gap-2'>
                                {Array.isArray(book.genre) && book.genre.length > 0 ? (
                                    book.genre.map((g, idx) => (
                                        <span key={idx} className='bg-blue-600/20 text-blue-400 border border-blue-600/30 px-4 py-1 rounded-full text-sm font-medium'>
                                            {g}
                                        </span>
                                    ))
                                ) : (
                                    <span className='bg-gray-800 text-gray-400 px-4 py-1 rounded-full text-sm'>No genres specified</span>
                                )}
                            </div>
                        </div>

                        <div className='mt-8 flex-1'>
                            <h3 className='text-xl font-bold mb-3 border-b border-gray-700 pb-2'>Description</h3>
                            <p className='text-gray-300 leading-relaxed whitespace-pre-wrap text-lg'>
                                {book.description || 'No description available for this book.'}
                            </p>
                        </div>

                        {/* Status section */}
                        <div className='mt-8 grid grid-cols-2 gap-4 border-t border-gray-800 pt-6'>
                            <div className='bg-gray-800/50 p-4 rounded-xl'>
                                <p className='text-gray-400 text-sm mb-1'>Borrowed Status</p>
                                <p className={`font-medium ${book.borrowed === '1' ? 'text-red-400' : 'text-green-400'}`}>
                                    {book.borrowed === '1' ? 'Currently Borrowed' : 'Available in Library'}
                                </p>
                            </div>
                            <div className='bg-gray-800/50 p-4 rounded-xl'>
                                <p className='text-gray-400 text-sm mb-1'>Date Added</p>
                                <p className='font-medium text-gray-200'>{book.whentoken || 'Unknown'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Viewbook;
