const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'client')));

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws) => {
    console.log('New player connected');

    ws.on('message', (data) => {
        const msg = JSON.parse(data);

        if (msg.type === 'join') {
            ws.room = msg.room;
            ws.username = msg.username;
            if (!rooms[msg.room]) rooms[msg.room] = new Set();
            rooms[msg.room].add(ws);
            console.log(`${msg.username} joined room: ${msg.room}`);
        }

        if (msg.type === 'chat') {
            const room = rooms[ws.room];
            if (room) {
                room.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            username: ws.username,
                            message: msg.message,
                        }));
                    }
                });
            }
        }
    });

    ws.on('close', () => {
        if (ws.room && rooms[ws.room]) {
            rooms[ws.room].delete(ws);
            console.log(`${ws.username} left room: ${ws.room}`);
        }
    });
});