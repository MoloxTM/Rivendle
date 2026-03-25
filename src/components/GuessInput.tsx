"use client";

import { useState, useRef, useEffect } from "react";

interface CharacterOption {
  id: string;
  name: string;
}

interface GuessInputProps {
  characters: CharacterOption[];
  usedIds: Set<string>;
  onGuess: (id: string) => void;
  disabled: boolean;
}

export default function GuessInput({
  characters,
  usedIds,
  onGuess,
  disabled,
}: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = characters.filter(
    (c) =>
      !usedIds.has(c.id) &&
      c.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleSelect(id: string) {
    onGuess(id);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || filtered.length === 0) {
      if (e.key === "Enter" && filtered.length === 1) {
        handleSelect(filtered[0].id);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].id);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(e.target.value.length > 0);
        }}
        onFocus={() => query.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Bravo ! Reviens demain" : "Deviner un personnage..."}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-surface px-4 py-3 text-text placeholder-text-dim outline-none backdrop-blur-md transition-colors focus:border-gold disabled:opacity-50"
      />
      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-white/10 bg-surface shadow-lg backdrop-blur-md"
        >
          {filtered.slice(0, 10).map((c, i) => (
            <li
              key={c.id}
              onMouseDown={() => handleSelect(c.id)}
              className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-gold text-background"
                  : "text-text hover:bg-surface-light"
              }`}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
