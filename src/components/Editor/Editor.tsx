import { useRef, useState } from "react";
import PythonEditor from "./PythonEditor";
import type { PythonEditorRef } from "./PythonEditor";
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"

import "./Editor.css"
import { Spinner } from "@/components/ui/spinner";

export default function Editor() {
    const pythonEditorRef = useRef<PythonEditorRef>(null);
    const [isReadyToRun, setIsReadyToRun] = useState(false);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex justify-end">
                <Button disabled={!isReadyToRun} onClick={() => pythonEditorRef.current?.runCode()} size="sm" className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white">
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
            <PythonEditor ref={pythonEditorRef} onReadyToRun={() => setIsReadyToRun(true)}
                initialCode={
                    `from datetime import datetime

# 1. Get the current datetime object
current_time = datetime.now()

# 2. Format the datetime object into a specific string format (e.g., YYYY-MM-DD HH:MM:SS)
formatted_time = current_time.strftime("%Y-%m-%d %H:%M:%S:%f")[:-3]

# 3. Print the result
print(formatted_time)`
                } />
        </div>
    )
}
