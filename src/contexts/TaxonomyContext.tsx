"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { INSTRUMENTS, ASPECTS, GENRES } from '@/lib/types';

interface TaxonomyContextType {
  instruments: string[];
  aspects: string[];
  genres: string[];
  isLoading: boolean;
  error: string | null;
  refreshTaxonomy: () => Promise<void>;
}

const TaxonomyContext = createContext<TaxonomyContextType>({
  instruments: INSTRUMENTS,
  aspects: ASPECTS,
  genres: GENRES,
  isLoading: false,
  error: null,
  refreshTaxonomy: async () => {}
});

export const useTaxonomy = () => useContext(TaxonomyContext);

export function TaxonomyProvider({ children }: { children: React.ReactNode }) {
  const [instruments, setInstruments] = useState<string[]>(INSTRUMENTS);
  const [aspects, setAspects] = useState<string[]>(ASPECTS);
  const [genres, setGenres] = useState<string[]>(GENRES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxonomy = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/taxonomy');
      
      if (!response.ok) {
        throw new Error('Failed to fetch taxonomy');
      }
      
      const data = await response.json();
      
      setInstruments(data.instruments || INSTRUMENTS);
      setAspects(data.aspects || ASPECTS);
      setGenres(data.genres || GENRES);
    } catch (err) {
      console.error('Error fetching taxonomy:', err);
      setError('Failed to load taxonomy options. Using default values.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTaxonomy();
  }, []);

  return (
    <TaxonomyContext.Provider
      value={{
        instruments,
        aspects,
        genres,
        isLoading,
        error,
        refreshTaxonomy: fetchTaxonomy
      }}
    >
      {children}
    </TaxonomyContext.Provider>
  );
} 