"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FolderKanban, Scale, ListTodo, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/contexts/search-context";

interface SearchResult {
  id: string;
  type: "project" | "decision" | "action" | "meeting";
  title: string;
  subtitle: string;
  href: string;
}

interface SearchResults {
  projects: SearchResult[];
  decisions: SearchResult[];
  actions: SearchResult[];
  meetings: SearchResult[];
}

export function GlobalSearchDropdown() {
  const { searchQuery } = useSearch();
  const router = useRouter();
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Recherche avec debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setResults(null);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error("Erreur de recherche");
        const data = await response.json();
        setResults(data.results);
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !results) return;

      const allResults = [
        ...results.projects,
        ...results.decisions,
        ...results.actions,
        ...results.meetings,
      ];

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected) {
          router.push(selected.href);
          setIsOpen(false);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, results, selectedIndex, router]);

  if (!isOpen || searchQuery.length < 2) {
    return null;
  }

  const allResults = results
    ? [
        ...results.projects,
        ...results.decisions,
        ...results.actions,
        ...results.meetings,
      ]
    : [];

  const getIcon = (type: string) => {
    switch (type) {
      case "project":
        return <FolderKanban className="h-4 w-4" />;
      case "decision":
        return <Scale className="h-4 w-4" />;
      case "action":
        return <ListTodo className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "project":
        return "Projet";
      case "decision":
        return "Décision";
      case "action":
        return "Action";
      case "meeting":
        return "Réunion";
      default:
        return "";
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[500px] overflow-y-auto"
    >
      {isLoading ? (
        <div className="p-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Recherche en cours...</p>
        </div>
      ) : allResults.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-sm text-slate-500">Aucun résultat trouvé</p>
        </div>
      ) : results ? (
        <div className="py-2">
          {results.projects.length > 0 && (
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Projets ({results.projects.length})
              </div>
              {results.projects.map((result, index) => {
                const globalIndex = index;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.href);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-blue-50 transition-colors",
                      isSelected && "bg-blue-50"
                    )}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="text-blue-600">{getIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-slate-500 truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {getTypeLabel(result.type)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {results.decisions.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Décisions ({results.decisions.length})
              </div>
              {results.decisions.map((result, index) => {
                const globalIndex =
                  results.projects.length + index;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.href);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-blue-50 transition-colors",
                      isSelected && "bg-blue-50"
                    )}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="text-emerald-600">{getIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-slate-500 truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {getTypeLabel(result.type)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {results.actions.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Actions ({results.actions.length})
              </div>
              {results.actions.map((result, index) => {
                const globalIndex =
                  results.projects.length +
                  results.decisions.length +
                  index;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.href);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-blue-50 transition-colors",
                      isSelected && "bg-blue-50"
                    )}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="text-blue-600">{getIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-slate-500 truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {getTypeLabel(result.type)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {results.meetings.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Réunions ({results.meetings.length})
              </div>
              {results.meetings.map((result, index) => {
                const globalIndex =
                  results.projects.length +
                  results.decisions.length +
                  results.actions.length +
                  index;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.href);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-blue-50 transition-colors",
                      isSelected && "bg-blue-50"
                    )}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="text-amber-600">{getIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-slate-500 truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {getTypeLabel(result.type)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

