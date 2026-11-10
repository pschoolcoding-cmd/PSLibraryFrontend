import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Check } from 'lucide-react';
import { createBookCoverSvg } from '../data/mockBooks';
import { useTheme } from '../context/ThemeContext';

export default function BookCard({ book, onAuthorClick }) {
  const navigate = useNavigate();
  const { t } = useTheme();

  const bookId = book._id || book.bid;
  // Rule: Book metadata (titles, authors) must remain in their original registered language
  const title = book.name || book.title || 'Untitled Volume';
  const author = book.author || 'Unknown Author';

  const rawBorrowed = String(book.borrowed || '0').toLowerCase().trim();
  const isReserved = rawBorrowed.includes('reserved') || book.status === 'reserved';
  const isBorrowed =
    !isReserved &&
    Boolean(book.borrowed && rawBorrowed !== '0' && rawBorrowed !== 'available' && rawBorrowed !== '');

  // Compute deterministic 1-5 star rating if not explicitly stored on backend record
  const rating =
    typeof book.rating === 'number'
      ? Math.min(5, Math.max(1, Math.round(book.rating)))
      : (title.length + author.length) % 2 === 0
      ? 5
      : 4;

  const fallbackCover = createBookCoverSvg({
    title,
    author,
    publisher: book.publisher || 'PS LIBRARY ARCHIVE',
    bg: '#1E293B',
    accent: '#3B9C88'
  });

  const coverSrc = book.image || fallbackCover;

  const handleOpenBook = () => {
    navigate(`/book/${bookId}`);
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    if (onAuthorClick) {
      onAuthorClick(author);
    } else {
      navigate(`/search?q=${encodeURIComponent(author)}`);
    }
  };

  return (
    <div className="flex flex-col group">
      {/* Cover Thumbnail Container */}
      <div
        onClick={handleOpenBook}
        className="relative w-full aspect-[2/3] rounded-[3px] overflow-hidden cursor-pointer border transition-opacity hover:opacity-95"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: 'var(--cover-shadow)'
        }}
      >
        <img
          src={coverSrc}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover block"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackCover;
          }}
        />

        {/* Top-Right Availability Pill Badge ("Available" / "Borrowed" / "Reserved") */}
        <div className="absolute top-1.5 right-1.5 z-10">
          {isReserved ? (
            <span className="cw-badge-info shadow-xs">{t('status.reserved', 'Reserved')}</span>
          ) : isBorrowed ? (
            <span className="cw-badge-borrowed shadow-xs">{t('status.borrowed', 'Borrowed')}</span>
          ) : (
            <span className="cw-badge-available shadow-xs">
              {t('status.available', 'Available')}
            </span>
          )}
        </div>

        {/* Bottom-Left Read Checkmark Badge (Calibre-Web signature indicator) */}
        {book.isRead && (
          <div
            className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center border"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)'
            }}
            title={t('status.read', 'Read')}
          >
            <Check className="w-3 h-3 stroke-[2.5]" />
          </div>
        )}

        {/* Optional Copy Count Pill if multiple copies */}
        {book.copyCount > 1 && (
          <div className="absolute bottom-1.5 right-1.5">
            <span
              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-[2px] border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              {book.copyCount} {t('status.copies', 'copies')}
            </span>
          </div>
        )}
      </div>

      {/* Book Metadata Under Cover (Original Language Preserved) */}
      <div className="pt-2.5 flex flex-col gap-0.5">
        <h3
          onClick={handleOpenBook}
          className="text-[13px] font-bold leading-snug cw-text-primary hover:underline cursor-pointer line-clamp-2"
          title={title}
        >
          {title}
        </h3>

        <button
          type="button"
          onClick={handleAuthorClick}
          className="text-left text-[12px] font-normal cw-link-teal truncate cursor-pointer w-fit max-w-full"
          title={author}
        >
          {author}
        </button>

        {/* Star Rating (1-5 Stars) */}
        <div
          className="flex items-center gap-0.5 mt-1"
          aria-label={`Rating: ${rating} out of 5 stars`}
        >
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const filled = starIndex <= rating;
            return (
              <Star
                key={starIndex}
                className="w-3.5 h-3.5"
                style={{
                  color: filled ? 'var(--star-filled)' : 'var(--star-empty)',
                  fill: filled ? 'var(--star-filled)' : 'transparent'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
