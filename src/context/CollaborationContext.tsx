import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    type ReactNode,
    useSyncExternalStore,
    useMemo
} from 'react';
import { useParams } from 'react-router';
import * as Y from 'yjs';

import {
    WebRTCDataProvider,
    type Profile,
    type Editors,
    // WebRTCConnectionProvider,
    // type WebRTCConnection,
    ScratchTab
} from '@/lib/webrtc';
import { PeerJSConnectionProvider } from '@/lib/peerjs';
import type { IConnectionProvider, PeerConnection } from '@/lib/peerjs';
import { runtimeRegistry } from '@/lib/runtimes';
import { generateAvatarAndDisplayName } from '@/lib/utils';
import { TEXT_EDITOR_DEFAULT_TEXT, TEXT_EDITOR_YTEXT_ID } from '@/constants/constants';

export type RemoteProfiles = { [connectionId: string]: Profile };

interface CollaborationContextType {
    yDoc: Y.Doc;
    localProfile: Profile;
    remoteProfiles: RemoteProfiles;
    updateLocalProfile: (update: Partial<Profile> | ((prev: Profile) => Profile)) => void;
    isConnected: boolean;
    isSynced: boolean;
    connectDataChannel: (connectionId: string, channel: RTCDataChannel) => void;
    // connectionProvider: WebRTCConnectionProvider;
    // connections: { [connectionId: string]: WebRTCConnection };
    connectionProvider: IConnectionProvider;
    connections: Record<string, PeerConnection>;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function CollaborationProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [avatar, displayName] = generateAvatarAndDisplayName()
    const [localProfile, setLocalProfile] = useState<Profile>(createInitialProfile(avatar, displayName));
    const [remoteProfiles, setRemoteProfiles] = useState<RemoteProfiles>({});
    // const connectionProvider = useMemo<WebRTCConnectionProvider>(() => new WebRTCConnectionProvider(), []);
    const connectionProvider = useMemo<IConnectionProvider>(() => new PeerJSConnectionProvider(), []);
    const connections = useSyncExternalStore(connectionProvider.subscribe, connectionProvider.getSnapshot);


    const yDocRef = useRef<Y.Doc>(new Y.Doc());
    const providerRef = useRef<WebRTCDataProvider | null>(null);
    // maintain reference to latest local profile to be used by external WebRTCDataProvider
    const localProfileRef = useRef(localProfile);
    localProfileRef.current = localProfile;

    const handleRemoteProfileUpdate = (connectionId: string, profile: Profile) => {
        setRemoteProfiles(prev => ({
            ...prev,
            [connectionId]: { ...profile }
        }));
    }

    const updateLocalProfile = (update: Partial<Profile> | ((prev: Profile) => Profile)) => {
        setLocalProfile(prev => {
            let newProfile: Profile;
            if (typeof update === 'function') {
                newProfile = update(prev);
            } else {
                newProfile = { ...prev, ...update };
            }

            // Set timestamp when language changes (unless timestamp is explicitly provided)
            if (newProfile.currentLanguage !== prev.currentLanguage &&
                newProfile.languageChangedAt === prev.languageChangedAt) {
                newProfile = { ...newProfile, languageChangedAt: Date.now() };
            }

            // Set timestamp when scratch tab changes (unless timestamp is explicitly provided)
            if (newProfile.currentScratchTab !== prev.currentScratchTab &&
                newProfile.scratchTabChangedAt === prev.scratchTabChangedAt) {
                newProfile = { ...newProfile, scratchTabChangedAt: Date.now() };
            }

            return newProfile;
        });
    };

    const connectDataChannel = (connectionId: string, channel: RTCDataChannel) => {
        if (providerRef.current) {
            providerRef.current.connect(connectionId, channel);
            setIsConnected(true);
        }
    };

    /* Display default text/code content for an editor
     * (if have not joined an existing room AND editor is empty)
     * 
     * @param yTextId - the ID of the Y.Text to be modified
     * @param defaultContent - the default content to be displayed
     */
    const initDefaultEditorContent = (yTextId: string, defaultContent: string) => {
        const yText = yDocRef.current.getText(yTextId);
        const isEditorEmpty = yText.toString().length === 0;
        if (localProfile.isRoomCreator && isEditorEmpty) {
            yText.insert(0, defaultContent);
        }
    };

    // Initialize [used to be: init runtime engines] and the WebRTC provider (meant to run only once.)
    useEffect(() => {
        providerRef.current = new WebRTCDataProvider(yDocRef.current, localProfileRef, handleRemoteProfileUpdate);

        providerRef.current.onSynced = (_: string) => {
            setIsSynced(true);
        };

        providerRef.current.onDisconnect = (connectionId: string) => {
            setRemoteProfiles(prev => {
                const updated = { ...prev };
                delete updated[connectionId];
                return updated;
            });
            // Only set disconnected if no more connections remain
            setRemoteProfiles(prev => {
                if (Object.keys(prev).length === 0) {
                    setIsConnected(false);
                    setIsSynced(false);
                }
                return prev;
            });
        };

        // Display default text for all editors (text editor and all programming language editors)
        initDefaultEditorContent(TEXT_EDITOR_YTEXT_ID, TEXT_EDITOR_DEFAULT_TEXT);
        Object.keys(runtimeRegistry).forEach(languageId => {
            initDefaultEditorContent(languageId, runtimeRegistry[languageId].defaultCode);
        });

        return () => {
            providerRef.current?.destroy();
            yDocRef.current.destroy();
        };
    }, []);

    // Send local profile updates
    useEffect(() => {
        if (!providerRef.current) return;
        providerRef.current.sendProfileUpdate(localProfile);
    }, [localProfile]);

    return (
        <CollaborationContext.Provider
            value={{
                yDoc: yDocRef.current,
                localProfile,
                remoteProfiles,
                updateLocalProfile,
                isConnected,
                isSynced,
                connectDataChannel,
                connectionProvider,
                connections
            }}
        >
            {children}
        </CollaborationContext.Provider>
    );
}

export function useCollaboration() {
    const context = useContext(CollaborationContext);
    if (!context) {
        throw new Error('useCollaboration must be used within a CollaborationProvider');
    }
    return context;
}

function createInitialProfile(
    avatar: string = '',
    displayName: string = '',
    currentLanguage: string = 'python',
    activeEditor?: string,
    isCameraOn: boolean = false,
    isMicrophoneOn: boolean = false,
): Profile {
    const initialEditors: Editors = { [TEXT_EDITOR_YTEXT_ID]: { position: { lineNumber: 1, column: 1 } } }
    Object.keys(runtimeRegistry).forEach(languageId => {
        initialEditors[languageId] = { position: { lineNumber: 1, column: 1 } }
    })

    const pathParams = useParams(); // check if id path variable exists (joining an existing room)
    const isRoomCreator = !pathParams.id

    return {
        avatar,
        displayName,
        isCameraOn,
        isMicrophoneOn,
        isRoomCreator,
        currentLanguage,
        languageChangedAt: isRoomCreator ? Date.now() : 0,
        currentScratchTab: ScratchTab.NOTES,
        scratchTabChangedAt: isRoomCreator ? Date.now() : 0,
        activeEditor,
        editors: initialEditors,
    };
}