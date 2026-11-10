import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Backend API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AuthProvider = ({ children }) => {
  const [reader, setReader] = useState(() => {
    const savedReader = localStorage.getItem('grand_library_reader');
    return savedReader ? JSON.parse(savedReader) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('grand_library_token') || null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate token on mount
  useEffect(() => {
    const fetchCurrentReader = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/readers/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success && data.reader) {
          setReader(data.reader);
          localStorage.setItem('grand_library_reader', JSON.stringify(data.reader));
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentReader();
  }, [token]);

  // Handle saving auth state
  const saveAuthSession = (newToken, readerData) => {
    setToken(newToken);
    setReader(readerData);
    localStorage.setItem('grand_library_token', newToken);
    localStorage.setItem('grand_library_reader', JSON.stringify(readerData));
  };

  // Sign Up with Email & Password
  const signup = async (name, email, password, extraFields = {}) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/readers/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, ...extraFields })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Signup failed');
      }

      saveAuthSession(data.token, data.reader);
      return data.reader;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Create Student Account (Librarian/Admin Action)
  const createStudentAccount = async (studentData) => {
    if (!token) throw new Error('Authorization token missing');
    try {
      const response = await fetch(`${API_BASE_URL}/readers/create-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(studentData)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create student account');
      }
      return data.reader;
    } catch (err) {
      throw err;
    }
  };

  // Log In with Email & Password
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/readers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      saveAuthSession(data.token, data.reader);
      return data.reader;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Sign In / Sign Up with Google
  const googleLogin = async (googleUser) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/readers/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleUser)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Google Auth failed');
      }

      saveAuthSession(data.token, data.reader);
      return data.reader;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Log Out
  const logout = () => {
    setToken(null);
    setReader(null);
    localStorage.removeItem('grand_library_token');
    localStorage.removeItem('grand_library_reader');
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/readers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Profile update failed');
      }

      setReader(data.reader);
      localStorage.setItem('grand_library_reader', JSON.stringify(data.reader));
      return data.reader;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Request to Borrow Book (Student Action)
  const borrowBook = async (bookInfo) => {
    if (!token) throw new Error('Please log in to request borrowing books');
    try {
      const response = await fetch(`${API_BASE_URL}/readers/borrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookInfo)
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to request book');

      // Refresh reader state
      setReader((prev) => ({
        ...prev,
        borrowedBooks: data.borrowedBooks
      }));
      localStorage.setItem(
        'grand_library_reader',
        JSON.stringify({ ...reader, borrowedBooks: data.borrowedBooks })
      );
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Cancel Pending Borrow Request (Student Action)
  const cancelBorrowRequest = async (bookId) => {
    if (!token) throw new Error('Please log in');
    try {
      const response = await fetch(`${API_BASE_URL}/readers/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to cancel request');

      setReader((prev) => ({
        ...prev,
        borrowedBooks: data.borrowedBooks
      }));
      localStorage.setItem(
        'grand_library_reader',
        JSON.stringify({ ...reader, borrowedBooks: data.borrowedBooks })
      );
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Give Book Copy to Student (Librarian & Super Admin ONLY)
  const giveBookToStudent = async (bookId, payload) => {
    if (!token) throw new Error('Staff authorization token required');
    const response = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(bookId)}/give`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-requester-id': reader?._id || '',
        'x-requester-role': reader?.role || ''
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Failed to give book to student');
    }
    return data;
  };

  // Mark Returned Book as in the Shelves (Librarian & Super Admin ONLY)
  const markBookReturnedToShelf = async (bookId, copyBid) => {
    if (!token) throw new Error('Staff authorization token required');
    const response = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(bookId)}/return-shelf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-requester-id': reader?._id || '',
        'x-requester-role': reader?.role || ''
      },
      body: JSON.stringify({ copyBid: copyBid || bookId })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Failed to mark book as returned in shelves');
    }
    return data;
  };

  // Return Book (Librarian & Super Admin ONLY)
  const returnBook = async (bookId, studentId) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/readers/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId, studentId })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to return book');

      if (!studentId || studentId === reader?._id) {
        setReader((prev) => ({
          ...prev,
          borrowedBooks: data.borrowedBooks
        }));
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Toggle Favorite Book
  const toggleFavorite = async (bookId) => {
    if (!token) throw new Error('Please log in to save favorite books');
    try {
      const response = await fetch(`${API_BASE_URL}/readers/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to update favorite');

      setReader((prev) => ({
        ...prev,
        favoriteBooks: data.favoriteBooks
      }));
      return data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        reader,
        token,
        loading,
        authError,
        signup,
        login,
        googleLogin,
        logout,
        updateProfile,
        createStudentAccount,
        borrowBook,
        cancelBorrowRequest,
        giveBookToStudent,
        markBookReturnedToShelf,
        returnBook,
        toggleFavorite,
        isSuperAdmin: ['superadmin', 'librarian'].includes(reader?.role),
        isLibrarian: reader?.role === 'librarian',
        isAdmin: ['superadmin', 'admin', 'librarian'].includes(reader?.role),
        isSubAdmin: reader?.role === 'subadmin',
        isStaff: ['superadmin', 'admin', 'librarian', 'subadmin'].includes(reader?.role),
        canAccessAdminPanel: ['superadmin', 'admin', 'librarian', 'subadmin'].includes(reader?.role),
        canManageCirculation: ['superadmin', 'librarian'].includes(reader?.role),
        canManageRoles: ['superadmin', 'librarian'].includes(reader?.role),
        canApproveBooks: ['superadmin', 'admin', 'librarian'].includes(reader?.role),
        canAddBooks: ['superadmin', 'admin', 'librarian', 'subadmin'].includes(reader?.role),
        userRole: reader?.role || 'reader',
        isAuthenticated: !!reader
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
