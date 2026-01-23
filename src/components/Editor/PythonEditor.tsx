import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import {
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { GripVerticalIcon } from "lucide-react";

export interface PythonEditorRef {
    runCode: () => void;
}

interface PyodideInterface {
    runPythonAsync: (code: string) => Promise<any>;
    loadPackage: (pkg: string) => Promise<void>;
}

interface PythonEditorProps {
    initialCode?: string;
    onReadyToRun?: () => void;
}

const PythonEditor = forwardRef<PythonEditorRef, PythonEditorProps>(
    ({ initialCode, onReadyToRun }, ref) => {
        const editorRef = useRef<HTMLDivElement | null>(null);
        const viewRef = useRef<EditorView | null>(null);
        const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
        const [output, setOutput] = useState<string>("");

        const runCode = useCallback(async () => {
            if (!pyodide) {
                setOutput("Pyodide is still loading...");
                return;
            }

            try {
                const code = viewRef.current?.state.doc.toString();
                await pyodide.runPythonAsync(code || "");
            } catch (err) {
                setOutput((err as Error).toString());
            }

            const outputDiv = document.getElementById('output-panel')?.childNodes[0] as HTMLDivElement;
            if (outputDiv) {
                outputDiv.scrollTop = outputDiv.scrollHeight;
            }
        }, [pyodide]);

        // Expose methods to the parent component
        useImperativeHandle(ref, () => ({
            runCode: runCode
        }), [runCode]);

        useEffect(() => {
            if (pyodide && onReadyToRun) {
                onReadyToRun();
            }
        }, [pyodide])


        useEffect(() => {
            const load = async () => {
                // @ts-ignore
                const pyodide = await (window as any).loadPyodide({
                    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
                });

                // Redirect stdout to our custom console
                pyodide.globals.set("sys", pyodide.pyimport("sys"));

                class StdoutWriter {
                    write(s: string) {
                        setOutput((prev) => prev + s);
                    }
                    flush() { } // Optional, no-op
                }

                pyodide.globals.get("sys").stdout = pyodide.toPy(new StdoutWriter());
                pyodide.globals.get("sys").stderr = pyodide.toPy(new StdoutWriter());

                setPyodide(pyodide);
            };

            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
            script.onload = load;
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script); // Cleanup on unmount
            };
        }, []);

        useEffect(() => {
            if (!editorRef.current || viewRef.current) return;

            const startCode = initialCode || `print("Hello World!")`;

            const state = EditorState.create({
                doc: startCode,
                extensions: [basicSetup, python()],
            });

            viewRef.current = new EditorView({
                state,
                parent: editorRef.current,
            });
        }, [editorRef, viewRef]);

        return (
            <div className="h-full">
                <ResizablePanelGroup className="panels" orientation="vertical">
                    <ResizablePanel className="bg-white" defaultSize={65}>
                        <div ref={editorRef} className="border rounded mb-4 focus:outline-none text-left h-full overflow-y-scroll"></div>
                    </ResizablePanel>
                    <div className="w-full h-4 flex flex-col justify-center items-center">
                        <GripVerticalIcon className="size-2.5 rotate-90" />
                        {/* <hr className="w-full"/> */}
                    </div>
                    <ResizablePanel id="output-panel" className="border rounded p-2 pb-2 bg-gray-50 text-gray-500 overflow-y-scroll" defaultSize={35}>
                        {/* {pyodide && <button
                        onClick={runCode}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Run Code
                    </button>} */}
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

PythonEditor.displayName = 'PythonEditor';

export default PythonEditor;