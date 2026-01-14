"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface LanguageOption {
  code: string;
  name: string;
}

interface LanguageAutocompleteProps {
  options: LanguageOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function LanguageAutocomplete({
  options,
  value,
  onChange,
  placeholder = "Select or type to search...",
  required = false,
  className = ""
}: LanguageAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<LanguageOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected language name from code
  const selectedLanguage = options.find(lang => lang.code === value);

  // Initialize query with selected language name
  useEffect(() => {
    if (selectedLanguage) {
      setQuery(selectedLanguage.name);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedLanguage]);

  // Filter options based on query
  useEffect(() => {
    if (query.trim() === '') {
      // Show all options when query is empty, sorted alphabetically
      setFilteredOptions([...options].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      // Filter options that match the query (case-insensitive)
      const filtered = options.filter(lang =>
        lang.name.toLowerCase().includes(query.toLowerCase())
      ).sort((a, b) => a.name.localeCompare(b.name));
      setFilteredOptions(filtered);
    }
  }, [query, options]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setSelectedIndex(-1);

    // If query matches an option exactly, select it
    const exactMatch = options.find(lang => 
      lang.name.toLowerCase() === newQuery.toLowerCase()
    );
    if (exactMatch) {
      onChange(exactMatch.code);
    } else {
      // Clear selection if no exact match
      onChange('');
    }
  };

  // Handle option selection
  const handleSelectOption = (option: LanguageOption) => {
    setQuery(option.name);
    onChange(option.code);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key !== 'Escape') {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleSelectOption(filteredOptions[selectedIndex]);
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
        
        // Reset query to selected language name if available
        if (selectedLanguage) {
          setQuery(selectedLanguage.name);
        } else if (!value) {
          setQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedLanguage, value]);

  // Clear input
  const handleClear = () => {
    setQuery('');
    onChange('');
    inputRef.current?.focus();
    setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handleSelectOption(option)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              } ${option.code === value ? 'bg-blue-100 font-medium' : ''}`}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}

      {/* Hidden input for form submission (stores the code) */}
      <input
        type="hidden"
        name="preferredLanguage"
        value={value}
        required={required}
      />
    </div>
  );
}
