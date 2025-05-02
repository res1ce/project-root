'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Search } from 'lucide-react';
import axios from 'axios';

interface AddressSearchProps {
  onSelectAddress?: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
  apiKey?: string;
}

interface SearchResult {
  address_name: string;
  full_name: string;
  point: {
    lat: number;
    lon: number;
  };
}

// Используем API ключ из .env.local
const ENV_API_KEY = process.env.NEXT_PUBLIC_2GIS_API_KEY || '91cc0959-c21f-4c59-90c3-f0c01cb4f5a3';

const AddressSearch: React.FC<AddressSearchProps> = ({
  onSelectAddress,
  placeholder = 'Введите адрес...',
  className = '',
  apiKey = ENV_API_KEY,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Функция для поиска адреса
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://catalog.api.2gis.com/3.0/items/geocode`,
        {
          params: {
            q: query,
            fields: 'items.point',
            key: apiKey,
          },
        }
      );

      if (response.data && response.data.result && response.data.result.items) {
        setResults(response.data.result.items);
        setShowResults(true);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Ошибка при поиске адреса:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка поиска при вводе
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce поиска
    const timeoutId = setTimeout(() => {
      searchAddress(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Обработка выбора адреса
  const handleSelectAddress = (result: SearchResult) => {
    if (onSelectAddress) {
      onSelectAddress(result.full_name, result.point.lat, result.point.lon);
    }
    setSearchQuery(result.full_name);
    setShowResults(false);
  };

  // Обработка клавиш
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelectAddress(results[activeIndex]);
      } else if (results.length > 0) {
        handleSelectAddress(results[0]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchContainerRef}>
      <div className="flex">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="pr-10"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-10 w-10"
          onClick={() => searchAddress(searchQuery)}
          disabled={isLoading}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto py-1 text-base sm:text-sm">
            {results.map((result, index) => (
              <li
                key={`${result.full_name}-${index}`}
                className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${
                  index === activeIndex ? 'bg-gray-100' : ''
                }`}
                onClick={() => handleSelectAddress(result)}
              >
                <div className="font-medium">{result.full_name}</div>
                {result.point && (
                  <div className="text-xs text-gray-500">
                    {result.point.lat.toFixed(6)}, {result.point.lon.toFixed(6)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults && results.length === 0 && searchQuery.length >= 3 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md bg-white p-2 text-center text-sm text-gray-500 shadow-lg">
          Адрес не найден
        </div>
      )}
    </div>
  );
};

export { AddressSearch }; 