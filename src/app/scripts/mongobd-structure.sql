-- MongoDB Database Structure for Hotel Management System
-- Database: hotel_management

-- Collection: rooms
-- Stores basic room information and current status
{
  "_id": ObjectId,
  "number": 101,
  "floor": 1,
  "type": "standard", // standard, deluxe, suite
  "capacity": {
    "adults": 2,
    "children": 1,
    "total": 3
  },
  "amenities": ["minibar", "tv", "wifi", "ac"],
  "status": "available", // available, occupied, maintenance, cleaning
  "isActive": true,
  "createdAt": ISODate,
  "updatedAt": ISODate
}

-- Collection: room_accounts
-- Stores all guest accounts and billing information
{
  "_id": ObjectId,
  "roomNumber": 107,
  "accountId": "ACC_107_20250127_001", // Unique account identifier
  "guest": {
    "customer": "Joe Smith",
    "adults": 2,
    "children": 0,
    "totalGuests": 2,
    "nationality": "Italian",
    "documentType": "passport", // passport, id_card
    "documentNumber": "AB123456",
    "phone": "+39 123 456 7890",
    "email": "joe.smith@email.com"
  },
  "stay": {
    "checkIn": "2025-07-22",
    "checkOut": "2025-07-25", 
    "nights": 3,
    "roomRate": 74.00, // Rate per night
    "status": "checked_in" // reservation, checked_in, checked_out, cancelled
  },
  "services": {
    "camera": {
      "2025-07-23": { "amount": 74.00, "description": "Camera standard" },
      "2025-07-24": { "amount": 74.00, "description": "Camera standard" },
      "2025-07-25": { "amount": 74.00, "description": "Camera standard" }
    },
    "lunch": {
      "2025-07-23": { "amount": 25.00, "description": "Menu fisso pranzo" }
    },
    "dinner": {
      "2025-07-23": { "amount": 35.00, "description": "Menu fisso cena" }
    },
    "minibar": {
      "2025-07-24": { 
        "amount": 15.00, 
        "description": "Coca Cola, Acqua",
        "items": [
          { "item": "Coca Cola", "quantity": 2, "price": 3.50 },
          { "item": "Acqua", "quantity": 4, "price": 2.00 }
        ]
      }
    },
    "bar": {
      "2025-07-23": { "amount": 18.00, "description": "Aperitivo" }
    },
    "custom1": {
      "2025-07-24": { "amount": 10.00, "description": "Servizio personalizzato 1" }
    },
    "custom2": {
      "2025-07-25": { "amount": 8.00, "description": "Servizio personalizzato 2" }
    },
    "transfer": {}
  },
  "serviceLabels": {
    "custom1": "Spa",
    "custom2": "Escursioni"
  },
  "calculations": {
    "roomTotal": 222.00,
    "servicesTotal": 111.00, // lunch + dinner + minibar + bar + custom1 + custom2
    "extrasAmount": 0.00,
    "transferAmount": 0.00,
    "subtotal": 333.00,
    "advancePayment": 0.00,
    "finalTotal": 333.00,
    "cityTax": {
      "ratePerPersonPerNight": 2.00,
      "totalAmount": 12.00, // 2 adults × 3 nights × 2€
      "exemptions": []
    }
  },
  "payments": [
    {
      "date": "2025-07-22",
      "amount": 100.00,
      "method": "cash", // cash, card, bank_transfer
      "reference": "ADV001",
      "type": "advance", // advance, partial, final
      "notes": "Anticipo check-in"
    }
  ],
  "extras": {
    "amount": 0.00,
    "description": "",
    "items": []
  },
  "transfer": {
    "amount": 0.00,
    "description": "",
    "pickup": {
      "location": "",
      "time": "",
      "date": ""
    },
    "dropoff": {
      "location": "",
      "time": "",
      "date": ""
    }
  },
  "notes": "Cliente VIP - richiede camera silenziosa",
  "printHistory": [
    {
      "date": "2025-07-22T14:30:00Z",
      "type": "account", // account, receipt, invoice
      "copies": 2,
      "printer": "HP LaserJet Pro",
      "user": "reception_user"
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "createdBy": "user_id",
  "lastModifiedBy": "user_id"
}

-- Collection: hotel_settings
-- Global hotel configuration
{
  "_id": ObjectId,
  "hotel": {
    "name": "Il Nido",
    "fullName": "Hotel Il Nido Restaurant",
    "address": "Via Nastro Verde 82",
    "city": "Sorrento",
    "postalCode": "80067",
    "country": "Italy",
    "phone": "+39 081 878 2706",
    "fax": "+39 081 807 3304",
    "email": "info@ilnido.it",
    "website": "ilnido.it",
    "stars": 3,
    "taxId": "IT12345678901"
  },
  "rates": {
    "cityTax": {
      "adultRate": 2.00,
      "childRate": 0.00,
      "maxNights": 7,
      "exemptAges": [0, 1, 2] // Children under 3 are exempt
    },
    "roomRates": {
      "standard": 74.00,
      "deluxe": 95.00,
      "suite": 150.00
    },
    "serviceRates": {
      "lunch": 25.00,
      "dinner": 35.00,
      "bar": 15.00
    }
  },
  "printing": {
    "defaultPrinter": "HP LaserJet Pro",
    "defaultCopies": 2,
    "paperSize": "A4"
  },
  "createdAt": ISODate,
  "updatedAt": ISODate
}

-- Collection: users
-- System users (reception, admin, etc.)
{
  "_id": ObjectId,
  "username": "reception1",
  "email": "reception@ilnido.it",
  "role": "reception", // admin, reception, manager
  "permissions": [
    "view_rooms",
    "edit_accounts", 
    "print_documents",
    "manage_checkin",
    "manage_checkout"
  ],
  "isActive": true,
  "lastLogin": ISODate,
  "createdAt": ISODate,
  "updatedAt": ISODate
}

-- Collection: audit_log
-- Track all changes for accountability
{
  "_id": ObjectId,
  "action": "account_updated", // account_created, account_updated, payment_added, etc.
  "entityType": "room_account",
  "entityId": "ACC_107_20250127_001",
  "roomNumber": 107,
  "userId": "user_id",
  "username": "reception1",
  "changes": {
    "field": "services.minibar.2025-07-24.amount",
    "oldValue": 10.00,
    "newValue": 15.00
  },
  "timestamp": ISODate,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
