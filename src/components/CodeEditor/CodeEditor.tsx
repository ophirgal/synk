import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import MonacoEditor from "@monaco-editor/react";
import { editor as monaco } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { AArrowDown, AArrowUp, GripHorizontal, Play, Trash2 } from "lucide-react";

import {
    ResizablePanel,
    ResizablePanelGroup,
    ResizableHandle,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner";
// import CursorWidget from "../CursorWidget";
import { runtimeRegistry, type RuntimeEngine } from "@/lib/runtimes";
import { useCollaboration } from "@/context/CollaborationContext";
import { useTheme } from "@/context/ThemeContext";


export default function CodeEditor() {
    const [output, setOutput] = useState<string>("");
    const [isReadyToRun, setIsReadyToRun] = useState(false);
    const [fontSize, setFontSize] = useState(14);
    const editorRef = useRef<monaco.IStandaloneCodeEditor | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    // const cursorWidgetRef = useRef<CursorWidget | null>(null);
    const { yDoc, currentLanguage, setCurrentLanguage,
        remoteProfile /*, localProfile, updateLocalProfile */ } = useCollaboration();
    const { isDarkMode } = useTheme();

    const runtime = useMemo<RuntimeEngine>(() => runtimeRegistry[currentLanguage], [currentLanguage]);

    const handleIncreaseFontSize = () => {
        setFontSize((prevFontSize) => prevFontSize + 1);
    };

    const handleDecreaseFontSize = () => {
        setFontSize((prevFontSize) => Math.max(prevFontSize - 1, 1));
    };

    const handleRun = useCallback(async () => {
        if (!runtime.isReady()) {
            setOutput("Runtime is still loading...");
            return;
        }

        try {
            const code = editorRef.current?.getValue() || "";
            await runtime.runCode(code);
        } catch (err) {
            setOutput((prev) => prev + (err as Error).toString());
        }

        const outputDiv = document.getElementById('output-panel')?.childNodes[0] as HTMLDivElement;
        if (outputDiv) {
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }
    }, [runtime]);

    const handleEditorMount = useCallback((editor: monaco.IStandaloneCodeEditor) => {
        editorRef.current = editor;
        if (!editor) return;

        const model = editor.getModel();
        if (!model) return;

        // Update local profile when cursor position changes
        // editor.onDidChangeCursorPosition((e) => {
        //     updateLocalProfile({ editors: { ...localProfile.editors, [runtime.languageId]: e.position } });
        // });

        // Destroy old binding if it exists
        bindingRef.current?.destroy();

        // Rebind MonacoBinding when yText changes (language switch)
        bindingRef.current = new MonacoBinding(
            yDoc.getText(runtime.languageId),
            model,
            new Set([editor])
        );

        return () => {
            bindingRef.current?.destroy();
            bindingRef.current = null;
        };
    }, [runtime]);

    const handleClearOutput = () => {
        setOutput("");
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

    // Load the runtime
    useEffect(() => {
        if (!runtime) return;

        let disposed = false;

        const loadRuntime = async () => {
            try {
                await runtime.load((output) => {
                    if (!disposed) {
                        setOutput((prev) => prev + output);
                    }
                });
                if (!disposed) {
                    setIsReadyToRun(true);
                }
            } catch (err) {
                if (!disposed) {
                    setOutput(`Failed to load runtime: ${(err as Error).message}`);
                }
            }
        };

        loadRuntime();
        setOutput(""); // Reset output when runtime changes

        return () => {
            disposed = true;
            runtime.dispose();
        };
    }, [runtime]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex justify-between">
                <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                    <SelectTrigger size="sm" className="w-[140px] bg-white">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.keys(runtimeRegistry).map((k) => (
                            <SelectItem key={k} value={runtimeRegistry[k].id}>{runtimeRegistry[k].languageName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Button disabled={!isReadyToRun} onClick={handleDecreaseFontSize} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        <AArrowDown className="h-4 w-4" />
                    </Button>
                    <Button disabled={!isReadyToRun} onClick={handleIncreaseFontSize} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        <AArrowUp className="h-4 w-4" />
                    </Button>
                    <Button disabled={!isReadyToRun} onClick={handleRun} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                        {isReadyToRun ?
                            <>
                                <Play className="h-4 w-4" />
                                Run
                            </>
                            :
                            <>
                                <Spinner data-icon="inline-start" />
                                Loading...
                            </>
                        }
                    </Button>
                </div>
            </div>
            <div className="h-full" key={runtime?.id}>
                <ResizablePanelGroup className="panels h-full" orientation="vertical">
                    <ResizablePanel className="border" defaultSize={65}>
                        <MonacoEditor
                            language={runtime.languageId}
                            onMount={handleEditorMount}
                            theme={isDarkMode ? "vs-dark" : "light"}
                            options={{
                                minimap: { enabled: false },
                                fontSize: fontSize,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                            loading={<><Spinner data-icon="inline-start" className="mr-1" /> Loading...</>}
                        />
                    </ResizablePanel>
                    <ResizableHandle withHandle
                        className="flex justify-center items-center w-full h-[15px] bg-transparent hover:bg-indigo-100 dark:hover:bg-indigo-900"
                        customHandle={<GripHorizontal className="size-2.5" />} />
                    <ResizablePanel id="output-panel" className="relative border p-2 pb-2 bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 overflow-y-scroll" defaultSize={35}>
                        {output &&
                            <div className="sticky top-0 z-10 h-0 flex justify-end">
                                <Button disabled={!output} variant="ghost" size="sm" onClick={handleClearOutput} title="Clear output"
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        }
                        {isReadyToRun ?
                            <div className="text-xs text-left">
                                {
                                    output ?
                                        <pre>{output}</pre>
                                        :
                                        <pre className="italic text-center">Press <strong>Run</strong> to see the output...</pre>
                                }
                            </div>
                            :
                            <div className="flex justify-center items-center h-full gap-1">
                                <Spinner data-icon="inline-start" />
                                Loading...
                            </div>
                        }
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
