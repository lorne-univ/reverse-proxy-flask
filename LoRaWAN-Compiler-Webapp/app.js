const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const { initSocket, sendLogToClient } = require('./sockets/socketInstance');
const { randomId, compile, compileMultiple, volName, stopContainer, containerIdMap } = require('./docker/dockerfunctions');
const { generateBinFileName, generateMultipleCompileFileName, initSharedVolume } = require('./docker/file_fct.js');

const app = express();
const port = process.env.PORT || 4050;

// Public static link
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

/* ROUTES */

// Route index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route compile
app.post('/compile', async (req, res) => {
    clientId = req.body.clientId;
    jsonConfig = req.body.formData;

    
    sendLogToClient(clientId, 'Compilation is starting...')

    let id = randomId()
    let fileName = generateBinFileName(jsonConfig)
    let compiledPath = `/${volName}/results/${id}/${fileName}`
    

    let status = await compile(clientId, id, jsonConfig, fileName)

    if (status === 0) {
        // Send compiled file data and name to client
        res.setHeader('compiler-status', status);
        res.setHeader('X-File-Name', fileName);
        res.download(compiledPath, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error downloading the file');
            }
        });
    }else if(status === 137){
        res.setHeader('compiler-status', status);
        res.status(200).send();
    } else {
        // Send an error response
        res.status(400).send('Compilation Error');
    }
});

// Route compile multiple
app.post('/compile-multiple', async (req, res) => {
    clientId = req.body.clientId;
    jsonConfig = req.body.formData;

    sendLogToClient(clientId, 'Compilation is starting...')

    let compileId = randomId()
    let zipName = generateMultipleCompileFileName(jsonConfig.length, jsonConfig[0]);
    let zipPath = `/${volName}/results/${compileId}.zip`
    let status = await compileMultiple(clientId, compileId, jsonConfig)

    if (status === 0) {
        // Send zip file data and name to client
        res.setHeader('X-File-Name', zipName);
        res.setHeader('compiler-status', status);
        res.download(zipPath, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error downloading the file');
            }
        });
    }else if(status === 137){
        res.setHeader('compiler-status', status);
        res.status(200).send();
    } else {
        // Send an error response
        res.status(400).send('Compilation Error');
    }
});

/* INIT */

const server = http.createServer(app);
initSocket(server, containerIdMap);

// Start serveur on port 4050
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

initSharedVolume(volName);
