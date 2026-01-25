import type { RuntimeEngine, RuntimeEngineFactory, RuntimeEngineInfo } from "./types";
import { PythonRuntime } from "./PythonRuntime";
import { JavaScriptRuntime } from "./JavaScriptRuntime";

/**
 * Registry of available runtime engines.
 * Add new runtime factories here to make them available in the editor.
 */
export const runtimeRegistry: Record<string, RuntimeEngineFactory> = {
    python: () => new PythonRuntime(),
    javascript: () => new JavaScriptRuntime(),
    // Future runtimes can be added here:
    // java: () => new JavaRuntime(),
    // csharp: () => new CSharpRuntime(),
};

/**
 * Get metadata about all available runtimes for display in the UI.
 */
export function getAvailableRuntimes(): RuntimeEngineInfo[] {
    return Object.entries(runtimeRegistry).map(([_, factory]) => {
        const runtime = factory();
        const info: RuntimeEngineInfo = {
            id: runtime.id,
            languageName: runtime.languageName,
            fileExtension: runtime.fileExtension,
        };
        runtime.dispose();
        return info;
    });
}

/**
 * Create a new instance of a runtime engine by ID.
 */
export function createRuntime(id: string): RuntimeEngine | null {
    const factory = runtimeRegistry[id];
    if (!factory) {
        return null;
    }
    return factory();
}
