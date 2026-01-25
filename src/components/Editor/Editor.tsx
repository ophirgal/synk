import { useRef, useState, useMemo } from "react";
import CodeEditor from "./CodeEditor";
import type { CodeEditorRef } from "./CodeEditor";
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import "./Editor.css"
import { Spinner } from "@/components/ui/spinner";
import { getAvailableRuntimes, createRuntime, type RuntimeEngine } from "@/lib/runtime";

export default function Editor() {
    const codeEditorRef = useRef<CodeEditorRef>(null);
    const [isReadyToRun, setIsReadyToRun] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("python");

    const availableRuntimes = useMemo(() => getAvailableRuntimes(), []);

    const runtime = useMemo<RuntimeEngine | null>(() => {
        setIsReadyToRun(false);
        return createRuntime(selectedLanguage);
    }, [selectedLanguage]);

    const handleLanguageChange = (value: string) => {
        setSelectedLanguage(value);
    };

    if (!runtime) {
        return <div>Failed to load runtime for {selectedLanguage}</div>;
    }

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex justify-between">
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
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
                <Button disabled={!isReadyToRun} onClick={() => codeEditorRef.current?.runCode()} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
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
            <CodeEditor
                key={runtime.id}
                ref={codeEditorRef}
                runtime={runtime}
                onReadyToRun={() => setIsReadyToRun(true)}
            />
        </div>
    )
}
