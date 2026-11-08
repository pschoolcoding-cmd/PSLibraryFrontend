import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Heart,
  BookmarkPlus,
  Check,
  ArrowLeft,
  ShieldCheck,
  Edit,
  Trash2,
  X,
  Tag,
  Calendar,
  Hash,
  User
} from 'lucide-react';

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
    (b) => (b.bookId === id || b.bookId === book?.bid) && b.status === 'active'
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
          const copiesResponse = await fetch(
            `${API_BASE_URL}/books?bid=${isbn}&name=${encodeURIComponent(name)}&all=true`,
            {
              headers: { 'x-api-key': import.meta.env.VITE_API_KEY || 'supersecret' }
            }
          );
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
    if (!window.confirm('Are you sure you want to delete this book entry from the library catalog?'))
      return;
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
      <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] p-8 flex items-center justify-center">
        <Loader text="Loading book record..." />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] p-8 flex flex-col items-center justify-center gap-4">
        <div className="text-rose-600 text-base font-bold">Error: {error || 'Book not found'}</div>
        <button
          onClick={() => navigate('/search')}
          className="cw-btn-primary px-5 py-2 text-xs"
        >
          Back to Catalogue
        </button>
      </div>
    );
  }

  const parsedGenres = Array.isArray(book.genre)
    ? book.genre
        .map((g) => String(g).replace(/^#+/, '').replace(/_/g, ' ').trim())
        .filter(Boolean)
    : typeof book.genre === 'string' && book.genre
    ? book.genre
        .split(/[,#]/)
        .map((g) => String(g).replace(/^#+/, '').replace(/_/g, ' ').trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] pt-20 pb-12 px-4 sm:px-8">
      <Navbar />

      <div className="max-w-6xl mx-auto">
        {/* Top Breadcrumb / Back Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border-color)]">
          <button
            onClick={() => navigate(-1)}
            className="cw-btn px-3.5 py-1.5 text-xs flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Catalogue</span>
          </button>

          <span className="text-xs font-mono text-[var(--text-secondary)]">
            Record ID: {(book.bid || '').split('-')[0]}
          </span>
        </div>

        {/* Main Book Record Card */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column: Cover & Actions */}
            <div className="w-full md:w-64 shrink-0 space-y-4">
              <div className="w-full aspect-[2/3] bg-[var(--bg-secondary)] rounded border border-[var(--border-color)] overflow-hidden">
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[var(--bg-secondary)]">
                    <BookOpen className="w-12 h-12 text-[var(--text-muted)] mb-3" />
                    <div className="text-sm font-bold text-[var(--text-primary)] line-clamp-3">
                      {book.name}
                    </div>
                  </div>
                )}
              </div>

              {/* Reader Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleBorrow}
                  disabled={borrowing || isAlreadyBorrowed}
                  className={`w-full py-2.5 px-4 rounded font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                    isAlreadyBorrowed || borrowedSuccess
                      ? 'bg-[var(--badge-available-bg)] text-[var(--badge-available-text)] border-[var(--badge-available-border)]'
                      : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'
                  }`}
                >
                  {isAlreadyBorrowed || borrowedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Borrowed / Active Loan</span>
                    </>
                  ) : borrowing ? (
                    <span>Processing Loan...</span>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Borrow This Book</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleToggleFav}
                  className={`w-full py-2.5 px-4 rounded font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                    isFav
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                      : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-color)]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isFav ? 'Saved in Favorites' : 'Add to Favorites'}</span>
                </button>

                {/* Librarian Controls */}
                {isAdmin && (
                  <div className="pt-3 mt-3 border-t border-[var(--border-color)] space-y-2">
                    <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Librarian Controls
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="cw-btn py-2 px-3 text-xs flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#337ab7]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDeleteBook}
                        className="cw-btn-danger py-2 px-3 text-xs flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Book Metadata & Inventory */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="border-b border-[var(--border-color)] pb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-snug">
                  {book.name}
                </h1>
                <button
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(book.author || '')}`)}
                  className="mt-1.5 text-sm font-semibold text-[#3b9c88] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{book.author || 'Anonymous'}</span>
                </button>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md p-4 text-xs">
                <div>
                  <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1 mb-1">
                    <Hash className="w-3.5 h-3.5" /> ISBN / Identifier
                  </span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {(book.bid || '').split('-')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Status
                  </span>
                  <span
                    className={`font-semibold ${
                      book.borrowed === '0' || !book.borrowed
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {book.borrowed === '0' || !book.borrowed ? 'Available in Library' : `Loaned (${book.borrowed})`}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Last Indexed
                  </span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {book.whentaken?.split(' ')[0] || 'Standard Archive'}
                  </span>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Categories
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {parsedGenres.length > 0 ? (
                    parsedGenres.map((g, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(g)}`)}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] cursor-pointer transition-colors"
                      >
                        {g}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">General Literature</span>
                  )}
                </div>
              </div>

              {/* Summary / Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  Summary
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md p-4">
                  {book.description ||
                    "This volume is part of the PS Library collection. Consult the inventory table below for individual copy numbers and availability."}
                </p>
              </div>

              {/* Copies & Inventory Table */}
              <div className="pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Holdings & Copy Inventory ({copies.length || 1})
                  </h3>
                  <span className="cw-badge-info">Active Holdings</span>
                </div>

                {loadingCopies ? (
                  <div className="p-8 text-center bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                    <Loader text="Loading copy records..." />
                  </div>
                ) : copies.length > 0 ? (
                  <div className="border border-[var(--border-color)] rounded overflow-hidden">
                    <table className="cw-table">
                      <thead>
                        <tr>
                          <th>Copy #</th>
                          <th>Full Barcode ID</th>
                          <th>Availability / Borrower</th>
                          <th>Sync Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {copies
                          .sort((a, b) => a.bid.localeCompare(b.bid))
                          .map((copy) => (
                            <tr key={copy._id}>
                              <td className="font-mono font-bold text-xs">
                                #{copy.bid.split('-')[1] || '1'}
                              </td>
                              <td className="font-mono text-xs text-[var(--text-secondary)]">
                                {copy.bid}
                              </td>
                              <td>
                                {copy.borrowed === '0' || !copy.borrowed ? (
                                  <span className="cw-badge-available">In Catalog</span>
                                ) : (
                                  <span className="cw-badge-borrowed">{copy.borrowed}</span>
                                )}
                              </td>
                              <td className="font-mono text-xs text-[var(--text-secondary)]">
                                {copy.whentaken?.split(' ')[0] || 'N/A'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                    Single catalog holding ({book.bid})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT BOOK MODAL (ADMIN ONLY) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#337ab7]" /> Edit Book Record
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Book Title
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="cw-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  required
                  className="cw-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="cw-textarea w-full resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="cw-btn px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBook}
                  className="cw-btn-primary px-4 py-2 text-xs"
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
