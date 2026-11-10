import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  User,
  UserCheck,
  UserX,
  RotateCcw,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const Viewbook = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    reader,
    token,
    isAuthenticated,
    isAdmin,
    isStaff,
    canManageCirculation,
    borrowBook,
    cancelBorrowRequest,
    giveBookToStudent,
    markBookReturnedToShelf,
    toggleFavorite
  } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copies, setCopies] = useState([]);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [cancellingReq, setCancellingReq] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  // Librarian / SuperAdmin Give Book (Issue SUX Copy) State
  const [showGivePanel, setShowGivePanel] = useState(false);
  const [selectedCopyBid, setSelectedCopyBid] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [noAccountClass, setNoAccountClass] = useState('');
  const [noAccountName, setNoAccountName] = useState('');
  const [issuingBook, setIssuingBook] = useState(false);
  const [returningCopyBid, setReturningCopyBid] = useState(null);
  const [circulationFeedback, setCirculationFeedback] = useState({ type: '', text: '' });

  // Admin edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updatingBook, setUpdatingBook] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const API_KEY = import.meta.env.VITE_API_KEY || 'supersecret';

  const baseIsbnOfBook = (book?.bid || id || '').split('-')[0];

  const isFav = reader?.favoriteBooks?.includes(book?.bid || id);

  // Check if current logged-in student actively borrowed any copy of this book
  const activeStudentLoan = reader?.borrowedBooks?.find(
    (b) =>
      b.status === 'active' &&
      (b.bookId === id ||
        b.bookId === book?.bid ||
        b.copyBid === book?.bid ||
        String(b.bookId || '').split('-')[0] === baseIsbnOfBook)
  );

  // Check if current logged-in student has a pending borrow request for this book
  const pendingStudentRequest = reader?.borrowedBooks?.find(
    (b) =>
      b.status === 'requested' &&
      (b.bookId === id ||
        b.bookId === book?.bid ||
        String(b.bookId || '').split('-')[0] === baseIsbnOfBook)
  );

  const fetchBookAndCopies = useCallback(async () => {
    try {
      const authHeaders = {
        'x-api-key': API_KEY
      };
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }
      if (reader?._id) {
        authHeaders['x-requester-id'] = reader._id;
        authHeaders['x-requester-role'] = reader.role || 'reader';
      }

      const response = await fetch(`${API_BASE_URL}/books/${id}`, {
        headers: authHeaders
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

      const basePrefix = String(data.bid || '').split('-')[0];
      const name = data.name;
      if (basePrefix) {
        setLoadingCopies(true);
        const copiesResponse = await fetch(
          `${API_BASE_URL}/books?bid=${encodeURIComponent(basePrefix)}&name=${encodeURIComponent(name)}&all=true&limit=200`,
          { headers: authHeaders }
        );
        if (copiesResponse.ok) {
          const copiesResult = await copiesResponse.json();
          const fetchedCopies =
            copiesResult.data && copiesResult.data.length > 0 ? copiesResult.data : [data];
          setCopies(fetchedCopies);

          // Pre-select the first available SUX copy for librarian circulation
          const firstAvail = fetchedCopies.find(
            (c) => !c.borrowed || c.borrowed === '0' || c.borrowed === ''
          );
          setSelectedCopyBid(firstAvail ? firstAvail.bid : fetchedCopies[0]?.bid || data.bid);
        } else {
          setCopies([data]);
          setSelectedCopyBid(data.bid);
        }
        setLoadingCopies(false);
      } else {
        setCopies([data]);
        setSelectedCopyBid(data.bid);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, token, reader?._id, reader?.role, API_BASE_URL, API_KEY]);

  useEffect(() => {
    fetchBookAndCopies();
  }, [fetchBookAndCopies]);

  // Pre-fill student if navigated from Librarian's Borrow Requests list (?studentId=...&studentName=...)
  useEffect(() => {
    const paramStudentId = searchParams.get('studentId');
    const paramStudentName = searchParams.get('studentName');
    const paramStudentEmail = searchParams.get('studentEmail');
    const paramStudentClass = searchParams.get('studentClass');
    if (paramStudentId && canManageCirculation) {
      setShowGivePanel(true);
      setNoAccount(false);
      setSelectedStudent({
        _id: paramStudentId,
        name: paramStudentName || 'Student',
        surname: '',
        email: paramStudentEmail || '',
        studentClass: paramStudentClass || ''
      });
      setStudentSearchQuery(paramStudentName || paramStudentEmail || paramStudentId);
    }
  }, [searchParams, canManageCirculation]);

  // Live student account lookup for Librarian / Super Admin
  useEffect(() => {
    if (!canManageCirculation || noAccount) {
      setStudentResults([]);
      return;
    }
    const q = studentSearchQuery.trim();
    if (!q || (selectedStudent && q === `${selectedStudent.name} ${selectedStudent.surname || ''}`.trim())) {
      setStudentResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingStudents(true);
        const res = await fetch(`${API_BASE_URL}/readers?q=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setStudentResults(data.data || []);
        }
      } catch (e) {
        console.error('Error searching student accounts:', e);
      } finally {
        setSearchingStudents(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [studentSearchQuery, canManageCirculation, noAccount, selectedStudent, API_BASE_URL]);

  // Student action: Request to borrow book
  const handleRequestBorrow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setBorrowing(true);
      setRequestSuccessMsg('');
      const res = await borrowBook({
        bookId: book?.bid || id,
        bookName: book?.name || 'Unknown Title',
        author: book?.author || 'Unknown Author',
        image: book?.image || ''
      });
      setRequestSuccessMsg(
        res.message || 'Borrow request submitted! Please visit the librarian to receive a SUX copy.'
      );
      await fetchBookAndCopies();
    } catch (err) {
      alert(err.message || 'Failed to submit borrow request');
    } finally {
      setBorrowing(false);
    }
  };

  // Student action: Cancel pending borrow request
  const handleCancelRequest = async () => {
    try {
      setCancellingReq(true);
      await cancelBorrowRequest(book?.bid || id);
      setRequestSuccessMsg('');
      await fetchBookAndCopies();
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setCancellingReq(false);
    }
  };

  // Librarian / SuperAdmin action: Give selected SUX copy to student
  const handleIssueCopyToStudent = async (e) => {
    e.preventDefault();
    if (!canManageCirculation) return;

    if (!selectedCopyBid) {
      setCirculationFeedback({ type: 'error', text: 'Please select an available SUX copy number.' });
      return;
    }

    if (!noAccount && !selectedStudent && !studentSearchQuery.trim()) {
      setCirculationFeedback({
        type: 'error',
        text: 'Please type/select a student account, or check "No Account" and enter class and name.'
      });
      return;
    }

    if (noAccount && (!noAccountClass.trim() || !noAccountName.trim())) {
      setCirculationFeedback({
        type: 'error',
        text: 'Please enter both Student Class and Student Name for a student without an account.'
      });
      return;
    }

    try {
      setIssuingBook(true);
      setCirculationFeedback({ type: '', text: '' });

      const res = await giveBookToStudent(book?._id || book?.bid || id, {
        copyBid: selectedCopyBid,
        hasAccount: !noAccount,
        studentId: selectedStudent?._id || '',
        studentQuery: studentSearchQuery.trim(),
        studentName: noAccountName.trim(),
        studentClass: noAccountClass.trim()
      });

      setCirculationFeedback({
        type: 'success',
        text: res.message || `Copy ${selectedCopyBid} given to student successfully!`
      });
      setSelectedStudent(null);
      setStudentSearchQuery('');
      setNoAccountName('');
      setNoAccountClass('');
      await fetchBookAndCopies();
    } catch (err) {
      setCirculationFeedback({
        type: 'error',
        text: err.message || 'Failed to give book to student'
      });
    } finally {
      setIssuingBook(false);
    }
  };

  // Librarian / SuperAdmin action: Accept returned book & mark back in shelves
  const handleReturnCopyToShelf = async (copy) => {
    if (!canManageCirculation) return;
    if (
      !window.confirm(
        `Mark copy ${copy.bid} as returned and back on the library shelves (borrowed = 0)?`
      )
    ) {
      return;
    }

    try {
      setReturningCopyBid(copy.bid);
      setCirculationFeedback({ type: '', text: '' });
      const res = await markBookReturnedToShelf(copy._id || copy.bid, copy.bid);
      setCirculationFeedback({
        type: 'success',
        text: res.message || `Copy ${copy.bid} marked as returned in shelves!`
      });
      await fetchBookAndCopies();
    } catch (err) {
      alert(err.message || 'Failed to mark copy as in shelves');
    } finally {
      setReturningCopyBid(null);
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

  const allCopies = copies.length > 0 ? copies : [book];
  const availableCopies = allCopies.filter(
    (c) => !c.borrowed || c.borrowed === '0' || c.borrowed === ''
  );

  // Determine how to render a copy's borrower info based on privacy rules:
  // Normal users NEVER see who has the book; only librarian, admins (isStaff), and the borrowing student themselves see it.
  const renderCopyBorrowerStatus = (copy) => {
    const rawBorrowed = String(copy.borrowed || '0').trim();
    const isCopyBorrowed = rawBorrowed !== '0' && rawBorrowed !== '';

    if (!isCopyBorrowed) {
      return <span className="cw-badge-available">In Shelves (0)</span>;
    }

    const isBorrowedByCurrentStudent =
      copy.isBorrowedByMe ||
      (reader?._id &&
        (String(reader._id) === rawBorrowed ||
          String(reader._id) === String(copy.borrowerInfo?.studentId)));

    if (isBorrowedByCurrentStudent) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="cw-badge-borrowed w-fit">
            Borrowed by You (ID: #{String(reader._id).slice(-6).toUpperCase()})
          </span>
          {copy.borrowerInfo?.dueDate && (
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">
              Due: {new Date(copy.borrowerInfo.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      );
    }

    if (isStaff) {
      const info = copy.borrowerInfo;
      const isNoAccount =
        info?.hasAccount === false || rawBorrowed.startsWith('no-account:');
      if (isNoAccount) {
        const fallbackParts = rawBorrowed.replace(/^no-account:/, '').split(':');
        const guestClass = info?.studentClass || fallbackParts[0] || 'N/A';
        const guestName = info?.name || fallbackParts[1] || rawBorrowed;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="cw-badge-borrowed w-fit">
              No Account: {guestName} (Class: {guestClass})
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
              ID: {rawBorrowed}
            </span>
          </div>
        );
      }

      const fullName = info?.name
        ? `${info.name} ${info.surname || ''}`.trim()
        : '';
      return (
        <div className="flex flex-col gap-0.5">
          <span className="cw-badge-borrowed w-fit font-mono">
            Student ID: {rawBorrowed}
          </span>
          {fullName && (
            <span className="text-[11px] font-semibold text-[var(--text-primary)]">
              {fullName}
              {info?.studentClass ? ` • Class ${info.studentClass}` : ''}
              {info?.email ? ` (${info.email})` : ''}
            </span>
          )}
        </div>
      );
    }

    // Normal users only see that the copy is borrowed, NOT who has it
    return <span className="cw-badge-borrowed">Borrowed</span>;
  };

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

              {/* Reader Request & Favorite Buttons */}
              <div className="space-y-2">
                {activeStudentLoan ? (
                  <div className="w-full py-2.5 px-3 rounded font-semibold text-xs flex flex-col items-center justify-center gap-1 border bg-[var(--badge-available-bg)] text-[var(--badge-available-text)] border-[var(--badge-available-border)]">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Borrowed by You (SUX #{activeStudentLoan.sux || '1'})</span>
                    </div>
                    <span className="text-[10px] opacity-85 text-center">
                      Return physical book to Librarian to mark in shelves
                    </span>
                  </div>
                ) : pendingStudentRequest ? (
                  <div className="space-y-1.5">
                    <div className="w-full py-2.5 px-3 rounded font-semibold text-xs flex items-center justify-center gap-2 border bg-amber-500/15 text-amber-500 border-amber-500/30">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Borrow Requested (Pending Librarian)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelRequest}
                      disabled={cancellingReq}
                      className="w-full py-1.5 px-3 rounded text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      {cancellingReq ? 'Cancelling...' : 'Cancel Borrow Request'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestBorrow}
                    disabled={borrowing}
                    className="w-full py-2.5 px-4 rounded font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>
                      {borrowing ? 'Submitting Request...' : 'Request to Borrow Book'}
                    </span>
                  </button>
                )}

                {requestSuccessMsg && (
                  <div className="p-2.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[11px] font-medium">
                    {requestSuccessMsg}
                  </div>
                )}

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

                {/* Librarian & Super Admin Circulation Trigger */}
                {canManageCirculation && (
                  <div className="pt-3 mt-3 border-t border-[var(--border-color)] space-y-2">
                    <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Circulation Desk (Librarian / Super Admin)
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowGivePanel((prev) => !prev)}
                      className="w-full py-2.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 bg-[#3b9c88] hover:bg-[#318473] text-white border border-[#2d7a6b] transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>
                        {showGivePanel ? 'Hide Give Book Form' : 'Give Book to Student'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Metadata Controls */}
                {isAdmin && (
                  <div className="pt-3 mt-3 border-t border-[var(--border-color)] space-y-2">
                    <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Catalog Record Controls
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="cw-btn py-2 px-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#337ab7]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDeleteBook}
                        className="cw-btn-danger py-2 px-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                    <ShieldCheck className="w-3.5 h-3.5" /> Shelf Availability
                  </span>
                  <span
                    className={`font-semibold ${
                      availableCopies.length > 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {availableCopies.length > 0
                      ? `${availableCopies.length} of ${allCopies.length} in Shelves`
                      : `All ${allCopies.length} Copies Borrowed`}
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

              {/* LIBRARIAN & SUPER ADMIN: GIVE BOOK TO STUDENT PANEL */}
              {canManageCirculation && (showGivePanel || (book.borrowRequests && book.borrowRequests.length > 0)) && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-strong)] rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#3b9c88]" />
                        Give Book to Student (Issue SUX Copy)
                      </h3>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Select the SUX copy number the student is taking, then choose their student account or select &ldquo;No Account&rdquo; and enter their class and name.
                      </p>
                    </div>
                    {showGivePanel && (
                      <button
                        type="button"
                        onClick={() => setShowGivePanel(false)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Pending Student Borrow Requests for this Book */}
                  {Array.isArray(book.borrowRequests) && book.borrowRequests.length > 0 && (
                    <div className="p-3 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Student Borrow Requests ({book.borrowRequests.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {book.borrowRequests.map((reqItem, idx) => (
                          <button
                            key={reqItem.studentId || idx}
                            type="button"
                            onClick={() => {
                              setShowGivePanel(true);
                              setNoAccount(false);
                              setSelectedStudent({
                                _id: reqItem.studentId,
                                name: reqItem.name,
                                surname: reqItem.surname || '',
                                email: reqItem.email || '',
                                studentClass: reqItem.studentClass || ''
                              });
                              setStudentSearchQuery(
                                `${reqItem.name} ${reqItem.surname || ''}`.trim()
                              );
                            }}
                            className="px-2.5 py-1.5 rounded text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-[var(--text-primary)] border border-amber-500/30 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <User className="w-3.5 h-3.5 text-amber-500" />
                            <span>
                              {reqItem.name} {reqItem.surname || ''}
                              {reqItem.studentClass ? ` (${reqItem.studentClass})` : ''}
                            </span>
                            <span className="text-[10px] font-mono text-[#337ab7] underline">
                              Select Student
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {circulationFeedback.text && (
                    <div
                      className={`p-3 rounded border text-xs font-semibold flex items-center gap-2 ${
                        circulationFeedback.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      }`}
                    >
                      {circulationFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{circulationFeedback.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleIssueCopyToStudent} className="space-y-4">
                    {/* 1. Select SUX Copy Number */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                        1. Select SUX Copy Number *
                      </label>
                      <select
                        value={selectedCopyBid}
                        onChange={(e) => setSelectedCopyBid(e.target.value)}
                        className="cw-input w-full font-mono text-xs"
                        required
                      >
                        {allCopies
                          .slice()
                          .sort((a, b) => String(a.bid).localeCompare(String(b.bid)))
                          .map((c) => {
                            const suxNum = String(c.bid || '').includes('-')
                              ? String(c.bid).split('-').slice(1).join('-')
                              : '1';
                            const isTaken =
                              c.borrowed && c.borrowed !== '0' && c.borrowed !== '';
                            return (
                              <option
                                key={c._id || c.bid}
                                value={c.bid}
                                disabled={Boolean(isTaken)}
                              >
                                SUX #{suxNum} — Barcode: {c.bid}{' '}
                                {isTaken ? '(Already Borrowed)' : '(Available in Shelves — 0)'}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {/* 2. Toggle Student Account vs No Account */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        2. Student Account Details *
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer select-none bg-[var(--bg-elevated)] px-3 py-1.5 rounded border border-[var(--border-color)]">
                        <input
                          type="checkbox"
                          checked={noAccount}
                          onChange={(e) => {
                            setNoAccount(e.target.checked);
                            setSelectedStudent(null);
                          }}
                          className="w-3.5 h-3.5 accent-[#337ab7] cursor-pointer"
                        />
                        <UserX className="w-3.5 h-3.5 text-amber-500" />
                        <span>No Account (Enter Class &amp; Name)</span>
                      </label>
                    </div>

                    {!noAccount ? (
                      <div className="relative space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={studentSearchQuery}
                            onChange={(e) => {
                              setStudentSearchQuery(e.target.value);
                              setSelectedStudent(null);
                            }}
                            placeholder="Type student name, email, class, or Student ID..."
                            className="cw-input w-full pl-9 text-xs"
                          />
                          {studentSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setStudentSearchQuery('');
                                setSelectedStudent(null);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Selected Student Pill */}
                        {selectedStudent && (
                          <div className="p-2.5 rounded bg-[#337ab7]/10 border border-[#337ab7]/30 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-[var(--text-primary)]">
                                {selectedStudent.name} {selectedStudent.surname || ''}
                              </span>
                              {selectedStudent.studentClass && (
                                <span className="ml-2 px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[10px] font-semibold">
                                  Class: {selectedStudent.studentClass}
                                </span>
                              )}
                              <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                                Student ID: {selectedStudent._id}
                                {selectedStudent.email ? ` • ${selectedStudent.email}` : ''}
                              </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-[#3b9c88] shrink-0" />
                          </div>
                        )}

                        {/* Autocomplete Matching Student Accounts */}
                        {!selectedStudent && studentResults.length > 0 && (
                          <div className="border border-[var(--border-color)] rounded bg-[var(--bg-elevated)] divide-y divide-[var(--border-color)] max-h-48 overflow-y-auto shadow-sm">
                            {studentResults.map((st) => (
                              <button
                                key={st._id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudent(st);
                                  setStudentSearchQuery(
                                    `${st.name} ${st.surname || ''}`.trim()
                                  );
                                  setStudentResults([]);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] flex items-center justify-between text-xs cursor-pointer transition-colors"
                              >
                                <div>
                                  <span className="font-bold text-[var(--text-primary)]">
                                    {st.name} {st.surname || ''}
                                  </span>
                                  {st.studentClass && (
                                    <span className="ml-2 text-[10px] font-semibold text-[#3b9c88]">
                                      Class: {st.studentClass}
                                    </span>
                                  )}
                                  <p className="text-[10px] text-[var(--text-secondary)]">
                                    {st.email}
                                  </p>
                                </div>
                                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                  ID: #{String(st._id).slice(-6).toUpperCase()}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchingStudents && (
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            Searching student accounts...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--bg-elevated)] p-3.5 rounded border border-[var(--border-color)]">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Student Class / Grade *
                          </label>
                          <input
                            type="text"
                            value={noAccountClass}
                            onChange={(e) => setNoAccountClass(e.target.value)}
                            placeholder="e.g. 9-A, 10-B"
                            className="cw-input w-full text-xs"
                            required={noAccount}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Student Full Name *
                          </label>
                          <input
                            type="text"
                            value={noAccountName}
                            onChange={(e) => setNoAccountName(e.target.value)}
                            placeholder="e.g. Sardor Rahimov"
                            className="cw-input w-full text-xs"
                            required={noAccount}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={issuingBook || availableCopies.length === 0}
                        className="bg-[#337ab7] hover:bg-[#286090] disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded border border-[#2e6da4] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>
                          {issuingBook
                            ? 'Issuing Copy...'
                            : `Give Copy (${selectedCopyBid}) to Student`}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

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
                    'This volume is part of the PS Library collection. Consult the inventory table below for individual copy numbers and availability.'}
                </p>
              </div>

              {/* Copies & SUX Inventory Table */}
              <div className="pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Holdings &amp; SUX Copy Inventory ({allCopies.length})
                  </h3>
                  <span className="cw-badge-info">Active Holdings</span>
                </div>

                {loadingCopies ? (
                  <div className="p-8 text-center bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                    <Loader text="Loading copy records..." />
                  </div>
                ) : (
                  <div className="border border-[var(--border-color)] rounded overflow-x-auto">
                    <table className="cw-table">
                      <thead>
                        <tr>
                          <th>SUX #</th>
                          <th>Full Barcode ID</th>
                          <th>Availability / Borrower</th>
                          <th>Sync Date</th>
                          {canManageCirculation && <th className="text-right">Librarian Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {allCopies
                          .slice()
                          .sort((a, b) => String(a.bid).localeCompare(String(b.bid)))
                          .map((copy) => {
                            const suxNum = String(copy.bid || '').includes('-')
                              ? String(copy.bid).split('-').slice(1).join('-')
                              : '1';
                            const isCopyBorrowed =
                              copy.borrowed && copy.borrowed !== '0' && copy.borrowed !== '';
                            return (
                              <tr key={copy._id || copy.bid}>
                                <td className="font-mono font-bold text-xs">
                                  #{suxNum}
                                </td>
                                <td className="font-mono text-xs text-[var(--text-secondary)]">
                                  {copy.bid}
                                </td>
                                <td>{renderCopyBorrowerStatus(copy)}</td>
                                <td className="font-mono text-xs text-[var(--text-secondary)]">
                                  {copy.whentaken?.split(' ')[0] || 'N/A'}
                                </td>
                                {canManageCirculation && (
                                  <td className="text-right">
                                    {isCopyBorrowed ? (
                                      <button
                                        type="button"
                                        onClick={() => handleReturnCopyToShelf(copy)}
                                        disabled={returningCopyBid === copy.bid}
                                        className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>
                                          {returningCopyBid === copy.bid
                                            ? 'Updating...'
                                            : 'Mark in Shelves'}
                                        </span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedCopyBid(copy.bid);
                                          setShowGivePanel(true);
                                        }}
                                        className="px-2.5 py-1 rounded text-xs font-semibold bg-[#337ab7]/15 hover:bg-[#337ab7]/25 text-[#337ab7] border border-[#337ab7]/30 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                      >
                                        <UserCheck className="w-3.5 h-3.5" />
                                        <span>Give SUX #{suxNum}</span>
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
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
