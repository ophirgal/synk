import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import MonacoEditor from "@monaco-editor/react";
import { editor as monaco } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { GripHorizontal, Play } from "lucide-react";

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
// import CursorWidget from "../CursorWidget"; // TODO: use this for remote cursor marker
import { runtimeRegistry, type RuntimeEngine } from "@/lib/runtimes";
import { useCollaboration } from "@/context/CollaborationContext";
import { useTheme } from "@/context/ThemeContext";


export default function CodeEditor() {
    const [output, setOutput] = useState<string>("");
    const [isReadyToRun, setIsReadyToRun] = useState(false);
    const [username, _] = useState<string>("user1"); // TODO: use this for local username
    const editorRef = useRef<monaco.IStandaloneCodeEditor | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const { yDoc, currentLanguage, setCurrentLanguage } = useCollaboration();
    const { isDarkMode } = useTheme();

    const runtime = useMemo<RuntimeEngine>(() => runtimeRegistry[currentLanguage], [currentLanguage]);

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

        // TODO: Set up cursor marker for peer edits
        // const position = editor.getPosition() ?? { lineNumber: 0, column: 0 };
        // const className = "bg-indigo-400 text-sm text-white px-1 absolute";
        // const cursorWidget = new CursorWidget(username, position, className);
        // editor.addContentWidget(cursorWidget);
        // editor.onDidChangeCursorPosition((e) => {
        //     cursorWidget.getPosition = () => ({
        //         position: e.position,
        //         preference: cursorWidget.preference
        //     });
        //     editor.layoutContentWidget(cursorWidget)
        //     cursorWidget.show(1000);
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
    }, [runtime, username]);

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
                <Button disabled={!isReadyToRun} onClick={handleRun} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
                    {isReadyToRun ?
                        <>
                            <Play className="h-4 w-4" />
                            <span className="hidden sm:inline">Run</span>
                        </>
                        :
                        <><Spinner data-icon="inline-start" />
                            Loading...
                        </>
                    }
                </Button>
            </div>
            <div className="h-full" key={runtime?.id}>
                <ResizablePanelGroup className="panels h-full" orientation="vertical">
                    <ResizablePanel defaultSize={65}>
                        <MonacoEditor
                            language={runtime.languageId}
                            onMount={handleEditorMount}
                            theme={isDarkMode ? "vs-dark" : "light"}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                            loading={<><Spinner data-icon="inline-start" className="mr-1" /> Loading...</>}
                        />
                    </ResizablePanel>
                    <ResizableHandle withHandle
                        className="flex justify-center items-center w-full h-[15px] bg-transparent hover:bg-indigo-100 dark:hover:bg-indigo-900"
                        customHandle={<GripHorizontal className="size-2.5" />} />
                    <ResizablePanel id="output-panel" className="border p-2 pb-2 bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 overflow-y-scroll" defaultSize={35}>
                        <div className="text-xs text-left">
                            {
                                output ?
                                    <pre>{output}</pre>
                                    :
                                    <pre className="italic text-center">Press <strong>Run</strong> to see the output...</pre>
                            }
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
