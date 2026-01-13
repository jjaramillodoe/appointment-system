"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface AutocompleteOption {
  id: string;
  name: string;
  email: string;
  school: string;
  displayText: string;
}

interface AutocompleteInputProps {
  placeholder: string;
  onSelect: (option: AutocompleteOption) => void;
  onSearch: (query: string) => Promise<AutocompleteOption[]>;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  minSearchLength?: number;
  debounceMs?: number;
}

export default function AutocompleteInput({
  placeholder,
  onSelect,
  onSearch,
  value = '',
  onChange,
  disabled = false,
  className = '',
  minSearchLength = 2,
  debounceMs = 300
}: AutocompleteInputProps) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minSearchLength) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await onSearch(searchQuery);
      setOptions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      setError('Search failed. Please try again.');
      setOptions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, minSearchLength]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange?.(newValue);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      debouncedSearch(newValue);
    }, debounceMs);
  };

  // Handle option selection
  const handleOptionSelect = (option: AutocompleteOption) => {
    setQuery(option.displayText);
    onChange?.(option.displayText);
    onSelect(option);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && options[selectedIndex]) {
          handleOptionSelect(options[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Clear input
  const clearInput = () => {
    setQuery('');
    onChange?.('');
    setOptions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= minSearchLength && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {query && (
          <button
            onClick={clearInput}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              Searching...
            </div>
          ) : error ? (
            <div className="px-4 py-2 text-sm text-red-500 text-center">
              {error}
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              No results found
            </div>
          ) : (
            options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                  index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{option.name}</div>
                <div className="text-sm text-gray-500">{option.email}</div>
                {option.school && (
                  <div className="text-xs text-gray-400">{option.school}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
