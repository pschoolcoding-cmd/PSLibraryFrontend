import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Navbar from '../components/Navbar';

const AddBook = () => {
    const [bookIdp1, setBookIdp1] = useState('');
    const [bookIdp2, setBookIdp2] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
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
    const clean = () =>{
        setTags([]);
        setTitle('');
        setAuthor('');
        setDescription('');
        setBookIdp1('');
        setBookIdp2('');
        setTagInput('');
        setImage('');
        setUploadedImageUrl('');
        setImageStatus('');
        setLocation('0');
    }

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
        setLoading(true);
        
        let imageUrl = uploadedImageUrl; // Use the already uploaded ImgBB URL
        if (!imageUrl && image) {
            // Fallback: if image wasn't uploaded yet, do it now
            imageUrl = await uploadToImgBB(image);
            if (!imageUrl) {
                setLoading(false);
                alert('Failed to upload image to ImgBB. Please check your API key.');
                return;
            }
        }
        console.log({
                name: title,
                bid: bookIdp1+"-"+bookIdp2,
                genre: genre,
                author: author,
                description: description,
                image: imageUrl,
            })
        // Handle adding a new book
        fetch('https://pslibrarybackend.onrender.com/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "x-api-key":"supersecret"
            },
            body: JSON.stringify({
                name: title,
                bid: bookIdp1+"-"+bookIdp2,
                genre: genre,
                author: author,
                description: description,
                image: imageUrl,
                borrowed: location || '0',
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Success:', data);
                setLoading(false);
                clean()
            })
            .catch((error) => {
                console.error('Error:', error);
                setLoading(false);
            });
    }
  return (
    <div className='min-h-screen w-full bg-[#030712] text-white pt-24 pb-12 px-4 md:px-12 flex items-center justify-center font-[Inter] relative'>
        <Navbar />
        <div className='max-w-4xl w-full bg-gray-900/40 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] border border-gray-800/50 shadow-2xl'>
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4'>
                <div>
                    <p className='text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2 font-[Outfit]'>Administration</p>
                    <h1 className='text-4xl font-black italic tracking-tighter uppercase font-[Outfit]'>New Catalog Entry</h1>
                </div>
                <div className='bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-blue-500/20'>
                    SECURE ADDITION
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
                        <div className='flex items-center gap-3'>
                            <div className='flex-1 flex items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-gray-800 focus-within:border-blue-500/40 transition-all shadow-inner'>
                                <input type="text" placeholder="BASE ISBN" className='p-3 bg-transparent outline-none w-full font-mono text-sm tracking-widest border-none' value={bookIdp1} onChange={(e) => setBookIdp1(e.target.value)} />
                                <span className='font-black text-gray-700'>—</span>
                                <input type="text" placeholder="SUX" className='p-3 bg-transparent outline-none w-20 font-mono text-sm tracking-widest border-none text-blue-400' value={bookIdp2} onChange={(e) => setBookIdp2(e.target.value)} />
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
                        <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1'>Classification Tags</label>
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
                                            className='text-lg font-black leading-none hover:text-white transition-colors'
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <label className='text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1'>Narrative Data</label>
                        <textarea placeholder="Describe the essence of this work..." className='w-full p-4 rounded-2xl bg-black/50 text-white border border-gray-800 focus:border-blue-500/50 outline-hidden transition-all text-sm font-medium min-h-[120px] shadow-inner placeholder:text-gray-700' value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`mt-4 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}`} 
                        onClick={newbook}
                    >
                        {loading ? 'Processing Registry...' : 'Authorize Addition'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}

export default AddBook