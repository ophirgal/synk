import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import * as Y from "yjs";
import { ExcalidrawBinding, yjsToExcalidraw } from "y-excalidraw"
import { Awareness } from "y-protocols/awareness";

import { useCollaboration } from "@/context/CollaborationContext";
import { WHITEBOARD_YASSETS_ID, WHITEBOARD_YELEMENTS_ID } from "@/constants/constants";

import "@excalidraw/excalidraw/index.css";

export default function Whiteboard() {
    const [excalAPI, setExcalAPI] = useState<ExcalidrawImperativeAPI | null>(null);
    const { yDoc, localProfile } = useCollaboration();
    const [binding, setBinding] = useState<ExcalidrawBinding | null>(null);
    const excalidrawRef = useRef<HTMLDivElement | null>(null);
    const { isDarkMode } = useTheme();

    const yElements = yDoc.getArray<Y.Map<any>>(WHITEBOARD_YELEMENTS_ID);  // structure = {el: NonDeletedExcalidrawElement, pos: string}
    const yAssets = yDoc.getMap(WHITEBOARD_YASSETS_ID);

    useEffect(() => {
        if (!excalAPI) return;

        const awareness = new Awareness(yDoc);
        awareness.setLocalStateField('user', {
            name: localProfile.displayName,
            color: '#30bced',
            colorLight: '#30bced33',
        })

        const binding = new ExcalidrawBinding(
            yElements,
            yAssets,
            excalAPI,
            awareness,
            // excalidraw dom is needed to override the undo/redo buttons in the UI as there is no way to override it via props in excalidraw
            // You might need to pass {trackedOrigins: new Set()} to undomanager depending on whether your provider sets an origin or not
            { excalidrawDom: excalidrawRef.current!, undoManager: new Y.UndoManager(yElements, { trackedOrigins: new Set() }) },
        );
        setBinding(binding);

        return () => {
            setBinding(null);
            binding.destroy();
        };
    }, [excalAPI]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="h-full w-full border-1" ref={excalidrawRef}>
                <Excalidraw
                    theme={isDarkMode ? "dark" : "light"}
                    initialData={{
                        appState: {
                            activeTool: {
                                lastActiveTool: null,
                                locked: false,
                                type: "freedraw",
                                customType: null,
                            },
                        },
                        elements: yjsToExcalidraw(yElements)
                    }}
                    UIOptions={{
                        tools: {
                            image: false,
                        }
                    }}
                    excalidrawAPI={setExcalAPI}
                    onPointerUpdate={binding?.onPointerUpdate}
                    isCollaborating
                />
            </div>
        </div>
    );
}
