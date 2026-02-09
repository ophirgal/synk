import type { RuntimeEngine } from "./types";
import { PythonRuntime } from "./PythonRuntime";
import { JavaScriptRuntime } from "./JavaScriptRuntime";
import { JavaRuntime } from "./JavaRuntime";

/**
 * Registry of available runtime engines.
 * Add new runtime factories here to make them available in the editor.
 */
export const runtimeRegistry: Record<string, RuntimeEngine> = {
    python: new PythonRuntime(),
    javascript: new JavaScriptRuntime(),
    java: new JavaRuntime(),
    // Future runtimes can be added here:
    // csharp: new CSharpRuntime(),
};