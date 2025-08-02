-- MongoDB Collection: room_accounts
-- Struttura basata esattamente sui campi del conto camera

{
  "_id": ObjectId,
  "roomNumber": 107,
  "accountId": "ACC_107_20250127_001", // Unique identifier
  
  // === GUEST INFORMATION ===
  "customer": "Joe Smith",
  "adults": 2,
  "children": 0,
  
  // === STAY DETAILS ===
  "checkIn": "22/07/2025", // Italian format DD/MM/YYYY
  "checkOut": "25/07/2025",
  "nights": 3,
  
  // === SERVICES TABLE DATA ===
  // Ogni servizio ha un oggetto con date come chiavi
  "services": {
    "camera": {
      "22/07/2025": "74.00",
      "23/07/2025": "74.00", 
      "24/07/2025": "74.00"
    },
    "colazione": {
      "23/07/2025": "12.00"
    },
    "pranzo": {},
    "cena": {
      "23/07/2025": "35.00"
    },
    "minibar": {
      "24/07/2025": "15.00"
    },
    "transfer": {}
  },
  
  // === MINIBAR DESCRIPTIONS ===
  // Descrizioni separate per il minibar
  "minibarDescriptions": {
    "24/07/2025": "Coca Cola, Acqua"
  },
  
  // === EXTRAS & TRANSFER ===
  "extras": 0.00,
  "transfer": 0.00,
  "advancePayment": 0.00,
  
  // === NOTES ===
  "notes": "Cliente VIP - richiede camera silenziosa",
  
  // === CALCULATED TOTALS ===
  // Calcolati automaticamente ma salvati per performance
  "calculations": {
    "roomTotal": 222.00,
    "servicesTotal": 62.00,
    "extrasTotal": 0.00,
    "transferTotal": 0.00,
    "subtotal": 284.00,
    "finalTotal": 284.00,
    "cityTax": 12.00
  },
  
  // === TABLE DATES ===
  // Date generate automaticamente dal check-in
  "tableDates": [
    "22/07/2025", "23/07/2025", "24/07/2025", 
    "25/07/2025", "26/07/2025", "27/07/2025", "28/07/2025"
  ],
  
  // === STATUS & METADATA ===
  "status": "active", // active, checked_out, cancelled
  "createdAt": ISODate("2025-01-27T10:30:00Z"),
  "updatedAt": ISODate("2025-01-27T14:45:00Z"),
  "lastModified": ISODate("2025-01-27T14:45:00Z")
}
