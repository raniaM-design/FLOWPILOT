"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  // Réinitialiser la recherche quand on change de page (mais pas immédiatement pour éviter les flashs)
  useEffect(() => {
    // Utiliser un petit délai pour éviter de réinitialiser pendant la navigation
    const timer = setTimeout(() => {
      setSearchQuery("");
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

