# Synk

**Real-time collaborative development environment** — pair program, run code, and sketch ideas together in a shared browser session.

## Features

- **Collaborative code editor** — Monaco (VS Code's editor) synchronized across peers via Yjs CRDTs; supports JavaScript, Python, and Java with in-browser execution
- **Live whiteboard** — Excalidraw canvas with real-time multi-user sync
- **Shared notes** — collaborative plain-text scratchpad
- **Video & audio** — peer-to-peer media streams via WebRTC
- **Live cursors** — see collaborators' cursor positions and active tabs in real time
- **No account required** — share a room link and start collaborating instantly

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Real-time sync | Yjs (CRDT), y-monaco, y-excalidraw |
| Networking | WebRTC (PeerJS), Firebase Realtime DB (signaling + presence) |
| Editors | Monaco Editor, Excalidraw |
| Auth / Infra | Firebase Authentication, Firebase Hosting |
| UI | Radix UI, shadcn/ui components |

## Getting Started

**Prerequisites:** Node.js 18+, a Firebase project with Realtime Database enabled.

```bash
git clone https://github.com/ophirgal/synk.git
cd synk
npm install

# Copy the example env and fill in your Firebase config
cp devenv .env.local   # then edit VITE_FIREBASE_* values

npm run dev            # starts both client (Vite) and signaling server
```

Open [http://localhost:5173](http://localhost:5173), create a room, and share the URL.

## Architecture

```
User visits /rooms/:id
  └── CollaborationProvider
        ├── PeerJSConnectionProvider   # media + data connections (WebRTC)
        ├── WebRTCDataProvider         # Yjs CRDT sync over RTCDataChannel
        └── PeerJSRoomService          # Firebase presence registry + PeerJS signaling
```

Peers discover each other via Firebase RTDB, negotiate connections through PeerJS Cloud, and exchange Yjs sync messages directly over encrypted RTCDataChannels. TURN credentials are fetched from Firebase at connection time to ensure relay fallback.

## Deployment

```bash
./deploy.sh dev    # deploy to Firebase dev project
./deploy.sh prod   # deploy to Firebase prod project
```

The deploy script swaps the appropriate env file (`devenv` / `prodenv`) into `.env.local`, runs the production build, and calls `firebase deploy`.

## Design Decisions

**P2P mesh over a media server (SFU/MCU)**
All audio, video, and data travel directly between peers — no media relay server is involved beyond TURN fallback. This eliminates server infrastructure costs and keeps latency low. The trade-off is that bandwidth scales with participant count (each peer sends N−1 streams), which makes the architecture impractical beyond small rooms (~4–6 people). A production scale-out path would replace the mesh with an SFU (e.g. LiveKit, mediasoup).

**Yjs CRDTs over Operational Transformation**
Collaborative text and whiteboard state are synchronized using Yjs, a CRDT library. CRDTs merge concurrent edits without a central authority, which is a natural fit for a P2P topology where there is no single source of truth. The trade-off versus OT (used by e.g. Google Docs) is a larger in-memory document state and more complex data structures — acceptable at this scale.

**Firebase as signaling layer, not a custom server**
Room presence and peer discovery use Firebase Realtime Database rather than a dedicated WebSocket signaling server. This removed an entire infrastructure concern during early development and provides built-in presence (`.onDisconnect`) for free. The trade-off is vendor coupling and less control over signaling latency and message format. The self-hosted PeerJS signaling server (in `/server`) was added later as an override for environments where PeerJS Cloud is undesirable.

**PeerJS for WebRTC abstraction**
PeerJS wraps the raw `RTCPeerConnection` API, handling offer/answer negotiation and ICE trickling. This significantly reduced boilerplate and accelerated initial development. The downside is an added dependency and a layer of abstraction that can make debugging lower-level ICE failures harder.

**TURN over TLS on port 443**
TURN servers are configured to accept connections over `turns:` (TLS) on port 443 as the primary transport. This ensures connectivity through strict corporate firewalls that block UDP or non-standard TCP ports, at the cost of slightly higher connection setup time. Direct STUN/P2P is still attempted first (`iceTransportPolicy: "all"`), so the TURN relay is only used when needed.

**In-browser code execution**
JavaScript runs via `eval` in a sandboxed worker context; Python and Java are executed by sending code to a lightweight backend service. This avoids the complexity of a full execution sandbox for the most common use case (JavaScript) while still supporting compiled languages. The trade-off is that JavaScript execution shares the browser process and has no hard resource limits.

## License

MIT
