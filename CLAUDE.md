# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check + build (tsc -b && vite build)
npm run lint       # ESLint

# Deploy
./deploy.sh dev    # Deploy to dev Firebase project (uses devenv → .env.local)
./deploy.sh prod   # Deploy to prod Firebase project (uses prodenv → .env.local)
```

There are no tests. The build command (`npm run build`) serves as the primary type/lint validation gate.

## Environment

Firebase config is loaded from `.env.local` via `VITE_FIREBASE_*` variables. For local dev, the `devenv` file is copied to `.env.local`. Never commit `devenv`, `prodenv`, or `.env.local`.

## Architecture

### High-Level Flow

```
User visits /rooms/:id  →  RoomPage
  └── CollaborationProvider (context)
        ├── PeerJSConnectionProvider  (media + data connections, useSyncExternalStore)
        ├── WebRTCDataProvider        (Yjs CRDT sync over RTCDataChannel)
        └── PeerJSRoomService         (Firebase room registry + PeerJS signaling)
```

### Connection Lifecycle

1. `RoomPage` mounts → `CollaborationProvider` creates a `PeerJSConnectionProvider` instance
2. `connectionProvider.init(camOn, micOn)` — acquires local stream, creates the PeerJS `Peer` (connects to PeerJS Cloud for signaling)
3. **Create room**: `PeerJSRoomService.createRoom()` pushes a participant entry to Firebase RTDB (`rooms/<id>/participants`), then calls `listenForIncomingConnections()` to accept inbound PeerJS connections
4. **Join room**: `PeerJSRoomService.joinRoom()` reads existing participants from Firebase → `connectToPeer()` to each → registers self in Firebase
5. On data channel open → `connectDataChannel()` → `WebRTCDataProvider.connect()` starts the Yjs sync handshake (sync-step-1 / sync-step-2 / yjs-update messages)

### Key Layers

| Layer | Files | Responsibility |
|---|---|---|
| **Connection provider** | `src/lib/peerjs/PeerJSConnectionProvider.ts` | PeerJS peer lifecycle, local/remote media streams, `useSyncExternalStore` state |
| **Data sync** | `src/lib/webrtc/webrtc-data.ts` | Yjs CRDT sync + profile updates over raw RTCDataChannel |
| **Room service** | `src/services/PeerJSRoomService.ts` | Firebase presence registry; initiates/accepts PeerJS connections |
| **Collaboration context** | `src/context/CollaborationContext.tsx` | Central React context wiring the above + `remoteProfiles`, `localProfile`, `yDoc` |
| **Room UI** | `src/pages/RoomPage/RoomPage.tsx` | Orchestrates init, create/join, camera/mic toggles, renders panels |

### Yjs Document Structure

Each collaborative editor maps to a named `Y.Text` on the shared `Y.Doc`:
- `"text-editor"` — the plain text editor (`TEXT_EDITOR_YTEXT_ID`)
- `"python"`, `"javascript"`, `"java"` — one per runtime language id
- `"whiteboard-elements"`, `"whiteboard-assets"` — Excalidraw whiteboard

### Runtime System

`src/lib/runtimes/registry.ts` exports `runtimeRegistry: Record<string, RuntimeEngine>`. Each entry's key is both the Yjs text ID and the Monaco language ID. Add new languages by implementing `RuntimeEngine` and registering in the registry.

### Profile Sync

`Profile` (defined in `src/lib/webrtc/webrtc-data.ts`) is broadcast peer-to-peer via the `profile-update` message type whenever `localProfile` changes. It carries cursor positions, camera/mic state, current language, and scratch tab.

### ICE/TURN Config

TURN credentials (`turnUsername`, `turnCredential`) are fetched from Firebase RTDB at connection time. Config is in `src/lib/peerjs/constants.ts` (`buildPeerOptions`). The legacy WebRTC path (`src/lib/webrtc/`) is kept but currently unused — `PeerJSConnectionProvider` replaced `WebRTCConnectionProvider`.

### Room UI Panels

`RoomPage` renders three resizable panels (via `react-resizable-panels`):
- **ScratchPanel** — tabbed Notes (plain text, `y-monaco` not used here) + Whiteboard (Excalidraw + `y-excalidraw`)
- **CodeEditor** — Monaco editor with runtime execution; language selector synced via `localProfile`
- **Video Panel** — `LivestreamPlayer` per remote connection + local video

### Path Aliases

`@/` maps to `src/` (configured via `vite-tsconfig-paths` + `tsconfig.app.json`).
