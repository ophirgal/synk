import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode
} from 'react';
import { useParams } from 'react-router';
import * as Y from 'yjs';

import { WebRTCDataProvider, type Profile } from '@/lib/webrtc';
import { runtimeRegistry } from '@/lib/runtimes';
import { generateUsername } from '@/lib/utils';
import { textEditorDefaultText, textEditorTextId } from '@/constants/constants';

interface CollaborationContextType {
    yDoc: Y.Doc;
    localProfile: Profile;
    remoteProfile: Profile;
    updateLocalProfile: (update: Partial<Profile>) => void;
    isConnected: boolean;
    isSynced: boolean;
    connectDataChannel: (channel: RTCDataChannel) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function CollaborationProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const pathParams = useParams(); // check if id path variable exists (joining an existing room)
    const [localProfile, setLocalProfile] = useState<Profile>(createInitialProfile(generateUsername(), !pathParams.id));
    const [remoteProfile, setRemoteProfile] = useState<Profile>(createInitialProfile());

    const yDocRef = useRef<Y.Doc>(new Y.Doc());
    const providerRef = useRef<WebRTCDataProvider | null>(null);
    // maintain reference to latest local profile to be used by external WebRTCDataProvider
    const localProfileRef = useRef(localProfile);
    localProfileRef.current = localProfile;

    const handleRemoteProfileUpdate = (profile: Profile) => {
        // alert("received remote profile update: " + JSON.stringify(profile))
        setRemoteProfile(_ => ({ ...profile })); // important: force an update by creating a new object
    }

    const updateLocalProfile = useCallback((update: Partial<Profile>) => {
        const updatedProfile = { ...localProfile, ...update }; // important: force an update by creating a new object
        // alert("updating local profile: " + JSON.stringify(updatedProfile))
        setLocalProfile(updatedProfile);
    }, [localProfile]);

    const connectDataChannel = (channel: RTCDataChannel) => {
        if (providerRef.current) {
            providerRef.current.connect(channel);
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

        providerRef.current.onSynced = () => {
            setIsSynced(true);
        };

        providerRef.current.onDisconnect = () => {
            setIsConnected(false);
            setIsSynced(false);
        };

        // Display default text for all editors (text editor and all programming language editors)
        initDefaultEditorContent(textEditorTextId, textEditorDefaultText);
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
        // alert("USE-EFFECT-TRIGGERED !!!\n\nproviderRef.current is: " + JSON.stringify(providerRef.current))
        if (!providerRef.current) return;
        // alert("sending local profile update: " + JSON.stringify(localProfile))
        providerRef.current.sendProfileUpdate(localProfile);
    }, [localProfile]);

    return (
        <CollaborationContext.Provider
            value={{
                yDoc: yDocRef.current,
                localProfile,
                remoteProfile,
                updateLocalProfile,
                isConnected,
                isSynced,
                connectDataChannel,
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
    username: string = '',
    isRoomCreator: boolean = false,
    isCameraOn: boolean = false,
    isMicrophoneOn: boolean = false,
    currentLanguage: string = 'python'
): Profile {
    const initialEditors: any = {}
    Object.keys(runtimeRegistry).forEach(languageId => {
        initialEditors[languageId] = { position: { lineNumber: 1, column: 1 } }
    })

    return {
        username,
        isCameraOn,
        isMicrophoneOn,
        isRoomCreator,
        currentLanguage,
        editors: initialEditors,
    };
}