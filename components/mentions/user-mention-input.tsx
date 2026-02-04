"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, AtSign, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserMentionInputProps {
  value: string[];
  onChange: (userIds: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function UserMentionInput({
  value,
  onChange,
  placeholder = "Mentionner des utilisateurs (@email)...",
  className,
  disabled = false,
}: UserMentionInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<User[]>([]);

  // Charger les membres de l'entreprise
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch("/api/company/members");
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error);
      }
    };

    fetchMembers();
  }, []);

  // Filtrer les suggestions basées sur l'input
  useEffect(() => {
    if (!inputValue.trim()) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    // Si l'utilisateur tape "@", afficher tous les membres disponibles
    // Sinon, filtrer par email ou nom
    const query = inputValue.toLowerCase().replace("@", "");
    const filtered = members
      .filter((m) => {
        // Exclure les utilisateurs déjà sélectionnés
        if (value.includes(m.id)) return false;
        
        // Si juste "@" ou vide après "@", afficher tous les membres disponibles
        if (!query || inputValue === "@") {
          return true;
        }
        
        // Filtrer par email ou nom
        const emailMatch = m.email.toLowerCase().includes(query);
        const nameMatch = m.name?.toLowerCase().includes(query);
        return emailMatch || nameMatch;
      })
      .slice(0, 8); // Augmenter à 8 pour plus de visibilité

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 && (inputValue.includes("@") || inputValue.trim().length > 0));
    setSelectedIndex(-1);
  }, [inputValue, members, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSelectUser = (user: User) => {
    if (!value.includes(user.id)) {
      onChange([...value, user.id]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveUser = (userId: string) => {
    onChange(value.filter((id) => id !== userId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectUser(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSelectedUsers = () => {
    return members.filter((m) => value.includes(m.id));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Utilisateurs sélectionnés */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getSelectedUsers().map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 border-blue-200"
            >
              <Avatar className="w-4 h-4">
                <AvatarFallback className="bg-blue-500 text-white text-xs">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{user.email.split("@")[0]}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.id)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input avec suggestions */}
      <div className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <AtSign className="h-4 w-4" />
          </div>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.includes("@") && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder || "Tapez @email pour mentionner un membre..."}
            disabled={disabled}
            className="w-full pl-10"
          />
        </div>
        
        {/* Indicateur visuel si des membres sont disponibles */}
        {members.length > 0 && !inputValue && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {members.length} membre{members.length > 1 ? "s" : ""} disponible{members.length > 1 ? "s" : ""} - Tapez @ pour voir la liste
          </p>
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
              <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {suggestions.length} membre{suggestions.length > 1 ? "s" : ""} disponible{suggestions.length > 1 ? "s" : ""}
              </p>
            </div>
            {suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0",
                  index === selectedIndex && "bg-blue-100"
                )}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-slate-900">
                    {user.name || user.email.split("@")[0]}
                  </div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <AtSign className="h-4 w-4 text-blue-500" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

