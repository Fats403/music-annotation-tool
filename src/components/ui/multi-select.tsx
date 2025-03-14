"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  allowCustomValues?: boolean;
  category?: 'instruments' | 'aspects' | 'genres';
  onOptionsChange?: (newOptions: string[]) => void;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  className,
  allowCustomValues = false,
  category,
  onOptionsChange,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [availableOptions, setAvailableOptions] = React.useState<string[]>(options);

  // Add custom value to options if it doesn't exist
  const handleAddCustomValue = async () => {
    if (!inputValue.trim() || availableOptions.includes(inputValue)) return;
    
    const newValue = inputValue.trim();
    const newOptions = [...availableOptions, newValue];
    
    // Update local state
    setAvailableOptions(newOptions);
    onChange([...selected, newValue]);
    setInputValue("");
    
    // Update Firestore if category is provided
    if (category) {
      try {
        // Call the API route instead of directly using Firebase
        const response = await fetch('/api/taxonomy/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            category, 
            values: [newValue] 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update taxonomy');
        }
        
        // Notify parent component about the change
        if (onOptionsChange) {
          onOptionsChange(newOptions);
        }
      } catch (error) {
        console.error(`Error updating ${category} taxonomy:`, error);
      }
    }
  };

  // Toggle selection of an item
  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    
    onChange(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10 px-3 py-2", className)}
        >
          {selected.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap">
              {selected.length > 2 ? (
                <Badge variant="secondary" className="rounded-md px-2 py-1 text-xs font-medium">
                  {selected.length} selected
                </Badge>
              ) : (
                selected.map(item => (
                  <Badge key={item} variant="secondary" className="rounded-md px-2 py-1 text-xs font-medium">
                    {item}
                  </Badge>
                ))
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 shadow-md border-border" align="start">
        <Command className="rounded-lg">
          <CommandInput 
            placeholder="Search..." 
            value={inputValue}
            onValueChange={setInputValue}
            className="border-none focus:ring-0"
          />
          <CommandList className="max-h-[200px] overflow-auto">
            <CommandEmpty className="py-3 px-4 text-sm text-muted-foreground">
              {emptyMessage}
              {allowCustomValues && inputValue && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-xs font-medium"
                  onClick={handleAddCustomValue}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add &quot;{inputValue}&quot;
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup className="py-1">
              {availableOptions
                .filter(option => 
                  option.toLowerCase().includes(inputValue.toLowerCase())
                )
                .sort((a, b) => {
                  // Sort selected items first
                  const aSelected = selected.includes(a);
                  const bSelected = selected.includes(b);
                  if (aSelected && !bSelected) return -1;
                  if (!aSelected && bSelected) return 1;
                  return a.localeCompare(b);
                })
                .map(option => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                    className="px-4 py-2 cursor-pointer aria-selected:bg-accent/50"
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <div className={cn(
                        "flex-shrink-0 border rounded-sm w-4 h-4 flex items-center justify-center transition-colors",
                        selected.includes(option) ? "bg-primary border-primary" : "border-input"
                      )}>
                        {selected.includes(option) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm">{option}</span>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
          {allowCustomValues && (
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add custom value..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomValue();
                    }
                  }}
                  className="h-9 text-sm"
                />
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleAddCustomValue}
                  disabled={!inputValue.trim() || availableOptions.includes(inputValue)}
                  className="h-9 px-2.5"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function SelectedBadges({ 
  selected, 
  onRemove 
}: { 
  selected: string[]; 
  onRemove: (value: string) => void;
}) {
  if (selected.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {selected.map(item => (
        <Badge key={item} variant="secondary" className="rounded-md px-2 py-1 text-xs font-medium">
          {item}
          <button
            className="ml-1.5 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:bg-muted/60 p-0.5"
            onClick={() => onRemove(item)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
} 