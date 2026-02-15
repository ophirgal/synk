import { useCallback, useEffect, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { editor as monaco, type IPosition } from "monaco-editor";
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
import CursorWidget from "../CursorWidget/CursorWidget";
import { runtimeRegistry } from "@/lib/runtimes";
import { useCollaboration } from "@/context/CollaborationContext";
import { useTheme } from "@/context/ThemeContext";
import type { Profile } from "@/lib/webrtc";


export default function CodeEditor() {
    const [output, setOutput] = useState<string>("");
    const [isReadyToRun, setIsReadyToRun] = useState(false);
    const [fontSize, setFontSize] = useState(14);
    const editorRef = useRef<monaco.IStandaloneCodeEditor | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const outputContainerRef = useRef<HTMLDivElement>(null);
    // Map of connectionId -> (languageId -> CursorWidget)
    const cursorWidgetsRef = useRef<{ [connectionId: string]: { [languageId: string]: CursorWidget } }>({});
    const lastRemoteCursorPosRef = useRef<{ [connectionId: string]: IPosition | null }>({});
    const { yDoc, remoteProfiles, localProfile, updateLocalProfile } = useCollaboration();
    const { isDarkMode } = useTheme();

    const runtime = runtimeRegistry[localProfile.currentLanguage];

    function scrollOutputContainerToBottom() {
        if (outputContainerRef.current) {
            const div = outputContainerRef.current.childNodes[0] as HTMLDivElement
            div.scrollTop = div.scrollHeight;
        }
    }

    const handleSelectCurrentLanguage = (language: string) => {
        updateLocalProfile({ currentLanguage: language });
    };

    const handleIncreaseFontSize = () => {
        setFontSize((prevFontSize) => prevFontSize + 1);
    };

    const handleDecreaseFontSize = () => {
        setFontSize((prevFontSize) => Math.max(prevFontSize - 1, 7));
    };

    const handleRun = useCallback(async () => {
        if (!runtime.isReady()) {
            setOutput("Runtime is still loading...");
            return;
        }

        try {
            setIsReadyToRun(false)
            const code = editorRef.current?.getValue() || "";
            await runtime.runCode(code);
        } catch (err) {
            const sharedOutputId = `${runtime.languageId}-output`;
            const yText = yDoc.getText(sharedOutputId);
            yText.insert(yText.toString().length, (err as Error).toString());
            setIsReadyToRun(true)
        }
    }, [runtime]);

    const handleEditorMount = useCallback((editor: monaco.IStandaloneCodeEditor) => {
        editorRef.current = editor;
        if (!editor) return;

        const model = editor.getModel();
        if (!model) return;

        // Update local profile when cursor position changes
        editor.onDidChangeCursorPosition((e) => {
            updateLocalProfile((profile: Profile) => ({
                ...profile,
                activeEditor: profile.currentLanguage,
                editors: {
                    ...profile.editors, [profile.currentLanguage]: {
                        ...profile.editors[profile.currentLanguage], position: e.position
                    }
                }
            } as Profile));
        });

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

    const handleClearOutput = useCallback(() => {
        const sharedOutputId = `${runtime.languageId}-output`;
        const yText = yDoc.getText(sharedOutputId);
        yText.delete(0, yText.toString().length);
    }, [runtime]);

    // Respond to remote editor changes: cursor position, prog language switch.
    // - displays widget for remote cursor
    // Bear in mind -- you are trying to listen to nested changes in remoteProfiles,
    // but in reality you are listening to any and all updates to the remoteProfiles.
    useEffect(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        // Iterate over all remote profiles
        Object.entries(remoteProfiles).forEach(([connectionId, remoteProfile]) => {
            // alert("sync with remote profile: "+ JSON.stringify(remoteProfile));
            // Sync language only if remote change is more recent than local change
            if (remoteProfile.currentLanguage !== localProfile.currentLanguage) {
                const remoteChangedAt = remoteProfile.languageChangedAt ?? 0;
                const localChangedAt = localProfile.languageChangedAt ?? 0;

                if (remoteChangedAt > localChangedAt) {
                    updateLocalProfile({
                        currentLanguage: remoteProfile.currentLanguage,
                        languageChangedAt: remoteChangedAt
                    });
                }
                return;
            }

            const newPos = remoteProfile.editors[localProfile.currentLanguage]?.position;
            if (!newPos) return;

            const lastPos = lastRemoteCursorPosRef.current[connectionId];
            if (lastPos && lastPos.lineNumber === newPos.lineNumber && lastPos.column === newPos.column) return;
            lastRemoteCursorPosRef.current[connectionId] = newPos;

            // Ensure cursor widgets map exists for this connection
            if (!cursorWidgetsRef.current[connectionId]) {
                cursorWidgetsRef.current[connectionId] = {};
            }

            // Ensure cursor widget exists for current language and connection
            if (!(localProfile.currentLanguage in cursorWidgetsRef.current[connectionId])) {
                const widget = new CursorWidget(
                    remoteProfile.displayName,
                    newPos,
                    connectionId // use connectionId for unique widget ID
                );
                cursorWidgetsRef.current[connectionId][localProfile.currentLanguage] = widget;
                editor.addContentWidget(widget);
            }

            // Update cursor widget's position
            const currentWidget = cursorWidgetsRef.current[connectionId][localProfile.currentLanguage];
            currentWidget.setPosition(newPos);
            editor.layoutContentWidget(currentWidget);
            currentWidget.show(1000); // hide after 1 second
        });
    }, [remoteProfiles]);

    // Load the runtime
    useEffect(() => {
        if (!runtime) return;

        let disposed = false;

        const sharedOutputId = `${runtime.languageId}-output`;
        const yText = yDoc.getText(sharedOutputId);

        const loadRuntime = async () => {
            try {
                setIsReadyToRun(false);
                await runtime.load((newOutput) => {
                    if (!disposed) {
                        yText.insert(yText.toString().length, newOutput);
                        setIsReadyToRun(true);
                    }
                });
            } catch (err) {
                if (!disposed) {
                    setOutput(`Failed to load runtime: ${(err as Error).message}`);
                }
            } finally {
                setIsReadyToRun(true);
            }
        };

        loadRuntime();
        setOutput(yText.toString());

        return () => {
            disposed = true;
            runtime.dispose();
        };
    }, [runtime]);

    // Scroll to the bottom of the output container when output changes
    useEffect(() => {
        scrollOutputContainerToBottom();
    }, [output])

    // Observe yText output console updates (both local and remote updates).
    // Update local output console if peers are currently looking at the same language.
    useEffect(() => {
        const observerRemovers: (() => void)[] = []

        Object.keys(runtimeRegistry).forEach(languageId => {
            const sharedOutputId = `${languageId}-output`;
            const yText = yDoc.getText(sharedOutputId);

            const handler = () => {
                if (localProfile.currentLanguage === languageId) {
                    setOutput(yText.toString())
                }
            }

            yText.observe(handler);
            observerRemovers.push(() => yText.unobserve(handler))
        });

        return () => observerRemovers.forEach(fn => { try { fn() } catch { } });
    }, [localProfile.currentLanguage]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex justify-between">
                <Select value={localProfile.currentLanguage} onValueChange={handleSelectCurrentLanguage}>
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
                                Run
                            </>
                        }
                    </Button>
                </div>
            </div>
            {/* important: we set the key below to force the editor to re-mount on programming language selection */}
            <div className="h-full" key={runtime.languageId}>
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
                    <ResizablePanel elementRef={outputContainerRef} className="relative border p-2 pb-2 bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 overflow-y-scroll" defaultSize={35}>
                        {output &&
                            <div className="sticky top-0 z-10 h-0 flex justify-end">
                                <Button disabled={!output} variant="ghost" size="sm" onClick={handleClearOutput} title="Clear output"
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        }
                        {isReadyToRun ?
                            <div className="text-left" style={{ fontSize: fontSize + "px" }}>
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