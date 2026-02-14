import * as Y from 'yjs';

type SyncMessage =
    | { type: 'sync-step-1'; stateVector: number[] }
    | { type: 'sync-step-2'; diff: number[]; stateVector: number[] }
    | { type: 'yjs-update'; data: number[] }
    | { type: 'profile-update'; data: string };

export type Editors = {
    [key: string]: { position: { lineNumber: number; column: number } }
};

export type Profile = {
    displayName: string;
    avatar: string;
    isCameraOn: boolean;
    isMicrophoneOn: boolean;
    isRoomCreator: boolean;
    currentLanguage: string;
    languageChangedAt: number;
    activeEditor?: string;
    editors: Editors;
};

type ConnectionState = {
    dataChannel: RTCDataChannel;
    isConnected: boolean;
    isSynced: boolean;
};

export class WebRTCDataProvider {
    private doc: Y.Doc;
    private localProfileRef: { current: Profile };
    private onRemoteProfileUpdate: (connectionId: string, profile: Profile) => void;
    private connections: { [connectionId: string]: ConnectionState } = {};

    onSynced?: (connectionId: string) => void;
    onDisconnect?: (connectionId: string) => void;

    constructor(doc: Y.Doc, localProfileRef: { current: Profile }, onRemoteProfileUpdate: (connectionId: string, profile: Profile) => void) {
        this.doc = doc;
        this.doc.on('update', this.handleLocalDocUpdate);
        this.localProfileRef = localProfileRef;
        this.onRemoteProfileUpdate = onRemoteProfileUpdate;
    }

    connect(connectionId: string, dataChannel: RTCDataChannel): void {
        this.connections[connectionId] = {
            dataChannel,
            isConnected: false,
            isSynced: false,
        };

        dataChannel.onmessage = (event) => this.handleRemoteMessage(connectionId, event);
        dataChannel.onclose = () => this.handleChannelClose(connectionId);
        dataChannel.onerror = (error) => this.handleChannelError(connectionId, error);

        if (dataChannel.readyState === 'open') {
            this.connections[connectionId].isConnected = true;
            this.sendSyncStep1(connectionId);
            this.sendProfileUpdate(this.localProfileRef.current);
        }
    }

    private handleLocalDocUpdate = (update: Uint8Array, origin: unknown): void => {
        if (origin === 'remote') {
            return;
        }

        // Broadcast to all connected peers
        Object.entries(this.connections).forEach(([connectionId, conn]) => {
            if (conn.isConnected) {
                this.sendMessage(connectionId, {
                    type: 'yjs-update',
                    data: Array.from(update),
                });
            }
        });
    };

    private handleRemoteMessage = (connectionId: string, event: MessageEvent): void => {
        try {
            const message = JSON.parse(event.data) as SyncMessage;
            switch (message.type) {
                case 'sync-step-1':
                    this.handleSyncStep1(connectionId, message);
                    break;
                case 'sync-step-2':
                    this.handleSyncStep2(connectionId, message);
                    break;
                case 'yjs-update':
                    this.handleRemoteYjsUpdate(message);
                    break;
                case 'profile-update':
                    this.handleRemoteProfileUpdateMessage(connectionId, message);
                    break;
            }
        } catch (err) {
            console.error('[WebRTCDataProvider] Error parsing message:', err);
        }
    };

    private sendSyncStep1(connectionId: string): void {
        const stateVector = Y.encodeStateVector(this.doc);
        this.sendMessage(connectionId, {
            type: 'sync-step-1',
            stateVector: Array.from(stateVector),
        });
    }

    private handleSyncStep1(connectionId: string, message: { stateVector: number[] }): void {
        const remoteStateVector = new Uint8Array(message.stateVector);
        const diff = Y.encodeStateAsUpdate(this.doc, remoteStateVector);
        const ourStateVector = Y.encodeStateVector(this.doc);

        this.sendMessage(connectionId, {
            type: 'sync-step-2',
            diff: Array.from(diff),
            stateVector: Array.from(ourStateVector),
        });
    }

    private handleSyncStep2(connectionId: string, message: { diff: number[]; stateVector: number[] }): void {
        const diff = new Uint8Array(message.diff);
        Y.applyUpdate(this.doc, diff, 'remote');

        const remoteStateVector = new Uint8Array(message.stateVector);
        const ourDiff = Y.encodeStateAsUpdate(this.doc, remoteStateVector);

        if (ourDiff.length > 0) {
            this.sendMessage(connectionId, {
                type: 'yjs-update',
                data: Array.from(ourDiff),
            });
        }

        if (this.connections[connectionId]) {
            this.connections[connectionId].isSynced = true;
        }
        this.onSynced?.(connectionId);
    }

    public sendProfileUpdate = (profile: Profile): void => {
        // Broadcast profile to all connected peers
        Object.entries(this.connections).forEach(([connectionId, conn]) => {
            if (conn.isConnected) {
                this.sendMessage(connectionId, {
                    type: 'profile-update',
                    data: JSON.stringify(profile),
                });
            }
        });
    }

    private handleRemoteProfileUpdateMessage(connectionId: string, message: { data: string }): void {
        const profile = JSON.parse(message.data) as Profile;
        this.onRemoteProfileUpdate(connectionId, profile);
    }

    private handleRemoteYjsUpdate(message: { data: number[] }): void {
        const update = new Uint8Array(message.data);
        Y.applyUpdate(this.doc, update, 'remote');
    }

    private sendMessage(connectionId: string, message: SyncMessage): void {
        const conn = this.connections[connectionId];
        if (conn?.dataChannel?.readyState === 'open') {
            conn.dataChannel.send(JSON.stringify(message));
        }
    }

    private handleChannelClose = (connectionId: string): void => {
        if (this.connections[connectionId]) {
            this.connections[connectionId].isConnected = false;
        }
        this.onDisconnect?.(connectionId);
    };

    private handleChannelError = (connectionId: string, error: Event): void => {
        console.error(`[WebRTCDataProvider] Data channel error for ${connectionId}:`, error);
    };

    disconnect(connectionId: string): void {
        if (this.connections[connectionId]) {
            delete this.connections[connectionId];
        }
    }

    destroy(): void {
        this.doc.off('update', this.handleLocalDocUpdate);
        this.connections = {};
    }
}
