import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import Loader from '../components/Loader';
import Navbar from '../components/Navbar';
import { ArrowLeft, Camera, Square, Search, RotateCcw, BookOpen } from 'lucide-react';

const ScannerSearch = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState(Array(13).fill(''));
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => console.error(err));
      }
    };
  }, []);

  const startScanner = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const scanner = new Html5Qrcode('reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 }
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
          scanner
            .stop()
            .then(() => {
              setIsScanning(false);
            })
            .catch((err) => console.error(err));
        },
        () => {}
      );
    } catch {
      setError('Camera access failed. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Stop scanner error:', err);
        setIsScanning(false);
      }
    }
  };

  const handleScanSuccess = (text) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length === 13 || digits.length === 10) {
      const newSlots = Array(13).fill('');
      digits.split('').forEach((char, i) => {
        if (i < 13) newSlots[i] = char;
      });
      setSlots(newSlots);
      performSearch(newSlots);
    } else {
      setError(`Invalid Barcode: ${text}. Expected 10 or 13 digits.`);
    }
  };

  const handleSlotChange = (index, value) => {
    const char = value.slice(-1);
    const newSlots = [...slots];
    newSlots[index] = char;
    setSlots(newSlots);

    if (char && index < 12) {
      const nextInput = document.getElementById(`slot-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !slots[index] && index > 0) {
      const prevInput = document.getElementById(`slot-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
    if (e.key === 'Enter') {
      performSearch(slots);
    }
  };

  const performSearch = async (currentSlots) => {
    setLoading(true);
    setError(null);
    try {
      let pattern = currentSlots.map((s) => (s === '' ? '.' : s)).join('');
      pattern = pattern.replace(/\.*$/, '');

      if (pattern === '') {
        setBooks([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/books?bid=${pattern}`, {
        headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' }
      });

      if (!response.ok) throw new Error('Search failed');

      const result = await response.json();

      if (result && result.data) {
        setBooks(result.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] pt-20 pb-12 px-4 sm:px-8 flex flex-col items-center">
      <Navbar />

      <div className="max-w-4xl w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/search')}
              className="cw-btn px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catalogue</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Barcode & ISBN-13 Lookup
            </h1>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            Scan camera barcode or enter partial ISBN digits
          </span>
        </div>

        {/* Camera Scanner Box */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="flex flex-col items-center gap-4">
            <div
              id="reader"
              className={`w-full max-w-[440px] aspect-video bg-[var(--bg-secondary)] rounded border border-dashed border-[var(--border-strong)] overflow-hidden ${
                isScanning ? 'block' : 'hidden'
              }`}
            />

            {!isScanning ? (
              <button
                onClick={startScanner}
                className="bg-[#337ab7] hover:bg-[#286090] text-white px-6 py-2.5 rounded text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Barcode Scanner</span>
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="cw-btn-danger px-6 py-2.5 rounded text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>Stop Camera Scanner</span>
              </button>
            )}
            <p className="text-[var(--text-secondary)] text-xs">
              Align the book&apos;s 10-digit or 13-digit ISBN barcode within the camera frame.
            </p>
          </div>
        </div>

        {/* Manual ISBN-13 Pattern Search */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              ISBN-13 Digit Pattern Matcher
            </h3>
            <span className="text-[11px] text-[var(--text-muted)]">
              Leave unknown positions blank for wildcard matching
            </span>
          </div>

          <div className="grid grid-cols-7 sm:flex sm:flex-wrap justify-center gap-2">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <input
                  id={`slot-${idx}`}
                  type="text"
                  maxLength="1"
                  value={slot}
                  onChange={(e) => handleSlotChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-10 h-12 text-center text-base font-bold font-mono rounded border transition-colors ${
                    slot
                      ? 'bg-[#337ab7] border-[#286090] text-white'
                      : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                  placeholder="·"
                />
                <span className="text-[10px] text-[var(--text-muted)] font-mono">{idx + 1}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            <button
              onClick={() => performSearch(slots)}
              disabled={loading || slots.every((s) => s === '')}
              className="bg-[#3b9c88] hover:bg-[#318473] disabled:opacity-50 text-white px-6 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Search Pattern'}</span>
            </button>
            <button
              onClick={() => {
                setSlots(Array(13).fill(''));
                setBooks([]);
              }}
              className="cw-btn px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Digits</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded border bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)] text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Matching Books Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader text="Searching catalog records..." />
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.map((book) => (
              <div
                key={book.bid || book._id}
                className="flex bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg overflow-hidden p-4 gap-4 hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="w-20 h-28 shrink-0 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)] overflow-hidden flex items-center justify-center">
                  {book.image ? (
                    <img src={book.image} alt={book.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2">
                        {book.name}
                      </h3>
                      {book.copyCount > 1 && (
                        <span className="cw-badge-info shrink-0">{book.copyCount} copies</span>
                      )}
                    </div>
                    <p className="text-xs text-[#3b9c88] font-medium mt-0.5 truncate">
                      {book.author}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
                      ISBN: {(book.bid || '').split('-')[0]}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/book/${book._id}`)}
                      className="cw-btn-primary py-1.5 px-3 text-xs"
                    >
                      Open Book Record
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading &&
          slots.some((s) => s !== '') && (
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg p-10 text-center space-y-2">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                No books match this ISBN pattern
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Check the entered digits or try searching by title in the main catalogue.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ScannerSearch;
