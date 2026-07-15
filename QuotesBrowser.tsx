import React, { useState, useMemo } from 'react';
import { LOCAL_QUOTES } from '../data/quotes';
import { Quote } from '../types';
import { Search, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface QuotesBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuote: (quote: Quote) => void;
  currentQuoteId: number;
}

export default function QuotesBrowser({ isOpen, onClose, onSelectQuote, currentQuoteId }: QuotesBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter quotes by search input (author name or text keyword)
  const filteredQuotes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return LOCAL_QUOTES;
    return LOCAL_QUOTES.filter(
      q => q.text.toLowerCase().includes(term) || q.author.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Handle pagination calculation
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage) || 1;
  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuotes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuotes, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset page to 1
  };

  const handleSelect = (quote: Quote) => {
    onSelectQuote(quote);
    onClose();
  };

  const handlePickRandom = () => {
    const randomIndex = Math.floor(Math.random() * LOCAL_QUOTES.length);
    handleSelect(LOCAL_QUOTES[randomIndex]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div 
        className="w-full max-w-2xl bg-[#1D1B20] border border-[#49454F] rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        id="quotes-modal"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#49454F]/50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D0BCFF]" />
              Inspirational Quotes Database
            </h3>
            <p className="text-xs text-[#E6E1E5]/60 mt-1">
              Explore and select from over {LOCAL_QUOTES.length} premium local motivational quotes.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#E6E1E5]/60 hover:text-white hover:bg-[#2B2930] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 bg-[#141218]/40 border-b border-[#49454F]/40 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E6E1E5]/40" />
            <input 
              type="text"
              placeholder="Search by quote, wisdom, or author..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-[#141218] text-[#E6E1E5] pl-10 pr-4 py-2.5 rounded-lg text-sm border border-[#49454F] focus:outline-none focus:border-[#D0BCFF]/50 transition-colors"
            />
          </div>
          <button
            onClick={handlePickRandom}
            className="px-4 py-2.5 bg-[#4F378B] hover:bg-[#4F378B]/90 border border-[#D0BCFF]/30 text-[#EADDFF] font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#D0BCFF]/10 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Random Quote
          </button>
        </div>

        {/* Quotes List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {paginatedQuotes.length > 0 ? (
            paginatedQuotes.map((q) => {
              const isSelected = q.id === currentQuoteId;
              return (
                <div 
                  key={q.id}
                  onClick={() => handleSelect(q)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer text-left ${
                    isSelected 
                      ? 'bg-[#4F378B]/20 border-[#D0BCFF] shadow-inner' 
                      : 'bg-[#141218]/40 border-[#49454F]/50 hover:border-[#D0BCFF]/50 hover:bg-[#141218]/80'
                  }`}
                >
                  <p className="text-sm text-[#E6E1E5]/90 leading-relaxed italic">
                    “{q.text}”
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs font-bold text-[#D0BCFF] tracking-wider">
                      - {q.author.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#E6E1E5]/30 font-mono">
                      Quote #{q.id}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-[#E6E1E5]/40 text-sm">No quotes found matching your search term.</p>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="p-4 border-t border-[#49454F]/50 bg-[#141218]/50 flex items-center justify-between">
          <span className="text-xs text-[#E6E1E5]/50">
            Showing {Math.min(filteredQuotes.length, (currentPage - 1) * itemsPerPage + 1)}-
            {Math.min(filteredQuotes.length, currentPage * itemsPerPage)} of {filteredQuotes.length} quotes
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#49454F] bg-[#2B2930] text-[#E6E1E5]/60 hover:text-white hover:bg-[#2B2930]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-[#E6E1E5]/70">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#49454F] bg-[#2B2930] text-[#E6E1E5]/60 hover:text-white hover:bg-[#2B2930]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
