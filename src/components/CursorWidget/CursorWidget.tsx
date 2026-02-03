import ReactDOMServer from "react-dom/server";
import { editor as monaco, type IPosition } from "monaco-editor";

import { ReactAnimal, type ReactAnimalNames } from "@/components/ReactAnimal";

export interface ICursorWidget extends monaco.IContentWidget {
    username: string;
    position: IPosition;
    className: string;
    preference: monaco.ContentWidgetPositionPreference[];
    show(): void
    hide(): void
}

export default class CursorWidget implements monaco.IContentWidget {
    username: string;
    position: IPosition;
    preference: monaco.ContentWidgetPositionPreference[] = [
        monaco.ContentWidgetPositionPreference.ABOVE,
        monaco.ContentWidgetPositionPreference.BELOW
    ];
    private node: HTMLElement
    private hideTimeout?: NodeJS.Timeout;

    constructor(username: string, position: IPosition, className: string, hidden: boolean = true) {
        this.username = username;
        this.position = position;
        this.node = this.createNode();
        this.node.className = this.node.className + " " + className;
        this.node.style.pointerEvents = "none"; // important
        if (hidden) {
            this.hide();
        }
    }

    private createNode(): HTMLElement {
        const node: HTMLElement = document.createElement("div");
        const avatarAnimal = this.username.split(' ')[1] as ReactAnimalNames
        const tsx = <ReactAnimal name={avatarAnimal} size="sm" shape="circle" color="indigo" dance />
        const htmlString = ReactDOMServer.renderToString(tsx);
        node.innerHTML = htmlString;
        return node;
    }

    getId() {
        return `user-cursor-${this.username.replace(" ", "-")}`
    }

    getDomNode() {
        return this.node;
    }

    getPosition() {
        return {
            position: this.position,
            preference: this.preference,
        };
    }

    /**
     * Shows the cursor widget, hiding it after the given timeout (if specified).
     * Cancels any existing hide timeout.
     * @param {number} [hideAfter] - Time in milliseconds until the widget is hidden.
     */
    show(hideAfter?: number) {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.node.style.display = "block";
        this.hideTimeout = setTimeout(() => this.hide(), hideAfter);
    }

    hide() {
        this.node.style.display = "none";
    }
};
