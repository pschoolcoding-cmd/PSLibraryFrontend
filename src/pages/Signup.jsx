import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, X } from 'lucide-react';

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

  const handleOAuthLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
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
    if (
      import.meta.env.VITE_GOOGLE_CLIENT_ID &&
      !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('demo')
    ) {
      try {
        handleOAuthLogin();
      } catch {
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
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-6 sm:p-8 shadow-xs">
          {/* Header */}
          <div className="pb-5 mb-6 border-b border-[var(--border-color)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[#3b9c88]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">
                Create Reader Account
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Register to borrow, track & organize library books
              </p>
            </div>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-5 p-3 rounded border bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)] text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full mb-5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold text-xs py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
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
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-[var(--border-color)] w-full" />
            <span className="bg-[var(--bg-elevated)] px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] absolute">
              or register details
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First Name"
                  required
                  className="cw-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Surname
                </label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Last Name"
                  className="cw-input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Birthdate
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="cw-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Class / Grade
                </label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="e.g. 10-A"
                  className="cw-input w-full"
                />
              </div>
            </div>

            <div
              className="flex items-center gap-2.5 p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md cursor-pointer"
              onClick={() => setIsExternal(!isExternal)}
            >
              <input
                type="checkbox"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#3b9c88] rounded cursor-pointer"
              />
              <span className="text-xs text-[var(--text-primary)] font-medium">
                External Reader (Non-Student Member)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reader@library.com"
                  required
                  className="cw-input w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="cw-input w-full pl-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="cw-input w-full pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#3b9c88] hover:bg-[#318473] text-white font-semibold text-xs py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Reader Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center border-t border-[var(--border-color)] pt-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#337ab7] hover:underline font-semibold">
                Sign In instead
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* GOOGLE ACCOUNT CHOOSER MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg shadow-xl border border-[var(--border-color)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <span className="font-semibold text-xs">Sign in with Google</span>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold">Choose an account</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  to continue to PS Library Catalogue
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => executeGoogleLogin('reader.scholar@gmail.com', 'Alex Scholar')}
                  className="w-full p-3 rounded-md hover:bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center gap-3 cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded bg-[#337ab7] text-white font-bold flex items-center justify-center text-xs">
                    A
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold">Alex Scholar</p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      reader.scholar@gmail.com
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => executeGoogleLogin('sarah.reader@gmail.com', 'Sarah Jenkins')}
                  className="w-full p-3 rounded-md hover:bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center gap-3 cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded bg-[#3b9c88] text-white font-bold flex items-center justify-center text-xs">
                    S
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold">Sarah Jenkins</p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      sarah.reader@gmail.com
                    </p>
                  </div>
                </button>

                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full p-3 rounded-md hover:bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center gap-3 cursor-pointer text-xs font-semibold"
                  >
                    <User className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span>Use another account</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        Google Email
                      </label>
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="cw-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="Display Name"
                        className="cw-input w-full"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (customGoogleEmail) {
                          executeGoogleLogin(customGoogleEmail, customGoogleName);
                        }
                      }}
                      className="cw-btn-primary w-full py-2 text-xs"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="py-4 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)]">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#337ab7]" />
          PS Library Reader Registration
        </p>
      </footer>
    </div>
  );
}
