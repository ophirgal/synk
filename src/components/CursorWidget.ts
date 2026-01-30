import { editor as monaco, type IPosition } from "monaco-editor";

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
    className: string;
    preference: monaco.ContentWidgetPositionPreference[] = [
        monaco.ContentWidgetPositionPreference.ABOVE,
        monaco.ContentWidgetPositionPreference.BELOW
    ];
    private node: HTMLElement
    private hideTimeout?: NodeJS.Timeout;

    constructor(username: string, position: IPosition, className: string, hidden: boolean = true) {
        this.username = username;
        this.position = position;
        this.className = className;
        this.node = document.createElement("p");
        this.node.textContent = this.username;
        this.node.className = this.className;
        this.node.style.pointerEvents = "none"; // important
        if (hidden) {
            this.hide();
        }
    }

    getId() {
        return `user-cursor-${this.username}`
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
