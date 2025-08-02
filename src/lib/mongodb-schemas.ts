export interface RestaurantTable {
  _id?: string
  tableNumber: number
  assignedRoom: number // 0 se non assegnata nessuna camera
  orderItems: OrderItem[]
  status: "occupato" | "disponibile"
  orderTotal: number
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  productName: string
  categoryName: string
  quantity: number
  unitPrice: number
  totalPrice: number // quantity * unitPrice
  addedAt: Date
}

export interface DailyRevenue {
  _id?: string
  date: string // formato "DD_MM_YYYY"
  collectionName: string // "Incassi_DD_MM_YYYY"
  soldItems: SoldItem[]
  totalRevenue: number
  createdAt: Date
  updatedAt: Date
}

export interface SoldItem {
  productId: string
  productName: string
  categoryName: string
  quantity: number
  unitPrice: number
  totalRevenue: number // quantity * unitPrice
  soldAt: Date
  tableNumber: number
}

export interface Category {
  _id?: string
  name: string
  createdAt: Date
}

export interface Product {
  _id?: string
  name: string
  price: number
  categoryId: string
  categoryName?: string
  createdAt: Date
}

export interface RoomAccount {
  _id?: string
  roomNumber: number
  customer: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  services: {
    camera: Record<string, { quantity: number; price: number }>
    bar: Record<string, { quantity: number; price: number }>
    ristorante: Record<string, { quantity: number; price: number }>
  }
  notes: string
  createdAt: Date
  updatedAt: Date
}
