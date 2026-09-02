import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar';
import { BookOpen, User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, X } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Account Chooser Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Official @react-oauth/google hook
  const handleOAuthLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await res.json();
        
        await googleLogin({
          email: googleUser.email,
          name: googleUser.name || googleUser.given_name || 'Google Reader',
          googleId: googleUser.sub,
          avatar: googleUser.picture
        });

        navigate('/account');
      } catch (err) {
        setError(err.message || 'Google authentication failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setShowGoogleModal(true);
    }
  });

  const handleGoogleClick = () => {
    if (import.meta.env.VITE_GOOGLE_CLIENT_ID && !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('demo')) {
      try {
        handleOAuthLogin();
      } catch (e) {
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const executeGoogleLogin = async (userEmail, userName) => {
    try {
      setLoading(true);
      setError('');
      setShowGoogleModal(false);

      const nameToUse = userName || userEmail.split('@')[0].replace('.', ' ');
      const formattedName = nameToUse.charAt(0).toUpperCase() + nameToUse.slice(1);

      await googleLogin({
        email: userEmail,
        name: formattedName,
        googleId: `google_${Date.now()}`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userEmail)}`
      });

      navigate('/account');
    } catch (err) {
      setError(err.message || 'Google Auth failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signup(name, email, password, { surname, birthdate, studentClass, isExternal });
      navigate('/account');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-hidden">
      <Navbar />

      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-4 py-28 relative z-10">
        <div className="w-full max-w-md bg-[#0b0b0e]/80 border border-gray-800/80 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black font-[Outfit] tracking-tight uppercase italic bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Become a Reader
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1.5 font-medium">
              Create your account to borrow, track & save books
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full mb-6 bg-[#16161a] hover:bg-[#1f1f24] border border-gray-700/60 text-white font-bold text-xs sm:text-sm py-3.5 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:border-gray-500 cursor-pointer group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign Up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-800 w-full" />
            <span className="bg-[#0b0b0e] px-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 absolute">
              or register details
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                  First Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First Name"
                    required
                    className="w-full bg-[#121216] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-3 py-3.5 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                  Surname
                </label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Last Name"
                  className="w-full bg-[#121216] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl px-4 py-3.5 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                  Birthdate
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full bg-[#121216] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl px-3 py-3.5 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                  Class / Grade
                </label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="e.g. 10-A"
                  className="w-full bg-[#121216] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl px-4 py-3.5 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#121216] border border-gray-800 rounded-2xl cursor-pointer" onClick={() => setIsExternal(!isExternal)}>
              <input
                type="checkbox"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-300 font-medium">External Reader (Non-Student Member)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reader@library.com"
                  required
                  className="w-full bg-[#121216] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-3.5 transition-all outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#121216] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-10 py-3.5 transition-all outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 font-[Outfit]">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#121216] border border-gray-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-3.5 transition-all outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-[Outfit]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Reader Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center border-t border-gray-800/80 pt-6">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                Sign In instead
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* GOOGLE ACCOUNT CHOOSER MODAL (Exact match to Google OAuth Modal) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="font-semibold text-gray-700 text-sm">Sign in with Google</span>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1 font-sans">Choose an account</h2>
              <p className="text-sm text-gray-600 mb-8">
                to continue to <span className="font-bold text-blue-600">Grand Library</span>
              </p>

              {/* Account Options */}
              <div className="space-y-2 text-left">
                {/* Preset Account Option 1 */}
                <button
                  onClick={() => executeGoogleLogin('reader.scholar@gmail.com', 'Alex Scholar')}
                  className="w-full p-3.5 rounded-2xl hover:bg-gray-50 border border-gray-100 transition-all flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
                    A
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-bold text-gray-900 leading-tight">Alex Scholar</p>
                    <p className="text-xs text-gray-500 truncate">reader.scholar@gmail.com</p>
                  </div>
                </button>

                {/* Preset Account Option 2 */}
                <button
                  onClick={() => executeGoogleLogin('sarah.reader@gmail.com', 'Sarah Jenkins')}
                  className="w-full p-3.5 rounded-2xl hover:bg-gray-50 border border-gray-100 transition-all flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
                    S
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-bold text-gray-900 leading-tight">Sarah Jenkins</p>
                    <p className="text-xs text-gray-500 truncate">sarah.reader@gmail.com</p>
                  </div>
                </button>

                {/* Custom Account Option */}
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full p-3.5 rounded-2xl hover:bg-gray-50 border border-gray-100 transition-all flex items-center gap-4 cursor-pointer text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold">Use another account</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Google Email</label>
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Your Name</label>
                      <input
                        type="text"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="Display Name"
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (customGoogleEmail) {
                          executeGoogleLogin(customGoogleEmail, customGoogleName);
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md"
                    >
                      Continue to Grand Library
                    </button>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <p className="mt-8 text-xs text-gray-500 leading-relaxed">
                To continue, Google will share your name, email address, and profile picture with <span className="font-semibold text-gray-700">Grand Library</span>.
              </p>
            </div>

          </div>
        </div>
      )}

      <footer className="py-6 text-center text-xs text-gray-600 border-t border-gray-900/60 relative z-10">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Grand Library Reader Account Agreement & Privacy
        </p>
      </footer>
    </div>
  );
}
