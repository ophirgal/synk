import type { RuntimeEngine } from "./types";

const CHEERPJ_VERSION = "4.2";
const CHEERPJ_CDN_URL = `https://cjrtnc.leaningtech.com/${CHEERPJ_VERSION}/loader.js`;
const CHEERPJ_SCRIPT_ID = "cheerpj-loader";

export class JavaRuntime implements RuntimeEngine {
    readonly id = "java";
    readonly languageName = "Java";
    readonly fileExtension = ".java";
    readonly languageId = "java";
    readonly defaultCode = `// Note: There must be at least one class called Main.
class Main {
    public static void main(String[] args) {
        System.out.println("Hello Java!");
    }
}`;
    private scriptElement: HTMLScriptElement | null = null;
    private consoleElement: HTMLElement | null = null;
    private observer: MutationObserver | null = null;
    private onOutput: ((text: string) => void) | null = null;
    private ready = false;

    isReady(): boolean {
        return this.ready
    }

    async load(onOutput: (text: string) => void): Promise<void> {
        this.onOutput = onOutput;

        // Create a hidden console element that CheerpJ writes to
        this.consoleElement = document.createElement("pre");
        this.consoleElement.id = "console";
        this.consoleElement.style.display = "none";
        document.body.appendChild(this.consoleElement);

        // Watch for changes to the console element and forward to onOutput
        this.observer = new MutationObserver(() => {
            if (this.consoleElement && this.onOutput) {
                const text = this.consoleElement.innerText;
                if (text) {
                    this.onOutput(text);
                    this.consoleElement.innerHTML = "";
                }
            }
        });
        this.observer.observe(this.consoleElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return new Promise((resolve, reject) => {
            if (this.ready) {
                resolve();
                return;
            }

            // Add the CheerpJ script to the page
            this.scriptElement = document.createElement("script");
            this.scriptElement.id = CHEERPJ_SCRIPT_ID;
            this.scriptElement.src = CHEERPJ_CDN_URL;
            this.scriptElement.onload = async () => {
                try {
                    await (window as any).cheerpjInit({
                        status: "none",
                    });
                    this.ready = true;
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            this.scriptElement.onerror = () => {
                reject(new Error("Failed to load CheerpJ script"));
            };

            document.body.appendChild(this.scriptElement);
        });
    }

    async runCode(code: string): Promise<void> {
        if (!this.ready) {
            throw new Error("Java engine is not loaded yet");
        }

        const fileName = "Main";
        const sourcePath = `/str/${fileName}.java`;
        const classPath = "/app/tools.jar:/files/";

        // Write the source code to the CheerpJ Virtual File System
        (window as any).cheerpOSAddStringFile(sourcePath, code);

        // Compile the code using javac bundled with CheerpJ
        // Args are spread, not passed as an array
        const compilerResult = await (window as any).cheerpjRunMain(
            "com.sun.tools.javac.Main", // relies on /tools.jar (in /public)
            classPath,
            sourcePath,
            "-d",
            "/files/"
        );

        // Run the compiled class only if compilation succeeded
        if (compilerResult === 0) {
            await (window as any).cheerpjRunMain(fileName, classPath);
        }
    }

    dispose(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.consoleElement && this.consoleElement.parentNode) {
            this.consoleElement.parentNode.removeChild(this.consoleElement);
        }

        if (this.scriptElement && this.scriptElement.parentNode) {
            this.scriptElement.parentNode.removeChild(this.scriptElement);
        }

        this.consoleElement = null;
        this.scriptElement = null;
        this.onOutput = null;
    }
}