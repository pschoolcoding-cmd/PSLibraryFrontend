import React from 'react'
import { useState } from 'react';

const AddBook = () => {
    const [bookIdp1, setBookIdp1] = useState('');
    const [bookIdp2, setBookIdp2] = useState('');
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState({});

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
    }
    const newbook = () => {
        // Handle adding a new book
        fetch('http://localhost:3000/books', {
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
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Success:', data);
                clean()
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
  return (
    <div className='h-full w-full bg-black flex items-center justify-center'>
        <div className='bg-gray-300 p-8 rounded shadow-md'>
            <h1 className='text-3xl text-black pb-4'>Add Book</h1>
            <div className='flex flex-col space-y-4 text-black '>
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
                <button type="submit" className='bg-blue-500 text-white p-2 rounded' onClick={newbook}>Add Book</button>
            </div>
        </div>
    </div>
  )
}

export default AddBook
