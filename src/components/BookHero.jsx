import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Compass, Search, ScanLine, Award, ArrowRight } from 'lucide-react';

export default function BookHero({ customPages, title }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Track scroll inside the sticky section (400vh tall)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // --- 3D Rotation Animation Mapping ---
  // Sheet 1: Cover (Front) -> Page 1 (Back)
  // Rotates 0deg to -180deg over scroll range [0.0, 0.25]
  const r1 = useTransform(scrollYProgress, [0, 0.25], [0, -180], { clamp: true });

  // Sheet 2: Page 2 (Front) -> Page 3 (Back)
  // Rotates 0deg to -180deg over scroll range [0.35, 0.60]
  const r2 = useTransform(scrollYProgress, [0.35, 0.60], [0, -180], { clamp: true });

  // Sheet 3: Page 4 (Front) -> Page 5 (Back)
  // Rotates 0deg to -180deg over scroll range [0.70, 0.95]
  const r3 = useTransform(scrollYProgress, [0.70, 0.95], [0, -180], { clamp: true });

  // --- Dynamic Z-Index Layering ---
  // Sheet 1 starts on top of right stack (30). Halfway flipped (t=0.125), it drops to bottom (10).
  const zIndex1 = useTransform(scrollYProgress, [0, 0.125, 0.125, 1], [30, 30, 10, 10]);
  
  // Sheet 2 stays in the middle stacking order (20).
  const zIndex2 = 20;

  // Sheet 3 starts under Sheet 2 (10). Halfway flipped (t=0.825), it rises to top of left stack (30).
  const zIndex3 = useTransform(scrollYProgress, [0, 0.825, 0.825, 1], [10, 10, 30, 30]);

  // Default High-Fidelity pages if customPages list is not provided
  const defaultPages = [
    // Page 1 (Left Spread 1)
    <div className="flex flex-col h-full justify-between p-5 md:p-6 select-text">
      <div>
        <div className="flex items-center gap-2 text-blue-600 font-bold mb-3">
          <BookOpen className="w-5.5 h-5.5" />
          <span className="text-[10px] uppercase tracking-widest font-[Outfit]">The Archives</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-3 font-[Outfit] italic uppercase">
          Welcome to the Portal
        </h2>
        <p className="text-gray-600 text-xs leading-relaxed mb-3">
          Step into a state-of-the-art literary sanctuary. Here, classical works merge side-by-side with modern scanning technology, giving you instant portal access to thousands of books.
        </p>
        <p className="text-gray-500 text-[10px] italic">
          "A room without books is like a body without a soul." — Cicero
        </p>
      </div>
      <div className="border-t border-gray-250 pt-2 flex justify-between items-center text-[10px] text-gray-400">
        <span>PROLOGUE</span>
        <span>Page 01</span>
      </div>
    </div>,

    // Page 2 (Right Spread 1)
    <div className="flex flex-col h-full justify-between p-5 md:p-6 select-text bg-gradient-to-b from-amber-50/50 to-amber-100/10">
      <div>
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Featured Collections</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { tag: 'History', count: '1,420 items', color: 'border-amber-200 hover:bg-amber-150/40 text-amber-900 bg-amber-50/50' },
            { tag: 'Philosophy', count: '890 items', color: 'border-purple-200 hover:bg-purple-150/40 text-purple-900 bg-purple-50/50' },
            { tag: 'Sci-Fi', count: '2,110 items', color: 'border-blue-200 hover:bg-blue-150/40 text-blue-900 bg-blue-50/50' },
            { tag: 'Classics', count: '650 items', color: 'border-emerald-200 hover:bg-emerald-150/40 text-emerald-900 bg-emerald-50/50' }
          ].map((c, i) => (
            <div key={i} className={`p-2.5 rounded-xl border transition-all ${c.color}`}>
              <p className="font-bold text-xs">{c.tag}</p>
              <p className="text-[9px] opacity-75">{c.count}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center text-[10px] text-gray-400">
        <span>Page 02</span>
        <span>COLLECTIONS</span>
      </div>
    </div>,

    // Page 3 (Left Spread 2)
    <div className="flex flex-col h-full justify-between p-5 md:p-6 select-text">
      <div>
        <div className="flex items-center gap-2 text-rose-500 font-bold mb-3">
          <Award className="w-5.5 h-5.5" />
          <span className="text-[10px] uppercase tracking-widest font-[Outfit]">Monthly Highlight</span>
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2 font-[Outfit] uppercase">The Lost Manuscript</h3>
        <p className="text-gray-600 text-xs leading-relaxed mb-3">
          Our conservation experts recently unlocked a digital transcript version of the centuries-old journal detailing early maritime explorations. Now accessible on search boards.
        </p>
        <div className="bg-amber-100/40 p-2.5 rounded-xl border border-amber-250 text-[10px] text-amber-900 flex items-center gap-3">
          <span className="text-lg">📜</span>
          <div>
            <p className="font-[Outfit] font-bold">Catalog Ref: #MS-3849</p>
            <p className="opacity-80">Restored in Ultra-HD scans.</p>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-255 pt-2 flex justify-between items-center text-[10px] text-gray-400">
        <span>CURATOR NOTES</span>
        <span>Page 03</span>
      </div>
    </div>,

    // Page 4 (Right Spread 2)
    <div className="flex flex-col h-full justify-between p-5 md:p-6 select-text">
      <div>
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">System Stacking</h3>
        <p className="text-gray-600 text-xs leading-relaxed mb-4">
          Every physical checkout is tracked in real-time. Feel free to search library holdings using standard query strings or barcode scans.
        </p>
        <div className="space-y-2">
          {[
            { label: 'Network Node', status: 'Online', val: 'bg-emerald-500' },
            { label: 'API Backend Gateway', status: 'Connected', val: 'bg-indigo-500' },
            { label: 'Active Sessions', status: '1,248 Users', val: 'bg-blue-500' }
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-[10px] p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-gray-600 font-semibold">{item.label}</span>
              <span className="flex items-center gap-1.5 font-bold text-gray-800">
                <span className={`w-2.5 h-2.5 rounded-full ${item.val}`} />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center text-[10px] text-gray-400">
        <span>Page 04</span>
        <span>TELEMETRY</span>
      </div>
    </div>,

    // Page 5 (Left Spread 3)
    <div className="flex flex-col h-full justify-between p-5 md:p-6 select-text">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-3">
          <Compass className="w-5.5 h-5.5" />
          <span className="text-[10px] uppercase tracking-widest font-[Outfit]">Navigation</span>
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2 font-[Outfit] uppercase">Quick Portals</h3>
        <p className="text-gray-600 text-xs leading-relaxed mb-3">
          Skip scroll stages and quickly navigate to primary modules using the links below.
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 justify-center p-2.5 bg-[#0a0a0a] hover:bg-gray-800 text-white rounded-xl font-bold text-[10px] transition-all active:scale-95 shadow-md shadow-black/20 group"
          >
            <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-blue-400" />
            Search
          </button>
          
          <button 
            onClick={() => navigate('/scan')}
            className="flex items-center gap-2 justify-center p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] transition-all active:scale-95 shadow-md shadow-blue-500/20 group"
          >
            <ScanLine className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            Scanner
          </button>
        </div>
      </div>
      <div className="border-t border-gray-255 pt-2 flex justify-between items-center text-[10px] text-gray-400">
        <span>MODULES</span>
        <span>Page 05</span>
      </div>
    </div>,

    // Page 6 (Right Spread 3 - Inside Back Cover)
    <div className="flex flex-col h-full justify-between p-5 md:p-6 select-text bg-gradient-to-b from-amber-50/50 to-amber-100/10">
      <div>
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Begin Your Search</h3>
        <p className="text-gray-600 text-xs leading-relaxed mb-3.5">
          Type keywords, titles, or authors directly in the live directory search. Press the trigger to enter our catalog immediately.
        </p>
        <div className="relative mb-3 group/input">
          <input 
            type="text" 
            placeholder="Search our catalog..." 
            value={bookSearchQuery}
            onChange={(e) => setBookSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && bookSearchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(bookSearchQuery.trim())}`);
              }
            }}
            className="w-full text-black text-[10px] p-2.5 pl-8 pr-3 rounded-xl border border-gray-200 bg-white shadow-inner hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-colors"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover/input:text-blue-500 transition-colors" />
        </div>

        <button 
          onClick={() => {
            const q = bookSearchQuery.trim();
            navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
          }}
          className="w-full p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-indigo-500/20 group"
        >
          Open Catalog
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      <div className="flex justify-between items-center text-[10px] text-gray-400">
        <span>Page 06</span>
        <span>EPILOGUE</span>
      </div>
    </div>
  ];

  // Overlay container page styling (parchment layout logic)
  const renderPage = (idx) => {
    if (customPages && customPages[idx]) {
      return customPages[idx].content;
    }
    return defaultPages[idx];
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[400vh] bg-black"
    >
      {/* Sticky section (locks in viewport) */}
      <div className="sticky top-0 left-0 w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        
        {/* Dark library background with blurred textures */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 filter blur-xs"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000')`
          }}
        />
        {/* Vignette layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.85)_100%)]" />

        {/* Dynamic scroll progress helper indicator */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[45]">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Scroll to read library catalog</span>
          <div className="w-32 h-1 bg-gray-900 rounded-full overflow-hidden">
            <motion.div 
              style={{ scaleX: scrollYProgress }} 
              className="w-full h-full bg-blue-500 origin-left"
            />
          </div>
        </div>

        {/* 3D Scene Viewport */}
        <div 
          style={{ perspective: '2500px' }} 
          className="relative w-full max-w-[90vw] sm:max-w-[760px] md:max-w-[850px] aspect-[4/3] max-h-[70vh] sm:max-h-[600px] flex items-center justify-center z-[40]"
        >
          {/* Centered book container using preserve-3d styling */}
          <div 
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-full h-full flex items-center justify-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            
            {/* 1. Right Hardcover Base (Static, open on the right, zIndex 5) */}
            <div
              style={{
                transform: 'rotateY(0deg)',
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                zIndex: 5,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
              className="absolute left-1/2 top-[-6px] w-[calc(50%+6px)] h-[calc(100%+12px)] rounded-r-2xl border border-blue-955 bg-[#0f2a4a] bg-radial from-[#1e447b] to-[#0a182c] shadow-[inset_3px_0_15px_rgba(0,0,0,0.5)] cursor-default select-none pointer-events-none"
            >
              {/* Gold lining details inside cover */}
              <div className="absolute inset-2 md:inset-3 border border-amber-600/30 rounded-r-xl pointer-events-none" />
            </div>

            {/* Spine Gutter Center Joint */}
            <div className="absolute left-1/2 top-[-6px] bottom-[-6px] w-[14px] md:w-[18px] bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 rounded-full border-x border-black/50 z-[48] -translate-x-1/2 shadow-[0_0_10px_rgba(0,0,0,0.8)]" />

            {/* 3D PAGES STACKING LAYERS */}

            {/* --- SHEET 1: FRONT COVER (Front Face) | PAGE 1 (Back Face acting as Left Cover) --- */}
            <motion.div
              style={{
                rotateY: r1,
                zIndex: zIndex1,
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center'
              }}
              className="absolute left-1/2 top-0 w-1/2 h-full cursor-pointer select-none"
            >
              {/* Front Face: Book Cover (visible on the right when closed) */}
              <div 
                className="absolute inset-0 w-full h-full rounded-r-2xl border border-blue-955 backface-hidden"
                style={{ 
                  transformStyle: 'preserve-3d',
                  backgroundColor: '#0f2a4a',
                  backgroundImage: 'radial-gradient(circle at center, #1a3c6b 0%, #0a182c 100%)',
                  boxShadow: 'inset_3px_0_10px_rgba(0,0,0,0.5), 10px_10px_20px_rgba(0,0,0,0.4)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Gold double lines framing */}
                <div className="absolute inset-3 md:inset-4 border border-amber-600/40 rounded-r-lg flex flex-col justify-between p-6 text-center select-none">
                  <div className="w-fit mx-auto border-b border-amber-500/30 pb-2 mb-2">
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Library Edition</span>
                  </div>
                  
                  <div className="my-auto space-y-4">
                    <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
                    <h1 className="text-xl md:text-3xl font-[Outfit] font-black text-amber-400 tracking-tighter uppercase leading-tight italic drop-shadow-md">
                      {title || 'THE GRAND ARCHIVES'}
                    </h1>
                    <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
                    <p className="text-gray-400 text-[10px] font-semibold tracking-widest uppercase mt-4">
                      Digital Catalog & Portal
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-[9px] text-amber-500 font-bold tracking-widest uppercase border border-amber-500/20 px-3 py-1 rounded-sm">
                      Scroll to open
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Face: Inside Left Cover containing Page 1 (visible on the left when opened) */}
              <div 
                className="absolute inset-[0px_0px_-6px_-6px] w-[calc(100%+6px)] h-[calc(100%+12px)] rounded-l-2xl border border-blue-955 backface-hidden transition-all"
                style={{ 
                  transform: 'rotateY(180deg)',
                  transformStyle: 'preserve-3d',
                  backgroundColor: '#0f2a4a',
                  backgroundImage: 'radial-gradient(circle at center, #1a3c6b 0%, #0a182c 100%)',
                  boxShadow: 'inset_-3px_0_15px_rgba(0,0,0,0.5)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Gold lining inside cover */}
                <div className="absolute inset-2 md:inset-3 border border-amber-600/20 rounded-l-xl pointer-events-none" />
                
                {/* Page 1 (cream paper container, smaller to leave blue hardcover border) */}
                <div 
                  className="absolute top-3 bottom-3 left-2.5 right-5 rounded-l-md bg-[#fcfaf2] shadow-lg flex flex-col justify-between pr-1.5 pl-3.5 py-1 overflow-hidden"
                  style={{ boxShadow: 'inset_-3px_0_15px_rgba(0,0,0,0.1)' }}
                >
                  {renderPage(0)}
                </div>

                {/* Spine shadow gutter */}
                <div className="bg-gradient-to-l from-black/15 to-transparent w-8 absolute right-5 top-3 bottom-3 pointer-events-none rounded-r-xs" />
              </div>
            </motion.div>

            {/* --- SHEET 2: PAGE 2 (Front Face) | PAGE 3 (Back Face) --- */}
            <motion.div
              style={{
                rotateY: r2,
                zIndex: zIndex2,
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center'
              }}
              className="absolute left-1/2 top-0 w-1/2 h-full cursor-pointer select-none bg-transparent"
            >
              {/* Front Face: Page 2 (Paper page, no blue backing, styled in center) */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-transparent"
                style={{ 
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Cream paper page positioned within cover limits */}
                <div 
                  className="absolute top-3 bottom-3 left-5 right-2.5 rounded-r-md bg-[#fcfaf2] shadow-md flex flex-col justify-between pl-1.5 pr-3.5 py-1 overflow-hidden"
                  style={{ boxShadow: 'inset_3px_0_15px_rgba(0,0,0,0.1)' }}
                >
                  {renderPage(1)}
                </div>
                {/* Spine Gutter shadow */}
                <div className="bg-gradient-to-r from-black/15 to-transparent w-8 absolute left-5 top-3 bottom-3 pointer-events-none rounded-l-xs" />
              </div>

              {/* Back Face: Page 3 (Paper page, no blue backing, styled in center) */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-transparent"
                style={{ 
                  transform: 'rotateY(180deg)',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Cream paper page positioned within cover limits */}
                <div 
                  className="absolute top-3 bottom-3 left-2.5 right-5 rounded-l-md bg-[#fcfaf2] shadow-md flex flex-col justify-between pr-1.5 pl-3.5 py-1 overflow-hidden"
                  style={{ boxShadow: 'inset_-3px_0_15px_rgba(0,0,0,0.1)' }}
                >
                  {renderPage(2)}
                </div>
                {/* Spine Gutter shadow */}
                <div className="bg-gradient-to-l from-black/15 to-transparent w-8 absolute right-5 top-3 bottom-3 pointer-events-none rounded-r-xs" />
              </div>
            </motion.div>

            {/* --- SHEET 3: PAGE 4 (Front Face) | PAGE 5 (Back Face) --- */}
            <motion.div
              style={{
                rotateY: r3,
                zIndex: zIndex3,
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center'
              }}
              className="absolute left-1/2 top-0 w-1/2 h-full cursor-pointer select-none bg-transparent"
            >
              {/* Front Face: Page 4 (Paper page, no blue backing) */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-transparent"
                style={{ 
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Cream paper page */}
                <div 
                  className="absolute top-3 bottom-3 left-5 right-2.5 rounded-r-md bg-[#fcfaf2] shadow-md flex flex-col justify-between pl-1.5 pr-3.5 py-1 overflow-hidden"
                  style={{ boxShadow: 'inset_3px_0_15px_rgba(0,0,0,0.1)' }}
                >
                  {renderPage(3)}
                </div>
                {/* Spine Gutter shadow */}
                <div className="bg-gradient-to-r from-black/15 to-transparent w-8 absolute left-5 top-3 bottom-3 pointer-events-none rounded-l-xs" />
              </div>

              {/* Back Face: Page 5 (Paper page, no blue backing) */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-transparent"
                style={{ 
                  transform: 'rotateY(180deg)',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Cream paper page */}
                <div 
                  className="absolute top-3 bottom-3 left-2.5 right-5 rounded-l-md bg-[#fcfaf2] shadow-md flex flex-col justify-between pr-1.5 pl-3.5 py-1 overflow-hidden"
                  style={{ boxShadow: 'inset_-3px_0_15px_rgba(0,0,0,0.1)' }}
                >
                  {renderPage(4)}
                </div>
                {/* Spine Gutter shadow */}
                <div className="bg-gradient-to-l from-black/15 to-transparent w-8 absolute right-5 top-3 bottom-3 pointer-events-none rounded-r-xs" />
              </div>
            </motion.div>

            {/* --- PAGE 6 (Static base on the right edge, on top of hardcover) --- */}
            <div
              style={{
                transform: 'rotateY(0deg)',
                transformOrigin: 'left center',
                zIndex: 9
              }}
              className="absolute left-1/2 top-0 w-1/2 h-full select-none"
            >
              {/* Inside Right Cover structure */}
              <div 
                className="w-[calc(100%+6px)] h-[calc(100%+12px)] mt-[-6px] rounded-r-2xl border border-blue-955 bg-[#0f2a4a] bg-radial from-[#1e447b] to-[#0a182c] shadow-[inset_3px_0_15px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Gold lining inside cover */}
                <div className="absolute inset-2 md:inset-3 border border-amber-600/20 rounded-r-xl pointer-events-none" />

                {/* Page 6 Container (cream base paper glued inside right cover) */}
                <div 
                  className="absolute top-3 bottom-3 left-5 right-2.5 rounded-r-md bg-[#fcfaf2] shadow-lg flex flex-col justify-between pl-1.5 pr-3.5 py-1 overflow-hidden"
                  style={{ boxShadow: 'inset_3px_0_15px_rgba(0,0,0,0.1)' }}
                >
                  {renderPage(5)}
                </div>
                
                {/* Spine shadow gutter */}
                <div className="bg-gradient-to-r from-black/15 to-transparent w-8 absolute left-5 top-3 bottom-3 pointer-events-none rounded-l-xs" />
              </div>
            </div>

          </div>
        </div>

        {/* Scroll cue arrow */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 flex flex-col items-center gap-1 z-[45] pointer-events-none"
        >
          <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">Keep scrolling</span>
          <span className="text-blue-500 text-xl font-bold">↓</span>
        </motion.div>
      </div>
    </div>
  );
}
