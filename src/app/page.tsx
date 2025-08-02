"use client"

import { useState, useEffect } from "react"
import { RealTimeClock } from "@/app/components/real-time-clock"
import { SharedSidebar } from "@/app/components/shared-sidebar"
import { CamereContent } from "@/app/components/camere-content"
import { SalaPageWithDB } from "@/app/components/sala-page-with-db"
import { InventoryPage } from "@/app/components/inventory-page"
import { RevenueArchive } from "@/app/components/revenue-archive"

export default function HotelManagementApp() {
  const [activeSection, setActiveSection] = useState("camere")
  const [selectedRoom, setSelectedRoom] = useState(107)
  const [viewingTable, setViewingTable] = useState<number | null>(null)
  const [showInventory, setShowInventory] = useState(false)
  const [showRevenueArchive, setShowRevenueArchive] = useState(false)

  useEffect(() => {
    const handleOpenInventory = () => {
      setShowInventory(true)
    }

    const handleOpenRevenueArchive = () => {
      setShowRevenueArchive(true)
    }

    window.addEventListener("openInventory", handleOpenInventory)
    window.addEventListener("openRevenueArchive", handleOpenRevenueArchive)

    return () => {
      window.removeEventListener("openInventory", handleOpenInventory)
      window.removeEventListener("openRevenueArchive", handleOpenRevenueArchive)
    }
  }, [])

  const handleRoomSelect = (roomNumber: number) => {
    console.log(`🏠 Cambio camera: ${selectedRoom} → ${roomNumber}`)
    setSelectedRoom(roomNumber)

    // Se siamo nella sezione sala e selezioniamo una camera, torniamo alla sezione camere
    if (activeSection === "sala") {
      setActiveSection("camere")
      setViewingTable(null)
    }
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setShowInventory(false)
    setShowRevenueArchive(false)
    // Reset viewing table quando cambiamo sezione
    if (section !== "sala") {
      setViewingTable(null)
    }
  }

  const handleTableSelect = (tableNumber: number | null) => {
    setViewingTable(tableNumber)
  }

  const handleBackToSala = () => {
    setViewingTable(null)
  }

  const handleInventoryClick = () => {
    setShowInventory(true)
  }

  const handleArchivioIncassiClick = () => {
    setShowRevenueArchive(true)
  }

  const handleBackFromInventory = () => {
    setShowInventory(false)
    setActiveSection("sala")
  }

  const handleBackFromRevenueArchive = () => {
    setShowRevenueArchive(false)
    setActiveSection("sala")
  }

  const handleBackToHome = () => {
    setActiveSection("camere")
    setShowInventory(false)
    setShowRevenueArchive(false)
    setViewingTable(null)
  }

  // Se stiamo mostrando l'inventario, mostra solo quello
  if (showInventory) {
    return <InventoryPage onBack={handleBackFromInventory} />
  }

  // Se stiamo mostrando l'archivio incassi, mostra solo quello
  if (showRevenueArchive) {
    return <RevenueArchive onBack={handleBackFromRevenueArchive} />
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case "camere":
        return <CamereContent selectedRoom={selectedRoom} />
      case "sala":
        return (
          <SalaPageWithDB
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onInventoryClick={handleInventoryClick}
            onBackToHome={handleBackToHome}
          />
        )
      default:
        return <CamereContent selectedRoom={selectedRoom} />
    }
  }

  // Per la sezione sala, usa il layout completo della SalaPageWithDB
  if (activeSection === "sala") {
    return (
      <SalaPageWithDB
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onInventoryClick={handleInventoryClick}
        onBackToHome={handleBackToHome}
      />
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar sempre condivisa */}
      <SharedSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
        viewingTable={viewingTable}
        onBackToSala={handleBackToSala}
        onInventoryClick={handleInventoryClick}
        onArchivioIncassiClick={handleArchivioIncassiClick}
      />

      <div className="flex-1 flex flex-col">
        {/* Header sempre presente - solo quando non si visualizza un tavolo */}
        {!viewingTable && (
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">Hotel Il Nido</h1>
              <div className="text-sm text-gray-500">
                Sezione: {activeSection === "camere" ? "Camere" : "Sala"}
                {activeSection === "camere" && <span className="ml-2 text-cyan-600">Camera {selectedRoom}</span>}
              </div>
            </div>
            <RealTimeClock />
          </header>
        )}

        {/* Contenuto principale */}
        <main className="flex-1 bg-gray-100">{renderMainContent()}</main>
      </div>
    </div>
  )
}
