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
                () => { }
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
                            <p className="font-bold uppercase tracking-wider text-xs">Subadmin Submission Queue</p>
                            <p className="text-amber-500 text-xs mt-1">Your added book copies will be sent to the Admin Pending Approval queue for review before appearing in the public library catalog.</p>
                        </div>
                    </div>
                )}

                <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-5 border-b border-[var(--border-color)] gap-4'>
                    <div>
                        <p className='text-[#3b9c88] text-[10px] font-bold uppercase tracking-widest mb-1'>Administration</p>
                        <h1 className='text-2xl font-bold tracking-tight text-[var(--text-primary)]'>New Catalog Entry</h1>
                    </div>
                    <div className='bg-[#337ab7]/15 text-[#337ab7] px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider border border-[#337ab7]/30'>
                        {isSubAdmin ? 'SUBADMIN INTAKE' : 'SECURE ADDITION'}
                    </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                    {/* Visual Section */}
                    <div className='space-y-3'>
                        <label className='text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider'>Book Cover Art</label>
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className='relative aspect-[3/4] border border-dashed border-[var(--border-color)] rounded-lg hover:border-[var(--accent-primary)] transition-colors bg-[var(--bg-secondary)] flex flex-col items-center justify-center group overflow-hidden'
                        >
                            {image ? (
                                <div className='relative w-full h-full'>
                                    <img src={image} alt="Preview" className='w-full h-full object-cover' />
                                    <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs'>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setImage(''); setUploadedImageUrl(''); setImageStatus(''); }}
                                            className='bg-rose-600 hover:bg-rose-700 text-white w-11 h-11 rounded-md flex items-center justify-center shadow-lg transition-colors cursor-pointer'
                                        >
                                            <span className='text-lg font-bold'>✕</span>
                                        </button>
                                    </div>
                                    {imageStatus === 'uploading' && (
                                        <div className='absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3'>
                                            <div className='w-9 h-9 border-3 border-[#337ab7]/30 border-t-[#337ab7] rounded-full animate-spin'></div>
                                            <p className='text-[10px] font-bold text-white uppercase tracking-wider'>Uploading to Cloud...</p>
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
                                    <div className='text-4xl mb-3 opacity-60'>📸</div>
                                    <p className='text-[var(--text-primary)] font-semibold text-xs'>Drop cover image or click to upload</p>
                                    <p className='text-[var(--text-muted)] text-[10px] mt-1 font-mono'>Supports JPG, PNG, WebP</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className='flex flex-col gap-5'>
                        <div className='space-y-1.5'>
                            <label className='text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider'>Title & Registry</label>
                            <input
                                type="text"
                                placeholder="Volume Title"
                                className='w-full p-3 rounded-md bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] outline-none transition-colors text-xs font-semibold placeholder:text-[var(--text-muted)]'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className='space-y-4'>
                            <div id="isbn-reader" className={`w-full aspect-video bg-black rounded-lg overflow-hidden border border-[var(--border-color)] ${isScanning ? 'block' : 'hidden'}`}></div>
                            <button
                                type="button"
                                onClick={isScanning ? stopScanner : startScanner}
                                className={`w-full py-2.5 rounded-md font-semibold text-xs transition-colors border cursor-pointer ${isScanning ? 'bg-rose-500/15 border-rose-500/30 text-rose-500' : 'bg-[#337ab7] hover:bg-[#286090] text-white border-[#2e6da4]'}`}
                            >
                                {isScanning ? 'Deactivate Lens' : '📷 Optical ISBN Scan'}
                            </button>

                            <div className='space-y-1.5'>
                                <label className='text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider'>Base ISBN</label>
                                <div className='bg-[var(--bg-input)] rounded-md border border-[var(--border-color)] focus-within:border-[var(--accent-primary)] transition-colors'>
                                    <input
                                        type="text"
                                        placeholder="e.g. 9780131103627"
                                        className='p-3 bg-transparent outline-none w-full font-mono text-xs tracking-wider border-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
                                        value={bookIdp1}
                                        onChange={(e) => setBookIdp1(e.target.value)}
                                        onBlur={() => checkIsbnStatus()}
                                    />
                                </div>

                                {/* ISBN Existence Status Indicator */}
                                {isbnChecking && (
                                    <div className="flex items-center gap-2 text-xs text-[#337ab7] font-medium px-1 py-1">
                                        <div className="w-3.5 h-3.5 border-2 border-[#337ab7]/20 border-t-[#337ab7] rounded-full animate-spin"></div>
                                        Checking catalog for existing ISBN...
                                    </div>
                                )}

                                {isbnCheckResult && !isbnChecking && (
                                    isbnCheckResult.exists ? (
                                        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 flex flex-col gap-2">
                                            <div className="flex items-start gap-2.5">
                                                <span className="text-base">⚠️</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-xs uppercase tracking-wider">
                                                        Book Already Registered ({isbnCheckResult.count} {isbnCheckResult.count === 1 ? 'copy' : 'copies'} in catalog)
                                                    </p>
                                                    <p className="text-xs text-[var(--text-primary)] mt-0.5 font-medium truncate">
                                                        "{isbnCheckResult.book?.name}" {isbnCheckResult.book?.author ? `by ${isbnCheckResult.book.author}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => autofillExistingBook(isbnCheckResult.book)}
                                                className="self-start bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 mt-1"
                                            >
                                                ⚡ Autofill Details from Existing Copy
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                                            <span>✅</span>
                                            <span>New Book Title: No existing copies found with this ISBN in catalog.</span>
                                        </div>
                                    )
                                )}
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center justify-between'>
                                    <label className='text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider'>Copy Identifiers (SUX List)</label>
                                    <div className='flex items-center gap-2'>
                                        <span className='bg-[#337ab7]/15 text-[#337ab7] text-[10px] font-bold px-2 py-0.5 rounded border border-[#337ab7]/30 font-mono'>
                                            {suxList.length} {suxList.length === 1 ? 'Copy' : 'Copies'}
                                        </span>
                                        {suxList.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setSuxList([])}
                                                className='text-[10px] text-[var(--text-secondary)] hover:text-rose-500 font-semibold uppercase transition-colors cursor-pointer'
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className='bg-[var(--bg-input)] rounded-md p-2 border border-[var(--border-color)] focus-within:border-[var(--accent-primary)] transition-colors min-h-[84px] flex flex-col justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <input
                                            type="text"
                                            placeholder="Type SUX (e.g. 01, 02 or range 1-5) & press Enter..."
                                            className='p-2 bg-transparent outline-none w-full font-mono text-xs tracking-wider border-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
                                            value={suxInput}
                                            onChange={(e) => setSuxInput(e.target.value)}
                                            onKeyDown={handleSuxKeyDown}
                                            onBlur={handleSuxBlur}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addSux(suxInput)}
                                            className='px-3.5 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white rounded-md text-xs font-semibold transition-colors shrink-0 cursor-pointer'
                                        >
                                            + Add
                                        </button>
                                    </div>

                                    <div className='flex flex-wrap items-center gap-1.5 p-1.5'>
                                        {suxList.map((code, idx) => (
                                            <span key={`${code}-${idx}`} className='bg-[#337ab7]/15 text-[#337ab7] border border-[#337ab7]/30 px-2.5 py-1 rounded flex items-center gap-1.5 font-mono text-xs'>
                                                <span className='text-[10px] font-bold'>#</span>
                                                <span className='font-bold'>{code}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSuxList(prev => prev.filter((_, i) => i !== idx))}
                                                    className='text-xs font-bold leading-none text-[var(--text-secondary)] hover:text-rose-500 transition-colors ml-1 cursor-pointer'
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                        {suxList.length === 0 && (
                                            <p className='text-[10px] text-[var(--text-muted)] px-1 py-0.5'>
                                                Type individual codes, comma-separated, or use ranges like <span className='text-[#337ab7] font-mono font-bold'>1-5</span> to add multiple copy suffixes.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Quick SUX Range Generator */}
                                <div className='flex items-center gap-2 pt-1'>
                                    <span className='text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]'>Quick Add Range:</span>
                                    <button
                                        type="button"
                                        onClick={() => generateSuxRange(3)}
                                        className='px-2.5 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[10px] font-semibold rounded border border-[var(--border-color)] transition-colors cursor-pointer'
                                    >
                                        1..3
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => generateSuxRange(5)}
                                        className='px-2.5 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[10px] font-semibold rounded border border-[var(--border-color)] transition-colors cursor-pointer'
                                    >
                                        1..5
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => generateSuxRange(10)}
                                        className='px-2.5 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[10px] font-semibold rounded border border-[var(--border-color)] transition-colors cursor-pointer'
                                    >
                                        1..10
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1.5'>
                                <label className='text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider'>Author</label>
                                <input type="text" placeholder="Author Name" className='w-full p-3 rounded-md bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] outline-none transition-colors text-xs font-semibold placeholder:text-[var(--text-muted)]' value={author} onChange={(e) => setAuthor(e.target.value)} />
                            </div>
                            <div className='space-y-1.5'>
                                <label className='text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider'>Shelf Location</label>
                                <input type="text" placeholder="Location Code" className='w-full p-3 rounded-md bg-[var(--bg-input)] border border-[var(--border-color)] text-[#3b9c88] focus:border-[var(--accent-primary)] outline-none transition-colors text-xs font-semibold font-mono placeholder:text-[var(--text-muted)]' value={location} onChange={(e) => setLocation(e.target.value)} />
                            </div>
                        </div>

                        <div className='space-y-1.5'>
                            <div className='flex items-center justify-between'>
                                <label className='text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider'>Classification Tags</label>
                                <span className='text-[9px] font-bold text-[#3b9c88] uppercase tracking-wider'>Standard Master List Available</span>
                            </div>
                            <div className='bg-[var(--bg-input)] rounded-md p-2 border border-[var(--border-color)] focus-within:border-[var(--accent-primary)] transition-colors min-h-[84px] flex flex-col'>
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleBlur}
                                    placeholder='Type genre tag & press Enter...'
                                    className='p-2 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none w-full text-xs font-semibold'
                                />
                                <div className='flex flex-wrap items-center gap-1.5 p-1.5'>
                                    {tags.map((t, i) => (
                                        <span key={`${t}-${i}`} className='bg-[#3b9c88]/15 text-[#3b9c88] border border-[#3b9c88]/30 px-2.5 py-1 rounded flex items-center gap-1.5'>
                                            <span className='text-[10px] font-bold uppercase tracking-wider'>{t}</span>
                                            <button
                                                type="button"
                                                onClick={() => setTags(prev => prev.filter(x => x !== t))}
                                                className='text-xs font-bold leading-none hover:text-rose-500 transition-colors cursor-pointer'
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Standard Master Canonical Genre Quick-Select Chips */}
                            {masterGenres.length > 0 && (
                                <div className='pt-1'>
                                    <p className='text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5'>
                                        ✨ Preferred Canonical Master Tags (Click to select):
                                    </p>
                                    <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)]'>
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
                                                    className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer font-mono border ${isSelected
                                                            ? 'bg-[#3b9c88] text-white border-[#318473]'
                                                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
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

                        <div className='space-y-1.5'>
                            <label className='text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider'>Summary / Description</label>
                            <textarea placeholder="Describe the essence of this work..." className='w-full p-3 rounded-md bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] outline-none transition-colors text-xs font-medium min-h-[110px] placeholder:text-[var(--text-muted)]' value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`mt-2 bg-[#3b9c88] hover:bg-[#318473] text-white py-3.5 rounded-md font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
