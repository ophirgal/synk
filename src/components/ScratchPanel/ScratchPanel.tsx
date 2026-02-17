import { useState, useMemo } from 'react'

import TextEditor from "@/components/TextEditor/TextEditor"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { AArrowUp, AArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button"
import Whiteboard from "@/components/Whiteboard/Whiteboard"
import { useCollaboration } from "@/context/CollaborationContext"
import { ScratchTab, type ScratchTabType } from "@/lib/webrtc"

export default function ScratchPanel() {
    const { localProfile, remoteProfiles, updateLocalProfile } = useCollaboration();
    const [notesFontSize, setNotesFontSize] = useState(14);
    const [isEditorReady, setIsEditorReady] = useState(false);

    // Determine active tab based on the most recent scratchTabChangedAt across all profiles
    const activeTab = useMemo(() => {
        let mostRecentTab = localProfile.currentScratchTab;
        let mostRecentTimestamp = localProfile.scratchTabChangedAt;

        Object.values(remoteProfiles).forEach(profile => {
            if (profile.scratchTabChangedAt > mostRecentTimestamp) {
                mostRecentTimestamp = profile.scratchTabChangedAt;
                mostRecentTab = profile.currentScratchTab;
            }
        });

        return mostRecentTab;
    }, [localProfile.currentScratchTab, localProfile.scratchTabChangedAt, remoteProfiles]);

    const handleTabChange = (tab: ScratchTabType) => {
        updateLocalProfile({ currentScratchTab: tab });
    };

    const handleIncreaseNotesFontSize = () => {
        setNotesFontSize((prevFontSize) => prevFontSize + 1);
    };

    const handleDecreaseNotesFontSize = () => {
        setNotesFontSize((prevFontSize) => Math.max(prevFontSize - 1, 1));
    };

    return (
        <Tabs value={activeTab} className="h-full w-full">
            <div className="flex justify-between">
                <TabsList variant="line">
                    <TabsTrigger onClick={() => handleTabChange(ScratchTab.NOTES)} value={ScratchTab.NOTES}>Notes</TabsTrigger>
                    <TabsTrigger onClick={() => handleTabChange(ScratchTab.WHITEBOARD)} value={ScratchTab.WHITEBOARD}>Whiteboard</TabsTrigger>
                </TabsList>
                <div className="flex gap-2" hidden={activeTab !== ScratchTab.NOTES}>
                    <Button
                        disabled={!isEditorReady} onClick={handleDecreaseNotesFontSize}
                        size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        <AArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                        disabled={!isEditorReady} onClick={handleIncreaseNotesFontSize}
                        size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        <AArrowUp className="h-4 w-42" />
                    </Button>
                </div>
            </div>
            <TabsContent value={ScratchTab.NOTES} forceMount hidden={activeTab !== ScratchTab.NOTES}>
                <TextEditor fontSize={notesFontSize} onEditorReady={() => setIsEditorReady(true)} />
            </TabsContent>
            <TabsContent value={ScratchTab.WHITEBOARD} forceMount hidden={activeTab !== ScratchTab.WHITEBOARD}>
                <Whiteboard />
            </TabsContent>
        </Tabs >
    )
}
