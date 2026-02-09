import { CURRENT_LANGUAGE_SEARCH_PARAM } from "@/constants/constants"
import { useState, useCallback } from "react"
import { useSearchParams } from "react-router"
import { toast } from "sonner"

interface RoomContext {
    currentRoomId: string | null
    setCurrentRoomId: (id: string | null) => void
    roomLink: string
    copyRoomLink: (roomId?: string) => void
}

function createRoomLink(roomId: string, currentLanguage?: string): string {
    const searchParams = new URLSearchParams();
    if (currentLanguage) {
        searchParams.set(CURRENT_LANGUAGE_SEARCH_PARAM, currentLanguage)
    }
    const queryString = searchParams.size > 0 ? `?${searchParams.toString()}` : ""
    return `${window.location.origin}/rooms/${roomId}${queryString}`
}

export function useRoom(): RoomContext {
    const [searchParams, _] = useSearchParams();
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)

    const currentLanguageParam = searchParams.get(CURRENT_LANGUAGE_SEARCH_PARAM) ?? undefined
    const roomLink = currentRoomId ? createRoomLink(currentRoomId, currentLanguageParam) : ""

    const copyRoomLink = useCallback((roomId?: string, currentLanguage?: string) => {
        const linkToCopy = roomId ? createRoomLink(roomId, currentLanguage) : roomLink
        if (linkToCopy) {
            navigator.clipboard.writeText(linkToCopy)
            toast("Room link copied to clipboard!")
        }
    }, [roomLink])

    return { currentRoomId, setCurrentRoomId, roomLink, copyRoomLink }
}