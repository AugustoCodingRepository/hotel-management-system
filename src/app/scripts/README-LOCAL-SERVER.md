# Server Locale per Stampa

Questo server locale permette di stampare da Vercel aggirando le limitazioni di rete.

## Setup

1. **Installa Node.js** sul computer nella stessa rete della stampante

2. **Copia i file del server locale:**
   \`\`\`bash
   mkdir local-print-server
   cd local-print-server
   # Copia package.json e local-print-server.js qui
   \`\`\`

3. **Installa le dipendenze:**
   \`\`\`bash
   npm install
   \`\`\`

4. **Avvia il server:**
   \`\`\`bash
   npm start
   \`\`\`

5. **Configura l'app Vercel:**
   - Trova l'IP del tuo PC: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
   - Nell'app, imposta l'URL: `http://TUO_IP:3001`

## Come Funziona

\`\`\`
Vercel App → HTTP Request → Server Locale → Stampante
\`\`\`

1. L'utente clicca "Stampa" su Vercel
2. Vercel invia i dati al server locale via HTTP
3. Il server locale stampa sulla stampante
4. Il server risponde a Vercel con il risultato

## Endpoints

- `POST /print` - Riceve richieste di stampa
- `GET /status` - Verifica stato del server
- `GET /logs` - Visualizza log delle stampe

## Vantaggi

✅ Rimani su Vercel  
✅ Stampa funziona perfettamente  
✅ Log delle stampe  
✅ Gestione errori  
✅ Test di connessione  

## Sicurezza

Il server locale accetta solo richieste di stampa e non ha accesso ai dati sensibili dell'app.
