'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { searchAirports, type Airport } from '@/lib/airports-data'

type Props = {
  value: string                        // IATA code stored in form state
  onChange: (iata: string) => void     // called with the 3-letter IATA code
  placeholder?: string
  required?: boolean
  className?: string
  id?: string
}

export default function AirportInput({ value, onChange, placeholder = 'LHR', required, className, id }: Props) {
  const [query, setQuery] = useState(value)       // what's typed in the box
  const [results, setResults] = useState<Airport[]>([])
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // When the parent resets the value (e.g. form clear), sync the display text
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInput = useCallback((raw: string) => {
    const upper = raw.toUpperCase()
    setQuery(upper)
    setHighlighted(0)

    if (raw.length < 2) {
      setResults([])
      setOpen(false)
      // If user clears the field, clear the stored IATA
      if (!raw) onChange('')
      return
    }

    const matches = searchAirports(raw)
    setResults(matches)
    setOpen(matches.length > 0)
  }, [onChange])

  function select(airport: Airport) {
    setQuery(airport.iata)
    onChange(airport.iata)
    setOpen(false)
    setResults([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[highlighted]) select(results[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function handleBlur() {
    // Small delay so a click on a result fires before we close
    setTimeout(() => {
      setOpen(false)
      // If what's typed is a valid 3-letter IATA code, accept it as-is
      if (query.length === 3) {
        onChange(query)
      }
    }, 150)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        required={required}
        value={query}
        onChange={e => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={className ?? 'w-full h-12 px-4 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base font-mono uppercase'}
      />

      {open && results.length > 0 && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {results.map((airport, i) => (
            <button
              key={airport.iata}
              type="button"
              onMouseDown={() => select(airport)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === highlighted ? 'bg-primary/10' : 'hover:bg-muted'} ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <span className="font-mono text-[15px] font-bold text-primary w-10 shrink-0">{airport.iata}</span>
              <span className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">{airport.city}</span>
                <span className="text-xs text-muted-foreground truncate block">{airport.name} · {airport.country}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
