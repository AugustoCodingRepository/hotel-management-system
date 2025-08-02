"use client"

interface RoomDetailsProps {
  roomNumber: number
}

export function RoomDetails({ roomNumber }: RoomDetailsProps) {
  // Mock data for the selected room
  const roomData = {
    customer: "Joe",
    adults: 2,
    children: 0,
    checkIn: "22/07/2025",
    checkOut: "25/07/2025",
    nights: 3,
    services: [
      { date: "22/07/2025", description: "Camera", amount: "74.00" },
      { date: "23/07/2025", description: "Camera", amount: "74.00" },
      { date: "24/07/2025", description: "Minibar", amount: "15.00" },
    ],
    extras: "",
    transfer: "",
    notes: "",
    advancePayment: "0.00",
    total: "76.00",
    cityTax: "6.00",
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-light text-gray-600">ROOM {roomNumber}</h2>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold italic">Il Nido</h1>
            <p className="text-sm text-gray-600">Hotel Sorrento ★★★</p>
          </div>
        </div>

        {/* Guest Information */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="space-y-2">
            <div className="flex">
              <span className="w-20 text-sm font-medium text-blue-600">Customer:</span>
              <span className="text-sm">{roomData.customer}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-sm font-medium text-blue-600">Adults:</span>
              <span className="text-sm">{roomData.adults}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-sm font-medium text-blue-600">Children:</span>
              <span className="text-sm">{roomData.children}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex">
              <span className="w-20 text-sm font-medium">Check-in:</span>
              <span className="text-sm">{roomData.checkIn}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-sm font-medium">Check-out:</span>
              <span className="text-sm">{roomData.checkOut}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-sm font-medium">Nights:</span>
              <span className="text-sm">{roomData.nights}</span>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-xs font-medium">22/07/2025</th>
                <th className="border border-gray-300 p-2 text-xs font-medium">23/07/2025</th>
                <th className="border border-gray-300 p-2 text-xs font-medium">24/07/2025</th>
                <th className="border border-gray-300 p-2 text-xs font-medium">25/07/2025</th>
                <th className="border border-gray-300 p-2 text-xs font-medium">26/07/2025</th>
                <th className="border border-gray-300 p-2 text-xs font-medium">27/07/2025</th>
                <th className="border border-gray-300 p-2 text-xs font-medium">28/07/2025</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-xs font-medium bg-gray-50">ROOM</td>
                <td className="border border-gray-300 p-2 text-xs">PREZZO</td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-xs">Camera</td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-xs">Colazione</td>
                <td className="border border-gray-300 p-2 text-xs">74.00</td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-xs">Bar</td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-xs">Minibar</td>
                <td className="border border-gray-300 p-2 text-xs">15.00</td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-xs">Servizi per day</td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
                <td className="border border-gray-300 p-2 text-xs"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Extras</label>
              <textarea className="w-full h-16 p-2 border border-gray-300 rounded text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Transfer</label>
              <textarea className="w-full h-16 p-2 border border-gray-300 rounded text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Notes</label>
              <textarea className="w-full h-20 p-2 border border-gray-300 rounded text-xs" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Advance payment</span>
              <span className="text-sm">0.00</span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span className="text-sm">TOTAL</span>
              <span className="text-sm">76.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">City tax</span>
              <span className="text-sm">6.00</span>
            </div>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-600">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-medium">Hotel "Il Nido" Restaurant</p>
              <p>Via Nastro Verde 62 | Sorrento (80067)</p>
              <p className="font-medium">Website: ilnido.it</p>
            </div>
            <div>
              <p>
                <span className="font-medium">Fax:</span> +39 081 807 3304
              </p>
              <p>
                <span className="font-medium">Email:</span> info@ilnido.it
              </p>
              <p>
                <span className="font-medium">Phone:</span> +39 081 878 2766
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
