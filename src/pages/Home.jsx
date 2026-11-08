import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookHero from '../components/BookHero';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Search, ScanLine, Layers, ShieldCheck, ArrowUpRight, BookmarkCheck, BookOpen } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] overflow-x-clip">
      <Navbar />

      {/* 3D BOOK PROLOGUE HERO SECTION */}
      <BookHero title="THE LIBRARY CHRONICLES" />

      {/* LIBRARY MODULES & CATALOG OVERVIEW SECTION */}
      <section className="relative z-50 bg-[var(--bg-app)] py-20 px-4 sm:px-8 border-t border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto">
          {/* Header Introduction */}
          <div className="max-w-3xl mb-12 space-y-2 border-b border-[var(--border-color)] pb-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[#3b9c88] font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Library Catalog & Inventory System</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              A Complete Academic Library Ecosystem
            </h2>

            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Browse indexed holdings, filter by categories and authors, look up ISBN-13 barcodes, and manage active reader loans through a unified catalog interface.
            </p>
          </div>

          {/* Module Cards Grid (Crisp 1px bordered library panels) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Card 1: Catalog Search */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--border-strong)] p-6 rounded-lg transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-[#337ab7]" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                  Book Catalogue
                </h3>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                  Browse library holdings by title, author, category, rating, and availability. Includes custom reading shelves and multi-criteria filtering.
                </p>
              </div>
              <button
                onClick={() => navigate('/search')}
                className="mt-6 cw-btn-primary py-2 px-4 text-xs w-fit"
              >
                <span>Open Catalogue</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Barcode Scanning */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--border-strong)] p-6 rounded-lg transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-4">
                  <ScanLine className="w-5 h-5 text-[#3b9c88]" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                  Barcode & ISBN Lookup
                </h3>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                  Scan physical book barcodes using your device camera or search partial 13-digit ISBN patterns directly against the catalog index.
                </p>
              </div>
              <button
                onClick={() => navigate('/scan')}
                className="mt-6 cw-btn-teal py-2 px-4 text-xs w-fit"
              >
                <span>Open Scanner</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Admin Inventory or Reader Account */}
            {isAdmin ? (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--border-strong)] p-6 rounded-lg transition-colors flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-4">
                    <Layers className="w-5 h-5 text-[#337ab7]" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                    Inventory Management
                  </h3>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                    Register newly acquired books, manage copy suffixes, review pending subadmin submissions, and audit reader accounts.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="mt-6 cw-btn py-2 px-4 text-xs w-fit"
                >
                  <span>Admin Panel</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--border-strong)] p-6 rounded-lg transition-colors flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-4">
                    <BookmarkCheck className="w-5 h-5 text-[#3b9c88]" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                    Reader Account & Loans
                  </h3>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                    Track your active borrowed books, check loan return dates, view saved favorites, and manage your reader profile.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/account')}
                  className="mt-6 cw-btn py-2 px-4 text-xs w-fit"
                >
                  <span>My Account</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Call-to-action Block */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 sm:p-8 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center shrink-0 text-[#337ab7]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Digital Archiving & Real-Time Shelf Index
                </h3>
                <p className="text-[var(--text-secondary)] text-xs mt-1 max-w-xl">
                  Every volume in the PS Library is indexed by ISBN-13 and copy number for instant availability verification.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="cw-btn-primary px-5 py-2.5 text-xs shrink-0"
            >
              Browse Full Catalogue
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] py-8 text-center text-[var(--text-secondary)] text-xs">
        <p className="font-medium">
          © {new Date().getFullYear()} PS Library Digital Archives. All systems operational.
        </p>
      </footer>
    </div>
  );
}
