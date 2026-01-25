import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import {
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { GripVerticalIcon } from "lucide-react";
import type { RuntimeEngine } from "@/lib/runtime";

export interface CodeEditorRef {
    runCode: () => void;
}

interface CodeEditorProps {
    runtime: RuntimeEngine;
    initialCode?: string;
    onReadyToRun?: () => void;
}

// Map runtime language identifiers to CodeMirror language extensions
function getLanguageExtension(codemirrorLanguage: string) {
    switch (codemirrorLanguage) {
        case "python":
            return python();
        case "javascript":
            return javascript();
        // TODO: Future languages can be added here:
        // case "java":
        //     return java();
        default:
            return python(); // Default fallback
    }
}

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
    ({ runtime, initialCode, onReadyToRun }, ref) => {
        const editorRef = useRef<HTMLDivElement | null>(null);
        const viewRef = useRef<EditorView | null>(null);
        const [output, setOutput] = useState<string>("");

        const runCode = useCallback(async () => {
            if (!runtime.isReady()) {
                setOutput("Runtime is still loading...");
                return;
            }

            try {
                const code = viewRef.current?.state.doc.toString();
                await runtime.runCode(code || "");
            } catch (err) {
                setOutput((prev) => prev + (err as Error).toString());
            }

            const outputDiv = document.getElementById('output-panel')?.childNodes[0] as HTMLDivElement;
            if (outputDiv) {
                outputDiv.scrollTop = outputDiv.scrollHeight;
            }
        }, [runtime]);

        // Expose methods to the parent component
        useImperativeHandle(ref, () => ({
            runCode: runCode
        }), [runCode]);

        // Load the runtime
        useEffect(() => {
            let disposed = false;

            const loadRuntime = async () => {
                try {
                    await runtime.load((text) => {
                        if (!disposed) {
                            setOutput((prev) => prev + text);
                        }
                    });
                    if (!disposed) {
                        onReadyToRun?.();
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
        }, [runtime, onReadyToRun]);

        // Initialize CodeMirror editor
        useEffect(() => {
            if (!editorRef.current || viewRef.current) return;

            const startCode = initialCode || runtime.defaultCode;

            const state = EditorState.create({
                doc: startCode,
                extensions: [basicSetup, getLanguageExtension(runtime.codemirrorLanguage)],
            });

            viewRef.current = new EditorView({
                state,
                parent: editorRef.current,
            });

            return () => {
                viewRef.current?.destroy();
                viewRef.current = null;
            };
        }, [initialCode, runtime]);

        // Reset output when runtime changes
        useEffect(() => {
            setOutput("");
        }, [runtime.id]);

        return (
            <div className="h-full">
                <ResizablePanelGroup className="panels" orientation="vertical">
                    <ResizablePanel className="bg-white" defaultSize={65}>
                        <div ref={editorRef} className="border rounded mb-4 focus:outline-none text-left h-full overflow-y-scroll"></div>
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
        );
    });

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
