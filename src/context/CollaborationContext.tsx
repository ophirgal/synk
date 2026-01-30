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

import { WebRTCProvider } from '@/lib/collaboration';
import { runtimeRegistry } from '@/lib/runtimes';

interface CollaborationContextType {
    yDoc: Y.Doc;
    currentLanguage: string;
    setCurrentLanguage: (language: string) => void;
    isConnected: boolean;
    isSynced: boolean;
    connectDataChannel: (channel: RTCDataChannel) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function CollaborationProvider({ children }: { children: ReactNode }) {
    const yDocRef = useRef<Y.Doc>(new Y.Doc());
    const providerRef = useRef<WebRTCProvider | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('python');
    const pathParams = useParams(); // check if id path variable exists (joining an existing room)

    // Initialize runtime engines and the WebRTC provider
    useEffect(() => {
        providerRef.current = new WebRTCProvider(yDocRef.current);

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

    // Display default code for current language
    // (if have not joined an existing room AND editor is empty)
    useEffect(() => {
        const isJoinedExisitingRoom = !!pathParams.id
        const yText = yDocRef.current.getText(`${currentLanguage}`);
        const isEditorEmpty = yText.toString().length === 0;
        if (!isJoinedExisitingRoom && isEditorEmpty) {
            const runtime = runtimeRegistry[currentLanguage];
            yText.insert(0, runtime.defaultCode);
        }
    }, [currentLanguage]);


    const connectDataChannel = useCallback((channel: RTCDataChannel) => {
        if (providerRef.current) {
            providerRef.current.connect(channel);
            setIsConnected(true);
        }
    }, []);

    return (
        <CollaborationContext.Provider
            value={{
                yDoc: yDocRef.current,
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
