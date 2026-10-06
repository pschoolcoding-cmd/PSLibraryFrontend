import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pslibrarybackend.onrender.com';
const API_KEY = import.meta.env.VITE_API_KEY || 'supersecret';

const AddBook = () => {
    const { isAdmin, isSubAdmin, canAccessAdminPanel, reader, isAuthenticated } = useAuth();

    if (!canAccessAdminPanel) {
      return (
        <div className="min-h-screen bg-[#030303] text-white flex flex-col justify-between">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-black font-[Outfit] uppercase italic mb-2 text-amber-400">
              Staff Access Only
            </h2>
            <p className="text-gray-400 text-sm max-w-md mb-6">
              The Add Book catalog management page is reserved exclusively for registered staff administrators and subadmins. Readers may browse, search, and borrow from the public catalog.
            </p>
            <a
              href="/search"
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              Browse Catalog Instead
            </a>
          </div>
        </div>
      );
    }

    const [bookIdp1, setBookIdp1] = useState('');
    const [suxInput, setSuxInput] = useState('');
    const [suxList, setSuxList] = useState([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState({});
    const [image, setImage] = useState('');
    const [imageStatus, setImageStatus] = useState(''); // 'uploading', 'done', ''
    const [uploadedImageUrl, setUploadedImageUrl] = useState(''); // stores ImgBB URL
    const [location, setLocation] = useState('0'); // Maps to 'borrowed' field
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

    // Genre tags input UI and logic
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [masterGenres, setMasterGenres] = useState([]);

    // Safe Draft Save State & Key
    const DRAFT_KEY = 'ps_library_add_book_draft';
    const [hasDraft, setHasDraft] = useState(false);

    // ISBN existence check state
    const [isbnCheckResult, setIsbnCheckResult] = useState(null);
    const [isbnChecking, setIsbnChecking] = useState(false);

    // Check if a saved draft exists on mount ONLY (shows banner only on reload)
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && (parsed.title || parsed.bookIdp1 || parsed.author || (parsed.suxList && parsed.suxList.length > 0))) {
                    setHasDraft(true);
                }
            }
        } catch (e) {
            console.error('Error checking saved draft:', e);
        }
    }, []);

    // Auto-save form fields to localStorage silently as user edits
    React.useEffect(() => {
        const hasContent = title.trim() || bookIdp1.trim() || author.trim() || description.trim() || (tags && tags.length > 0) || (suxList && suxList.length > 0) || image;
        if (hasContent) {
            const draftObj = {
                title,
                bookIdp1,
                suxList,
                suxInput,
                author,
                description,
                tags,
                image,
                uploadedImageUrl,
                location
            };
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj));
                // Note: Do NOT call setHasDraft(true) here so pop-up doesn't appear live while editing
            } catch (e) {
                console.error('Error saving draft:', e);
            }
        }
    }, [title, bookIdp1, suxList, suxInput, author, description, tags, image, uploadedImageUrl, location]);

    const restoreDraft = () => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const draft = JSON.parse(saved);
                if (draft.title !== undefined) setTitle(draft.title);
                if (draft.bookIdp1 !== undefined) {
                    setBookIdp1(draft.bookIdp1);
                    checkIsbnStatus(draft.bookIdp1);
                }
                if (draft.suxList !== undefined) setSuxList(draft.suxList);
                if (draft.suxInput !== undefined) setSuxInput(draft.suxInput);
                if (draft.author !== undefined) setAuthor(draft.author);
                if (draft.description !== undefined) setDescription(draft.description);
                if (draft.tags !== undefined) setTags(draft.tags);
                if (draft.image !== undefined) setImage(draft.image);
                if (draft.uploadedImageUrl !== undefined) setUploadedImageUrl(draft.uploadedImageUrl);
                if (draft.location !== undefined) setLocation(draft.location);
                alert('Draft book information restored successfully!');
            }
        } catch (e) {
            alert('Could not restore saved draft.');
        }
    };

    const discardDraft = () => {
        if (window.confirm('Are you sure you want to permanently delete your saved draft? This action cannot be undone.')) {
            try {
                localStorage.removeItem(DRAFT_KEY);
                setHasDraft(false);
                alert('Saved draft has been deleted.');
            } catch (e) {
                console.error('Error discarding draft:', e);
            }
        }
    };

    // Check ISBN existence in catalog on blur or scan
    const checkIsbnStatus = async (val) => {
        const targetIsbn = val !== undefined ? val : bookIdp1;
        if (!targetIsbn || targetIsbn.trim().length < 3) {
            setIsbnCheckResult(null);
            return;
        }
        setIsbnChecking(true);
        try {
            const res = await fetch(`${API_BASE_URL}/books/check-isbn/${encodeURIComponent(targetIsbn.trim())}`);
            if (res.ok) {
                const data = await res.json();
                setIsbnCheckResult(data);
            } else {
                setIsbnCheckResult(null);
            }
        } catch (err) {
            console.error('Error checking ISBN existence:', err);
            setIsbnCheckResult(null);
        } finally {
            setIsbnChecking(false);
        }
    };

    // Autofill metadata from existing book record if found
    const autofillExistingBook = (existingBook) => {
        if (!existingBook) return;
        if (existingBook.name && !title) setTitle(existingBook.name);
        if (existingBook.author && !author) setAuthor(existingBook.author);
        if (existingBook.description && !description) setDescription(existingBook.description);
        if (existingBook.image && !image) {
            setImage(existingBook.image);
            setUploadedImageUrl(existingBook.image);
            setImageStatus('done');
        }
        if (existingBook.genre && (!tags || tags.length === 0)) {
            if (Array.isArray(existingBook.genre)) {
                setTags(existingBook.genre);
            } else if (typeof existingBook.genre === 'object') {
                setTags(Object.values(existingBook.genre).filter(Boolean));
            } else if (typeof existingBook.genre === 'string') {
                setTags(existingBook.genre.split(',').map(s => s.trim()).filter(Boolean));
            }
        }
    };

    // Fetch master canonical genres for admin quick-selection
    React.useEffect(() => {
        fetch(`${API_BASE_URL}/books/genre-organizer/status`)
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data.masterGenres)) {
                    setMasterGenres(data.masterGenres);
                }
            })
            .catch(err => console.warn('Could not fetch master genres for AddBook:', err));
    }, []);

    // keep the original `genre` state in sync with tag list
    React.useEffect(() => {
        setGenre(tags);
    }, [tags]);

    // prevent the form's native submit so the Add Book button can call newbook without reloading
    React.useEffect(() => {
        const form = document.querySelector('form');
        if (!form) return;
        const handler = (e) => e.preventDefault();
        form.addEventListener('submit', handler);
        return () => {
            form.removeEventListener('submit', handler);
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanner = async () => {
        setIsScanning(true);
        try {
            const scanner = new Html5Qrcode("isbn-reader");
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 150 } },
                (decodedText) => {
                    const isbn = decodedText.replace(/[^0-9]/g, '');
                    if (isbn.length === 13 || isbn.length === 10) {
                        setBookIdp1(isbn);
                        checkIsbnStatus(isbn);
                        stopScanner();
                    }
                },
                () => {}
            );
        } catch (err) {
            console.error(err);
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error(err);
                setIsScanning(false);
            }
        }
    };

    // SUX parsing & range expansion (e.g., "1-5", "01-05", "1, 2, 3")
    const parseSuxTokens = (rawInput) => {
        if (!rawInput) return [];
        const tokens = rawInput.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
        const result = [];

        tokens.forEach(token => {
            // Check for range format e.g. "1-5" or "01-05"
            const rangeMatch = token.match(/^(\d+)-(\d+)$/);
            if (rangeMatch) {
                const startStr = rangeMatch[1];
                const endStr = rangeMatch[2];
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                const padLength = startStr.startsWith('0') ? startStr.length : 0;

                if (!isNaN(start) && !isNaN(end) && start <= end && (end - start) <= 100) {
                    for (let i = start; i <= end; i++) {
                        const val = padLength > 0 ? String(i).padStart(padLength, '0') : String(i);
                        result.push(val);
                    }
                    return;
                }
            }
            result.push(token);
        });

        return result;
    };

    const addSux = (val) => {
        const parsed = parseSuxTokens(val);
        if (parsed.length === 0) return;
        setSuxList(prev => {
            const next = [...prev];
            parsed.forEach(item => {
                if (!next.includes(item)) next.push(item);
            });
            return next;
        });
        setSuxInput('');
    };

    const handleSuxKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addSux(suxInput);
        }
    };

    const handleSuxBlur = () => {
        if (suxInput.trim()) {
            addSux(suxInput);
        }
    };

    const generateSuxRange = (count) => {
        setSuxList(prev => {
            const next = [...prev];
            for (let i = 1; i <= count; i++) {
                const code = String(i);
                if (!next.includes(code)) next.push(code);
            }
            return next;
        });
    };

    const addTag = (value) => {
        const parts = value.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return;
        setTags(prev => {
            const next = [...prev];
            parts.forEach(p => { if (!next.includes(p)) next.push(p); });
            return next;
        });
        setTagInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
        }
    };

    const handleBlur = () => {
        if (tagInput) addTag(tagInput);
    };

    const clean = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
            setHasDraft(false);
        } catch (e) {
            console.error('Error clearing draft:', e);
        }
        setTags([]);
        setTitle('');
        setAuthor('');
        setDescription('');
        setBookIdp1('');
        setSuxInput('');
        setSuxList([]);
        setTagInput('');
        setImage('');
        setUploadedImageUrl('');
        setImageStatus('');
        setLocation('0');
        setLoadingStatus('');
        setIsbnCheckResult(null);
        setIsbnChecking(false);
    };

    const uploadToImgBB = async (base64Image) => {
        const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
        if (!apiKey) {
            console.error('ImgBB API key is missing. Please add VITE_IMGBB_API_KEY to your .env file.');
            setImageStatus('');
            return null;
        }

        // ImgBB expects the base64 string without the data:image/png;base64, prefix
        const base64Data = base64Image.split(',')[1];
        
        const formData = new FormData();
        formData.append('image', base64Data);

        try {
            setImageStatus('uploading');
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (result.success) {
                setUploadedImageUrl(result.data.url);
                setImageStatus('done');
                return result.data.url;
            } else {
                console.error('ImgBB Upload Error:', result.error);
                setImageStatus('');
                return null;
            }
        } catch (error) {
            console.error('Error uploading to ImgBB:', error);
            setImageStatus('');
            return null;
        }
    };

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                // Immediately upload to ImgBB
                uploadToImgBB(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    React.useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    processFile(file);
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const newbook = async () => {
        if (!title.trim()) {
            alert('Please enter a volume title.');
            return;
        }
        if (!bookIdp1.trim()) {
            alert('Please enter a Base ISBN identifier.');
            return;
        }

        // Determine final SUX list to register
        let finalSuxList = [...suxList];
        if (suxInput.trim()) {
            const parsed = parseSuxTokens(suxInput);
            parsed.forEach(item => {
                if (!finalSuxList.includes(item)) finalSuxList.push(item);
            });
            setSuxList(finalSuxList);
            setSuxInput('');
        }

        if (finalSuxList.length === 0) {
            finalSuxList = ['1']; // Default copy suffix if none specified
        }

        setLoading(true);
        setLoadingStatus('Preparing image asset...');
        
        let imageUrl = uploadedImageUrl; // Use the already uploaded ImgBB URL
        if (!imageUrl && image) {
            imageUrl = await uploadToImgBB(image);
            if (!imageUrl) {
                setLoading(false);
                setLoadingStatus('');
                alert('Failed to upload image to ImgBB. Please check your API key.');
                return;
            }
        }

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < finalSuxList.length; i++) {
            const suxCode = finalSuxList[i];
            const bid = `${bookIdp1.trim()}-${suxCode}`;
            setLoadingStatus(`Registering Copy ${i + 1} of ${finalSuxList.length} (SUX: ${suxCode})...`);

            try {
                const response = await fetch(`${API_BASE_URL}/books`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "x-api-key": API_KEY
                    },
                    body: JSON.stringify({
                        name: title,
                        bid: bid,
                        genre: genre,
                        author: author,
                        description: description,
                        image: imageUrl,
                        borrowed: location || '0',
                        whoadded: reader?.email || reader?.name || 'admin',
                        addedByRole: reader?.role || 'admin',
                        isApproved: isSubAdmin ? false : true
                    }),
                });

                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                console.error(`Error adding copy with SUX ${suxCode}:`, error);
                failCount++;
            }
        }

        setLoading(false);
        setLoadingStatus('');

        if (successCount > 0) {
            if (isSubAdmin) {
                alert(`Successfully submitted ${successCount} ${successCount === 1 ? 'copy' : 'copies'} of "${title}"! It has been sent to the Admin Pending Approval queue.`);
            } else {
                alert(`Successfully registered ${successCount} ${successCount === 1 ? 'copy' : 'copies'} of "${title}" into the catalog!${failCount > 0 ? ` (${failCount} failed)` : ''}`);
            }
            clean();
        } else {
            alert('Failed to register book copies. Please check backend network connection.');
        }
    }
  return (
    <div className='min-h-screen w-full bg-[#030712] text-white pt-24 pb-12 px-4 md:px-12 flex items-center justify-center font-[Inter] relative'>
        <Navbar />

        {/* Right Floating Save Draft Notification Toast */}
        {hasDraft && (
            <div className="fixed top-24 right-4 sm:right-8 z-50 max-w-sm w-full bg-gray-900/95 backdrop-blur-2xl border border-purple-500/40 p-4.5 rounded-3xl shadow-2xl text-white flex flex-col gap-3 transition-all animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-lg shrink-0">
                            💾
                        </div>
                        <div>
                            <p className="font-extrabold text-xs uppercase tracking-wider font-[Outfit] text-purple-300">
                                Unsaved Draft Found
                            </p>
                            <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                                You have unsubmitted book data from your previous session.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setHasDraft(false)}
                        className="text-gray-400 hover:text-white text-sm p-1 cursor-pointer"
                        title="Dismiss notification"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-purple-500/20">
                    <button
                        type="button"
                        onClick={() => { restoreDraft(); setHasDraft(false); }}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        ⚡ Restore Saved Draft
                    </button>
                    <button
                        type="button"
                        onClick={() => { discardDraft(); }}
                        className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs py-2 px-3 rounded-xl border border-rose-500/30 transition-all flex items-center justify-center cursor-pointer"
                    >
                        🗑️ Delete
                    </button>
                </div>
            </div>
        )}

        <div className='max-w-4xl w-full bg-gray-900/40 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] border border-gray-800/50 shadow-2xl'>
            
            {isSubAdmin && (
                <div className="mb-8 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
                        ⏳
                    </div>
                    <div>
                        <p className="font-extrabold uppercase tracking-wider text-xs font-[Outfit]">Subadmin Submission Queue</p>
                        <p className="text-amber-300/80 text-xs mt-1">Your added book copies will be sent to the Admin Pending Approval queue for review before appearing in the public library catalog.</p>
                    </div>
                </div>
            )}

            <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4'>
                <div>
                    <p className='text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2 font-[Outfit]'>Administration</p>
                    <h1 className='text-4xl font-black italic tracking-tighter uppercase font-[Outfit]'>New Catalog Entry</h1>
                </div>
                <div className='bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-blue-500/20'>
                    {isSubAdmin ? 'SUBADMIN INTAKE' : 'SECURE ADDITION'}
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
                {/* Visual Section */}
                <div className='space-y-6'>
                    <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1'>Art Assets</label>
                    <div 
                        onDragOver={handleDragOver} 
                        onDrop={handleDrop} 
                        className='relative aspect-[3/4] border-2 border-dashed border-gray-800 rounded-[2rem] hover:border-blue-500/50 transition-all duration-500 bg-black/40 flex flex-col items-center justify-center group overflow-hidden group'
                    >
                        {image ? (
                            <div className='relative w-full h-full'>
                                <img src={image} alt="Preview" className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105' />
                                <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm'>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setImage(''); setUploadedImageUrl(''); setImageStatus(''); }}
                                        className='bg-red-500 hover:bg-red-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all'
                                    >
                                        <span className='text-2xl font-black'>✕</span>
                                    </button>
                                </div>
                                {imageStatus === 'uploading' && (
                                    <div className='absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4'>
                                        <div className='w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin'></div>
                                        <p className='text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse'>Uploading to Cloud...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange} 
                                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                                />
                                <div className='text-6xl mb-4 grayscale opacity-20 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-110'>📸</div>
                                <p className='text-gray-500 font-black text-[10px] uppercase tracking-widest group-hover:text-blue-400 transition-colors'>Drop selection here</p>
                                <p className='text-gray-600 text-[8px] mt-2 italic font-mono'>supports: cloud-sync optimized formats</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Form Section */}
                <div className='flex flex-col gap-6'>
                    <div className='space-y-2'>
                        <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1'>Title & Registry</label>
                        <input 
                            type="text" 
                            placeholder="Volume Title" 
                            className='w-full p-4 rounded-2xl bg-black/50 text-white border border-gray-800 focus:border-blue-500/50 outline-hidden transition-all font-bold placeholder:text-gray-700' 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                        />
                    </div>

                    <div className='space-y-4'>
                        <div id="isbn-reader" className={`w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-inner ${isScanning ? 'block ring-2 ring-blue-500/20' : 'hidden'}`}></div>
                        <button 
                            type="button"
                            onClick={isScanning ? stopScanner : startScanner}
                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${isScanning ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-blue-600 text-white border-blue-500/50 shadow-xl shadow-blue-500/20 active:scale-95'}`}
                        >
                            {isScanning ? 'Deactivate Lens' : '📷 Optical ISBN Scan'}
                        </button>

                        <div className='space-y-2'>
                            <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1'>Base ISBN</label>
                            <div className='bg-black/50 p-1.5 rounded-2xl border border-gray-800 focus-within:border-blue-500/40 transition-all shadow-inner'>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 9780131103627" 
                                    className='p-3 bg-transparent outline-none w-full font-mono text-sm tracking-widest border-none text-white placeholder:text-gray-700' 
                                    value={bookIdp1} 
                                    onChange={(e) => setBookIdp1(e.target.value)}
                                    onBlur={() => checkIsbnStatus()}
                                />
                            </div>

                            {/* ISBN Existence Status Indicator */}
                            {isbnChecking && (
                                <div className="flex items-center gap-2 text-xs text-blue-400 font-medium px-1 py-1">
                                    <div className="w-3.5 h-3.5 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin"></div>
                                    Checking catalog for existing ISBN...
                                </div>
                            )}

                            {isbnCheckResult && !isbnChecking && (
                                isbnCheckResult.exists ? (
                                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col gap-2 shadow-lg">
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-base">⚠️</span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-extrabold text-xs font-[Outfit] uppercase tracking-wider text-amber-400">
                                                    Book Already Registered ({isbnCheckResult.count} {isbnCheckResult.count === 1 ? 'copy' : 'copies'} in catalog)
                                                </p>
                                                <p className="text-xs text-amber-200/90 mt-0.5 font-medium truncate">
                                                    "{isbnCheckResult.book?.name}" {isbnCheckResult.book?.author ? `by ${isbnCheckResult.book.author}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => autofillExistingBook(isbnCheckResult.book)}
                                            className="self-start bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] px-3.5 py-1.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 mt-1"
                                        >
                                            ⚡ Autofill Details from Existing Copy
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                                        <span>✅</span>
                                        <span>New Book Title: No existing copies found with this ISBN in catalog.</span>
                                    </div>
                                )
                            )}
                        </div>

                        <div className='space-y-2'>
                            <div className='flex items-center justify-between ml-1'>
                                <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest'>Copy Identifiers (SUX List)</label>
                                <div className='flex items-center gap-2'>
                                    <span className='bg-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-500/30 font-mono'>
                                        {suxList.length} {suxList.length === 1 ? 'Copy' : 'Copies'}
                                    </span>
                                    {suxList.length > 0 && (
                                        <button 
                                            type="button" 
                                            onClick={() => setSuxList([])} 
                                            className='text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase transition-colors'
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className='bg-black/50 rounded-2xl p-2 border border-gray-800 focus-within:border-blue-500/40 transition-all shadow-inner min-h-[90px] flex flex-col justify-between'>
                                <div className='flex items-center gap-2'>
                                    <input 
                                        type="text" 
                                        placeholder="Type SUX (e.g. 01, 02 or range 1-5) & press Enter..." 
                                        className='p-3 bg-transparent outline-none w-full font-mono text-xs tracking-wider border-none text-blue-400 placeholder:text-gray-700' 
                                        value={suxInput} 
                                        onChange={(e) => setSuxInput(e.target.value)} 
                                        onKeyDown={handleSuxKeyDown}
                                        onBlur={handleSuxBlur}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addSux(suxInput)}
                                        className='px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-black uppercase transition-all shrink-0 border border-blue-500/30 cursor-pointer'
                                    >
                                        + Add
                                    </button>
                                </div>

                                <div className='flex flex-wrap items-center gap-1.5 p-2'>
                                    {suxList.map((code, idx) => (
                                        <span key={`${code}-${idx}`} className='bg-blue-500/10 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all hover:bg-blue-500/20 font-mono text-xs'>
                                            <span className='text-[10px] text-blue-500 font-bold'>#</span>
                                            <span className='font-bold'>{code}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSuxList(prev => prev.filter((_, i) => i !== idx))}
                                                className='text-sm font-black leading-none text-gray-400 hover:text-white transition-colors ml-1 cursor-pointer'
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    {suxList.length === 0 && (
                                        <p className='text-[10px] text-gray-600 italic px-2 py-1'>
                                            💡 Type individual codes, comma-separated, or use ranges like <span className='text-blue-400 font-mono font-bold'>1-5</span> to add multiple copy suffixes.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Quick SUX Range Generator */}
                            <div className='flex items-center gap-2 pt-1'>
                                <span className='text-[9px] font-black uppercase tracking-wider text-gray-600 ml-1'>Quick Add Range:</span>
                                <button
                                    type="button"
                                    onClick={() => generateSuxRange(3)}
                                    className='px-2.5 py-1 bg-gray-800/60 hover:bg-gray-700 text-gray-300 text-[10px] font-bold rounded-lg transition-colors border border-gray-700/50 cursor-pointer'
                                >
                                    1..3
                                </button>
                                <button
                                    type="button"
                                    onClick={() => generateSuxRange(5)}
                                    className='px-2.5 py-1 bg-gray-800/60 hover:bg-gray-700 text-gray-300 text-[10px] font-bold rounded-lg transition-colors border border-gray-700/50 cursor-pointer'
                                >
                                    1..5
                                </button>
                                <button
                                    type="button"
                                    onClick={() => generateSuxRange(10)}
                                    className='px-2.5 py-1 bg-gray-800/60 hover:bg-gray-700 text-gray-300 text-[10px] font-bold rounded-lg transition-colors border border-gray-700/50 cursor-pointer'
                                >
                                    1..10
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1'>Curated by</label>
                            <input type="text" placeholder="Author Name" className='w-full p-4 rounded-2xl bg-black/50 border border-gray-800 focus:border-blue-500/50 outline-hidden transition-all text-sm font-bold' value={author} onChange={(e) => setAuthor(e.target.value)} />
                        </div>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1'>Deployment</label>
                            <input type="text" placeholder="Location Code" className='w-full p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 focus:border-blue-400 outline-hidden transition-all text-sm font-bold font-mono placeholder:text-blue-900/50' value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>
                    </div>

                    <div className='space-y-2 text-black'>
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest'>Classification Tags</label>
                            <span className='text-[9px] font-black text-indigo-400 uppercase tracking-wider'>Standard Master List Available</span>
                        </div>
                        <div className='bg-black/50 rounded-[1.5rem] p-2 border border-gray-800 focus-within:border-blue-500/40 transition-all shadow-inner min-h-[100px] flex flex-col'>
                            <input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleBlur}
                                placeholder='Type & Enter...'
                                className='p-3 bg-transparent text-white outline-none w-full text-sm font-bold'
                            />
                            <div className='flex flex-wrap items-center gap-2 p-2'>
                                {tags.map((t, i) => (
                                    <span key={`${t}-${i}`} className='bg-blue-600/10 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all hover:bg-blue-600/20'>
                                        <span className='text-[10px] font-black uppercase tracking-wider'>{t}</span>
                                        <button
                                            type="button"
                                            onClick={() => setTags(prev => prev.filter(x => x !== t))}
                                            className='text-lg font-black leading-none hover:text-white transition-colors cursor-pointer'
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Standard Master Canonical Genre Quick-Select Chips */}
                        {masterGenres.length > 0 && (
                            <div className='pt-1 text-white'>
                                <p className='text-[9px] font-black uppercase tracking-wider text-indigo-400 mb-1.5 ml-1'>
                                    ✨ Preferred Canonical Master Tags (Click to select):
                                </p>
                                <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-gray-800/60 rounded-xl bg-black/30'>
                                    {masterGenres.map((mg) => {
                                        const isSelected = tags.includes(mg);
                                        return (
                                            <button
                                                key={mg}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setTags(prev => prev.filter(t => t !== mg));
                                                    } else {
                                                        setTags(prev => [...prev, mg]);
                                                    }
                                                }}
                                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer font-mono border ${
                                                    isSelected 
                                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30' 
                                                        : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:text-indigo-300 hover:border-indigo-500/40'
                                                }`}
                                            >
                                                #{mg} {isSelected ? '✓' : '+'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='space-y-2'>
                        <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1'>Narrative Data</label>
                        <textarea placeholder="Describe the essence of this work..." className='w-full p-4 rounded-2xl bg-black/50 text-white border border-gray-800 focus:border-blue-500/50 outline-hidden transition-all text-sm font-medium min-h-[120px] shadow-inner placeholder:text-gray-700' value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`mt-4 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all active:scale-95 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}`} 
                        onClick={newbook}
                    >
                        {loading ? (loadingStatus || 'Processing Registry...') : `Authorize Addition (${suxList.length > 0 ? suxList.length : 1} ${suxList.length === 1 ? 'Copy' : 'Copies'})`}
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}

export default AddBook