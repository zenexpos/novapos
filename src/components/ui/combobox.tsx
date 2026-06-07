'use client';


"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User, UserX } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


export interface ComboboxOption {
    value: string;
    label: string;
    subLabel?: string;
    disabled?: boolean;
    subLabelClassName?: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    onSelect: (value: string) => void;
    value: string;
    placeholder: string;
    searchPlaceholder: string;
    notFoundMessage: React.ReactNode;
    onSearchChange?: (search: string) => void;
    id?: string;
    className?: string;
    shouldFilter?: boolean;
}


export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(({ options, onSelect, value, placeholder, searchPlaceholder, notFoundMessage, onSearchChange, id, className, shouldFilter }, ref) => {
  const [open, setOpen] = React.useState(false)
  const selectedOption = React.useMemo(() => options.find(o => o.value === value), [options, value]);
  
  // Si onSearchChange est présent, on désactive le filtrage interne de cmdk par défaut sauf si spécifié autrement
  const isInternalFilteringDisabled = shouldFilter === false || (onSearchChange !== undefined && shouldFilter === undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto py-3 px-6 rounded-2xl bg-black/20 border-none shadow-inner group hover:bg-black/30 transition-all", className)}
        >
            <div className="flex items-center gap-4 overflow-hidden text-left flex-grow">
                {/* Icon */}
                <div className="flex-shrink-0">
                    {selectedOption?.value === 'walk-in' || !selectedOption ? (
                        <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                            <UserX className="h-5 w-5" />
                        </div>
                    ) : (
                        <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-sm">
                            <User className="h-5 w-5" />
                        </div>
                    )}
                </div>
                {/* Text content */}
                <div className="flex-grow truncate">
                  {selectedOption ? (
                    <div className="flex flex-col -space-y-0.5">
                      <p className="font-semibold text-sm truncate tracking-tight">{selectedOption.label}</p>
                      {selectedOption.subLabel && (
                        <p className={cn("text-xs font-semibold truncate opacity-60", selectedOption.subLabelClassName)}>
                            {selectedOption.subLabel}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-bold text-muted-foreground/40 text-sm">{placeholder}</p> 
                  )}
                </div>
            </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-20 group-hover:opacity-10 transition-opacity" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-3xl border-white/5 bg-card/95 backdrop-blur-sm shadow-sm overflow-hidden">
        <Command shouldFilter={!isInternalFilteringDisabled}>
          <CommandInput placeholder={searchPlaceholder} onValueChange={onSearchChange} className="h-14 border-none bg-transparent" />
           <CommandList className="custom-scrollbar">
            <CommandEmpty className="p-4">
                {notFoundMessage}
            </CommandEmpty>
            <CommandGroup className="p-2">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label, option.subLabel || '']}
                  disabled={option.disabled}
                  onSelect={(currentValue) => {
                    // Logic: match by value if possible, cmdk returns value lowercase
                    const found = options.find(o => o.value.toLowerCase() === currentValue.toLowerCase());
                    onSelect(found ? found.value : currentValue);
                    setOpen(false);
                  }}
                  className="rounded-xl p-3 cursor-pointer transition-all aria-selected:bg-primary/10 aria-selected:text-primary mb-1 last:mb-0"
                >
                  <div className="flex items-center w-full gap-3">
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border transition-colors",
                        value === option.value ? "bg-primary border-primary text-primary-foreground" : "bg-muted/20 border-white/5 text-muted-foreground"
                    )}>
                        {value === option.value ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-grow flex flex-col -space-y-0.5">
                        <p className="font-semibold text-sm tracking-tight">{option.label}</p>
                        {option.subLabel && (
                            <p className={cn("text-xs font-semibold tracking-tight", option.subLabelClassName || 'text-muted-foreground opacity-40')}>
                                {option.subLabel}
                            </p>
                        )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
});
Combobox.displayName = "Combobox";
