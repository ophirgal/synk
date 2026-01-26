import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import MonacoEditor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { GripVerticalIcon, Play } from "lucide-react";

import {
    ResizablePanel,
    ResizablePanelGroup,
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
import { getAvailableRuntimes, createRuntime, type RuntimeEngine } from "@/lib/runtime";
import { useCollaboration } from "@/context/CollaborationContext";

export default function Editor() {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);

    const { yText } = useCollaboration();

    const [output, setOutput] = useState<string>("");
    const [isReadyToRun, setIsReadyToRun] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("python");

    const availableRuntimes = useMemo(() => getAvailableRuntimes(), []);

    const runtime = useMemo<RuntimeEngine | null>(() => {
        setIsReadyToRun(false);
        return createRuntime(selectedLanguage);
    }, [selectedLanguage]);

    const runCode = useCallback(async () => {
        if (!runtime?.isReady()) {
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

    const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;

        // Only set default code if Y.Text is empty (first user in room)
        if (yText.length === 0 && runtime?.defaultCode) {
            yText.insert(0, runtime.defaultCode);
        }

        // Create MonacoBinding to sync Y.Text with Monaco editor
        const model = editor.getModel();
        if (model) {
            bindingRef.current = new MonacoBinding(
                yText,
                model,
                new Set([editor])
            );
        }
    }, [yText, runtime]);

    // Load the runtime
    useEffect(() => {
        if (!runtime) return;

        let disposed = false;

        const loadRuntime = async () => {
            try {
                await runtime.load((text) => {
                    if (!disposed) {
                        setOutput((prev) => prev + text);
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

        return () => {
            disposed = true;
            runtime.dispose();
        };
    }, [runtime]);

    // Reset output when runtime changes
    useEffect(() => {
        if (runtime) {
            setOutput("");
        }
    }, [runtime]);

    // Cleanup binding on unmount
    useEffect(() => {
        return () => {
            bindingRef.current?.destroy();
            bindingRef.current = null;
        };
    }, []);

    if (!runtime) {
        return <div>Failed to load runtime for {selectedLanguage}</div>;
    }

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex justify-between">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger size="sm" className="w-[140px] bg-white">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRuntimes.map((rt) => (
                            <SelectItem key={rt.id} value={rt.id}>
                                {rt.languageName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button disabled={!isReadyToRun} onClick={runCode} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
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
            <div className="h-full" key={runtime.id}>
                <ResizablePanelGroup className="panels h-full" orientation="vertical">
                    <ResizablePanel className="bg-white" defaultSize={65}>
                        <MonacoEditor
                            language={runtime.languageId}
                            onMount={handleEditorMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </ResizablePanel>
                    <div className="w-full h-4 flex flex-col justify-center items-center">
                        <GripVerticalIcon className="size-2.5 rotate-90" />
                    </div>
                    <ResizablePanel id="output-panel" className="border rounded p-2 pb-2 bg-gray-50 text-gray-500 overflow-y-scroll" defaultSize={35}>
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
