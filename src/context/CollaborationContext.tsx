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

interface CollaborationContextType {
    yDoc: Y.Doc;
    localProfile: Profile;
    remoteProfile: Profile;
    updateLocalProfile: (update: Partial<Profile>) => void;
    currentLanguage: string;
    setCurrentLanguage: (language: string) => void;
    isConnected: boolean;
    isSynced: boolean;
    connectDataChannel: (channel: RTCDataChannel) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function CollaborationProvider({ children }: { children: ReactNode }) {
    const yDocRef = useRef<Y.Doc>(new Y.Doc());
    const providerRef = useRef<WebRTCDataProvider | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('python');
    const [localProfile, setLocalProfile] = useState<Profile>({ username: generateUsername(), isCameraOn: false, isMicrophoneOn: false });
    const [remoteProfile, setRemoteProfile] = useState<Profile>({ username: '', isCameraOn: false, isMicrophoneOn: false });
    const pathParams = useParams(); // check if id path variable exists (joining an existing room)

    const handleRemoteProfileUpdate = (profile: Profile) => {
        // alert("received remote profile update: " + JSON.stringify(profile))
        setRemoteProfile(profile);
    }

    const updateLocalProfile = useCallback((update: Partial<Profile>) => {
        const updatedProfile = { ...localProfile, ...update };
        // alert("updating local profile: " + JSON.stringify(updatedProfile))
        setLocalProfile(updatedProfile);
    }, [localProfile]);

    const connectDataChannel = (channel: RTCDataChannel) => {
        if (providerRef.current) {
            providerRef.current.connect(channel);
            setIsConnected(true);
        }
    };

    // Initialize runtime engines and the WebRTC provider (meant to run only once.)
    useEffect(() => {
        const initialProfile = localProfile; // using the initial state value (do not add dependencies)
        providerRef.current = new WebRTCDataProvider(yDocRef.current, initialProfile, handleRemoteProfileUpdate);

        providerRef.current.onSynced = () => {
            setIsSynced(true);
        };

        providerRef.current.onDisconnect = () => {
            setIsConnected(false);
            setIsSynced(false);
        };

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

    // Display default code for current language
    // (if have not joined an existing room AND editor is empty)
    useEffect(() => {
        const isJoinedExisitingRoom = !!pathParams.id
        const yText = yDocRef.current.getText(currentLanguage);
        const isEditorEmpty = yText.toString().length === 0;
        if (!isJoinedExisitingRoom && isEditorEmpty) {
            const runtime = runtimeRegistry[currentLanguage];
            yText.insert(0, runtime.defaultCode);
        }
    }, [currentLanguage]);

    return (
        <CollaborationContext.Provider
            value={{
                yDoc: yDocRef.current,
                localProfile,
                remoteProfile,
                updateLocalProfile,
                currentLanguage,
                setCurrentLanguage,
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
