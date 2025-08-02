"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("useSelect must be used within a Select")
  }
  return context
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Select({ value = "", onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: onValueChange || (() => {}),
        open,
        onOpenChange: setOpen,
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const { open, onOpenChange } = useSelect()

  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={() => onOpenChange(!open)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

interface SelectValueProps {
  placeholder?: string
  children?: React.ReactNode
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  const { value } = useSelect()

  if (children) {
    return <>{children}</>
  }

  return <span>{value || placeholder}</span>
}

interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

export function SelectContent({ className, children }: SelectContentProps) {
  const { open, onOpenChange } = useSelect()
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
        className,
      )}
    >
      {children}
    </div>
  )
}

interface SelectItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function SelectItem({ value, className, children }: SelectItemProps) {
  const { value: selectedValue, onValueChange, onOpenChange } = useSelect()
  const isSelected = selectedValue === value

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className,
      )}
      onClick={() => {
        onValueChange(value)
        onOpenChange(false)
      }}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}
