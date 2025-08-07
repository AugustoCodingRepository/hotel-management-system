const express = require('express')
const cors = require('cors')
const net = require('net')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Endpoint per ricevere richieste di stampa da Vercel
app.post('/print', async (req, res) => {
  try {
    const { printerIp, content, tableNumber, timestamp } = req.body
    
    console.log(`🖨️ Ricevuta richiesta di stampa per tavolo ${tableNumber}`)
    console.log(`📡 IP Stampante: ${printerIp}`)
    console.log(`⏰ Timestamp: ${timestamp}`)
    
    // Test connessione alla stampante
    const isConnected = await testPrinterConnection(printerIp, 9100)
    
    if (!isConnected) {
      throw new Error(`Stampante non raggiungibile su ${printerIp}:9100`)
    }
    
    // Invia il contenuto alla stampante
    await sendToPrinter(printerIp, 9100, content)
    
    // Log della stampa
    logPrintJob(tableNumber, printerIp, timestamp)
    
    console.log("✅ Stampa completata con successo")
    
    res.json({
      success: true,
      message: `Stampa completata per tavolo ${tableNumber}`,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Errore stampa:", error.message)
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Test connessione stampante
function testPrinterConnection(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    
    const timer = setTimeout(() => {
      socket.destroy()
      resolve(false)
    }, timeout)

    socket.connect(port, host, () => {
      clearTimeout(timer)
      socket.destroy()
      resolve(true)
    })

    socket.on('error', () => {
      clearTimeout(timer)
      socket.destroy()
      resolve(false)
    })
  })
}

// Invia dati alla stampante
function sendToPrinter(host, port, data) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    
    socket.connect(port, host, () => {
      socket.write(data, 'binary')
      socket.end()
    })

    socket.on('close', () => {
      resolve()
    })

    socket.on('error', (error) => {
      reject(error)
    })
  })
}

// Log delle stampe
function logPrintJob(tableNumber, printerIp, timestamp) {
  const logEntry = {
    tableNumber,
    printerIp,
    timestamp,
    serverTimestamp: new Date().toISOString()
  }
  
  const logFile = path.join(__dirname, 'print-log.json')
  
  let logs = []
  if (fs.existsSync(logFile)) {
    try {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf8'))
    } catch (e) {
      logs = []
    }
  }
  
  logs.push(logEntry)
  
  // Mantieni solo gli ultimi 1000 log
  if (logs.length > 1000) {
    logs = logs.slice(-1000)
  }
  
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2))
}

// Endpoint per verificare lo stato del server
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Endpoint per vedere i log di stampa
app.get('/logs', (req, res) => {
  const logFile = path.join(__dirname, 'print-log.json')
  
  if (fs.existsSync(logFile)) {
    try {
      const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'))
      res.json(logs.slice(-50)) // Ultimi 50 log
    } catch (e) {
      res.json([])
    }
  } else {
    res.json([])
  }
})

// Avvia il server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server di stampa locale avviato su porta ${PORT}`)
  console.log(`📡 Endpoint: http://localhost:${PORT}/print`)
  console.log(`📊 Status: http://localhost:${PORT}/status`)
  console.log(`📋 Logs: http://localhost:${PORT}/logs`)
  console.log(`\n🔧 Per usarlo da Vercel, configura l'URL: http://TUO_IP:${PORT}`)
})
