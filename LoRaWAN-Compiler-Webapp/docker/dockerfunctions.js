const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
var stream = require('stream');
const { sendLogToClient } = require('../sockets/socketInstance');
const { generateBinFileName, setupFiles, deleteDir, setupFilesMulti, zipDirectory } = require('./file_fct.js');

//keys to set into General_Setup.h
const generalSetupKeys = ["ADMIN_SENSOR_ENABLED", "MLR003_SIMU", "MLR003_APP_PORT", "ADMIN_GEN_APP_KEY"]

const imageName = 'montagny/arm-compiler:1.0' // image of the compiler
const volName = 'shared-vol' // name of the volume used to store configs and results
const compiledFile = 'STM32WL-standalone.bin' // compiled file name

const containerIdMap = {};

/**
 * Generate a random compileId for the compiling process
 * With 5 characters/numbers
 */
function randomId() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
}

/**
 * Compile main function used through API
 */
async function compile(clientId,compileId,jsonConfig, fileName) {
    console.log(`Compiling with id : ${compileId}`)
    let configPath = `/${volName}/configs/${compileId}` // Path for compiler files
    let resultPath = `/${volName}/results/${compileId}` // Path for .bin compiled files

    // Split input json for the 2 config files
    // Put General_Setup.h keys in separate json
    jsonConfigApplication = jsonConfig;
    jsonGeneralSetup = {};
    for (let key of generalSetupKeys) {
        jsonGeneralSetup[key] = jsonConfigApplication[key];
        delete jsonConfigApplication[key];
    }

    // Create folders, copy compiler files and modify .h files
    await setupFiles(configPath,resultPath,jsonConfigApplication,jsonGeneralSetup);

    // Start Compiling
    let status = await startCompilerContainer(compileId,configPath,resultPath,fileName,clientId)
    if(status == 0){
        console.log(`Compiled successfully : ${compileId}`)
    } else if(status == 137){
        console.log(`Compiling stopped successfully : ${compileId}`)
    } else {
        console.log(`Error while compiling : ${compileId}`)
    }
    delete containerIdMap[compileId];
    
    // Clean up : Remove compiler files
    await deleteDir(configPath);

    return status;
}

async function compileMultiple(clientId, multipleCompileId, jsonArrayConfig){
    console.log(`Multiple compilation id : ${multipleCompileId}`)
    let resultPath = `/${volName}/results/${multipleCompileId}` // Path for .zip with .bin and .csv files
    let configPath = `/${volName}/configs` // Path for all compiler files

    // JSON with compiler ID as key and splitted json as value
    let jsonIdsConfig = []
    jsonArrayConfig.forEach(element => {
        let jsonConfig = {}
        // Split input json for the 2 config files
        // Put General_Setup.h keys in separate json
        let jsonConfigApplication = element;
        let jsonGeneralSetup = {};
        for (let key of generalSetupKeys) {
            jsonGeneralSetup[key] = jsonConfigApplication[key];
            delete jsonConfigApplication[key];
        }

        // Put them in jsonIdsConfig at randomId
        // Also adds the .bin fileName for compilation
        jsonConfig.configApplication = jsonConfigApplication;
        jsonConfig.generalSetup = jsonGeneralSetup;
        jsonConfig.fileName = generateBinFileName(element)
        jsonIdsConfig[randomId()] = jsonConfig;
    })
    await setupFilesMulti(configPath,resultPath,jsonIdsConfig);

    // Compilation
    let status = 0;
    for (let id in jsonIdsConfig) {
        console.log(`${id} ${resultPath}`)
        status = await startCompilerContainer(id,`${configPath}/${id}`,resultPath,jsonIdsConfig[id].fileName, clientId);
        if(status == 0){
            console.log(`Compiled successfully : ${id}`)
        } else if(status == 137){
            console.log(`Compiling stopped successfully : ${multipleCompileId}`)
            break;
        } else {
            console.log(`Error while compiling : ${id}`)
            break;
        }
    }

    // Clean up : Remove compiler files
    for(let id in jsonIdsConfig) {
        await deleteDir(`${configPath}/${id}`);
        delete containerIdMap[id];
    }

    // Zip file
    if(status == 0){
        await zipDirectory(resultPath,`${resultPath}.zip`)
    }
    return status;
}

/**
 * Starts the compiler container with Dockerode
 * Execute the CMD and deletes itself
 * Return the status of the container execution
 * 0 if everything went well
 */
async function startCompilerContainer(compileId, configPath, resultPath, fileName, clientId){
    try {
        // Start compiler with custom CMD
        const container = await docker.createContainer({
            Image: imageName, // Compiler image
            HostConfig: {
                Binds: [`${volName}:/${volName}`] // Volume that stores configs and results data
            },
            // Move to compiler, make, and then put .bin into resultpath with new name
            Cmd: [`/bin/bash`, `-c`, `cd ..${configPath} && make && mv ${compiledFile} ${resultPath}/${fileName}`]
        });

        containerIdMap[compileId] = container.id;

        // Start container
        await container.start();
        console.log(`Container started: ${container.id}`);

        // Handle logs
        containerLogs(compileId,container,clientId);

        // Wait for the container to stop
        const waitResult = await container.wait();
        console.log('Container stopped with status:', waitResult.StatusCode);

        // Clean up: remove the container
        await container.remove({ force: true });
        console.log("Container removed");

        // Return if the container had an error or not
        return waitResult.StatusCode

    } catch (error) {
        console.error('Error starting container :', error);
    }
}

/**
 * Handle Container Logs
 * Display them on console.log with the compileId first
*/
function containerLogs(compileId, container, clientId) {
    // Create a single stream for stdin and stdout
    var logStream = new stream.PassThrough();
    logStream.on('data', function (chunk) {
        let str = chunk.toString('utf8');
        if(str != ' \n'){
            const logMessage = `[${compileId}] ${str}`
            sendLogToClient(clientId, logMessage)
            process.stdout.write(logMessage);
        }
    });
    container.logs({
        follow: true,
        stdout: true,
        stderr: true
    }, function (err, stream) {
        if (err) {
            return process.stderr.write(err.message);
        }
        container.modem.demuxStream(stream, logStream, logStream);
        stream.on('end', function () {
            stream.destroy();
        });
    });
}

module.exports = {
    randomId,
    compile,
    compileMultiple,
    volName,
    compiledFile,
    containerIdMap
}