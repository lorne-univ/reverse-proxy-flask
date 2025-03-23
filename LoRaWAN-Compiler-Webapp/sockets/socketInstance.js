const { Server } = require("socket.io");
const socketIo = require('socket.io');
const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
let io;

// Initializes the Socket.IO server with CORS settings and handles client connections.
const initSocket = (server, containerIdMap) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('cancel_compilation', (data) => {
            stopContainer(socket.id, data.id, containerIdMap);
        });
    });
};

/*
 * Stop the container based on the compiled id
 * 
*/
async function stopContainer(clientId, compileId, containerIdMap) {
    const containerId = containerIdMap[compileId];
    if (!containerId) {
        console.error(`No container found for compileId: ${compileId}`);
        return;
    }
    try {
        const container = docker.getContainer(containerId);
        await container.kill()
        sendLogToClient(clientId,`Container with compileId ${compileId} stopped and removed.`);
        delete containerIdMap[compileId];
    } catch (error) {
         sendLogToClient(clientId,`Error stopping container with compileId ${compileId} `, error);
    }
}

// Returns the Socket.IO instance, throwing an error if it hasn't been initialized yet.
const getSocketInstance = () => {
    if (!io) {
        throw new Error('Socket not initialized. Call initSocket(server) first.');
    }
    return io;
};

// Sends a compilation log message to the specific client identified by clientId.
function sendLogToClient(clientId, logMessage) {
    io.to(clientId).emit('compilation_log', { message: logMessage });
}

module.exports = {
    initSocket,
    getSocketInstance,
    sendLogToClient
};

