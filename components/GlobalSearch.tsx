
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Search, User, ShoppingBag, X } from 'lucide-react';
import type { Customer, Service } from '../types';

interface SearchResult {
  id: string;
  name: string;
  type: 'customer' | 'service';
  path: string;
}

const GlobalSearch: React.FC = () => {
  const { customers, services } = useAppContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      const lowerCaseQuery = query.toLowerCase();

      const customerResults = customers
        .filter(c =>
          c.name.toLowerCase().includes(lowerCaseQuery) ||
          c.phone.includes(lowerCaseQuery)
        )
        .map(c => ({ id: c.id, name: c.name, type: 'customer' as const, path: '/customers' }));

      const serviceResults = services
        .filter(s => s.name.toLowerCase().includes(lowerCaseQuery))
        .map(s => ({ id: s.id, name: s.name, type: 'service' as const, path: '/services' }));
      
      setResults([...customerResults, ...serviceResults]);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, customers, services]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setQuery('');
    setResults([]);
    setIsFocused(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  }

  const groupedResults = results.reduce((acc, result) => {
    (acc[result.type] = acc[result.type] || []).push(result);
    return acc;
  }, {} as Record<'customer' | 'service', SearchResult[]>);

  return (
    <div className="relative w-full max-w-md" ref={searchContainerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search customers, products..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-transparent focus:border-teal-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          aria-label="Global search for customers and products"
        />
        {query && (
          <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" aria-label="Clear search input">
            <X size={18} />
          </button>
        )}
      </div>
      {isFocused && query.length > 1 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <ul>
                {groupedResults.customer && (
                <>
                    <li className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">Customers</li>
                    {groupedResults.customer.map(result => (
                    <li key={result.id} onMouseDown={() => handleSelect(result)} className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <User className="mr-3 text-teal-500 flex-shrink-0" size={18} />
                        <span className="truncate">{result.name}</span>
                    </li>
                    ))}
                </>
                )}
                {groupedResults.service && (
                <>
                    <li className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">Services & Products</li>
                    {groupedResults.service.map(result => (
                    <li key={result.id} onMouseDown={() => handleSelect(result)} className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <ShoppingBag className="mr-3 text-indigo-500 flex-shrink-0" size={18} />
                        <span className="truncate">{result.name}</span>
                    </li>
                    ))}
                </>
                )}
            </ul>
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center">No results found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;