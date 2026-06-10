import React from 'react'
import { useState } from 'react';

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
        return () => form.removeEventListener('submit', handler);
    }, []);

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                // Immediately upload to ImgBB
                uploadToImgBB(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

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
    <div className='h-full w-full bg-black flex items-center justify-center'>
        <div className='bg-gray-300 p-8 rounded shadow-md flex flex-col'>
            <h1 className='text-3xl text-black pb-4'>Add Book</h1>
            <div className='flex flex-row gap-2 items-center text-black '>
                <div className='flex flex-col space-y-3'>
                    <label className='text-sm font-semibold text-gray-700 uppercase tracking-wider'>Book Cover Image</label>
                    <div className='relative border-2 border-dashed border-gray-400 rounded-lg p-4 hover:border-blue-500 transition-colors duration-300 bg-gray-50 flex flex-col items-center justify-center space-y-2 cursor-pointer group'>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                        />
                        <div className='text-4xl text-gray-400 group-hover:text-blue-500 transition-colors duration-300'>📷</div>
                        <p className='text-gray-500 group-hover:text-gray-700 font-medium'>Click or drag image to upload</p>
                        <p className='text-xs text-gray-400'>Supports: JPG, PNG, WEBP</p>
                    </div>
                    {image && (
                        <div className='mt-4 flex flex-col items-center space-y-2'>
                            <div className='relative w-40 h-56 overflow-hidden rounded-xl shadow-2xl border-4 border-white group'>
                                <img src={image} alt="Preview" className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110' />
                                
                                {/* Loading spinner overlay */}
                                {imageStatus === 'uploading' && (
                                    <div className='absolute inset-0 bg-black/60 flex items-center justify-center'>
                                        <div className='w-12 h-12 border-4 border-white border-t-blue-500 rounded-full animate-spin'></div>
                                    </div>
                                )}
                                
                                {/* Hover delete button */}
                                {imageStatus !== 'uploading' && (
                                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setImage(''); setUploadedImageUrl(''); setImageStatus(''); }}
                                            className='bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transform hover:scale-110 transition-all duration-200'
                                        >
                                            <span className='text-xl'>✕</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Status text */}
                            {imageStatus && (
                                <p className={`text-sm font-semibold ${imageStatus === 'uploading' ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {imageStatus === 'uploading' ? 'Uploading image...' : 'Done'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className='flex flex-col space-y-3 p-3'>
                    <input type="text" placeholder="Title" className='p-2 rounded outline-1' value={title} onChange={(e) => setTitle(e.target.value)} />
                    <div className='outline-1'>
                    <input type="text" placeholder="xxxxxxxxxxxxx" className='p-2 rounded outline-none' value={bookIdp1} onChange={(e) => setBookIdp1(e.target.value)} />-
                    <input type="text" placeholder="xxxx" className='p-2 rounded outline-none' value={bookIdp2} onChange={(e) => setBookIdp2(e.target.value)} />
                    </div>
                    <input type="text" placeholder="Author" className='p-2 rounded outline-1' value={author} onChange={(e) => setAuthor(e.target.value)} />
                    <label className='text-sm mb-1 block text-black'>Genres</label>
                    <div className='flex flex-wrap items-center gap-2 mb-2'>
                        <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            placeholder='Add genres (press Enter or comma)'
                            className='p-2 rounded outline-1 w-full'
                        />
                        {tags.map((t, i) => (
                            <span key={`${t}-${i}`} className='bg-blue-200 text-blue-800 px-2 py-1 rounded-full flex items-center gap-2'>
                                <span className='text-sm'>{t}</span>
                                <button
                                    type="button"
                                    onClick={() => setTags(prev => prev.filter(x => x !== t))}
                                    className='ml-1 text-xs leading-none'
                                    aria-label={`Remove genre ${t}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <textarea placeholder="Description" className='p-2 rounded outline-1' value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
            </div>
            <button type="submit" className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 active:text-black duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={newbook}>Add Book</button>
        </div>
    </div>
  )
}

export default AddBook