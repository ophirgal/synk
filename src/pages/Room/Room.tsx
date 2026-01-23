import { useCallback, useEffect, useState } from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"

import {
    initWebRTC,
    createOfferForRoom,
    createAnswerForRoom,
    setRemoteAnswer,
    addRemoteIceCandidate,
    getRemoteStream,
    isRemoteDescriptionSet
} from "@/lib/webrtc"
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
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

    const handleCreateRoom = async () => {
        try {
            // Create room in database
            const room = await databaseService.createRoom();
            console.log('Room created:', room);
            setCurrentRoomId(room.id);

            // Create SDP offer and set up ICE candidate handling
            const offer = await createOfferForRoom(
                async (candidate) => {
                    // Save Offer's ICE candidates to database as they arrive
                    await databaseService.addIceCandidate(room.id, candidate, true);
                },
                () => {
                    setIsPeerJoined(true);
                    alert(`A Peer has successfully joined the room: ${room.id}`);
                }
            );

            // Save offer to database
            await databaseService.updateRoomOffer(room.id, offer);

            // Listen for Room Updates (answer & ICE candidates from peer)
            const unsubscribe = databaseService.listenForRoomUpdates(room.id, async (room) => {
                console.log('Received room updates:', room);
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

            navigator.clipboard.writeText(room.id);
            toast.success(`Room created successfully!`);
            toast(`Room ID copied to clipboard!`);
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    };

    const handleJoinRoom = async () => {
        const roomId = prompt('Enter Room ID:');
        if (!roomId) return;

        try {
            // Fetch room and get the offer
            let room: Room;
            try {
                room = await databaseService.getRoomById(roomId);
                setCurrentRoomId(room.id);
            } catch (error) {
                alert(error);
                return;
            }

            if (!room.offer) {
                alert('Room does not have an offer yet. Please wait for the room creator to set up the connection.');
                return;
            }

            // Set Remote Description, Create SDP answer, and set up ICE candidate handling
            const answer = await createAnswerForRoom(room.offer,
                async (candidate) => {
                    // Save Answer's ICE candidates to database as they arrive
                    await databaseService.addIceCandidate(room.id, candidate, false);
                },
                () => {
                    setIsPeerJoined(true);
                    toast(`Successfully joined room: ${room.id}`);
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
                console.log('Received room updates:', room);
                // add any ICE candidates from the peer
                if (room.offerIceCandidates) {
                    const lastCandidate = room.offerIceCandidates[room.offerIceCandidates.length - 1];
                    await addRemoteIceCandidate(lastCandidate);
                }

                unsubscribe();
            });
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please check the Room ID and try again.');
        }
    };

    const handleCopyRoomID = useCallback(() => {
        if (currentRoomId) {
            navigator.clipboard.writeText(currentRoomId);
            toast('Room ID copied to clipboard!');
        }
    }, [currentRoomId]);

    useEffect(() => {
        initWebRTC()
    })

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
                        <div className="flex items-start h-[10%]">
                            <div className="bg-muted rounded border text-sm p-2 flex justify-between items-center">
                                <p className="text-muted-foreground"><strong>Room ID:</strong></p>
                                <p className="select-all px-2">{currentRoomId}</p>
                                <Button size="sm" variant="outline" onClick={handleCopyRoomID}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    }
                    <div className="flex-1 flex flex-col justify-center items-center gap-4 h-100">
                        <video id="curr-user" className="rounded object-cover max-h-[45%] w-full" autoPlay playsInline></video>
                        <video id="peer-user" className={`rounded object-cover max-h-[45%] w-full ${isPeerJoined ? '' : 'hidden'}`} autoPlay playsInline></video>
                        <div className="flex gap-2">
                            <Button onClick={handleCreateRoom} variant="default" className="flex-1">
                                Create Room
                            </Button>
                            <Button onClick={handleJoinRoom} variant="outline" className="flex-1">
                                Join Room
                            </Button>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div >
    )
}
