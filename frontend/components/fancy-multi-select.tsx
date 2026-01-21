"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

export type MultiSelectOption = Record<"value" | "label", string>;

export type FancyMultiSelectProps = {
  options: MultiSelectOption[];
  value: MultiSelectOption[];
  onChange: (value: MultiSelectOption[]) => void;
  placeholder?: string;
  allowCreate?: boolean;
  disabled?: boolean;
};

const createOption = (label: string): MultiSelectOption => ({
  label,
  value: label.toLowerCase().replace(/\s+/g, "-"),
});

export function FancyMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Add items...",
  allowCreate = true,
  disabled = false,
}: FancyMultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback(
    (option: MultiSelectOption) => {
      onChange(value.filter((item) => item.value !== option.value));
    },
    [onChange, value]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        if (input.value === "") {
          onChange(value.slice(0, -1));
        }
      }

      if (event.key === "Escape") {
        setOpen(false);
        input.blur();
      }
    },
    [onChange, value]
  );

  const selectables = options.filter(
    (option) => !value.some((selected) => selected.value === option.value)
  );

  const normalizedInput = inputValue.trim();
  const canCreate =
    allowCreate &&
    normalizedInput.length > 0 &&
    !options.some(
      (option) => option.label.toLowerCase() === normalizedInput.toLowerCase()
    ) &&
    !value.some(
      (option) => option.label.toLowerCase() === normalizedInput.toLowerCase()
    );

  return (
    <div
      ref={containerRef}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as HTMLElement | null;
        if (!nextTarget || !containerRef.current?.contains(nextTarget)) {
          setOpen(false);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <Command className="overflow-visible bg-transparent">
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex flex-wrap gap-1">
            {value.map((option, index) => (
              <Badge key={`${option.value}-${index}`} variant="secondary">
                {option.label}
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleUnselect(option);
                    }
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={() => handleUnselect(option)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={(nextValue) => {
                setInputValue(nextValue);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="relative mt-2">
          <CommandList>
            {open && (selectables.length > 0 || canCreate) ? (
              <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandGroup className="h-full max-h-64 overflow-auto">
                  {selectables.map((option, index) => (
                    <CommandItem
                      key={`${option.value}-${index}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onSelect={() => {
                        setInputValue("");
                        onChange([...value, option]);
                        inputRef.current?.focus();
                      }}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                  {canCreate ? (
                    <CommandItem
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onSelect={() => {
                        const newOption = createOption(normalizedInput);
                        setInputValue("");
                        onChange([...value, newOption]);
                        inputRef.current?.focus();
                      }}
                      className="cursor-pointer"
                    >
                      Add "{normalizedInput}"
                    </CommandItem>
                  ) : null}
                </CommandGroup>
              </div>
            ) : null}
          </CommandList>
        </div>
      </Command>
    </div>
  );
}
