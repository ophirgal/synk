import * as Y from 'yjs';

type SyncMessage =
    | { type: 'sync-step-1'; stateVector: number[] }
    | { type: 'sync-step-2'; diff: number[]; stateVector: number[] }
    | { type: 'yjs-update'; data: number[] }
    | { type: 'profile-update'; data: string };

export type Profile = {
    username: string;
    isCameraOn: boolean;
    isMicrophoneOn: boolean;
};

export class WebRTCDataProvider {
    private doc: Y.Doc;
    private localProfileRef: { current: Profile };
    private onRemoteProfileUpdate: (profile: Profile) => void;
    private dataChannel: RTCDataChannel | null = null;
    private isConnected = false;

    onSynced?: () => void;
    onDisconnect?: () => void;

    constructor(doc: Y.Doc, localProfileRef: { current: Profile }, onRemoteProfileUpdate: (profile: Profile) => void) {
        this.doc = doc;
        this.doc.on('update', this.handleLocalDocUpdate);
        this.localProfileRef = localProfileRef;
        this.onRemoteProfileUpdate = onRemoteProfileUpdate;
    }

    connect(dataChannel: RTCDataChannel): void {
        this.dataChannel = dataChannel;

        this.dataChannel.onmessage = this.handleRemoteMessage;
        this.dataChannel.onclose = this.handleChannelClose;
        this.dataChannel.onerror = this.handleChannelError;

        if (this.dataChannel.readyState === 'open') {
            this.isConnected = true;
            this.sendSyncStep1();
            this.sendProfileUpdate(this.localProfileRef.current);
        }
    }

    private handleLocalDocUpdate = (update: Uint8Array, origin: unknown): void => {
        if (origin === 'remote' || !this.isConnected || !this.dataChannel) {
            return;
        }

        this.sendMessage({
            type: 'yjs-update',
            data: Array.from(update),
        });
    };

    private handleRemoteMessage = (event: MessageEvent): void => {
        try {
            const message = JSON.parse(event.data) as SyncMessage;
            // alert("received message: " + JSON.stringify(message))
            switch (message.type) {
                case 'sync-step-1':
                    this.handleSyncStep1(message);
                    break;
                case 'sync-step-2':
                    this.handleSyncStep2(message);
                    break;
                case 'yjs-update':
                    this.handleRemoteYjsUpdate(message);
                    break;
                case 'profile-update':
                    this.handleRemoteProfileUpdate(message);
                    break;
            }
        } catch (err) {
            console.error('[WebRTCDataProvider] Error parsing message:', err);
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
                type: 'yjs-update',
                data: Array.from(ourDiff),
            });
        }

        this.onSynced?.();
    }

    public sendProfileUpdate = (profile: Profile): void => {
        // alert("sending local profile: " + JSON.stringify(profile))
        this.sendMessage({
            type: 'profile-update',
            data: JSON.stringify(profile),
        });
    }

    private handleRemoteProfileUpdate(message: { data: string }): void {
        const profile = JSON.parse(message.data) as Profile;
        this.onRemoteProfileUpdate(profile);
    }

    private handleRemoteYjsUpdate(message: { data: number[] }): void {
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
        console.error('[WebRTCDataProvider] Data channel error:', error);
    };

    destroy(): void {
        this.doc.off('update', this.handleLocalDocUpdate);
        this.dataChannel = null;
        this.isConnected = false;
    }
}
