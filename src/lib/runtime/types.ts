/**
 * Interface for runtime engines that can execute code in different programming languages.
 * Implementations of this interface should handle loading the runtime, executing code,
 * and managing output streams.
 */
export interface RuntimeEngine {
    /** Unique identifier for this runtime */
    readonly id: string;

    /** Display name for the language (e.g., "Python", "JavaScript") */
    readonly languageName: string;

    /** File extension for this language (e.g., ".py", ".js") */
    readonly fileExtension: string;

    /** CodeMirror language support identifier */
    readonly codemirrorLanguage: string;

    /** Default code to show when the editor is first loaded */
    readonly defaultCode: string;

    /** Whether the runtime has finished loading and is ready to execute code */
    isReady(): boolean;

    /**
     * Initialize and load the runtime engine.
     * @param onOutput - Callback function to receive output from code execution
     * @returns Promise that resolves when the runtime is ready
     */
    load(onOutput: (text: string) => void): Promise<void>;

    /**
     * Execute code using this runtime.
     * @param code - The source code to execute
     * @returns Promise that resolves when execution is complete
     */
    runCode(code: string): Promise<void>;

    /**
     * Clean up resources when the runtime is no longer needed.
     */
    dispose(): void;
}

/**
 * Metadata about a runtime engine for display in the UI.
 */
export interface RuntimeEngineInfo {
    id: string;
    languageName: string;
    fileExtension: string;
}

/**
 * Factory function type for creating runtime engines.
 */
export type RuntimeEngineFactory = () => RuntimeEngine;
