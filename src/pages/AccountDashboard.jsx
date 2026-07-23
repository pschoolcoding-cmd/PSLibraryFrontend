import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  User, 
  BookOpen, 
  Heart, 
  Settings, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Edit3, 
  Sparkles, 
  Bookmark,
  Calendar,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function AccountDashboard() {
  const navigate = useNavigate();
  const { reader, logout, updateProfile, returnBook, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('borrowed'); // 'borrowed' | 'favorites' | 'settings'
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newName, setNewName] = useState(reader?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });
  const [updating, setUpdating] = useState(false);
  const [returningId, setReturningId] = useState(null);

  // Redirect if not authenticated
  if (!isAuthenticated && !reader) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black font-[Outfit] uppercase italic mb-2">Access Restricted</h2>
          <p className="text-gray-400 text-sm max-w-sm mb-6">
            Please sign in to access your Grand Library Reader Account Dashboard.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setUpdateMessage({ type: '', text: '' });

      await updateProfile({
        name: newName,
        avatar: newAvatarUrl || undefined,
        password: newPassword || undefined
      });

      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditingAvatar(false);
      setNewPassword('');
    } catch (err) {
      setUpdateMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };

  const handleReturnBook = async (bookId) => {
    try {
      setReturningId(bookId);
      await returnBook(bookId);
    } catch (err) {
      alert(err.message || 'Failed to return book');
    } finally {
      setReturningId(null);
    }
  };

  const activeLoans = reader?.borrowedBooks?.filter(b => b.status === 'active') || [];
  const returnedLoans = reader?.borrowedBooks?.filter(b => b.status === 'returned') || [];

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-blue-500 selection:text-white flex flex-col justify-between relative">
      <Navbar />

      {/* Decorative Background Lighting */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-28 w-full flex-1 relative z-10">
        
        {/* PROFILE BANNER CARD */}
        <div className="bg-[#0b0b0e]/90 border border-gray-800/80 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              {/* Avatar Container */}
              <div className="relative group">
                <img
                  src={reader?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reader?.name || 'R')}`}
                  alt={reader?.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-blue-500/40 shadow-xl shadow-blue-950/50 bg-gray-900"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reader?.name || 'R')}`;
                  }}
                />
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setEditingAvatar(true);
                  }}
                  className="absolute bottom-1 right-1 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-transform group-hover:scale-110"
                  title="Edit Avatar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black font-[Outfit] tracking-tight italic">
                    {reader?.name || 'Grand Reader'}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Scholar Member
                  </span>
                </div>

                <p className="text-gray-400 text-xs sm:text-sm font-medium">{reader?.email}</p>

                <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified ID: #{reader?._id ? reader._id.slice(-6).toUpperCase() : '882190'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    Joined: {reader?.createdAt ? new Date(reader.createdAt).toLocaleDateString() : 'Active Reader'}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>

          </div>

          {/* STATS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-800/80">
            <div className="bg-[#121217] border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black font-[Outfit]">{activeLoans.length}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Borrows</p>
                </div>
              </div>
            </div>

            <div className="bg-[#121217] border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black font-[Outfit]">{reader?.favoriteBooks?.length || 0}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Favorite Books</p>
                </div>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#121217] border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black font-[Outfit]">{returnedLoans.length}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Returned Loans</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* TAB NAVIGATION STRIP */}
        <div className="flex items-center gap-2 border-b border-gray-800 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('borrowed')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold font-[Outfit] transition-all flex items-center gap-2.5 border whitespace-nowrap cursor-pointer ${
              activeTab === 'borrowed'
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                : 'bg-[#0f0f13] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            My Borrowed Books ({activeLoans.length})
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold font-[Outfit] transition-all flex items-center gap-2.5 border whitespace-nowrap cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20'
                : 'bg-[#0f0f13] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            Saved Favorites ({reader?.favoriteBooks?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold font-[Outfit] transition-all flex items-center gap-2.5 border whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                : 'bg-[#0f0f13] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </button>
        </div>

        {/* TAB CONTENTS */}

        {/* 1. MY BORROWED BOOKS TAB */}
        {activeTab === 'borrowed' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black font-[Outfit] uppercase italic tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Active Loaned Titles
              </h3>
              <button
                onClick={() => navigate('/search')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Browse Books <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeLoans.length === 0 ? (
              <div className="bg-[#0e0e12] border border-gray-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                  <Bookmark className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold font-[Outfit] text-white">No Active Borrowed Books</h4>
                <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
                  You currently have no checked-out books. Explore the library catalog to borrow classic and contemporary titles!
                </p>
                <button
                  onClick={() => navigate('/search')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLoans.map((item) => (
                  <div
                    key={item.bookId + item.borrowedDate}
                    className="bg-[#0f0f14] border border-gray-800 hover:border-blue-500/40 p-5 rounded-2xl transition-all flex gap-4 items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.bookName}
                          className="w-16 h-20 object-cover rounded-xl border border-gray-800 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-center justify-center text-blue-400">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white font-[Outfit] line-clamp-1">{item.bookName}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{item.author}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReturnBook(item.bookId)}
                      disabled={returningId === item.bookId}
                      className="bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer"
                    >
                      {returningId === item.bookId ? 'Returning...' : 'Return'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. FAVORITES TAB */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black font-[Outfit] uppercase italic tracking-tight flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              Saved Library Favorites
            </h3>

            {!reader?.favoriteBooks || reader.favoriteBooks.length === 0 ? (
              <div className="bg-[#0e0e12] border border-gray-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold font-[Outfit] text-white">No Saved Favorite Books</h4>
                <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
                  Bookmark titles while exploring the library catalog to build your personal wishlist.
                </p>
                <button
                  onClick={() => navigate('/search')}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-rose-600/30"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {reader.favoriteBooks.map((bid) => (
                  <div
                    key={bid}
                    onClick={() => navigate(`/book/${bid}`)}
                    className="bg-[#0f0f14] border border-gray-800 hover:border-rose-500/40 p-4 rounded-2xl transition-all cursor-pointer group flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-300 font-[Outfit]">Book ID</p>
                        <p className="text-sm font-black text-white font-mono">{bid}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-rose-400 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-[#0e0e12] border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-black font-[Outfit] uppercase italic tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Reader Account Settings
            </h3>

            {updateMessage.text && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 ${
                  updateMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}
              >
                {updateMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{updateMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                  Reader Display Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#14141a] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl px-4 py-3.5 transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={newAvatarUrl}
                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-[#14141a] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl px-4 py-3.5 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full bg-[#14141a] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl px-4 py-3.5 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {updating ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

      </main>

      <footer className="py-8 text-center text-xs text-gray-600 border-t border-gray-900 relative z-10">
        <p>© {new Date().getFullYear()} Grand Library Reader Portal. All permissions active.</p>
      </footer>
    </div>
  );
}
