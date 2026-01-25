import type { RuntimeEngine } from "./types";

// Import the worker using Vite's worker syntax
import JavaScriptWorker from "./javascript.worker?worker";

interface WorkerMessage {
    type: "ready" | "output" | "result";
    text?: string;
    id?: string;
    success?: boolean;
    error?: string;
}

export class JavaScriptRuntime implements RuntimeEngine {
    readonly id = "javascript";
    readonly languageName = "JavaScript";
    readonly fileExtension = ".js";
    readonly codemirrorLanguage = "javascript";
    readonly defaultCode = `// Get the current date and time
const now = new Date();

// Format components
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const ms = String(now.getMilliseconds()).padStart(3, '0');

// Print formatted datetime
console.log(\`\${year}-\${month}-\${day} \${hours}:\${minutes}:\${seconds}:\${ms}\`);`;

    private worker: Worker | null = null;
    private onOutput: ((text: string) => void) | null = null;
    private pendingExecutions: Map<
        string,
        { resolve: () => void; reject: (error: Error) => void }
    > = new Map();
    private ready = false;

    isReady(): boolean {
        return this.ready;
    }

    async load(onOutput: (text: string) => void): Promise<void> {
        this.onOutput = onOutput;

        return new Promise((resolve, reject) => {
            try {
                this.worker = new JavaScriptWorker();

                this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
                    const message = event.data;

                    switch (message.type) {
                        case "ready":
                            this.ready = true;
                            resolve();
                            break;

                        case "output":
                            if (message.text && this.onOutput) {
                                this.onOutput(message.text);
                            }
                            break;

                        case "result":
                            if (message.id) {
                                const pending = this.pendingExecutions.get(message.id);
                                if (pending) {
                                    this.pendingExecutions.delete(message.id);
                                    if (message.success) {
                                        pending.resolve();
                                    } else {
                                        pending.reject(new Error(message.error || "Execution failed"));
                                    }
                                }
                            }
                            break;
                    }
                };

                this.worker.onerror = (error) => {
                    if (!this.ready) {
                        reject(new Error(`Worker initialization failed: ${error.message}`));
                    } else {
                        this.onOutput?.(`Worker error: ${error.message}\n`);
                    }
                };
            } catch (err) {
                reject(err);
            }
        });
    }

    async runCode(code: string): Promise<void> {
        if (!this.worker || !this.ready) {
            throw new Error("JavaScript worker is not loaded yet");
        }

        const id = crypto.randomUUID();

        return new Promise((resolve, reject) => {
            this.pendingExecutions.set(id, { resolve, reject });

            this.worker!.postMessage({
                type: "execute",
                code,
                id,
            });
        });
    }

    dispose(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.pendingExecutions.clear();
        this.ready = false;
        this.onOutput = null;
    }
}
