"use client";

import * as d from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// This is a workaround to get all icon names from lucide-react
const lucideIcons = d as unknown as { [key: string]: React.FC<any> };
const iconNames = Object.keys(lucideIcons).filter(key => key !== 'createLucideIcon' && key !== 'icons' && typeof lucideIcons[key] !== 'function');

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);

    const Icon = value ? (lucideIcons[value] as React.FC<any>) : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        {value || "Select icon..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search icon..." />
                    <CommandList>
                        <CommandEmpty>No icon found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                            {iconNames.map((iconName) => {
                                const LoopIcon = lucideIcons[iconName] as React.FC<any>;
                                return (
                                    <CommandItem
                                        key={iconName}
                                        value={iconName}
                                        onSelect={(currentValue) => {
                                            onChange(currentValue === value ? "" : currentValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === iconName ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <LoopIcon className="mr-2 h-4 w-4" />
                                        {iconName}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
