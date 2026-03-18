'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomerDashboardView } from '@/lib/types';

interface CustomerSearchComboboxProps {
  customers: CustomerDashboardView[];
  value: string; // selected customer UUID
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CustomerSearchCombobox({
  customers,
  value,
  onChange,
  placeholder = 'Search customer by name or mobile...',
  disabled = false,
}: CustomerSearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive the selected customer object from the value UUID
  const selectedCustomer = customers.find((c) => c.c_id === value) || null;

  // When a customer is selected, show their name in the input
  useEffect(() => {
    if (selectedCustomer && !open) {
      setQuery('');
    }
  }, [selectedCustomer, open]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter customers based on query (name or mobile)
  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.c_name.toLowerCase().includes(query.toLowerCase()) ||
          c.c_mobile.includes(query)
      )
    : customers.slice(0, 50); // show first 50 when no query

  function handleSelect(customer: CustomerDashboardView) {
    onChange(customer.c_id);
    setOpen(false);
    setQuery('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleInputFocus() {
    setOpen(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    // If user starts typing, clear the current selection
    if (value) onChange('');
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input row */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors',
          open && 'ring-2 ring-ring ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

        {/* When a customer is selected and dropdown is closed, show the selected name */}
        {selectedCustomer && !open ? (
          <span className="flex-1 truncate text-foreground">
            {selectedCustomer.c_name}{' '}
            <span className="text-muted-foreground text-xs">({selectedCustomer.c_mobile})</span>
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={selectedCustomer ? `${selectedCustomer.c_name} (${selectedCustomer.c_mobile})` : placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
        )}

        {/* Clear button */}
        {(value || query) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground shrink-0"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Expand button when customer selected */}
        {selectedCustomer && !open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
            className="text-muted-foreground hover:text-foreground shrink-0"
            tabIndex={-1}
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <User className="h-6 w-6" />
                <span>No customers found</span>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.c_id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // keeps focus on input
                  onClick={() => handleSelect(c)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                    c.c_id === value && 'bg-accent/60'
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                    {c.c_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{c.c_name}</span>
                    <span className="text-xs text-muted-foreground">{c.c_mobile}</span>
                  </div>
                  {c.c_id === value && (
                    <Check className="ml-auto h-4 w-4 text-blue-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
          {customers.length > 50 && query.trim() === '' && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              Type to search all {customers.length} customers
            </div>
          )}
        </div>
      )}
    </div>
  );
}
