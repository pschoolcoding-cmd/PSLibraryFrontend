import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Users, PlusCircle, Search, MoreVertical, Edit3, Trash2, 
  Copy, Sparkles, Filter, ChevronLeft, ChevronRight, CheckCircle2, 
  AlertCircle, Shield, UserPlus, RefreshCw, X, Upload, Calendar, ArrowRight,
  Layers, Lock
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pslibrarybackend.onrender.com';
const API_KEY = import.meta.env.VITE_API_KEY || 'supersecret';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, isSubAdmin, canAccessAdminPanel, canManageRoles, canApproveBooks, reader } = useAuth();

  // Active Main Tab: 'books' | 'pending' | 'users' | 'admin-stats'
  const [activeTab, setActiveTab] = useState('books');
  const [subFilter, setSubFilter] = useState('all'); // 'all', 'borrowed', 'available' / 'readers', 'admins'

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Data states
  const [books, setBooks] = useState([]);
  const [pendingBooks, setPendingBooks] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [adminStatsList, setAdminStatsList] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMenuId, setActionMenuId] = useState(null);

  // Stats
  const [stats, setStats] = useState({ totalBooks: 0, totalReaders: 0, activeBorrows: 0, categoriesCount: 0 });

  // Modals state
  const [editBookModal, setEditBookModal] = useState(null); // book object or null
  const [suxModal, setSuxModal] = useState(null); // base book object or null
  const [editUserModal, setEditUserModal] = useState(null); // user object or null
  const [createUserModal, setCreateUserModal] = useState(false);

  // ImgBB Upload status inside Edit Book Modal
  const [uploadingImg, setUploadingImg] = useState(false);

  // Form states for Book Edit
  const [bookForm, setBookForm] = useState({
    name: '', author: '', bid: '', description: '', borrowed: '0', whentaken: '', image: '', genre: []
  });
  const [genreTagInput, setGenreTagInput] = useState('');

  // Form states for SUX Copy Creation
  const [suxForm, setSuxForm] = useState({
    baseBook: null,
    suxInput: '',
    suxList: ['1']
  });

  // Form states for User Edit / Create
  const [userForm, setUserForm] = useState({
    _id: '', name: '', surname: '', email: '', role: 'reader', birthdate: '', studentClass: '', isExternal: false, avatar: '', password: ''
  });

  // Check Staff Access Authorization
  if (!canAccessAdminPanel) {
    return (
      <div className="min-h-screen bg-[#f4f5f8] text-gray-900 flex flex-col justify-between font-[Inter]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-4 shadow-xl">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black font-[Outfit] uppercase tracking-tight text-gray-900 mb-2">
            Restricted Admin Area
          </h2>
          <p className="text-gray-500 text-sm max-w-md mb-6">
            This management panel is reserved exclusively for registered staff administrators and subadmins. Please log in with appropriate administrative credentials.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-rose-500/20 transition-all cursor-pointer"
          >
            Authenticate Staff Login
          </button>
        </div>
      </div>
    );
  }

  // Fetch Live Stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/books/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  // Fetch Books
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 15,
        all: 'true',
        q: searchQuery
      });
      const res = await fetch(`${API_BASE_URL}/books?${queryParams.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setBooks(result.data || []);
        setTotalPages(result.pages || 1);
        setTotalCount(result.total || 0);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pending Approvals
  const fetchPendingBooks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 15,
        pendingOnly: 'true',
        all: 'true',
        q: searchQuery
      });
      const res = await fetch(`${API_BASE_URL}/books?${queryParams.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setPendingBooks(result.data || []);
        setPendingCount(result.total || (result.data ? result.data.length : 0));
        setTotalPages(result.pages || 1);
        setTotalCount(result.total || 0);
      }
    } catch (err) {
      console.error('Error fetching pending books:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Admin Stats
  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/books/admin-stats`);
      if (res.ok) {
        const data = await res.json();
        setAdminStatsList(data.stats || []);
        setPendingCount(data.totalPending || 0);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Admin Stats based on search query
  const filteredAdminStats = adminStatsList.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (entry.name && entry.name.toLowerCase().includes(q)) ||
      (entry.surname && entry.surname.toLowerCase().includes(q)) ||
      (entry.email && entry.email.toLowerCase().includes(q)) ||
      (entry.role && entry.role.toLowerCase().includes(q)) ||
      (entry.studentClass && entry.studentClass.toLowerCase().includes(q))
    );
  });

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setPage(1);
    setTotalPages(1);
    setTotalCount(0);
  };

  // Fetch Users / Readers
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 15,
        q: searchQuery
      });
      if (subFilter === 'admins') queryParams.append('role', 'admin');
      if (subFilter === 'readers') queryParams.append('role', 'reader');

      const res = await fetch(`${API_BASE_URL}/readers?${queryParams.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setUsers(result.data || []);
        setTotalPages(result.pages || 1);
        setTotalCount(result.total || 0);
      }
    } catch (err) {
      console.error('Error fetching readers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Approve Pending Book Handler
  const handleApproveBook = async (bookId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/books/${bookId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          approvedBy: reader?.email || reader?.name || 'Admin'
        })
      });

      if (res.ok) {
        alert('Book entry approved and added to the public catalog!');
        fetchPendingBooks();
        fetchStats();
      } else {
        const err = await res.json();
        alert('Failed to approve book: ' + (err.error || 'Error'));
      }
    } catch (err) {
      alert('Network error while approving book entry');
    }
  };

  // Change User Role Handler (Super Admin only)
  const handleChangeUserRole = async (userId, targetRole, currentRole) => {
    if (!isSuperAdmin) {
      alert('Access Denied: Only Super Admins can alter user roles.');
      return;
    }
    if (currentRole === 'superadmin' && targetRole !== 'superadmin') {
      if (!window.confirm('Warning: You are demoting a Super Admin. Continue?')) return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/readers/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-requester-role': 'superadmin'
        },
        body: JSON.stringify({
          role: targetRole,
          requesterRole: 'superadmin'
        })
      });

      if (res.ok) {
        alert(`User role updated to ${targetRole.toUpperCase()} successfully!`);
        if (activeTab === 'admin-stats') fetchAdminStats();
        if (activeTab === 'users') fetchUsers();
      } else {
        const data = await res.json();
        alert('Role change failed: ' + (data.message || 'Error'));
      }
    } catch (err) {
      alert('Error updating user role');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPendingBooks();
  }, []);

  useEffect(() => {
    if (activeTab === 'books') {
      fetchBooks();
    } else if (activeTab === 'pending') {
      fetchPendingBooks();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'admin-stats') {
      fetchAdminStats();
    }
  }, [activeTab, page, searchQuery, subFilter]);

  // Sync totalPages and totalCount for admin-stats tab
  useEffect(() => {
    if (activeTab === 'admin-stats') {
      const total = filteredAdminStats.length;
      setTotalPages(Math.max(1, Math.ceil(total / 15)));
      setTotalCount(total);
    }
  }, [activeTab, adminStatsList, searchQuery]);

  // Clamp page to valid range if page exceeds totalPages
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  // Click outside listener for 3-dots action popup menu
  useEffect(() => {
    const handleOutsideClick = () => setActionMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Handler: Open Edit Book Modal
  const handleOpenEditBook = (book) => {
    let genreArray = [];
    if (Array.isArray(book.genre)) {
      genreArray = book.genre;
    } else if (typeof book.genre === 'string') {
      genreArray = book.genre.split(/[,#]/).map(s => s.trim()).filter(Boolean);
    }

    setBookForm({
      _id: book._id,
      bid: book.bid || '',
      name: book.name || '',
      author: book.author || '',
      description: book.description || '',
      borrowed: book.borrowed || '0',
      whentaken: book.whentaken || '',
      image: book.image || '',
      genre: genreArray
    });
    setEditBookModal(book);
  };

  // Handler: ImgBB Cover Image Upload inside Modal
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) {
      alert('ImgBB API key missing in environment (VITE_IMGBB_API_KEY). You can paste an image URL directly.');
      return;
    }

    setUploadingImg(true);
    try {
      const readerFile = new FileReader();
      readerFile.onloadend = async () => {
        const base64Data = readerFile.result.split(',')[1];
        const formData = new FormData();
        formData.append('image', base64Data);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          setBookForm(prev => ({ ...prev, image: result.data.url }));
        } else {
          alert('Failed to upload image to ImgBB: ' + (result.error?.message || 'Error'));
        }
        setUploadingImg(false);
      };
      readerFile.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingImg(false);
    }
  };

  // Handler: Save Book Edit
  const handleSaveBook = async () => {
    if (!bookForm.name || !bookForm.author || !bookForm.bid) {
      alert('Title, Author, and BID code are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/books/${bookForm._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(bookForm)
      });

      if (res.ok) {
        alert('Book details updated successfully!');
        setEditBookModal(null);
        fetchBooks();
        fetchStats();
      } else {
        const err = await res.json();
        alert('Failed to update book: ' + (err.error || 'Server error'));
      }
    } catch (err) {
      alert('Network error while updating book');
    }
  };

  // Handler: Delete Book
  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to permanently delete this book entry?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/books/${bookId}`, {
        method: 'DELETE',
        headers: { 'x-api-key': API_KEY }
      });
      if (res.ok) {
        alert('Book copy deleted.');
        fetchBooks();
        fetchStats();
      } else {
        alert('Failed to delete book.');
      }
    } catch (err) {
      alert('Error deleting book.');
    }
  };

  // Handler: Open SUX Copy Modal for existing book
  const handleOpenSuxModal = (book) => {
    // Extract base ISBN (first 13 chars or prefix before hyphen)
    const rawBid = book.bid || '';
    const baseIsbn = rawBid.includes('-') ? rawBid.split('-')[0] : rawBid;

    setSuxForm({
      baseBook: book,
      baseIsbn: baseIsbn,
      suxInput: '',
      suxList: ['2'] // default copy suffix
    });
    setSuxModal(book);
  };

  // Handler: Process SUX Range / List parsing
  const handleAddSuxTokens = (inputVal) => {
    if (!inputVal) return;
    const tokens = inputVal.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    const expanded = [];

    tokens.forEach(tok => {
      const rangeMatch = tok.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        const padLen = rangeMatch[1].startsWith('0') ? rangeMatch[1].length : 0;
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            expanded.push(padLen ? String(i).padStart(padLen, '0') : String(i));
          }
          return;
        }
      }
      expanded.push(tok);
    });

    setSuxForm(prev => {
      const updated = [...prev.suxList];
      expanded.forEach(item => {
        if (!updated.includes(item)) updated.push(item);
      });
      return { ...prev, suxList: updated, suxInput: '' };
    });
  };

  // Handler: Save SUX copies
  const handleSaveSuxCopies = async () => {
    if (!suxForm.suxList.length) {
      alert('Please specify at least one SUX suffix code.');
      return;
    }

    const { baseBook, baseIsbn, suxList } = suxForm;
    let addedCount = 0;

    for (const suxCode of suxList) {
      const newBid = `${baseIsbn}-${suxCode}`;
      try {
        const res = await fetch(`${API_BASE_URL}/books`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          body: JSON.stringify({
            name: baseBook.name,
            bid: newBid,
            author: baseBook.author,
            genre: baseBook.genre,
            description: baseBook.description,
            image: baseBook.image,
            borrowed: '0',
            whoadded: reader?.email || 'admin'
          })
        });

        if (res.ok) addedCount++;
      } catch (err) {
        console.error('Error adding SUX copy:', err);
      }
    }

    alert(`Successfully registered ${addedCount} new SUX copy/copies!`);
    setSuxModal(null);
    fetchBooks();
    fetchStats();
  };

  // Handler: Open Edit User Modal
  const handleOpenEditUser = (user) => {
    setUserForm({
      _id: user._id,
      name: user.name || '',
      surname: user.surname || '',
      email: user.email || '',
      role: user.role || 'reader',
      birthdate: user.birthdate || '',
      studentClass: user.studentClass || '',
      isExternal: user.isExternal || false,
      avatar: user.avatar || '',
      password: ''
    });
    setEditUserModal(user);
  };

  // Handler: Save User Edit
  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email) {
      alert('Name and Email are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/readers/${userForm._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });

      if (res.ok) {
        alert('User profile updated successfully!');
        setEditUserModal(null);
        fetchUsers();
        fetchStats();
      } else {
        const data = await res.json();
        alert('Failed to update user: ' + (data.message || 'Error'));
      }
    } catch (err) {
      alert('Network error while updating user profile');
    }
  };

  // Handler: Save Create User
  const handleSaveCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      alert('Name, Email, and Password are required to create a new user.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/readers/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });

      if (res.ok) {
        alert('New user account created successfully!');
        setCreateUserModal(false);
        fetchUsers();
        fetchStats();
      } else {
        const data = await res.json();
        alert('Failed to create user: ' + (data.message || 'Error'));
      }
    } catch (err) {
      alert('Network error while creating user');
    }
  };

  // Handler: Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/readers/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('User account deleted.');
        fetchUsers();
        fetchStats();
      } else {
        alert('Failed to delete user account.');
      }
    } catch (err) {
      alert('Error deleting user account.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-[Inter] antialiased pb-16 transition-colors duration-200">
      <Navbar />

      {/* Main Admin Dashboard Container */}
      <div className="max-w-[1440px] mx-auto pt-20 px-4 sm:px-6 lg:px-8">
        
        {/* Top Dashboard Frame */}
        <div className="bg-[var(--bg-elevated)] rounded-lg shadow-xs border border-[var(--border-color)] overflow-hidden min-h-[820px] flex flex-col lg:flex-row">
          
          {/* LEFT SIDEBAR MENU */}
          <aside className="w-full lg:w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] p-5 flex flex-col justify-between shrink-0">
            <div>
              {/* Brand Logo inside Sidebar */}
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-9 h-9 rounded-md bg-[#337ab7]/15 border border-[#337ab7]/30 flex items-center justify-center text-[#337ab7]">
                  <BookOpen className="w-4 h-4 text-[#337ab7]" />
                </div>
                <div>
                  <h1 className="font-bold text-lg tracking-tight text-[var(--text-primary)]">
                    PS Library
                  </h1>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#3b9c88]">
                    Admin Portal
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                <button
                  onClick={() => handleTabChange('books')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'books'
                      ? 'bg-[#337ab7] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4" />
                    <span>Book Directory</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    activeTab === 'books' ? 'bg-white/20 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}>
                    {stats.totalBooks}
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('pending')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 ${activeTab === 'pending' ? 'text-white' : 'text-amber-500'}`} />
                    <span>Pending Approvals</span>
                  </div>
                  {pendingCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
                      {pendingCount} NEW
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                    }`}>
                      0
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange('users')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-[#337ab7] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>User Directory</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}>
                    {stats.totalReaders}
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('admin-stats')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'admin-stats'
                      ? 'bg-[#3b9c88] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={`w-4 h-4 ${activeTab === 'admin-stats' ? 'text-white' : 'text-[#3b9c88]'}`} />
                    <span>Admins & Statistics</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    activeTab === 'admin-stats' ? 'bg-white/20 text-white' : 'bg-[#3b9c88]/15 text-[#3b9c88]'
                  }`}>
                    STATS
                  </span>
                </button>

                <button
                  onClick={() => navigate('/admin/genres')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#337ab7]" />
                    <span>AI Genre Normalizer</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/add')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-4 h-4 text-[#3b9c88]" />
                    <span>Catalog Intake Form</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Bottom Status Bar */}
            <div className="pt-6 border-t border-[var(--border-color)]">
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-elevated)] rounded-md border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Catalog Online</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] font-semibold">v2.4</span>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <main className="flex-1 p-6 lg:p-8 flex flex-col justify-between overflow-x-hidden bg-[var(--bg-elevated)]">
            
            <div>
              {/* Top Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-[var(--border-color)]">
                
                {/* Search Box */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search books, ISBN, or users..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] outline-none rounded-md pl-10 pr-4 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)]"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Right Profile & Mode Controls */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="hidden sm:flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-md border border-[var(--border-color)]">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">System Active</span>
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  {/* Admin User Profile */}
                  <div className="flex items-center gap-2.5 bg-[var(--bg-secondary)] p-1.5 pr-3.5 rounded-md border border-[var(--border-color)]">
                    <img
                      src={reader?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reader?.name || 'Admin')}`}
                      alt="Admin"
                      className="w-7 h-7 rounded object-cover border border-[var(--border-color)]"
                    />
                    <div className="text-left leading-tight">
                      <p className="text-xs font-bold text-[var(--text-primary)]">{reader?.name || 'Admin User'}</p>
                      <p className="text-[10px] text-[#3b9c88] font-bold uppercase tracking-wider">
                        {reader?.role === 'superadmin' ? 'Super Admin' : reader?.role === 'admin' ? 'Admin' : 'Subadmin'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Title & Tab Header Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {activeTab === 'books' && 'Book Management Directory'}
                    {activeTab === 'pending' && 'Pending Approval Queue'}
                    {activeTab === 'users' && 'User & Reader Directory'}
                    {activeTab === 'admin-stats' && 'Admins & Contribution Statistics'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {activeTab === 'books' && 'Browse, edit metadata, update cover art, or generate new SUX copies.'}
                    {activeTab === 'pending' && 'Review and approve subadmin book submissions before they appear in the public catalog.'}
                    {activeTab === 'users' && 'View system users, change roles, edit accounts, or reset credentials.'}
                    {activeTab === 'admin-stats' && 'Track contribution leaderboard, review staff performance, and manage roles.'}
                  </p>
                </div>

                {/* Action & Filter Pills */}
                <div className="flex items-center gap-2">
                  {activeTab === 'books' && (
                    <button
                      onClick={() => navigate('/add')}
                      className="bg-[#337ab7] hover:bg-[#286090] text-white font-semibold text-xs px-4 py-2 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add New Title
                    </button>
                  )}

                  {activeTab === 'users' && (
                    <button
                      onClick={() => {
                        setUserForm({ _id: '', name: '', surname: '', email: '', role: 'reader', birthdate: '', studentClass: '', isExternal: false, avatar: '', password: '' });
                        setCreateUserModal(true);
                      }}
                      className="bg-[#3b9c88] hover:bg-[#318473] text-white font-semibold text-xs px-4 py-2 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Student / Admin
                    </button>
                  )}
                </div>
              </div>

              {/* PENDING APPROVALS TAB */}
              {activeTab === 'pending' && (
                <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)] overflow-hidden">
                  {loading ? (
                    <div className="py-16 text-center text-[var(--text-secondary)] flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                      <span className="font-semibold text-xs">Loading pending submissions...</span>
                    </div>
                  ) : pendingBooks.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl mb-1">✅</div>
                      <p className="font-bold text-[var(--text-primary)] text-sm">All caught up!</p>
                      <p className="text-[var(--text-secondary)] text-xs">No pending book submissions awaiting approval.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-color)]">
                      {pendingBooks.map((book) => (
                        <div key={book._id} className="flex items-start gap-4 p-4 hover:bg-[var(--bg-hover)] transition-colors">
                          <img
                            src={book.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200'}
                            alt={book.name}
                            className="w-12 h-16 object-cover rounded border border-[var(--border-color)] shrink-0"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div>
                                <p className="font-bold text-[var(--text-primary)] text-sm leading-tight">{book.name}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">by <span className="font-semibold text-[#3b9c88]">{book.author || 'Unknown Author'}</span></p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded">{book.bid}</span>
                                  <span className="text-[10px] font-semibold text-[#337ab7] bg-[#337ab7]/15 border border-[#337ab7]/30 px-2 py-0.5 rounded">
                                    Submitted by: {book.whoadded || 'Unknown'}
                                  </span>
                                  {book.addedByRole && (
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                      {book.addedByRole}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleApproveBook(book._id)}
                                  className="bg-[#3b9c88] hover:bg-[#318473] text-white font-semibold text-xs px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleDeleteBook(book._id)}
                                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-xs px-3 py-1.5 rounded-md border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </div>
                            </div>
                            {book.description && (
                              <p className="text-[11px] text-[var(--text-secondary)] mt-2 line-clamp-2">{book.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN STATS TAB */}
              {activeTab === 'admin-stats' && (
                <div className="space-y-4">
                  {/* Fair Ranking Notice */}
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 flex items-center gap-3 text-[var(--text-primary)] text-xs">
                    <Sparkles className="w-5 h-5 text-[#337ab7] shrink-0" />
                    <div>
                      <p className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                        Fair Leaderboard Policy
                      </p>
                      <p className="text-[var(--text-secondary)] text-[11px] mt-0.5">
                        Admin rankings are determined by <strong>distinct book types added (same ISBN = 1 type)</strong>. Submitting 5 copies in one form counts as 1 book type towards your ranking position while displaying total physical copies.
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)] py-16 text-center flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-2 border-[#337ab7]/20 border-t-[#337ab7] rounded-full animate-spin" />
                      <span className="font-semibold text-xs text-[var(--text-secondary)]">Loading statistics...</span>
                    </div>
                  ) : filteredAdminStats.length === 0 ? (
                    <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)] py-20 text-center flex flex-col items-center gap-3">
                      <p className="font-bold text-[var(--text-secondary)] text-sm">No contribution data available matching your search.</p>
                    </div>
                  ) : (
                    filteredAdminStats.map((entry, idx) => {
                      const medals = ['🥇', '🥈', '🥉'];
                      const roleColors = {
                        superadmin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                        admin: 'bg-[#337ab7]/15 text-[#337ab7] border-[#337ab7]/30',
                        subadmin: 'bg-[#3b9c88]/15 text-[#3b9c88] border-[#3b9c88]/30',
                        reader: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)]',
                      };
                      return (
                        <div key={entry._id} className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4 flex items-center gap-4">
                          <div className="text-2xl w-9 text-center shrink-0 font-bold text-[var(--text-primary)]">{medals[idx] || `#${idx + 1}`}</div>
                          <img
                            src={entry.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(entry.name || entry._id)}`}
                            alt={entry.name}
                            className="w-10 h-10 rounded-md border border-[var(--border-color)] shrink-0 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[var(--text-primary)] text-sm">{entry.name} {entry.surname || ''}</p>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${roleColors[entry.role] || roleColors.reader}`}>
                                {entry.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{entry.email}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                              <span className="font-semibold text-[#337ab7] bg-[#337ab7]/10 px-2.5 py-1 rounded border border-[#337ab7]/30 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-[#337ab7]" />
                                <span className="font-bold text-sm">{entry.uniqueTypesCount || 0}</span> Book Types Added
                              </span>
                              <span className="text-[var(--text-secondary)] font-medium text-[11px]">
                                ({entry.addedCount || 0} total physical copies)
                              </span>
                              <span className="text-[var(--border-color)]">|</span>
                              <span className="font-semibold text-[var(--text-secondary)]">
                                <span className="text-emerald-500 font-bold">{entry.approvedCount || 0}</span> approved
                              </span>
                              <span className="text-[var(--border-color)]">|</span>
                              <span className="font-semibold text-[var(--text-secondary)]">
                                <span className="text-amber-500 font-bold">{entry.pendingCount || 0}</span> pending
                              </span>
                            </div>
                          </div>
                          {isSuperAdmin && entry.role !== 'superadmin' && (
                            <div className="shrink-0">
                              <select
                                defaultValue={entry.role}
                                onChange={(e) => handleChangeUserRole(entry._id, e.target.value, entry.role)}
                                className="text-xs font-semibold border border-[var(--border-color)] rounded-md px-3 py-1.5 bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer transition-colors"
                              >
                                <option value="reader">Reader</option>
                                <option value="subadmin">Subadmin</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* BOOKS & USERS TABLE */}
              {(activeTab === 'books' || activeTab === 'users') && (
              <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        <th className="py-3.5 px-5">Id</th>
                        <th className="py-3.5 px-5">{activeTab === 'books' ? 'Book Title & Cover' : 'User Profile'}</th>
                        <th className="py-3.5 px-5">{activeTab === 'books' ? 'Author / Creator' : 'Email Address'}</th>
                        <th className="py-3.5 px-5">{activeTab === 'books' ? 'Borrowed Status' : 'Role'}</th>
                        <th className="py-3.5 px-5">{activeTab === 'books' ? 'Added By' : 'Class / Details'}</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border-color)] text-xs font-medium text-[var(--text-primary)]">
                      
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-[var(--text-secondary)]">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="w-7 h-7 border-2 border-[#337ab7]/20 border-t-[#337ab7] rounded-full animate-spin" />
                              <span className="font-semibold text-xs">Loading directory data...</span>
                            </div>
                          </td>
                        </tr>
                      ) : activeTab === 'books' ? (
                        // BOOKS LIST ROWS
                        books.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)]">
                              No book records found matching your filter criteria.
                            </td>
                          </tr>
                        ) : (
                          books.map((book) => {
                            const isBorrowed = book.borrowed && book.borrowed !== '0' && book.borrowed !== '';
                            return (
                              <tr key={book._id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                                
                                {/* BID Code */}
                                <td className="py-3.5 px-5 font-mono font-semibold text-[var(--text-secondary)] text-[11px]">
                                  #{book.bid || book._id.slice(-6)}
                                </td>

                                {/* Cover & Name */}
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-3.5">
                                    <img
                                      src={book.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200'}
                                      alt={book.name}
                                      className="w-9 h-13 object-cover rounded border border-[var(--border-color)] shrink-0 bg-[var(--bg-secondary)]"
                                      onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200';
                                      }}
                                    />
                                    <div>
                                      <p className="font-bold text-[var(--text-primary)] group-hover:text-[#337ab7] transition-colors line-clamp-1">
                                        {book.name}
                                      </p>
                                      <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                        {book.whentaken ? `Intake: ${book.whentaken}` : 'Intake: 01/04/2026'}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Author */}
                                <td className="py-3.5 px-5 font-semibold text-[#3b9c88]">
                                  {book.author}
                                </td>

                                {/* Borrowed Status */}
                                <td className="py-3.5 px-5">
                                  {isBorrowed ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      Borrowed: {book.borrowed}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      In Library Stock
                                    </span>
                                  )}
                                </td>

                                {/* Added By */}
                                <td className="py-3.5 px-5">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-[var(--text-secondary)] truncate max-w-[140px]">
                                      {book.whoadded && book.whoadded !== 'none' ? book.whoadded : '—'}
                                    </span>
                                    {book.addedByRole && (
                                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded w-fit border ${
                                        book.addedByRole === 'superadmin' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                                        book.addedByRole === 'admin' ? 'bg-[#337ab7]/15 text-[#337ab7] border-[#337ab7]/30' :
                                        book.addedByRole === 'subadmin' ? 'bg-[#3b9c88]/15 text-[#3b9c88] border-[#3b9c88]/30' :
                                        'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                                      }`}>
                                        {book.addedByRole}
                                      </span>
                                    )}
                                    {!book.isApproved && (
                                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded w-fit bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 3-Dots Action Popup Menu */}
                                <td className="py-3.5 px-5 text-right relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionMenuId(actionMenuId === book._id ? null : book._id);
                                    }}
                                    className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {/* POPUP ACTION DROPDOWN */}
                                  {actionMenuId === book._id && (
                                    <div className="absolute right-6 top-11 w-48 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg shadow-xl p-1.5 z-50 text-left">
                                      <button
                                        onClick={() => {
                                          setActionMenuId(null);
                                          handleOpenEditBook(book);
                                        }}
                                        className="w-full px-3 py-2 rounded-md text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-[#337ab7]" />
                                        Edit Details & Photo
                                      </button>

                                      <button
                                        onClick={() => {
                                          setActionMenuId(null);
                                          handleOpenSuxModal(book);
                                        }}
                                        className="w-full px-3 py-2 rounded-md text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2.5 transition-colors cursor-pointer mt-0.5"
                                      >
                                        <Copy className="w-3.5 h-3.5 text-[#3b9c88]" />
                                        + Add SUX Copy
                                      </button>

                                      <div className="h-px bg-[var(--border-color)] my-1" />

                                      <button
                                        onClick={() => {
                                          setActionMenuId(null);
                                          handleDeleteBook(book._id);
                                        }}
                                        className="w-full px-3 py-2 rounded-md text-xs font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                        Delete Book Entry
                                      </button>
                                    </div>
                                  )}
                                </td>

                              </tr>
                            );
                          })
                        )
                      ) : (
                        // USERS LIST ROWS
                        users.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)]">
                              No user accounts found matching your filter criteria.
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => (
                            <tr key={u._id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                              
                              {/* User ID */}
                              <td className="py-3.5 px-5 font-mono font-semibold text-[var(--text-secondary)] text-[11px]">
                                #{u._id.slice(-6)}
                              </td>

                              {/* Profile Avatar & Name */}
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                                    alt={u.name}
                                    className="w-8 h-8 object-cover rounded-md border border-[var(--border-color)] shrink-0 bg-[var(--bg-secondary)]"
                                  />
                                  <div>
                                    <p className="font-bold text-[var(--text-primary)] group-hover:text-[#337ab7] transition-colors">
                                      {u.name} {u.surname}
                                    </p>
                                    {u.isExternal && (
                                      <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded">
                                        External Visitor
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Email */}
                              <td className="py-3.5 px-5 font-medium text-[var(--text-secondary)]">
                                {u.email}
                              </td>

                              {/* Role Badge */}
                              <td className="py-3.5 px-5">
                                {u.role === 'superadmin' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                    <Shield className="w-3 h-3" />
                                    Super Admin
                                  </span>
                                ) : u.role === 'admin' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#337ab7]/15 text-[#337ab7] border border-[#337ab7]/30">
                                    <Shield className="w-3 h-3" />
                                    Admin
                                  </span>
                                ) : u.role === 'subadmin' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#3b9c88]/15 text-[#3b9c88] border border-[#3b9c88]/30">
                                    Subadmin
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                                    Reader
                                  </span>
                                )}
                              </td>

                              {/* Class / Details */}
                              <td className="py-3.5 px-5 font-medium text-[var(--text-secondary)]">
                                {u.studentClass ? `Class: ${u.studentClass}` : 'Standard Account'}
                              </td>

                              {/* Action Menu */}
                              <td className="py-3.5 px-5 text-right relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionMenuId(actionMenuId === u._id ? null : u._id);
                                  }}
                                  className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* POPUP ACTION DROPDOWN FOR USER */}
                                {actionMenuId === u._id && (
                                  <div className="absolute right-6 top-11 w-48 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg shadow-xl p-1.5 z-50 text-left">
                                    <button
                                      onClick={() => {
                                        setActionMenuId(null);
                                        handleOpenEditUser(u);
                                      }}
                                      className="w-full px-3 py-2 rounded-md text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-[#337ab7]" />
                                      Edit User Profile
                                    </button>

                                    <div className="h-px bg-[var(--border-color)] my-1" />

                                    <button
                                      onClick={() => {
                                        setActionMenuId(null);
                                        handleDeleteUser(u._id);
                                      }}
                                      className="w-full px-3 py-2 rounded-md text-xs font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                      Delete Account
                                    </button>
                                  </div>
                                )}
                              </td>

                            </tr>
                          ))
                        )
                      )}

                    </tbody>

                  </table>
                </div>
              </div>
              )}

            </div>

            {/* Pagination Controls */}
            <div className="mt-8 flex items-center justify-between border-t border-[var(--border-color)] pt-5">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Showing Page <span className="text-[var(--text-primary)] font-bold">{page}</span> of{' '}
                <span className="text-[var(--text-primary)] font-bold">{totalPages}</span> ({totalCount} total items)
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </main>

        </div>

      </div>

      {/* ================= EDIT BOOK & PHOTO MODAL ================= */}
      {editBookModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-[var(--border-color)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Book & Cover Photo</h3>
                <p className="text-xs text-[var(--text-secondary)]">Update catalog metadata and art assets</p>
              </div>
              <button onClick={() => setEditBookModal(null)} className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              
              {/* Cover Art Upload / Preview */}
              <div className="md:col-span-1 space-y-3">
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Book Cover Art</label>
                <div className="aspect-[3/4] rounded-lg bg-[var(--bg-secondary)] border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center relative overflow-hidden group">
                  {bookForm.image ? (
                    <img src={bookForm.image} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-7 h-7 text-[var(--text-muted)] mx-auto mb-2" />
                      <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Upload Photo</span>
                    </div>
                  )}
                  {uploadingImg && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#337ab7] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Or paste Image URL..."
                  value={bookForm.image}
                  onChange={(e) => setBookForm({ ...bookForm, image: e.target.value })}
                  className="w-full text-[11px] p-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {/* Form Metadata Fields */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Book Title</label>
                  <input
                    type="text"
                    value={bookForm.name}
                    onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-semibold mt-1 outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Author</label>
                    <input
                      type="text"
                      value={bookForm.author}
                      onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-semibold mt-1 outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">BID / Barcode</label>
                    <input
                      type="text"
                      value={bookForm.bid}
                      onChange={(e) => setBookForm({ ...bookForm, bid: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-mono font-semibold mt-1 outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Borrowed Status (0 = Available)</label>
                  <input
                    type="text"
                    value={bookForm.borrowed}
                    onChange={(e) => setBookForm({ ...bookForm, borrowed: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-medium mt-1 outline-none focus:border-[var(--accent-primary)]"
                    placeholder="0 or Borrower Name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    value={bookForm.description}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-medium mt-1 outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setEditBookModal(null)}
                className="px-4 py-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBook}
                className="px-5 py-2 rounded-md bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-semibold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD SUX COPY MODAL ================= */}
      {suxModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg max-w-lg w-full p-6 shadow-2xl border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">+ Add SUX Copy to Catalog</h3>
                <p className="text-xs text-[var(--text-secondary)]">Register duplicate copy for existing title</p>
              </div>
              <button onClick={() => setSuxModal(null)} className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[var(--bg-secondary)] p-3.5 rounded-lg mb-5 flex items-center gap-4 border border-[var(--border-color)]">
              <img
                src={suxForm.baseBook.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200'}
                alt="Book"
                className="w-11 h-15 object-cover rounded border border-[var(--border-color)] shrink-0"
              />
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-xs">{suxForm.baseBook.name}</h4>
                <p className="text-[11px] text-[#3b9c88] font-medium">Author: {suxForm.baseBook.author}</p>
                <p className="text-[10px] text-[#337ab7] font-mono font-bold">Base ISBN: {suxForm.baseIsbn}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">
                  Copy Suffix Codes (e.g. "02", "03", or range "2-5")
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={suxForm.suxInput}
                    onChange={(e) => setSuxForm({ ...suxForm, suxInput: e.target.value })}
                    placeholder="Type suffix e.g. 02..."
                    className="flex-1 p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-mono font-semibold outline-none focus:border-[var(--accent-primary)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSuxTokens(suxForm.suxInput);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddSuxTokens(suxForm.suxInput)}
                    className="px-4 py-2.5 bg-[#337ab7] text-white font-semibold rounded-md text-xs hover:bg-[#286090] cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Suffix Tags Chips */}
              <div className="flex flex-wrap gap-1.5 p-3 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)] min-h-[60px]">
                {suxForm.suxList.map((code, idx) => (
                  <span key={idx} className="bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[#337ab7] text-xs font-mono font-semibold px-2.5 py-1 rounded flex items-center gap-2">
                    <span>{suxForm.baseIsbn}-{code}</span>
                    <button
                      onClick={() => setSuxForm(prev => ({ ...prev, suxList: prev.suxList.filter((_, i) => i !== idx) }))}
                      className="text-[var(--text-secondary)] hover:text-rose-500 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setSuxModal(null)}
                className="px-4 py-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSuxCopies}
                className="px-5 py-2 rounded-md bg-[#3b9c88] hover:bg-[#318473] text-white text-xs font-semibold cursor-pointer"
              >
                Register {suxForm.suxList.length} SUX Copy/Copies
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= EDIT / CREATE USER MODAL ================= */}
      {(editUserModal || createUserModal) && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg max-w-md w-full p-6 shadow-2xl border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {createUserModal ? 'Create New User Account' : 'Edit User Profile'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Manage reader credentials and system role</p>
              </div>
              <button onClick={() => { setEditUserModal(null); setCreateUserModal(false); }} className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-semibold mt-1 outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-semibold mt-1 outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">System Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-semibold mt-1 outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="reader">Reader / Student</option>
                    <option value="admin">Librarian Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Student Class</label>
                  <input
                    type="text"
                    value={userForm.studentClass}
                    onChange={(e) => setUserForm({ ...userForm, studentClass: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-semibold mt-1 outline-none focus:border-[var(--accent-primary)]"
                    placeholder="e.g. 10-A"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">
                  {createUserModal ? 'Set Password' : 'Reset Password (optional)'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-xs font-semibold mt-1 outline-none focus:border-[var(--accent-primary)]"
                  placeholder={createUserModal ? 'Password...' : 'Leave blank to keep unchanged'}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => { setEditUserModal(null); setCreateUserModal(false); }}
                className="px-4 py-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={createUserModal ? handleSaveCreateUser : handleSaveUser}
                className="px-5 py-2 rounded-md bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-semibold cursor-pointer"
              >
                {createUserModal ? 'Create Account' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
