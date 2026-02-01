import { useEffect, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { editor as monaco } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { AArrowUp, AArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner";
// import CursorWidget from "../CursorWidget";
import { useCollaboration } from "@/context/CollaborationContext";
import { useTheme } from "@/context/ThemeContext";
import { textEditorTextId } from "@/constants/constants";


export default function TextEditor() {
    const [fontSize, setFontSize] = useState(14);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const editorRef = useRef<monaco.IStandaloneCodeEditor | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    // const cursorWidgetRef = useRef<CursorWidget | null>(null);
    const { yDoc, remoteProfile /*, localProfile, updateLocalProfile */ } = useCollaboration();
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
        // editor.onDidChangeCursorPosition((e) => {
        //     updateLocalProfile({ editors: { ...localProfile.editors, [textEditorTextId]: e.position } });
        // });

        // Destroy old binding if it exists
        bindingRef.current?.destroy();

        // Rebind MonacoBinding when yText changes (language switch)
        bindingRef.current = new MonacoBinding(
            yDoc.getText(textEditorTextId),
            model,
            new Set([editor])
        );

        setIsEditorReady(true);

        return () => {
            bindingRef.current?.destroy();
            bindingRef.current = null;
        };
    };

    // Respond to remote cursor position changes 
    useEffect(() => {
        // if (!editorRef.current) return;
        // const editor = editorRef.current;

        // if (!cursorWidgetRef.current) {
        //     cursorWidgetRef.current = new CursorWidget(
        //         remoteProfile.username,
        //         remoteProfile.editors[currentLanguage].position,
        //         "bg-indigo-400 text-sm text-white px-1 absolute"
        //     );
        //     editor.addContentWidget(cursorWidgetRef.current);
        // }
        // 
        // cursorWidgetRef.current.getPosition = () => ({
        //     position: remoteProfile.editors[currentLanguage].position,
        //     preference: cursorWidgetRef.current!.preference,
        // });
        // editor.layoutContentWidget(cursorWidgetRef.current)
        // if (current remote cursor position different than last one) {
        //     cursorWidgetRef.current.show(1000);
        // }

    }, [remoteProfile]);

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
