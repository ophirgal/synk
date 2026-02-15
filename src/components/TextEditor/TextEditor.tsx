import { useEffect, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { editor as monaco } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { AArrowUp, AArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner";
import CursorWidget from "../CursorWidget/CursorWidget";
import { useCollaboration } from "@/context/CollaborationContext";
import { useTheme } from "@/context/ThemeContext";
import { TEXT_EDITOR_YTEXT_ID } from "@/constants/constants";
import type { Profile } from "@/lib/webrtc";


export default function TextEditor() {
    const [fontSize, setFontSize] = useState(14);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const editorRef = useRef<monaco.IStandaloneCodeEditor | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    // Map of connectionId -> CursorWidget
    const cursorWidgetsRef = useRef<{ [connectionId: string]: CursorWidget }>({});
    const { yDoc, remoteProfiles, localProfile, updateLocalProfile } = useCollaboration();
    const { isDarkMode } = useTheme();

    const handleIncreaseFontSize = () => {
        setFontSize((prevFontSize) => prevFontSize + 1);
    };

    const handleDecreaseFontSize = () => {
        setFontSize((prevFontSize) => Math.max(prevFontSize - 1, 1));
    };

    const handleEditorMount = (editor: monaco.IStandaloneCodeEditor) => {
        editorRef.current = editor;
        if (!editor) return;

        const model = editor.getModel();
        if (!model) return;

        // Update local profile when cursor position changes
        editor.onDidChangeCursorPosition((e) => {
            if (localProfile.activeEditor === TEXT_EDITOR_YTEXT_ID) return;
            updateLocalProfile((profile: Profile) => ({
                ...profile,
                activeEditor: TEXT_EDITOR_YTEXT_ID,
                editors: {
                    ...profile.editors, [TEXT_EDITOR_YTEXT_ID]: {
                        ...profile.editors[TEXT_EDITOR_YTEXT_ID], position: e.position
                    }
                }
            }));
        });

        // Rebind MonacoBinding when yText changes
        bindingRef.current = new MonacoBinding(
            yDoc.getText(TEXT_EDITOR_YTEXT_ID),
            model,
            new Set([editor])
        );

        setIsEditorReady(true);

        return () => {
            bindingRef.current?.destroy();
            bindingRef.current = null;
        };
    };

    // Respond to remote editor changes (e.g. cursor position)
    // - displays widget for remote cursor
    useEffect(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        // Iterate over all remote profiles
        Object.entries(remoteProfiles).forEach(([connectionId, remoteProfile]) => {
            if (remoteProfile.activeEditor !== TEXT_EDITOR_YTEXT_ID) return;

            const position = remoteProfile.editors[TEXT_EDITOR_YTEXT_ID]?.position;
            if (!position) return;

            // Ensure cursor widget exists for this connection
            if (!cursorWidgetsRef.current[connectionId]) {
                const widget = new CursorWidget(
                    remoteProfile.displayName,
                    position,
                    connectionId // use connectionId for unique widget ID
                );
                cursorWidgetsRef.current[connectionId] = widget;
                editor.addContentWidget(widget);
            }

            // Update cursor widget's position
            const currentWidget = cursorWidgetsRef.current[connectionId];
            currentWidget.setPosition(position);
            editor.layoutContentWidget(currentWidget);
            currentWidget.show(1000); // hide after 1 second
        });
    }, [remoteProfiles]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex justify-between">
                <h1 className="flex items-center">Notes</h1>
                <div className="flex justify-end gap-2">
                    <Button disabled={!isEditorReady} onClick={handleDecreaseFontSize} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        <AArrowDown className="h-4 w-4" />
                    </Button>
                    <Button disabled={!isEditorReady} onClick={handleIncreaseFontSize} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        <AArrowUp className="h-4 w-42" />
                    </Button>
                </div>
            </div>
            <div className="h-full border-1">
                <MonacoEditor
                    onMount={handleEditorMount}
                    theme={isDarkMode ? "vs-dark" : "light"}
                    options={{
                        padding: { top: 5 },
                        minimap: { enabled: false },
                        fontSize: fontSize,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        // remove unnecessary editor rulers and lines
                        lineNumbers: "off",
                        lineDecorationsWidth: 5,
                        glyphMargin: false,
                        folding: false,
                        renderLineHighlight: 'none',
                        overviewRulerLanes: 0,
                    }}
                    loading={<><Spinner data-icon="inline-start" className="mr-1" /> Loading...</>}
                />
            </div>
        </div>
    );
}
