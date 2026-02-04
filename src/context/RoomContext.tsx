import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { toast } from "sonner"

interface RoomContextType {
    currentRoomId: string | null
    setCurrentRoomId: (id: string | null) => void
    roomLink: string
    copyRoomLink: (roomId?: string) => void
}

const RoomContext = createContext<RoomContextType | null>(null)

export function RoomProvider({ children }: { children: ReactNode }) {
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)

    const roomLink = currentRoomId ? createRoomLink(currentRoomId) : ""

    const copyRoomLink = useCallback((roomId?: string) => {
        const linkToCopy = roomId ? createRoomLink(roomId) : roomLink
        if (linkToCopy) {
            navigator.clipboard.writeText(linkToCopy)
            toast("Room link copied to clipboard!")
        }
    }, [roomLink])

    return (
        <RoomContext.Provider value={{ currentRoomId, setCurrentRoomId, roomLink, copyRoomLink }}>
            {children}
        </RoomContext.Provider>
    )
}
function createRoomLink(roomId: string): string {
    return `${window.location.origin}/rooms/${roomId}`
}

export function useRoom() {
    const context = useContext(RoomContext)
    if (!context) {
        throw new Error("useRoom must be used within a RoomProvider")
    }
    return context
}
