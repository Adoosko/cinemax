'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronDown, Filter, Star, Tv, X } from 'lucide-react';
import { useState } from 'react';

// shadcn/ui imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchBar } from '@/components/ui/searchbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SeriesGenre {
  id: string;
  name: string;
}

export interface SeriesFilterOptions {
  genre?: string;
  years?: number[]; // Changed to array for multiple selection
  rating?: number;
  sortBy?: 'title' | 'releaseYear' | 'rating' | 'popularity';
}

interface SeriesSearchFilterBarProps {
  onSearch: (term: string) => void;
  onFilterChange: (filters: SeriesFilterOptions) => void;
  genres: SeriesGenre[];
  initialSearchTerm?: string;
  initialFilters?: SeriesFilterOptions;
}

export function SeriesSearchFilterBar({
  onSearch,
  onFilterChange,
  genres,
  initialSearchTerm = '',
  initialFilters = {},
}: SeriesSearchFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState<SeriesFilterOptions>(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isYearPopoverOpen, setIsYearPopoverOpen] = useState(false);

  // Generate years from current year down to 1980
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

  const ratings = [9, 8, 7, 6, 5, 4];

  const sortOptions = [
    { id: 'popularity', name: 'Most Popular' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'releaseYear', name: 'Newest First' },
    { id: 'title', name: 'A-Z' },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (filterType: keyof SeriesFilterOptions, value: any) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleYearToggle = (year: number, checked: boolean) => {
    const currentYears = filters.years || [];
    let newYears: number[];

    if (checked) {
      newYears = [...currentYears, year];
    } else {
      newYears = currentYears.filter((y) => y !== year);
    }

    handleFilterChange('years', newYears.length > 0 ? newYears : undefined);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  const clearAllFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const removeFilter = (filterType: keyof SeriesFilterOptions) => {
    const { [filterType]: _, ...remainingFilters } = filters;
    setFilters(remainingFilters);
    onFilterChange(remainingFilters);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key as keyof SeriesFilterOptions]
  ).length;

  return (
    <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search series..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            onSearch(value);
          }}
          onClear={clearSearch}
        />

        {/* Filter Controls - Using AnimatePresence instead of DropdownMenu */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            variant="outline"
            className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-4 py-3 rounded-xl transition-all"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge className="w-6 h-6 bg-netflix-red rounded-full flex items-center justify-center p-0">
                <span className="text-white text-xs font-bold">{activeFiltersCount}</span>
              </Badge>
            )}
            <motion.div animate={{ rotate: isFilterOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </Button>

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

        {/* Filter Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10 overflow-hidden"
            >
              {/* Genre Filter */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Tv className="w-4 h-4 mr-2 text-netflix-red" />
                  Genre
                </label>
                <Select
                  value={filters.genre || 'all-genres'}
                  onValueChange={(value: string) =>
                    handleFilterChange('genre', value === 'all-genres' ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-full bg-white/5 border border-white/10 text-white">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/20">
                    <SelectItem value="all-genres">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem
                        key={genre.id}
                        value={genre.id}
                        className="text-white hover:bg-white/10"
                      >
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Multi-Year Filter */}
              <div>
                <label className=" text-white text-sm font-semibold mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-netflix-red" />
                  Years
                </label>
                <Popover open={isYearPopoverOpen} onOpenChange={setIsYearPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 border border-white/10 text-white justify-between cursor-pointer"
                    >
                      {filters.years && filters.years.length > 0
                        ? `${filters.years.length} year${filters.years.length > 1 ? 's' : ''} selected`
                        : 'Any Year'}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-netflix-red scrollbar-track-white/10">
                    <div className="space-y-2">
                      {years.slice(0, 15).map((year) => (
                        <div key={year} className="flex items-center space-x-2">
                          <Checkbox
                            id={`year-${year}`}
                            checked={filters.years?.includes(year) || false}
                            onCheckedChange={(checked: boolean) =>
                              handleYearToggle(year, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`year-${year}`}
                            className="text-white text-sm cursor-pointer flex-1"
                          >
                            {year}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-2 text-netflix-red" />
                  Min Rating
                </label>
                <Select
                  value={filters.rating?.toString() || 'any-rating'}
                  onValueChange={(value: string) =>
                    handleFilterChange(
                      'rating',
                      value === 'any-rating' ? undefined : parseInt(value)
                    )
                  }
                >
                  <SelectTrigger className="w-full bg-white/5 border border-white/10 text-white">
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/20">
                    <SelectItem value="any-rating">Any Rating</SelectItem>
                    {ratings.map((rating) => (
                      <SelectItem
                        key={rating}
                        value={rating.toString()}
                        className="text-white hover:bg-white/10"
                      >
                        {rating}.0+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-netflix-red" />
                  Sort By
                </label>
                <Select
                  value={filters.sortBy || 'title'}
                  onValueChange={(value: string) => handleFilterChange('sortBy', value as any)}
                >
                  <SelectTrigger className="w-full bg-white/5 border border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/20">
                    {sortOptions.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id}
                        className="text-white hover:bg-white/10"
                      >
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Badge
                variant="secondary"
                className="bg-netflix-red/20 border border-netflix-red/30 text-netflix-red hover:bg-netflix-red/30 cursor-pointer"
                onClick={() => removeFilter('genre')}
              >
                <span>{genres.find((g) => g.id === filters.genre)?.name}</span>
                <X className="w-3 h-3 ml-2" />
              </Badge>
            )}
            {filters.years && filters.years.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-netflix-red/20 border border-netflix-red/30 text-netflix-red hover:bg-netflix-red/30 cursor-pointer"
                onClick={() => removeFilter('years')}
              >
                <span>
                  {filters.years.length === 1 ? filters.years[0] : `${filters.years.length} years`}
                </span>
                <X className="w-3 h-3 ml-2" />
              </Badge>
            )}
            {filters.rating && (
              <Badge
                variant="secondary"
                className="bg-netflix-red/20 border border-netflix-red/30 text-netflix-red hover:bg-netflix-red/30 cursor-pointer"
                onClick={() => removeFilter('rating')}
              >
                <span>{filters.rating}.0+</span>
                <X className="w-3 h-3 ml-2" />
              </Badge>
            )}
            {filters.sortBy && (
              <Badge
                variant="secondary"
                className="bg-netflix-red/20 border border-netflix-red/30 text-netflix-red hover:bg-netflix-red/30 cursor-pointer"
                onClick={() => removeFilter('sortBy')}
              >
                <span>{sortOptions.find((s) => s.id === filters.sortBy)?.name}</span>
                <X className="w-3 h-3 ml-2" />
              </Badge>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
