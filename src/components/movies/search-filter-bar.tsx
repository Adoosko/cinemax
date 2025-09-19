'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, Calendar, Star, Filter, ChevronDown } from 'lucide-react';

export interface Genre {
  id: string;
  name: string;
}

export interface FilterOptions {
  genre?: string;
  year?: number;
  rating?: number;
  sortBy?: 'popularity' | 'rating' | 'releaseDate' | 'title';
}

interface SearchFilterBarProps {
  onSearch: (term: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  genres: Genre[];
  initialSearchTerm?: string;
  initialFilters?: FilterOptions;
}

export function SearchFilterBar({
  onSearch,
  onFilterChange,
  genres,
  initialSearchTerm = '',
  initialFilters = {},
}: SearchFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Generate years from current year down to 1980
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

  const ratings = [9, 8, 7, 6, 5, 4];

  const sortOptions = [
    { id: 'popularity', name: 'Most Popular' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'releaseDate', name: 'Newest First' },
    { id: 'title', name: 'A-Z' },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  const clearAllFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key as keyof FilterOptions]
  ).length;

  return (
    <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-white/5 text-white placeholder-white/40 pl-12 pr-12 py-4 rounded-xl border border-white/10 focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all"
          />
          {searchTerm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-4 py-3 rounded-xl transition-all"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-netflix-red rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs font-bold">{activeFiltersCount}</span>
              </motion.div>
            )}
            <motion.div animate={{ rotate: isFilterOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>

          {activeFiltersCount > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={clearAllFilters}
              className="text-netflix-red hover:text-white text-sm font-medium transition-colors"
            >
              Clear All
            </motion.button>
          )}
        </div>

        {/* Filter Dropdown */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10 overflow-hidden"
            >
              {/* Genre */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Film className="w-4 h-4 mr-2 text-netflix-red" />
                  Genre
                </label>
                <select
                  value={filters.genre || ''}
                  onChange={(e) => handleFilterChange('genre', e.target.value || undefined)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 focus:border-netflix-red focus:outline-none"
                >
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id} className="bg-black">
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-netflix-red" />
                  Year
                </label>
                <select
                  value={filters.year || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'year',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 focus:border-netflix-red focus:outline-none"
                >
                  <option value="">Any Year</option>
                  {years.slice(0, 15).map((year) => (
                    <option key={year} value={year} className="bg-black">
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-2 text-netflix-red" />
                  Min Rating
                </label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'rating',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 focus:border-netflix-red focus:outline-none"
                >
                  <option value="">Any Rating</option>
                  {ratings.map((rating) => (
                    <option key={rating} value={rating} className="bg-black">
                      {rating}.0+
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-netflix-red" />
                  Sort By
                </label>
                <select
                  value={filters.sortBy || ''}
                  onChange={(e) =>
                    handleFilterChange('sortBy', (e.target.value as any) || undefined)
                  }
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 focus:border-netflix-red focus:outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-black">
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 pt-2 border-t border-white/10"
          >
            {filters.genre && (
              <span className="bg-netflix-red/20 border border-netflix-red/30 text-netflix-red px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <span>{genres.find((g) => g.id === filters.genre)?.name}</span>
                <button
                  onClick={() => handleFilterChange('genre', undefined)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.year && (
              <span className="bg-netflix-red/20 border border-netflix-red/30 text-netflix-red px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <span>{filters.year}</span>
                <button
                  onClick={() => handleFilterChange('year', undefined)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.rating && (
              <span className="bg-netflix-red/20 border border-netflix-red/30 text-netflix-red px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <span>{filters.rating}.0+</span>
                <button
                  onClick={() => handleFilterChange('rating', undefined)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.sortBy && (
              <span className="bg-netflix-red/20 border border-netflix-red/30 text-netflix-red px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <span>{sortOptions.find((s) => s.id === filters.sortBy)?.name}</span>
                <button
                  onClick={() => handleFilterChange('sortBy', undefined)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
