import type { RuntimeEngine } from "./types";

interface PyodideInterface {
    runPythonAsync: (code: string) => Promise<any>;
    loadPackage: (pkg: string) => Promise<void>;
    globals: {
        set: (key: string, value: any) => void;
        get: (key: string) => any;
    };
    pyimport: (module: string) => any;
    toPy: (obj: any) => any;
}

const PYODIDE_VERSION = "0.29.3";
const PYODIDE_CDN_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export class PythonRuntime implements RuntimeEngine {
    readonly id = "python";
    readonly languageName = "Python";
    readonly fileExtension = ".py";
    readonly languageId = "python";
    readonly defaultCode = `from datetime import datetime

# 1. Get the current datetime object
current_time = datetime.now()

# 2. Format the datetime object into a specific string format
formatted_time = current_time.strftime("%Y-%m-%d %H:%M:%S:%f")[:-3]

# 3. Print the result
print(formatted_time)`;

    private pyodide: PyodideInterface | null = null;
    private scriptElement: HTMLScriptElement | null = null;
    private onOutput: ((text: string) => void) | null = null;

    isReady(): boolean {
        return this.pyodide !== null;
    }

    async load(onOutput: (text: string) => void): Promise<void> {
        this.onOutput = onOutput;

        return new Promise((resolve, reject) => {
            // Add the Pyodide script to the page
            this.scriptElement = document.createElement("script");
            this.scriptElement.src = `${PYODIDE_CDN_URL}pyodide.js`;

            this.scriptElement.onload = async () => {
                try {
                    // @ts-ignore - loadPyodide is added to window by the script
                    const pyodide = await (window as any).loadPyodide({
                        indexURL: PYODIDE_CDN_URL,
                    });

                    // Redirect stdout/stderr to our custom output handler
                    pyodide.globals.set("sys", pyodide.pyimport("sys"));

                    const outputHandler = this.onOutput;
                    class StdoutWriter {
                        write(s: string) {
                            outputHandler?.(s);
                        }
                        flush() { }
                    }

                    pyodide.globals.get("sys").stdout = pyodide.toPy(new StdoutWriter());
                    pyodide.globals.get("sys").stderr = pyodide.toPy(new StdoutWriter());

                    this.pyodide = pyodide;
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            this.scriptElement.onerror = () => {
                reject(new Error("Failed to load Pyodide script"));
            };

            document.body.appendChild(this.scriptElement);
        });
    }

    async runCode(code: string): Promise<void> {
        if (!this.pyodide) {
            throw new Error("Pyodide is not loaded yet");
        }

        await this.pyodide.runPythonAsync(code);
    }

    dispose(): void {
        if (this.scriptElement && this.scriptElement.parentNode) {
            this.scriptElement.parentNode.removeChild(this.scriptElement);
        }
        this.pyodide = null;
        this.scriptElement = null;
        this.onOutput = null;
    }
}
