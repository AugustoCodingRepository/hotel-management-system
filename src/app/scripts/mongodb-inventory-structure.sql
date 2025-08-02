-- MongoDB Database Structure for Inventory System
-- Database: hotel_management

-- Collection: categories
-- Stores product categories with unique names
{
  "_id": ObjectId,
  "name": "Antipasti", // Unique category name
  "createdAt": ISODate,
  "updatedAt": ISODate
}

-- Index for unique category names
db.categories.createIndex({ "name": 1 }, { unique: true })

-- Collection: products
-- Stores products linked to categories
{
  "_id": ObjectId,
  "name": "Insalata Caprese", // Product name
  "categoryId": ObjectId("category_id"), // Reference to category
  "price": 10.00, // Product price
  "createdAt": ISODate,
  "updatedAt": ISODate
}

-- Index for category reference
db.products.createIndex({ "categoryId": 1 })

-- Sample Categories Data
[
  { "name": "Antipasti", "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Primi piatti", "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Secondi piatti", "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Contorni", "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Dessert", "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Bibite", "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Cocktails", "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Caffè e bar", "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Coperto", "createdAt": ISODate(), "updatedAt": ISODate() }
]

-- Sample Products Data
[
  { "name": "Insalata Caprese", "categoryId": ObjectId("antipasti_id"), "price": 10.00, "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Bruschette", "categoryId": ObjectId("antipasti_id"), "price": 8.00, "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Spaghetti Carbonara", "categoryId": ObjectId("primi_id"), "price": 12.00, "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Risotto ai Funghi", "categoryId": ObjectId("primi_id"), "price": 14.00, "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Bistecca alla Griglia", "categoryId": ObjectId("secondi_id"), "price": 18.00, "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Coca Cola", "categoryId": ObjectId("bibite_id"), "price": 3.50, "createdAt": ISODate(), "updatedAt": ISODate() },
  { "name": "Tiramisu", "categoryId": ObjectId("dessert_id"), "price": 6.00, "createdAt": ISODate(), "updatedAt": ISODate() }
]
