import { useCallback, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router"
import { toast } from "sonner"
import { Copy, Plus, Menu, Moon, Sun, ArrowLeftRight, ArrowRightLeft } from "lucide-react"

import {
    navLinks,
    LOCAL_VIDEO_ELEMENT_ID,
    SMALL_SCREEN_WIDTH,
} from "@/constants/constants"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet"
import ScratchPanel from "@/components/ScratchPanel/ScratchPanel"
import CodeEditor from "@/components/CodeEditor/CodeEditor"
import LivestreamPlayer from "@/components/LivestreamPlayer/LivestreamPlayer"
import { Button } from "@/components/ui/button"
import { createRoomService } from "@/services/RoomService"
import { useRoom } from "@/hooks/useRoom"
import { CollaborationProvider, useCollaboration } from "@/context/CollaborationContext"
import { useTheme } from "@/context/ThemeContext"
import { Spinner } from "@/components/ui/spinner"
import useWindowSize from "@/hooks/useWindowSize"

import avatarPlaceholder from "@/assets/avatar-placeholder.svg"
import { getRemoteVideoElementId } from "@/lib/utils"

export default function RoomPage() {
    const { width } = useWindowSize()

    return (
        <CollaborationProvider>
            {width >= SMALL_SCREEN_WIDTH ?
                <RoomContent />
                :
                <div className="sm:hidden flex justify-center items-center text-3xl p-5 h-full">
                    <p><span className="font-semibold text-indigo-500 dark:text-indigo-400">[synk]</span> is designed for medium to large screens!
                        <br />Switch to a larger screen to <span className="font-semibold text-indigo-500 dark:text-indigo-400">[synk]</span> up!</p>
                </div>
            }
        </CollaborationProvider>
    );
}

function RoomContent() {
    const isJoinRoomAttemptedRef = useRef<boolean>(false);
    const isCreateRoomAttemptedRef = useRef<boolean>(false);

    const navigate = useNavigate();
    const pathParams = useParams(); // get id path variable from the router!
    const { roomLink, setCurrentRoomId, copyRoomLink } = useRoom();
    const { connectDataChannel, localProfile, remoteProfiles, updateLocalProfile, connectionProvider, connections } = useCollaboration();
    const roomService = createRoomService(connectionProvider);
    const { direction } = useTheme();

    const handleConnectionSuccess = () => {
        toast.success(`A Peer has successfully joined the room.`);
    }
    const handleDataChannelReady = (connectionId: string, channel: RTCDataChannel) => {
        connectDataChannel(connectionId, channel);
    }

    const createRoom = async () => {
        if (isCreateRoomAttemptedRef.current) return; // Prevent duplicate create room attempts
        // console.log("[DEBUG]: Attempting to create room.");
        isCreateRoomAttemptedRef.current = true;

        try {
            const participant: Participant = { avatar: localProfile.avatar, displayName: localProfile.displayName, peerId: "" };
            const roomId = await roomService.createRoom(
                participant,
                handleConnectionSuccess,
                handleDataChannelReady
            );
            setCurrentRoomId(roomId);
            navigate(`/rooms/${roomId}`);
            toast.success(`Room created successfully!`);
            copyRoomLink(roomId)
        } catch (error) {
            console.error('Error creating room:', error);
            toast.error(String(error));
            toast.error('Failed to create room. Please try again.');
        }
    };

    const joinRoom = async (roomId: string) => {
        if (!roomId) {
            toast.error('Cannot join room: invalid room ID.');
            return;
        }

        if (isJoinRoomAttemptedRef.current) return; // Prevent duplicate join room attempts
        // console.log("[DEBUG]: Attempting to join room:", roomId);
        isJoinRoomAttemptedRef.current = true;

        try {

            const participant: Participant = { avatar: localProfile.avatar, displayName: localProfile.displayName, peerId: "" };
            await roomService.joinRoom(
                roomId,
                participant,
                handleConnectionSuccess,
                handleDataChannelReady
            );
        } catch (error) {
            console.error('Error joining room:', error);
            toast.error(String(error));
            toast.error('Failed to join room. Please verify the link and try again.');
        }
    }

    const handleCameraToggle = useCallback(async () => {
        await connectionProvider.toggleLocalCamera(!localProfile.isCameraOn)
        updateLocalProfile({ isCameraOn: !localProfile.isCameraOn })
    }, [localProfile.isCameraOn])
    const handleMicToggle = useCallback(() => {
        connectionProvider.toggleLocalMic(!localProfile.isMicrophoneOn)
        updateLocalProfile({ isMicrophoneOn: !localProfile.isMicrophoneOn })
    }, [localProfile.isMicrophoneOn])

    // Initialize the Room
    useEffect(() => {
        (async () => {
            // IMPORTANT: init() acquires local stream AND creates the PeerJS Peer instance.
            // Must complete before createRoom / joinRoom.
            await connectionProvider.init(false, false) // cam & mic turned off until user action
            if (pathParams.id) {
                setCurrentRoomId(pathParams.id)
                await joinRoom(pathParams.id)
            } else {
                await createRoom()
            }
        })()
    }, [])

    // Update remote video and audio elements when peer joins or updates their profile.
    // It re-runs when remoteProfiles or connections change (`connections` changes when a real media stream arrives).
    useEffect(() => {
        Object.keys(connectionProvider.getConnections()).forEach(connectionId => {
            const remoteProfile = remoteProfiles[connectionId];
            if (remoteProfile) {
                // Sync up remote video window and hidden audio element with remote profile (if needed)
                connectionProvider.toggleRemoteVideoAndAudioSources(connectionId, remoteProfile.isCameraOn, remoteProfile.isMicrophoneOn)
            }
        })
    }, [remoteProfiles, connections])

    return (
        <div className="hidden sm:flex flex-col border-t h-full">
            <RoomNavBar roomLink={roomLink} onCopyRoomLink={copyRoomLink} />
            <ResizablePanelGroup className="h-full" orientation="horizontal" dir={direction}>
                {/* Scratch Panel (Notes & Whiteboard) */}
                <ResizablePanel collapsible className="h-full p-4" dir="ltr" defaultSize={30} minSize={'20%'} maxSize={'45%'}>
                    <ScratchPanel />
                </ResizablePanel>
                <ResizableHandle withHandle />
                {/* Code Editor Panel */}
                <ResizablePanel className="h-full p-4" dir="ltr" defaultSize={50}>
                    <CodeEditor />
                </ResizablePanel>
                {/* Video Panel */}
                <ResizableHandle withHandle />
                <ResizablePanel collapsible className="h-full flex flex-col justify-center items-center" dir="ltr" defaultSize={30} minSize={'15%'} maxSize={'45%'}>
                    <div className="flex flex-wrap justify-center items-center gap-4 p-4 overflow-y-auto">
                        {Object.entries(connections).map(([connId, _]) => {
                            const remoteProfile = remoteProfiles[connId];
                            if (!remoteProfile) return null;
                            return (
                                    <LivestreamPlayer key={connId} id={getRemoteVideoElementId(connId)} poster={avatarPlaceholder}
                                        autoPlay playsInline withControls
                                        // connectionState={conn.state}
                                        profile={remoteProfile}
                                    />
                            );
                        })}
                        <LivestreamPlayer id={LOCAL_VIDEO_ELEMENT_ID} poster={avatarPlaceholder}
                            autoPlay playsInline withControls muted
                            profile={localProfile} isLocalProfile
                            onCameraToggle={handleCameraToggle} onMicToggle={handleMicToggle}
                        />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup >
        </div>
    )
}

function RoomNavBar({ onCopyRoomLink, roomLink }: { onCopyRoomLink: () => void, roomLink: string }) {
    const { isDarkMode, setIsDarkMode, direction, setDirection } = useTheme();
    const pathParams = useParams(); // get id path variable from the router!

    const handleCopyRoomLink = () => onCopyRoomLink()
    const handleNewRoom = () => window.open('/rooms', '_blank')
    const handleToggleDirection = () => setDirection(direction === 'ltr' ? 'rtl' : 'ltr')
    const handleToggleDarkMode = () => setIsDarkMode(!isDarkMode)

    return <nav className="flex border-b h-[50px] justify-between items-center px-4">
        <a href="/" className="text-3xl font-bold no-underline text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300 active:text-indigo-600 transition-colors select-none">[synk]</a>
        <div className="flex items-center gap-2 max-w-[50%]">
            {roomLink ?
                <div id="room-link" className="text-sm flex items-center gap-2 w-full">
                    <p className="text-muted-foreground dark:text-gray-100 whitespace-nowrap"><strong>Room:</strong></p>
                    <a
                        href={roomLink}
                        className="underline text-blue-600 hover:text-blue-800 truncate whitespace-nowrap select-all"
                    >
                        {roomLink}
                    </a>
                    <div>
                        <Copy className="cursor-pointer hover:text-gray-500 active:text-black h-4 w-4" onClick={handleCopyRoomLink} />
                    </div>
                </div>
                :
                <div className="text-sm flex items-center gap-2 text-muted-foreground dark:text-gray-100 whitespace-nowrap">
                    <Spinner data-icon="inline-start" />
                    <strong>{pathParams.id ? 'Joining Room...' : 'Creating Room...'}</strong>
                </div>
            }
        </div>
        <div className="flex gap-2">
            <Button onClick={handleToggleDirection} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                {direction === 'rtl' ? <ArrowLeftRight strokeWidth={3} /> : <ArrowRightLeft strokeWidth={3} />}
            </Button>
            <Button onClick={handleToggleDarkMode} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                {isDarkMode ? <Moon strokeWidth={3} /> : <Sun strokeWidth={3} />}
            </Button>
            <Button onClick={handleNewRoom} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                <Plus strokeWidth={3} />New Room
            </Button>
            <Sheet>
                <SheetTrigger asChild>
                    <Menu className="cursor-pointer rounded text-indigo-500 hover:text-indigo-400 h-8 w-8 ml-2" />
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px]">
                    <SheetHeader>
                        <SheetTitle></SheetTitle>
                        <SheetDescription></SheetDescription>
                    </SheetHeader>
                    <nav className="flex flex-col gap-8 mt-6">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-3xl text-indigo-500 hover:text-indigo-400 active:text-indigo-600 transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    </nav >
}