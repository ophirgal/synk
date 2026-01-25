/**
 * Web Worker for executing JavaScript code in isolation.
 * This worker runs in a separate thread without access to the DOM,
 * providing a sandboxed environment for user code execution.
 */

// Message types for communication with the main thread
interface ExecuteMessage {
    type: "execute";
    code: string;
    id: string;
}

interface OutputMessage {
    type: "output";
    text: string;
}

interface ResultMessage {
    type: "result";
    id: string;
    success: boolean;
    error?: string;
}

type IncomingMessage = ExecuteMessage;
// type OutgoingMessage = OutputMessage | ResultMessage;

// Override console methods to capture output
// const originalConsole = {
//     log: console.log,
//     error: console.error,
//     warn: console.warn,
//     info: console.info,
// };

/**
 * Sends a message to the main thread with the given text as the output.
 * This function is used to capture output from user code execution.
 * @param text - The text to be sent as the output.
 */
function sendOutput(text: string): void {
    self.postMessage({ type: "output", text } satisfies OutputMessage);
}

// Create custom console that sends output to main thread
const customConsole = {
    log: (...args: unknown[]): void => {
        sendOutput(args.map((arg) => formatValue(arg)).join(" ") + "\n");
    },
    error: (...args: unknown[]): void => {
        sendOutput("[Error] " + args.map((arg) => formatValue(arg)).join(" ") + "\n");
    },
    warn: (...args: unknown[]): void => {
        sendOutput("[Warn] " + args.map((arg) => formatValue(arg)).join(" ") + "\n");
    },
    info: (...args: unknown[]): void => {
        sendOutput(args.map((arg) => formatValue(arg)).join(" ") + "\n");
    },
};

// Format values for display
function formatValue(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return value;
    if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
    if (typeof value === "symbol") return value.toString();
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (Array.isArray(value)) {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return "[Array]";
        }
    }
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return "[Object]";
        }
    }
    return String(value);
}

// Execute code in the worker context
async function executeCode(code: string, id: string): Promise<void> {
    try {
        // Create a function with custom console in scope
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        const wrappedCode = `
            const console = this.console;
            ${code}
        `;
        const fn = new AsyncFunction(wrappedCode);
        await fn.call({ console: customConsole });

        self.postMessage({
            type: "result",
            id,
            success: true,
        } satisfies ResultMessage);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        sendOutput(`Error: ${errorMessage}\n`);
        if (errorStack) {
            // Clean up the stack trace to remove worker internals
            const cleanStack = errorStack
                .split("\n")
                .filter((line) => !line.includes("javascript.worker"))
                .join("\n");
            if (cleanStack !== errorMessage) {
                sendOutput(`${cleanStack}\n`);
            }
        }

        self.postMessage({
            type: "result",
            id,
            success: false,
            error: errorMessage,
        } satisfies ResultMessage);
    }
}

// Handle incoming messages
self.onmessage = (event: MessageEvent<IncomingMessage>): void => {
    const message = event.data;

    if (message.type === "execute") {
        executeCode(message.code, message.id);
    }
};

// Signal that the worker is ready
self.postMessage({ type: "ready" });
