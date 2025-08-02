"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { X } from "lucide-react"

interface Category {
  _id: string
  name: string
}

interface AddProductDialogProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
  categories: Category[]
}

export function AddProductDialog({ isOpen, onClose, onProductAdded, categories }: AddProductDialogProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) {
      newErrors.name = "Il nome del prodotto è obbligatorio"
    }

    if (!price.trim()) {
      newErrors.price = "Il prezzo è obbligatorio"
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = "Il prezzo deve essere un numero positivo"
    }

    if (!categoryId) {
      newErrors.categoryId = "La categoria è obbligatoria"
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
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          price: Number.parseFloat(price),
          categoryId,
        }),
      })

      if (response.ok) {
        resetForm()
        onProductAdded()
        onClose()
      } else {
        const data = await response.json()
        setErrors({ general: data.error || "Errore nella creazione del prodotto" })
      }
    } catch (error) {
      setErrors({ general: "Errore di connessione" })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setPrice("")
    setCategoryId("")
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
            Nuovo Prodotto
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Prodotto</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Inserisci il nome del prodotto..."
              disabled={isLoading}
              className="mt-1"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoading}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleziona una categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>}
          </div>

          <div>
            <Label htmlFor="price">Prezzo (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
              className="mt-1"
            />
            {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
          </div>

          {errors.general && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.general}</div>}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creazione..." : "Crea Prodotto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
