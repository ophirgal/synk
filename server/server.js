import { PeerServer } from 'peer';
const server = PeerServer({ port: 9000, path: "/" });
server.on("connection", (client) => {
    console.log("Client connected:", client.getId());
});
server.on("disconnect", (client) => {
    console.log("Client disconnected:", client.getId());
});
//# sourceMappingURL=server.js.map