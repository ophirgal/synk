import * as Y from 'yjs';

type SyncMessage =
    | { type: 'sync-step-1'; stateVector: number[] }
    | { type: 'sync-step-2'; diff: number[]; stateVector: number[] }
    | { type: 'update'; data: number[] };

export class WebRTCProvider {
    private doc: Y.Doc;
    private dataChannel: RTCDataChannel | null = null;
    private isConnected = false;

    onSynced?: () => void;
    onDisconnect?: () => void;

    constructor(doc: Y.Doc) {
        this.doc = doc;
        this.doc.on('update', this.handleLocalUpdate);
    }

    connect(dataChannel: RTCDataChannel): void {
        this.dataChannel = dataChannel;

        this.dataChannel.onmessage = this.handleRemoteMessage;
        this.dataChannel.onclose = this.handleChannelClose;
        this.dataChannel.onerror = this.handleChannelError;

        if (this.dataChannel.readyState === 'open') {
            this.isConnected = true;
            this.sendSyncStep1();
        }
    }

    private handleLocalUpdate = (update: Uint8Array, origin: unknown): void => {
        if (origin === 'remote' || !this.isConnected || !this.dataChannel) {
            return;
        }

        this.sendMessage({
            type: 'update',
            data: Array.from(update),
        });
    };

    private handleRemoteMessage = (event: MessageEvent): void => {
        try {
            const message = JSON.parse(event.data) as SyncMessage;

            switch (message.type) {
                case 'sync-step-1':
                    this.handleSyncStep1(message);
                    break;
                case 'sync-step-2':
                    this.handleSyncStep2(message);
                    break;
                case 'update':
                    this.handleRemoteUpdate(message);
                    break;
            }
        } catch (err) {
            console.error('[WebRTCProvider] Error parsing message:', err);
        }
    };

    private sendSyncStep1(): void {
        const stateVector = Y.encodeStateVector(this.doc);
        this.sendMessage({
            type: 'sync-step-1',
            stateVector: Array.from(stateVector),
        });
    }

    private handleSyncStep1(message: { stateVector: number[] }): void {
        const remoteStateVector = new Uint8Array(message.stateVector);
        const diff = Y.encodeStateAsUpdate(this.doc, remoteStateVector);
        const ourStateVector = Y.encodeStateVector(this.doc);

        this.sendMessage({
            type: 'sync-step-2',
            diff: Array.from(diff),
            stateVector: Array.from(ourStateVector),
        });
    }

    private handleSyncStep2(message: { diff: number[]; stateVector: number[] }): void {
        const diff = new Uint8Array(message.diff);
        Y.applyUpdate(this.doc, diff, 'remote');

        const remoteStateVector = new Uint8Array(message.stateVector);
        const ourDiff = Y.encodeStateAsUpdate(this.doc, remoteStateVector);

        if (ourDiff.length > 0) {
            this.sendMessage({
                type: 'update',
                data: Array.from(ourDiff),
            });
        }

        this.onSynced?.();
    }

    private handleRemoteUpdate(message: { data: number[] }): void {
        const update = new Uint8Array(message.data);
        Y.applyUpdate(this.doc, update, 'remote');
    }

    private sendMessage(message: SyncMessage): void {
        if (this.dataChannel?.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
    }

    private handleChannelClose = (): void => {
        this.isConnected = false;
        this.onDisconnect?.();
    };

    private handleChannelError = (error: Event): void => {
        console.error('[WebRTCProvider] Data channel error:', error);
    };

    destroy(): void {
        this.doc.off('update', this.handleLocalUpdate);
        this.dataChannel = null;
        this.isConnected = false;
    }
}
