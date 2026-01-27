import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode
} from 'react';
import * as Y from 'yjs';
import { WebRTCProvider } from '@/lib/collaboration';
import { createRuntime } from '@/lib/runtime';

interface CollaborationContextType {
    yDoc: Y.Doc;
    yText: Y.Text;
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
    const [yText, setYText] = useState(yDocRef.current.getText(`${currentLanguage}`));

    useEffect(() => {
        const currentYText = yDocRef.current.getText(`${currentLanguage}`);
        if (currentYText.length === 0) {
            const runtime = createRuntime(currentLanguage);
            currentYText.insert(0, runtime?.defaultCode ?? "");
        }
        setYText(currentYText);

    }, [currentLanguage]);

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
                yText,
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
