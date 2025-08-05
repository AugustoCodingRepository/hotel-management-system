import { RoomsInitializer } from "@/app/components/rooms-initializer"

export default function SetupRoomsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Camere Hotel</h1>
          <p className="text-gray-600">Inizializza solo le camere senza toccare prodotti e inventario della sala</p>
        </div>

        <RoomsInitializer />

        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Torna alla Home 
          </a>
        </div>
      </div>
    </div>
  )
}
