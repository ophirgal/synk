import { PeerServer } from 'peer';

const server = PeerServer({ port: 9000, path: "/" });

server.on("connection", (client: any) => {
    console.log("Client connected:", client.getId());
});

server.on("disconnect", (client: any) => {
    console.log("Client disconnected:", client.getId());
});