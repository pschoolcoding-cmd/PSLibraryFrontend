import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Layers, 
  BookOpen, 
  Key, 
  ListFilter, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Edit3,
  Plus,
  Trash2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function GenreOrganizer() {
  const { isAdmin } = useAuth();

  // Do not automatically reuse a browser-stored key. A stale OAuth token or API
  // key would override the server's GEMINI_API_KEY and cause Gemini 401 errors.
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [currentActionMsg, setCurrentActionMsg] = useState('');
  
  const [lastBatchResults, setLastBatchResults] = useState([]);
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [masterGenresInput, setMasterGenresInput] = useState('');
  const [newGenreTag, setNewGenreTag] = useState('');

  const autoRunRef = useRef(false);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const saveApiKey = (key) => {
    setApiKey(key.trim());
    setShowKeyInput(false);
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/books/genre-organizer/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus(data);
      if (data.masterGenres) {
        setMasterGenresInput(data.masterGenres.join(', '));
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  const processBatch = async () => {
    const keyToUse = apiKey.trim();

    try {
      setCurrentActionMsg('Sending 10-book batch to Gemini AI...');
      const res = await fetch(`${API_BASE_URL}/books/genre-organizer/organize-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(keyToUse ? { 'x-gemini-api-key': keyToUse } : {})
        },
        body: JSON.stringify({
          ...(keyToUse ? { apiKey: keyToUse } : {}),
          batchSize: 10
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process batch');
      }

      setStatus(prev => ({
        ...prev,
        masterGenres: data.masterGenres || prev?.masterGenres,
        totalBooks: data.totalBooks,
        organizedCount: data.organizedCount,
        unorganizedCount: data.unorganizedCount,
        progressPercent: data.progressPercent,
        logs: data.logs || prev?.logs
      }));

      if (data.processedBooks && data.processedBooks.length > 0) {
        setLastBatchResults(data.processedBooks);
      }

      return data;
    } catch (err) {
      console.error('Batch processing error:', err);
      setCurrentActionMsg(`Error: ${err.message}`);
      setIsRunning(false);
      autoRunRef.current = false;
      alert(`AI Processing Error: ${err.message}`);
      return null;
    }
  };

  const handleRunSingleBatch = async () => {
    if (isRunning) return;
    setIsRunning(true);
    const result = await processBatch();
    setIsRunning(false);
    setCurrentActionMsg(result?.message || 'Single batch completed.');
  };

  const handleStartAutoRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    autoRunRef.current = true;

    setCurrentActionMsg('Auto-run started: Processing 10 books per request batch...');

    while (autoRunRef.current) {
      const result = await processBatch();
      if (!result || result.completed || !autoRunRef.current) {
        break;
      }
      // Wait 1.5s between batches for API rate-limiting friendliness
      setCurrentActionMsg(`Batch complete! Waiting 1.5s before next 10 books... (${result.organizedCount}/${result.totalBooks})`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsRunning(false);
    autoRunRef.current = false;
    setCurrentActionMsg('Auto-run completed or paused.');
  };

  const handlePauseAutoRun = () => {
    autoRunRef.current = false;
    setIsRunning(false);
    setCurrentActionMsg('Auto-run paused cleanly.');
  };

  const handleResetCheckpoint = async () => {
    if (!window.confirm('Reset genre organization progress? This will reset the checkpoint counter so you can re-organize books.')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/books/genre-organizer/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetMasterGenres: false })
      });
      const data = await res.json();
      if (res.ok) {
        setLastBatchResults([]);
        fetchStatus();
        alert('Organization checkpoint reset successfully!');
      }
    } catch (err) {
      alert(`Reset error: ${err.message}`);
    }
  };

  const handleSaveMasterGenres = async () => {
    const genresArray = masterGenresInput.split(',').map(s => s.trim()).filter(Boolean);
    if (genresArray.length === 0) {
      alert('Master genre list cannot be empty.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/books/genre-organizer/master-genres`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterGenres: genresArray })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(prev => ({ ...prev, masterGenres: data.masterGenres }));
        setIsEditingMaster(false);
        alert('Master canonical genre list updated!');
      }
    } catch (err) {
      alert(`Failed to update master genres: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between font-[Inter]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
            <ShieldAlert className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black font-[Outfit] uppercase italic mb-2 text-indigo-400">
            Librarian Admin Access Required
          </h2>
          <p className="text-gray-400 text-sm max-w-md mb-6">
            The AI Genre Normalizer & Batch Organizer dashboard is restricted to authorized librarians and system administrators.
          </p>
          <a
            href="/search"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            Return to Public Catalog
          </a>
        </div>
      </div>
    );
  }

  const masterGenres = status?.masterGenres || [];
  const organizedCount = status?.organizedCount || 0;
  const totalBooks = status?.totalBooks || 0;
  const progressPercent = status?.progressPercent || 0;

  return (
    <div className="min-h-screen w-full bg-[#030712] text-white pt-24 pb-16 px-4 md:px-12 font-[Inter]">
      <Navbar />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/40 p-6 md:p-8 rounded-3xl border border-gray-800/80 backdrop-blur-xl shadow-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-indigo-500/30 font-[Outfit]">
                AI Metadata Studio
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-emerald-500/30 font-[Outfit]">
                Batch Size: 10
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tight uppercase font-[Outfit] text-white flex items-center gap-3">
              Genre Normalizer & AI Classifier
              <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
            </h1>
            <p className="text-gray-400 text-xs md:text-sm max-w-2xl">
              Consolidate duplicate & wild admin hashtags (e.g. "children", "Kids", "children fantasy") into clean canonical master genres (~20 tags). Automatically processes 10 books per request batch with state checkpointing to pause & resume anytime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="bg-gray-800/80 hover:bg-gray-700 text-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-700 flex items-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4 text-indigo-400" />
              {apiKey ? 'Session Key Configured' : 'Server Key Active'}
            </button>
          </div>
        </div>

        {/* API Key Modal / Drawer */}
        {showKeyInput && (
          <div className="bg-indigo-950/40 border border-indigo-500/40 p-6 rounded-3xl backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-wider font-[Outfit] text-indigo-300">
                  Google Gemini API Key Setup
                </h3>
              </div>
              <button onClick={() => setShowKeyInput(false)} className="text-xs text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-gray-300 mb-4">
              The server uses its private <code className="bg-black/50 px-1.5 py-0.5 rounded text-indigo-300">GEMINI_API_KEY</code> by default. Optionally enter a different Gemini API key for this browser session only; it is not saved.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 bg-black/60 border border-indigo-500/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-400 font-mono"
              />
              <button
                onClick={() => saveApiKey(apiKey)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Save Key
              </button>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Books */}
          <div className="bg-gray-900/40 border border-gray-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Library Books</span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-black font-[Outfit] text-white">{totalBooks}</p>
            <p className="text-[11px] text-gray-500 mt-1">Catalog items analyzed</p>
          </div>

          {/* Organized Progress */}
          <div className="bg-gray-900/40 border border-gray-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Organized Progress</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black font-[Outfit] text-emerald-400">{organizedCount}</p>
              <span className="text-xs text-gray-400 font-bold">/ {totalBooks} ({progressPercent}%)</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Master Genres Count */}
          <div className="bg-gray-900/40 border border-gray-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Master Canonical Genres</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-black font-[Outfit] text-indigo-400">{masterGenres.length}</p>
            <p className="text-[11px] text-gray-500 mt-1">Target ~20 non-overlapping tags</p>
          </div>

          {/* Organizer Status */}
          <div className="bg-gray-900/40 border border-gray-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Batch State</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
              <p className="text-lg font-black font-[Outfit] text-white">
                {isRunning ? 'Processing Batch...' : (progressPercent === 100 ? 'Catalog Organized' : 'Ready / Paused')}
              </p>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 truncate font-mono">{currentActionMsg || 'Checkpoint active'}</p>
          </div>

        </div>

        {/* Master Canonical Genres Palette */}
        <div className="bg-gray-900/40 border border-gray-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <h2 className="text-lg font-black uppercase tracking-wider font-[Outfit] text-white">
                  Master Canonical Genre List ({masterGenres.length})
                </h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Admins should tag new books using these standardized master genres to prevent category inflation!
              </p>
            </div>

            <button
              onClick={() => setIsEditingMaster(!isEditingMaster)}
              className="bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingMaster ? 'Cancel Edit' : 'Edit Canonical List'}
            </button>
          </div>

          {/* Master Genre Tags Grid */}
          {!isEditingMaster ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {masterGenres.map((g, idx) => (
                <span
                  key={`${g}-${idx}`}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm group font-mono"
                >
                  <span className="text-[10px] text-indigo-500">#</span>
                  {g}
                </span>
              ))}
              {masterGenres.length === 0 && (
                <p className="text-xs text-gray-500 italic">No master genres initialized yet. Run batch to synthesize.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-gray-400">Comma-separated list of canonical master genres (~20 total):</p>
              <textarea
                value={masterGenresInput}
                onChange={(e) => setMasterGenresInput(e.target.value)}
                className="w-full h-28 bg-black/60 border border-indigo-500/30 rounded-2xl p-4 text-xs font-mono text-indigo-200 outline-none focus:border-indigo-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSaveMasterGenres}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Save Master List
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Control Center & Batch Execution Buttons */}
        <div className="bg-gray-900/40 border border-gray-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider font-[Outfit] text-white flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-emerald-400" />
                AI Batch Processing Control Center
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Executes **10 books per request**. State is automatically saved to MongoDB after each batch.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Auto-Run All Batches */}
            {!isRunning ? (
              <button
                onClick={handleStartAutoRun}
                disabled={progressPercent === 100}
                className={`bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 ${progressPercent === 100 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Play className="w-4 h-4 fill-current" />
                Auto-Organize All (10 Books / Request)
              </button>
            ) : (
              <button
                onClick={handlePauseAutoRun}
                className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-amber-600/20 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 animate-pulse"
              >
                <Pause className="w-4 h-4 fill-current" />
                Pause Auto-Run
              </button>
            )}

            {/* Run Single 10-Book Batch */}
            <button
              onClick={handleRunSingleBatch}
              disabled={isRunning || progressPercent === 100}
              className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-5 py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Organize Next 10 Books (Single Batch)
            </button>

            {/* Reset Checkpoint */}
            <button
              onClick={handleResetCheckpoint}
              disabled={isRunning}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-4 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Checkpoint
            </button>
          </div>

          {currentActionMsg && (
            <div className="bg-black/50 border border-indigo-500/30 p-4 rounded-2xl text-xs font-mono text-indigo-300 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>{currentActionMsg}</span>
            </div>
          )}
        </div>

        {/* Recent Batch Output Table */}
        {lastBatchResults.length > 0 && (
          <div className="bg-gray-900/40 border border-gray-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
              <h2 className="text-lg font-black uppercase tracking-wider font-[Outfit] text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Latest Batch Results ({lastBatchResults.length} Books Normalized)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800/80 text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="py-3 px-4">Book Title & BID</th>
                    <th className="py-3 px-4">Original Raw Admin Genres</th>
                    <th className="py-3 px-4"></th>
                    <th className="py-3 px-4">AI Normalized Master Genres</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-xs">
                  {lastBatchResults.map((item, i) => (
                    <tr key={item.id || i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div>{item.title}</div>
                        <div className="text-[10px] font-mono text-gray-500">BID: {item.bid}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.oldGenres && item.oldGenres.length > 0 ? (
                            item.oldGenres.map((og, idx) => (
                              <span key={idx} className="bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] px-2 py-0.5 rounded-md font-mono">
                                #{og}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-600 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <ArrowRight className="w-4 h-4" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.newGenres && item.newGenres.map((ng, idx) => (
                            <span key={idx} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] px-2 py-0.5 rounded-md font-mono font-bold">
                              #{ng}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Execution Logs Feed */}
        {status?.logs && status.logs.length > 0 && (
          <div className="bg-gray-900/40 border border-gray-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wider font-[Outfit] text-white flex items-center gap-2 border-b border-gray-800/80 pb-4">
              <Clock className="w-4 h-4 text-purple-400" />
              Audit Execution Logs ({status.logs.length})
            </h2>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {status.logs.map((log, idx) => (
                <div key={idx} className="bg-black/40 border border-gray-800/80 p-3 rounded-xl text-xs font-mono flex items-center justify-between text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{log.message}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
