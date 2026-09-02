import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Heart, BookmarkPlus, Check, ArrowLeft, ShieldCheck, Sparkles, Edit, Trash2, X } from 'lucide-react';

const Viewbook = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { reader, isAuthenticated, isAdmin, borrowBook, toggleFavorite } = useAuth();

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copies, setCopies] = useState([]);
    const [loadingCopies, setLoadingCopies] = useState(false);
    const [borrowing, setBorrowing] = useState(false);
    const [borrowedSuccess, setBorrowedSuccess] = useState(false);

    // Admin edit state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAuthor, setEditAuthor] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [updatingBook, setUpdatingBook] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const API_KEY = import.meta.env.VITE_API_KEY || 'supersecret';

    const isFav = reader?.favoriteBooks?.includes(book?.bid || id);
    const isAlreadyBorrowed = reader?.borrowedBooks?.some(
      b => (b.bookId === id || b.bookId === book?.bid) && b.status === 'active'
    );

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
                setEditName(data.name || '');
                setEditAuthor(data.author || '');
                setEditDescription(data.description || '');
                setError(null);

                const isbn = data.bid?.substring(0, 13);
                const name = data.name;
                if (isbn && isbn.length >= 13) {
                    setLoadingCopies(true);
                    const copiesResponse = await fetch(`${API_BASE_URL}/books?bid=${isbn}&name=${encodeURIComponent(name)}&all=true`, {
                        headers: { 'x-api-key': import.meta.env.VITE_API_KEY || 'supersecret' }
                    });
                    if (copiesResponse.ok) {
                        const copiesResult = await copiesResponse.json();
                        setCopies(copiesResult.data || []);
                    }
                    setLoadingCopies(false);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    const handleBorrow = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        setBorrowing(true);
        await borrowBook({
          bookId: book?.bid || id,
          bookName: book?.name || 'Unknown Title',
          author: book?.author || 'Unknown Author',
          image: book?.image || ''
        });
        setBorrowedSuccess(true);
      } catch (err) {
        alert(err.message || 'Failed to borrow book');
      } finally {
        setBorrowing(false);
      }
    };

    const handleToggleFav = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        await toggleFavorite(book?.bid || id);
      } catch (err) {
        alert(err.message || 'Failed to update favorite');
      }
    };

    const handleSaveEdit = async (e) => {
      e.preventDefault();
      try {
        setUpdatingBook(true);
        const res = await fetch(`${API_BASE_URL}/books/${book?.bid || id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          body: JSON.stringify({
            name: editName,
            author: editAuthor,
            description: editDescription
          })
        });

        if (!res.ok) throw new Error('Failed to update book details');
        const updated = await res.json();
        setBook(updated);
        setShowEditModal(false);
      } catch (err) {
        alert(err.message || 'Error updating book');
      } finally {
        setUpdatingBook(false);
      }
    };

    const handleDeleteBook = async () => {
      if (!window.confirm('Are you sure you want to delete this book entry from the library catalog?')) return;
      try {
        const res = await fetch(`${API_BASE_URL}/books/${book?.bid || id}`, {
          method: 'DELETE',
          headers: { 'x-api-key': API_KEY }
        });

        if (!res.ok) throw new Error('Failed to delete book');
        alert('Book removed from catalog');
        navigate('/search');
      } catch (err) {
        alert(err.message || 'Error deleting book');
      }
    };

    if (loading) {
        return (
            <div className='min-h-screen w-full bg-black text-white p-8 flex items-center justify-center'>
                <Loader text="Opening the book..." />
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className='min-h-screen w-full bg-black text-white p-8 flex flex-col items-center justify-center gap-4'>
                <div className='text-rose-500 text-xl font-bold'>Error: {error || 'Book not found'}</div>
                <button onClick={() => navigate('/search')} className='bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-xl transition-colors'>
                    Back to Search
                </button>
            </div>
        );
    }

    return (
        <div className='min-h-screen w-full bg-[#030712] text-white pt-24 pb-12 px-4 md:px-12 overflow-y-auto selection:bg-blue-500/30 font-[Inter] relative'>
            <Navbar />

            <div className='max-w-6xl mx-auto'>
                <button 
                    onClick={() => navigate(-1)} 
                    className='mb-8 group bg-gray-900/50 hover:bg-white text-gray-400 hover:text-black px-5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all border border-gray-800/50 backdrop-blur-md cursor-pointer'
                >
                    <ArrowLeft className='w-4 h-4 transition-transform group-hover:-translate-x-1' /> 
                    <span className='text-xs font-black uppercase tracking-widest'>Back</span>
                </button>

                <div className='flex flex-col lg:flex-row gap-12'>
                    {/* Book Cover & Action Buttons */}
                    <div className='w-full lg:w-[35%] shrink-0'>
                        <div className='sticky top-28 space-y-6'>
                            <div className='w-full aspect-[2/3] bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] border border-gray-800 relative group'>
                                {book.image ? (
                                    <img src={book.image} alt={book.name} className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105' />
                                ) : (
                                    <div className='bg-gradient-to-br from-blue-900/20 to-black h-full flex flex-col items-center justify-center text-center p-8'>
                                        <div className='text-8xl mb-6 grayscale opacity-20'>📚</div>
                                        <div className='text-xl font-black uppercase italic tracking-tighter text-blue-400'>{book.name}</div>
                                    </div>
                                )}
                                <div className='absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60'></div>
                            </div>

                            {/* READER ACTION BUTTONS */}
                            <div className='space-y-3'>
                              <button
                                onClick={handleBorrow}
                                disabled={borrowing || isAlreadyBorrowed}
                                className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
                                  isAlreadyBorrowed || borrowedSuccess
                                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
                                }`}
                              >
                                {isAlreadyBorrowed || borrowedSuccess ? (
                                  <>
                                    <Check className='w-4 h-4 text-emerald-400' />
                                    <span>Borrowed / Active Loan</span>
                                  </>
                                ) : borrowing ? (
                                  <span>Processing Loan...</span>
                                ) : (
                                  <>
                                    <BookmarkPlus className='w-4 h-4' />
                                    <span>Borrow This Book</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={handleToggleFav}
                                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                                  isFav
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                    : 'bg-[#121217] hover:bg-[#1a1a20] text-gray-300 border-gray-800'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400 text-rose-400' : 'text-gray-400'}`} />
                                <span>{isFav ? 'Saved in Favorites' : 'Save to Favorites'}</span>
                              </button>

                              {/* ADMIN ACTIONS */}
                              {isAdmin && (
                                <div className="pt-4 border-t border-gray-800 space-y-2">
                                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest text-center">Librarian Controls</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => setShowEditModal(true)}
                                      className="py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span>Edit Book</span>
                                    </button>
                                    <button
                                      onClick={handleDeleteBook}
                                      className="py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Copy</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                        </div>
                    </div>

                    {/* Book Details */}
                    <div className='w-full lg:w-[65%] flex flex-col'>
                        <div className='space-y-6'>
                            <div className='space-y-2'>
                                <p className='text-blue-500 text-xs font-black uppercase tracking-[0.4em] font-[Outfit] flex items-center gap-2'>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Book Profile
                                </p>
                                <h1 className='text-4xl md:text-6xl font-black leading-[0.95] tracking-tighter uppercase italic font-[Outfit]'>{book.name}</h1>
                            </div>
                            
                            <div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8'>
                                <div>
                                    <p className='text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1'>Author</p>
                                    <p className='text-2xl font-bold text-gray-200'>{(book.author || 'Anonymous').toUpperCase()}</p>
                                </div>
                                <div className='h-10 w-px bg-gray-800 hidden sm:block'></div>
                                <div>
                                    <p className='text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1'>Identifier (ISBN)</p>
                                    <p className='text-xl font-mono text-blue-400 font-bold'>{(book.bid).split("-")[0]}</p>
                                </div>
                            </div>

                            <div className='pt-6'>
                                <p className='text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 italic'>Classified Under</p>
                                <div className='flex flex-wrap gap-2'>
                                    {Array.isArray(book.genre) && book.genre.length > 0 ? (
                                        book.genre.map((g, idx) => {
                                            const clean = String(g).replace(/^#+/, '').replace(/_/g, ' ').trim();
                                            return (
                                                <span key={idx} className='bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-default'>
                                                    {clean}
                                                </span>
                                            );
                                        })
                                    ) : typeof book.genre === 'string' && book.genre ? (
                                        book.genre.split(/[,#]/).filter(Boolean).map((g, idx) => {
                                            const clean = String(g).replace(/^#+/, '').replace(/_/g, ' ').trim();
                                            return (
                                                <span key={idx} className='bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-default'>
                                                    {clean}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className='text-gray-600 text-xs italic'>General Literature</span>
                                    )}
                                </div>
                            </div>

                            <div className='pt-8'>
                                <h3 className='text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-3'>
                                    <span>Summary</span>
                                    <div className='h-px flex-1 bg-gray-800/50'></div>
                                </h3>
                                <p className='text-gray-400 leading-relaxed text-base sm:text-lg font-medium selection:bg-blue-500/50'>
                                    {book.description || 'This work remains one of the library\'s most intriguing pieces, offering a window into the author\'s unique perspective and creative depth.'}
                                </p>
                            </div>

                            {/* Copies & Inventory section */}
                            <div className='mt-12 pt-10 border-t border-gray-800/50'>
                                <div className='flex items-center justify-between mb-8'>
                                    <h3 className='text-2xl font-black uppercase italic font-[Outfit] tracking-tighter'>Inventory Status</h3>
                                    <div className='bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5'>
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      ACTIVE HOLDINGS
                                    </div>
                                </div>
                                
                                {loadingCopies ? (
                                    <div className='flex flex-col items-center justify-center p-12 bg-gray-900/30 rounded-[2rem] border border-gray-800/30'>
                                        <Loader text="Auditing records..." />
                                    </div>
                                ) : copies.length > 0 ? (
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        {copies.sort((a, b) => a.bid.localeCompare(b.bid)).map((copy) => (
                                            <div key={copy._id} className='group bg-gray-900/40 p-5 rounded-2xl flex items-center justify-between border border-gray-800/50 hover:bg-gray-800/50 hover:border-blue-500/30 transition-all'>
                                                <div className='flex items-center gap-5'>
                                                    <div className='w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-gray-800 group-hover:border-blue-500/40 transition-colors'>
                                                        <span className='text-blue-500 font-bold text-xs'>#{copy.bid.split('-')[1] || '1'}</span>
                                                    </div>
                                                    <div>
                                                        <p className='text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5'>Location</p>
                                                        <p className={`font-black uppercase text-sm tracking-tight ${copy.borrowed === '0' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                            {copy.borrowed === '0' ? 'In Catalog' : copy.borrowed}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='text-right'>
                                                    <p className='text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5'>Sync</p>
                                                    <p className='font-mono text-[10px] text-gray-500'>{copy.whentaken?.split(' ')[0] || 'N/A'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='p-10 text-center bg-gray-900/30 rounded-[2rem] border border-gray-800/30'>
                                        <p className='text-gray-600 font-bold uppercase tracking-widest text-xs'>Universal distribution record</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT BOOK MODAL (ADMIN ONLY) */}
            {showEditModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0f0f14] border border-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                    <h3 className="text-lg font-black uppercase italic tracking-wider text-amber-400 font-[Outfit] flex items-center gap-2">
                      <Edit className="w-5 h-5" /> Edit Book Details
                    </h3>
                    <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white p-1">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Book Title</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full bg-[#181820] border border-gray-800 focus:border-amber-500 text-white text-sm rounded-xl p-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Author</label>
                      <input
                        type="text"
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        required
                        className="w-full bg-[#181820] border border-gray-800 focus:border-amber-500 text-white text-sm rounded-xl p-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                      <textarea
                        rows={4}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-[#181820] border border-gray-800 focus:border-amber-500 text-white text-sm rounded-xl p-3 outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="w-1/2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updatingBook}
                        className="w-1/2 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20"
                      >
                        {updatingBook ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
        </div>
    );
};

export default Viewbook;
