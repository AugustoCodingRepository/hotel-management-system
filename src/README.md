# Hotel Management System

Sistema di gestione hotel con:
- Gestione camere e conti
- Gestione sala ristorante
- Inventario prodotti
- Stampa conti
- Archivio incassi

## Deploy su Vercel

1. Fork questo repository su GitHub
2. Connetti il repository a Vercel
3. Aggiungi la variabile d'ambiente `MONGODB_URI` su Vercel
4. Deploy automatico!

## Configurazione MongoDB Atlas

1. Crea account gratuito su MongoDB Atlas
2. Crea cluster M0 (gratuito)
3. Ottieni connection string
4. Aggiungi come variabile d'ambiente su Vercel

## Utilizzo Locale

\`\`\`bash
npm install
cp .env.example .env.local
# Modifica .env.local con i tuoi dati MongoDB
npm run dev
\`\`\`

Apri [http://localhost:3000](http://localhost:3000)
