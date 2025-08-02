"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { X } from "lucide-react"

interface AddCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onCategoryAdded: () => void
}

export function AddCategoryDialog({ isOpen, onClose, onCategoryAdded }: AddCategoryDialogProps) {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) {
      newErrors.name = "Il nome della categoria è obbligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      })

      if (response.ok) {
        resetForm()
        onCategoryAdded()
        onClose()
      } else {
        const data = await response.json()
        setErrors({ general: data.error || "Errore nella creazione della categoria" })
      }
    } catch (error) {
      setErrors({ general: "Errore di connessione" })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Nuova Categoria
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Categoria</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Inserisci il nome della categoria..."
              disabled={isLoading}
              className="mt-1"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          {errors.general && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.general}</div>}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creazione..." : "Crea Categoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
