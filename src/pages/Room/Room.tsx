import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { Copy } from "lucide-react"
import { toast } from "sonner"

import {
    initLocalStream,
    createOfferForRoom,
    createAnswerForRoom,
    setRemoteAnswer,
    addRemoteIceCandidate,
    getRemoteStream,
    isRemoteDescriptionSet,
} from "@/lib/webrtc"
import { createRoomLink } from "@/lib/utils"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import Editor from "@/components/Editor/Editor"
import { Button } from "@/components/ui/button"
import { databaseService } from "@/services/FirebaseDatabaseService"
import type { Room } from "@/services/DatabaseService"

import "./Room.css"

export default function Room() {
    const [isPeerJoined, setIsPeerJoined] = useState(false);
    const navigate = useNavigate();
    const pathParams = useParams(); // get id path variable from the router!
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(pathParams?.id || null);
    const isJoinAttemptedRef = useRef<boolean>(false);

    const handleCreateRoom = async () => {
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
                }
            );

            // Save offer to database
            await databaseService.updateRoomOffer(room.id, offer);

            // Listen for Room Updates (answer & ICE candidates from peer)
            const unsubscribe = databaseService.listenForRoomUpdates(room.id, async (room) => {
                console.log('[DEBUG]: Creator received room updates:', room);
                if (!isRemoteDescriptionSet() && room.answer) {
                    await setRemoteAnswer(room.answer);
                }

                // Fetch and add any ICE candidates from the peer
                if (room.answerIceCandidates) {
                    const lastCandidate = room.answerIceCandidates[room.answerIceCandidates.length - 1];
                    await addRemoteIceCandidate(lastCandidate);
                }

                unsubscribe();
            });

            navigator.clipboard.writeText(createRoomLink(room.id));
            toast.success(`Room created successfully!`);
            toast(`Room link copied to clipboard!`);
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
        console.log("[DEBUG]: Attempting to join room:", roomId);
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
                }
            );

            // Save answer to database
            await databaseService.updateRoomAnswer(room.id, answer);

            // Add any ICE candidates from the room creator
            if (room.offerIceCandidates) {
                const lastCandidate = room.offerIceCandidates[room.offerIceCandidates.length - 1];
                await addRemoteIceCandidate(lastCandidate);
            }

            // Listen for Room Updates (ICE candidates from room creator)
            const unsubscribe = databaseService.listenForRoomUpdates(room.id, async (room) => {
                console.log('[DEBUG]: Joiner received room updates:', room);
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

    const handleCopyRoomLink = useCallback(() => {
        if (currentRoomId) {
            navigator.clipboard.writeText(createRoomLink(currentRoomId));
            toast('Room link copied to clipboard!');
        }
    }, [currentRoomId]);

    useEffect(() => {
        (async () => {
            await initLocalStream()
            if (pathParams.id) {
                await joinRoom(pathParams.id)
            }
        })()
    }, [])

    useEffect(() => {
        if (isPeerJoined) {
            const remoteStream = getRemoteStream();
            const remoteVideo = document.getElementById('peer-user') as HTMLVideoElement;
            if (remoteVideo && remoteStream) {
                remoteVideo.srcObject = remoteStream;
            }
        }
    }, [isPeerJoined])

    return (
        <div className="room bg-indigo-50">
            <ResizablePanelGroup className="panels" orientation="horizontal">
                <ResizablePanel className="problem-panel panel p-4 overflow-y-scroll" defaultSize={25} minSize={'20%'} maxSize={'33.3%'}>
                    <p className="bg-indigo-100 rounded p-4 overflow-y-scroll text-left" style={{ whiteSpace: "pre-line" }}>
                        <span className="text-center"><strong>Two Sum</strong></span>
                        <br />
                        {
                            `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.
 
Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]

 
Constraints:

2 <= nums.length <= 104
-109 <= nums[i] <= 109
-109 <= target <= 109
Only one valid answer exists.

 
Follow-up: Can you come up with an algorithm that is less than O(n2) time complexity?`
                        }
                    </p>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel className="editor-panel panel p-4" defaultSize={50}>
                    <Editor />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel className="video-panel panel p-4 flex flex-col h-full justify-center items-center gap-2" defaultSize={25} minSize={'20%'} maxSize={'33.3%'}>
                    {/* <h2><strong>Video Feed</strong></h2> */}
                    {currentRoomId &&
                        <div className="flex items-start justify-center h-[10%] w-full">
                            <div className="bg-muted rounded border text-sm p-2 flex justify-between items-center max-w-[90%]">
                                <p className="text-muted-foreground  whitespace-nowrap"><strong>Room Link:</strong></p>
                                <a href={createRoomLink(currentRoomId)} className="underline text-blue-600 hover:text-blue-800 truncate whitespace-nowrap overflow-x-scroll max-w-[75%] select-all px-2">{createRoomLink(currentRoomId)}</a>
                                <Button size="sm" variant="outline" onClick={handleCopyRoomLink}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    }
                    <div className="flex-1 flex flex-col justify-center items-center gap-4 h-100">
                        <video id="curr-user" className="rounded object-cover max-h-[45%] w-full" autoPlay playsInline muted></video>
                        <video id="peer-user" className={`rounded object-cover max-h-[45%] w-full ${isPeerJoined ? '' : 'hidden'}`} autoPlay playsInline></video>
                        <div>
                            <Button onClick={handleCreateRoom} variant="default" className="flex-1">
                                Create Room
                            </Button>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div >
    )
}
