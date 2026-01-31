import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { toast } from "sonner"
import { Copy, Plus, Menu, Moon, Sun } from "lucide-react"

import {
    navLinks,
    localVideoElementId,
    remoteVideoElementId,
} from "@/constants/constants"
import {
    ensureLocalStream,
    ensureRemoteStream,
    createOfferForRoom,
    createAnswerForRoom,
    setRemoteAnswer,
    addRemoteIceCandidate,
    isRemoteDescriptionSet,
    // getPeerConnection,
    toggleLocalCamera,
    toggleLocalMic,
    toggleRemoteVideoSource,
} from "@/lib/webrtc"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
// import CodeEditor from "@/components/CodeEditor/CodeEditor"
import Video from "@/components/Video/Video"
import { Button } from "@/components/ui/button"
import { databaseService } from "@/services/FirebaseDatabaseService"
import type { Room } from "@/services/DatabaseService"
import { RoomProvider, useRoom } from "@/context/RoomContext"
import { CollaborationProvider, useCollaboration } from "@/context/CollaborationContext"
import { useTheme } from "@/context/ThemeContext"

import avatarPlaceholder from "@/assets/avatar-placeholder.svg"


function RoomContent() {
    const [isPeerJoined, setIsPeerJoined] = useState(false);
    const isJoinAttemptedRef = useRef<boolean>(false);

    const navigate = useNavigate();
    const pathParams = useParams(); // get id path variable from the router!
    const { roomLink, setCurrentRoomId, copyRoomLink } = useRoom();
    const { connectDataChannel, localProfile, remoteProfile, updateLocalProfile } = useCollaboration();
    const { isDarkMode, setIsDarkMode } = useTheme();


    const createRoom = async () => {
        try {
            // Create room in database
            const room = await databaseService.createRoom();
            setCurrentRoomId(room.id);
            navigate(`/rooms/${room.id}`, { replace: true });

            // Create SDP offer and set up ICE candidate handling
            const offer = await createOfferForRoom(
                async (candidate) => {
                    // Save Offer's ICE candidates to database as they arrive
                    await databaseService.addIceCandidate(room.id, candidate, true);
                },
                () => {
                    setIsPeerJoined(true);
                    toast.success(`A Peer has successfully joined the room: ${room.id}`);
                },
                (channel) => {
                    console.log('[Room] Data channel ready (creator)');
                    connectDataChannel(channel);
                }
            );

            // Save offer to database
            await databaseService.updateRoomOffer(room.id, offer);

            // Listen for Room Updates (answer & ICE candidates from peer)
            const unsubscribe = databaseService.listenForRoomUpdates(room.id, async (room) => {
                // console.log('[DEBUG]: Creator received room updates:', room);
                // console.log("[DEBUG]: PeerConnection:", getPeerConnection());
                if (!isRemoteDescriptionSet() && room.answer) {
                    await setRemoteAnswer(room.answer);
                }

                // Fetch and add any ICE candidates from the peer
                if (room.answerIceCandidates) {
                    // toast(`[DEBUG]: Received ICE candidate ${room.answerIceCandidates.length - 1} from joiner peer`);
                    const lastCandidate = room.answerIceCandidates[room.answerIceCandidates.length - 1];
                    await addRemoteIceCandidate(lastCandidate);
                }

                unsubscribe();
            });

            toast.success(`Room created successfully!`);
            copyRoomLink(room.id);
        } catch (error) {
            console.error('Error creating room:', error);
            toast.error('Failed to create room. Please try again.');
        }
    };

    const joinRoom = async (roomId: string) => {
        if (!roomId) {
            toast.error('Cannot join room: invalid room ID.');
            return;
        }

        if (isJoinAttemptedRef.current) return; // Prevent duplicate join attempts
        // console.log("[DEBUG]: Attempting to join room:", roomId);
        isJoinAttemptedRef.current = true;

        try {
            // Fetch room and get the offer
            let room: Room;
            try {
                room = await databaseService.getRoomById(roomId);
            } catch (error) {
                toast.error(String(error));
                return;
            }

            if (!room.offer) {
                toast.error('Room does not have an offer yet. Please wait for the room creator to set up the connection.');
                return;
            }

            // Create SDP answer, Set up ICE candidate handling, and Set Remote Description
            const answer = await createAnswerForRoom(room.offer,
                async (candidate) => {
                    // Save Answer's ICE candidates to database as they arrive
                    await databaseService.addIceCandidate(room.id, candidate, false);
                },
                () => {
                    setIsPeerJoined(true);
                    toast.success(`Successfully joined room: ${room.id.slice(0, 6)}...`);
                },
                (channel) => {
                    console.log('[Room] Data channel ready (joiner)');
                    connectDataChannel(channel);
                }
            );

            // Save answer to database
            await databaseService.updateRoomAnswer(room.id, answer);

            // Add any ICE candidates from the room creator
            if (room.offerIceCandidates) {
                for (let candidate of room.offerIceCandidates) {
                    await addRemoteIceCandidate(candidate);
                }
            }

            // Listen for Room Updates (ICE candidates from room creator)
            const unsubscribe = databaseService.listenForRoomUpdates(room.id, async (room) => {
                // console.log('[DEBUG]: Joiner received room updates:', room);
                // console.log("[DEBUG]: PeerConnection:", getPeerConnection());
                // add any ICE candidates from the peer
                if (room.offerIceCandidates) {
                    const lastCandidate = room.offerIceCandidates[room.offerIceCandidates.length - 1];
                    await addRemoteIceCandidate(lastCandidate);
                }

                unsubscribe();
            });
        } catch (error) {
            console.error('Error joining room:', error);
            toast.error('Failed to join room. Please verify the link and try again.');
        }
    }

    const handleCopyRoomLink = () => copyRoomLink()
    const handleNewRoom = () => window.open('/rooms', '_blank')
    const handleToggleDarkMode = useCallback(() => setIsDarkMode(!isDarkMode), [isDarkMode])
    const handleCameraToggle = useCallback(async () => {
        await toggleLocalCamera(!localProfile.isCameraOn)
        updateLocalProfile({ isCameraOn: !localProfile.isCameraOn })
    }, [localProfile])
    const handleMicToggle = useCallback(() => {
        toggleLocalMic(!localProfile.isMicrophoneOn)
        updateLocalProfile({ isMicrophoneOn: !localProfile.isMicrophoneOn })
    }, [localProfile])

    // Initialize the Room
    useEffect(() => {
        (async () => {
            // IMPORTANT: must ensure local stream before creating/joining room!
            await ensureLocalStream(false, false) // cam & mic turned off until user action
            if (pathParams.id) {
                setCurrentRoomId(pathParams.id)
                await joinRoom(pathParams.id)
            } else {
                await createRoom()
            }
        })()
    }, [])

    // Update remote video when peer joins
    useEffect(() => {
        (async () => {
            if (isPeerJoined) {
                await ensureRemoteStream()
            }
            // Update remote video window with remote profile
            await toggleRemoteVideoSource(remoteProfile.isCameraOn)
        })()
    }, [isPeerJoined, remoteProfile])

    return (
        <div className="h-full flex flex-col border-t">
            <nav className="flex border-b h-[50px] justify-between items-center px-4">
                <a href="/" className="text-3xl font-bold no-underline text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300 active:text-indigo-600 transition-colors select-none">[synk]</a>
                <div className="flex items-center gap-2 max-w-[50%]">
                    {roomLink &&
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
                    }
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleToggleDarkMode} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        {isDarkMode ? <Sun strokeWidth={3} /> : <Moon strokeWidth={3} />}
                    </Button>
                    <Button onClick={handleNewRoom} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        <Plus strokeWidth={3} />New Room
                    </Button>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Menu className="cursor-pointer rounded text-indigo-500 hover:text-indigo-400 h-8 w-8 ml-2" />
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[250px]">
                            <nav className="flex flex-col gap-4 mt-6">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        className="text-lg text-indigo-500 hover:text-indigo-400 active:text-indigo-600 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav >
            <ResizablePanelGroup className="h-full" orientation="horizontal">
                {/* Text Editor Panel */}
                <ResizablePanel collapsible className="h-full p-4" defaultSize={25} minSize={'20%'} maxSize={'33.3%'}>
                    <p className="dark:bg-indigo-950 bg-indigo-100 rounded p-4 overflow-y-scroll h-full text-left" style={{ whiteSpace: "pre-line" }}>
                        <span className="text-center"><strong>Text Editor</strong></span>
                        <br />
                        Coming Soon.
                    </p>
                </ResizablePanel>
                <ResizableHandle withHandle />
                {/* Code Editor Panel */}
                <ResizablePanel className="editor-panel h-full p-4" defaultSize={50}>
                    {/* <CodeEditor /> */}
                </ResizablePanel>
                {/* Video Panel */}
                <ResizableHandle withHandle />
                <ResizablePanel collapsible className="h-full flex flex-col justify-center items-center" defaultSize={25} minSize={'15%'} maxSize={'33.3%'}>
                    <div className="flex flex-col justify-center items-center gap-4 p-4 max-h-100 ">
                        <Video id={localVideoElementId} poster={avatarPlaceholder}
                            autoPlay playsInline withControls muted
                            profile={localProfile} isLocalProfile
                            onCameraToggle={handleCameraToggle} onMicToggle={handleMicToggle}
                        />
                        <Video id={remoteVideoElementId} poster={avatarPlaceholder}
                            autoPlay playsInline withControls
                            profile={remoteProfile} hidden={!isPeerJoined}
                        />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup >
        </div >
    )
}

export default function RoomPage() {
    return (
        <CollaborationProvider>
            <RoomProvider>
                <RoomContent />
            </RoomProvider>
        </CollaborationProvider>
    );
}
