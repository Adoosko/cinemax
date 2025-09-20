'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { FilterOptions } from '@/components/movies/search-filter-bar';

interface AdminMoviesContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
}

const AdminMoviesContext = createContext<AdminMoviesContextType | undefined>(undefined);

export function AdminMoviesProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

  return (
    <AdminMoviesContext.Provider
      value={{ searchTerm, setSearchTerm, filterOptions, setFilterOptions }}
    >
      {children}
    </AdminMoviesContext.Provider>
  );
}

export function useAdminMoviesContext() {
  const context = useContext(AdminMoviesContext);
  if (context === undefined) {
    throw new Error('useAdminMoviesContext must be used within an AdminMoviesProvider');
  }
  return context;
}
