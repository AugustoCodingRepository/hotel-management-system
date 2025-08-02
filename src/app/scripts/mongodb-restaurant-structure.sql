-- MongoDB Restaurant Management Structure
-- Questo script definisce la struttura delle collezioni per la gestione del ristorante

-- =====================================================
-- COLLEZIONE: restaurant_tables
-- Gestisce i tavoli del ristorante con ordini attivi
-- =====================================================

db.restaurant_tables.createIndex({ "tableNumber": 1 }, { unique: true })
db.restaurant_tables.createIndex({ "status": 1 })
db.restaurant_tables.createIndex({ "assignedRoom": 1 })
db.restaurant_tables.createIndex({ "updatedAt": -1 })

-- Esempio di documento restaurant_tables:
{
  "_id": ObjectId("..."),
  "tableNumber": 5,
  "assignedRoom": 107,
  "orderItems": [
    {
      "productId": "prod_1",
      "productName": "Insalata Caprese",
      "categoryName": "Antipasti",
      "quantity": 2,
      "unitPrice": 10.00,
      "totalPrice": 20.00,
      "addedAt": ISODate("2024-01-15T10:30:00Z")
    }
  ],
  "status": "occupato", -- "occupato" | "disponibile"
  "orderTotal": 20.00,
  "createdAt": ISODate("2024-01-15T09:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}

-- =====================================================
-- COLLEZIONE: daily_revenue
-- Archivio incassi giornalieri del ristorante
-- =====================================================

db.daily_revenue.createIndex({ "date": 1 }, { unique: true })
db.daily_revenue.createIndex({ "createdAt": -1 })
db.daily_revenue.createIndex({ "totalRevenue": -1 })

-- Esempio di documento daily_revenue:
{
  "_id": ObjectId("..."),
  "date": "15_01_2024",
  "collectionName": "Incassi_15_01_2024",
  "soldItems": [
    {
      "productId": "prod_1",
      "productName": "Insalata Caprese",
      "categoryName": "Antipasti",
      "quantity": 2,
      "unitPrice": 10.00,
      "totalRevenue": 20.00,
      "soldAt": ISODate("2024-01-15T12:30:00Z"),
      "tableNumber": 5
    }
  ],
  "totalRevenue": 20.00,
  "createdAt": ISODate("2024-01-15T12:30:00Z"),
  "updatedAt": ISODate("2024-01-15T12:30:00Z")
}

-- =====================================================
-- COLLEZIONE: categories (già esistente)
-- Categorie dei prodotti del ristorante
-- =====================================================

db.categories.createIndex({ "name": 1 }, { unique: true })
db.categories.createIndex({ "createdAt": -1 })

-- =====================================================
-- COLLEZIONE: products (già esistente)
-- Prodotti del ristorante con prezzi
-- =====================================================

db.products.createIndex({ "name": 1 })
db.products.createIndex({ "categoryId": 1 })
db.products.createIndex({ "price": 1 })
db.products.createIndex({ "createdAt": -1 })

-- =====================================================
-- VALIDAZIONE DOCUMENTI
-- Regole di validazione per garantire integrità dati
-- =====================================================

-- Validazione per restaurant_tables
db.runCommand({
  "collMod": "restaurant_tables",
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": ["tableNumber", "assignedRoom", "orderItems", "status", "orderTotal"],
      "properties": {
        "tableNumber": {
          "bsonType": "int",
          "minimum": 1,
          "maximum": 100
        },
        "assignedRoom": {
          "bsonType": "int",
          "minimum": 0
        },
        "orderItems": {
          "bsonType": "array",
          "items": {
            "bsonType": "object",
            "required": ["productId", "productName", "categoryName", "quantity", "unitPrice", "totalPrice"],
            "properties": {
              "quantity": { "bsonType": "int", "minimum": 1 },
              "unitPrice": { "bsonType": "double", "minimum": 0 },
              "totalPrice": { "bsonType": "double", "minimum": 0 }
            }
          }
        },
        "status": {
          "enum": ["occupato", "disponibile"]
        },
        "orderTotal": {
          "bsonType": "double",
          "minimum": 0
        }
      }
    }
  }
})

-- Validazione per daily_revenue
db.runCommand({
  "collMod": "daily_revenue",
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": ["date", "collectionName", "soldItems", "totalRevenue"],
      "properties": {
        "date": {
          "bsonType": "string",
          "pattern": "^[0-9]{2}_[0-9]{2}_[0-9]{4}$"
        },
        "soldItems": {
          "bsonType": "array",
          "items": {
            "bsonType": "object",
            "required": ["productId", "productName", "categoryName", "quantity", "unitPrice", "totalRevenue", "tableNumber"],
            "properties": {
              "quantity": { "bsonType": "int", "minimum": 1 },
              "unitPrice": { "bsonType": "double", "minimum": 0 },
              "totalRevenue": { "bsonType": "double", "minimum": 0 },
              "tableNumber": { "bsonType": "int", "minimum": 1 }
            }
          }
        },
        "totalRevenue": {
          "bsonType": "double",
          "minimum": 0
        }
      }
    }
  }
})
