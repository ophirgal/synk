import { useState, useCallback } from "react"
import { toast } from "sonner"

interface RoomContext {
    currentRoomId: string | null
    setCurrentRoomId: (id: string | null) => void
    roomLink: string
    copyRoomLink: (roomId?: string) => void
}

function createRoomLink(roomId: string): string {
    return `${window.location.origin}/rooms/${roomId}`
}

export function useRoom(): RoomContext {
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
    const roomLink = currentRoomId ? createRoomLink(currentRoomId) : ""

    const copyRoomLink = useCallback((roomId?: string) => {
        const linkToCopy = roomId ? createRoomLink(roomId) : roomLink
        if (linkToCopy) {
            navigator.clipboard.writeText(linkToCopy)
            toast("Room link copied to clipboard!")
        }
    }, [roomLink])

    return { currentRoomId, setCurrentRoomId, roomLink, copyRoomLink }
}