
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
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  className,
  allowCustomValues = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [availableOptions, setAvailableOptions] = React.useState<string[]>(options);

  // Add custom value to options if it doesn't exist
  const handleAddCustomValue = () => {
    if (!inputValue.trim() || availableOptions.includes(inputValue)) return;
    
    setAvailableOptions(prev => [...prev, inputValue]);
    onChange([...selected, inputValue]);
    setInputValue("");
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
          className={cn("w-full justify-between", className)}
        >
          {selected.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {selected.length > 2 ? (
                <Badge variant="secondary" className="rounded-sm">
                  {selected.length} selected
                </Badge>
              ) : (
                selected.map(item => (
                  <Badge key={item} variant="secondary" className="rounded-sm">
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
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {emptyMessage}
              {allowCustomValues && inputValue && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleAddCustomValue}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add &quot;{inputValue}&quot;
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
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
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={cn(
                        "flex-shrink-0 border rounded-sm w-4 h-4 flex items-center justify-center",
                        selected.includes(option) ? "bg-primary border-primary" : "border-input"
                      )}>
                        {selected.includes(option) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
          {allowCustomValues && (
            <div className="p-2 border-t">
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
                />
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleAddCustomValue}
                  disabled={!inputValue.trim() || availableOptions.includes(inputValue)}
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
    <div className="flex flex-wrap gap-1 mt-2">
      {selected.map(item => (
        <Badge key={item} variant="secondary" className="rounded-sm">
          {item}
          <button
            className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-1"
            onClick={() => onRemove(item)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
} 