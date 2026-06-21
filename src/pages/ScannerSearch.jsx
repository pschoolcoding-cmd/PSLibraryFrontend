import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import Loader from '../components/Loader';

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
                scannerRef.current.stop().catch(err => console.error(err));
            }
        };
    }, []);

    const startScanner = async () => {
        setIsScanning(true);
        setError(null);
        try {
            const scanner = new Html5Qrcode("reader");
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 }
                },
                (decodedText) => {
                    // Assuming ISBN-13 is scanned
                    handleScanSuccess(decodedText);
                    scanner.stop().then(() => {
                        setIsScanning(false);
                    }).catch(err => console.error(err));
                },
                (errorMessage) => {
                    // Silently ignore scan errors
                }
            );
        } catch (err) {
            setError("Camera access failed. Please ensure permissions are granted.");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Stop scanner error:", err);
                setIsScanning(false);
            }
        }
    };

    const handleScanSuccess = (text) => {
        // Barcode might have extra chars, take all digits
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
        const char = value.slice(-1); // Only take last character
        const newSlots = [...slots];
        newSlots[index] = char;
        setSlots(newSlots);
        
        // Auto-focus next slot
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
            // Build regex: empty slots are dots
            let pattern = currentSlots.map(s => s === '' ? '.' : s).join('');
            
            // Remove trailing dots to allow matching shorter IDs or prefixes
            pattern = pattern.replace(/\.*$/, '');

            // If all were dots (now empty), don't search or handle as empty
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
                // Backend now handles grouping and provides copyCount
                setBooks(result.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen w-full bg-black text-white p-4 md:p-8 flex flex-col items-center'>
            <div className='max-w-4xl w-full'>
                <div className='flex justify-between items-center mb-8'>
                    <button onClick={() => navigate('/')} className='bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'>
                        <span>&larr;</span> Back
                    </button>
                    <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>Smart ID Search</h1>
                </div>

                {/* Scanner Section */}
                <div className='bg-gray-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-800/50 mb-8 overflow-hidden relative shadow-2xl'>
                    <div className='flex flex-col items-center gap-6'>
                        <div id="reader" className={`w-full max-w-[450px] aspect-video bg-black rounded-2xl border-2 border-dashed border-gray-700 overflow-hidden shadow-inner ${isScanning ? 'block shadow-blue-500/10 border-blue-500/50' : 'hidden'}`}></div>
                        
                        {!isScanning ? (
                            <button 
                                onClick={startScanner}
                                className='bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-4 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-600/20 uppercase tracking-widest text-sm font-[Outfit]'
                            >
                                <span className='text-3xl'>📷</span> Open Barcode Scanner
                            </button>
                        ) : (
                            <button 
                                onClick={stopScanner}
                                className='bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-4 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-red-600/20 uppercase tracking-widest text-sm font-[Outfit]'
                            >
                                <span className='text-3xl'>⏹</span> Stop Scanner
                            </button>
                        )}
                        <p className='text-gray-500 text-xs font-bold uppercase tracking-widest'>Align barcode within the frame</p>
                    </div>
                </div>

                {/* Manual Pattern Section */}
                <div className='bg-gray-900/60 border border-gray-800 p-8 rounded-[2.5rem] mb-12 shadow-2xl'>
                    <h3 className='text-xs font-black uppercase tracking-[0.3em] mb-10 text-center text-blue-500 font-[Outfit]'>ISBN-13 Pattern Search</h3>
                    <div className='grid grid-cols-5 sm:grid-cols-7 md:flex md:flex-wrap justify-center gap-2 md:gap-4 mb-10'>
                        {slots.map((slot, idx) => (
                            <div key={idx} className='flex flex-col items-center gap-2'>
                                <input
                                    id={`slot-${idx}`}
                                    type="text"
                                    maxLength="1"
                                    value={slot}
                                    onChange={(e) => handleSlotChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className={`w-full aspect-square md:w-12 md:h-16 text-center text-2xl font-black rounded-xl border-2 transition-all outline-hidden
                                        ${slot ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30' : 'bg-black/40 border-gray-800 text-gray-500 focus:border-blue-500/50 focus:bg-blue-500/5'}`}
                                    placeholder="•"
                                />
                                <span className='text-[9px] text-gray-600 font-black font-mono'>{idx + 1}</span>
                            </div>
                        ))}
                    </div>
                    <div className='flex flex-col sm:flex-row justify-center gap-4'>
                        <button 
                            onClick={() => performSearch(slots)}
                            disabled={loading || slots.every(s => s === '')}
                            className='bg-white text-black px-12 py-4 rounded-2xl font-black hover:bg-gray-200 disabled:opacity-50 transition-all active:scale-95 uppercase tracking-widest text-xs shadow-xl'
                        >
                            {loading ? 'Searching...' : 'Execute Search'}
                        </button>
                        <button 
                            onClick={() => setSlots(Array(13).fill(''))}
                            className='bg-gray-800/50 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all border border-gray-700/50 text-xs uppercase tracking-widest'
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {error && (
                    <div className='bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-2xl mb-8 text-center'>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader text="Finding matching books..." />
                    </div>
                ) : books.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {books.map((book) => (
                            <div key={book.bid || book._id} className='flex flex-row bg-[#030712] rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 h-64 border border-gray-800 group'>
                                <div className='w-[35%] h-full shrink-0 relative overflow-hidden'>
                                    {book.image ? (
                                        <img src={book.image} alt={book.name} className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110' />
                                    ) : (
                                        <div className='bg-gray-800 h-full flex items-center justify-center'>📚</div>
                                    )}
                                    {book.copyCount > 1 && (
                                        <div className='absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg'>
                                            {book.copyCount} COPIES
                                        </div>
                                    )}
                                </div>
                                <div className='w-[65%] p-4 flex flex-col'>
                                    <h3 className='text-white text-lg font-bold line-clamp-2 leading-tight mb-2'>{book.name}</h3>
                                    <p className='text-gray-400 text-sm mb-1'>Author: <span className='text-gray-200'>{book.author}</span></p>
                                    <p className='text-gray-500 text-xs font-mono mb-4'>{(book.bid).split("-")[0]}</p>
                                    
                                    <button 
                                        onClick={() => navigate(`/book/${book._id}`)}
                                        className='mt-auto w-full bg-gray-100 hover:bg-white text-black py-2 rounded-xl text-sm font-bold transition-all'
                                    >
                                        View details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !loading && slots.some(s => s !== '') && (
                    <div className='text-center py-20 text-gray-500'>
                        <div className='text-5xl mb-4'>🔍</div>
                        <p className='text-xl'>No books match this pattern</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScannerSearch;
