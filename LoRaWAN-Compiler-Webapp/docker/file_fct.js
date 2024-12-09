const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const compilerPath = '/STM32WL' // Path to the STM32WL compiler files
const generalSetupPath = process.env.GENERAL_SETUP_PATH;
const configApplicationPath = process.env.CONFIG_APPLICATION_PATH;
const archiver = require('archiver');

/**
 * Generates the file name based on the config
 */
function generateBinFileName(jsonConfig) {
    let DevEUI = jsonConfig.devEUI_.replace(/0x|,\s/g, '')
    let ActivationMode = jsonConfig.ACTIVATION_MODE
    let Class = jsonConfig.CLASS
    let SpreadingFactor = 'SF' + jsonConfig.SPREADING_FACTOR
    let Confirmed = (jsonConfig.CONFIRMED == "true") ? "Confirmed" : "Unconfirmed"
    return `${DevEUI}-${ActivationMode}-${Class}-${SpreadingFactor}-${Confirmed}.bin`;
}

/**
 * Generate the .zip file name for multiple firmware generation
 */
function generateMultipleCompileFileName(nbFirmware, jsonConfig) {
    let ActivationMode = jsonConfig.ACTIVATION_MODE
    let Class = jsonConfig.CLASS
    let SpreadingFactor = 'SF' + jsonConfig.SPREADING_FACTOR
    let Confirmed = (jsonConfig.CONFIRMED == "true") ? "Confirmed" : "Unconfirmed"
    return `x${nbFirmware}-${ActivationMode}-${Class}-${SpreadingFactor}-${Confirmed}.zip`;
}

/**
 * Modify the .h file with the json using regex
 */
async function modifyHFile(source, jsonConfig) {
    try {
        // Read async
        let data = await fs.readFile(source, 'utf8');
        let modifiedData = data;

        for (let [key, value] of Object.entries(jsonConfig)) {
            // Special case : { 0x00, ... }
            if (key == "devEUI_" || key == "appEUI_") {
                let regex = new RegExp(`(#define ${key}\\s+{ ).+[0-9]`, 'm');
                modifiedData = modifiedData.replace(regex, `$1${value}`);
                // Special case : ( uint32_t )0x00...
            } else if (key == "devAddr_") {
                let regex = new RegExp(`(#define ${key}\\s+.*)0x[0-9]+`, 'm')
                modifiedData = modifiedData.replace(regex, `$1${value}`);
                // Default case
            } else {
                let regex = new RegExp(`(#define ${key}\\s+)[a-zA-Z0-9_,]+`, 'm');
                modifiedData = modifiedData.replace(regex, `$1${value}`);
            }
        }
        // Write changes to file
        await writeFileAsync(source, modifiedData);
    } catch (err) {
        console.error(`Error reading or writing in file : ${err}`);
    }
}

/**
 * Create the folders in the shared volume for compiler files and results .bin
 */
async function initSharedVolume(volName) {
    console.log(`Initiating shared volume ${volName}`)
    try {
        await fs.mkdir(`/${volName}/configs`, { recursive: true });
        console.log(`Init : configs folder created or already there`);
        await fs.mkdir(`/${volName}/results`, { recursive: true });
        console.log(`Init : results folder created or already there`);
    } catch (err) {
        console.error(`Error initiating shared volume '${volName}':`, err);
    }
}

/**
 * Setup the files for the compilation process
 */
async function setupFiles(configPath, resultPath, jsonConfigApplication, jsonGeneralSetup) {
    // Creating folders
    await createDir(configPath)
    await createDir(resultPath)

    // Copy compiler files
    await copyDir(compilerPath, configPath);

    // Modify .h files with json
    await modifyHFile(`${configPath}${configApplicationPath}/config_application.h`, jsonConfigApplication);
    await modifyHFile(`${configPath}${generalSetupPath}/General_Setup.h`, jsonGeneralSetup);
}

/**
 * Setup the files for the multi-compilation process
 */
async function setupFilesMulti(configPath, resultPath, jsonIdsConfig) {
    // Result folder and CSV creation
    const csvName = 'tts-end-devices.csv'
    let csvPath = `${resultPath}/${csvName}`;
    await createDir(resultPath) // 
    await setupCsv(csvPath, jsonIdsConfig)

    // Configs folders for compilers
    for (let id in jsonIdsConfig) {
        let path = `${configPath}/${id}`
        await createDir(path);

        // Copy compiler files
        await copyDir(compilerPath, path);

        // Modify .h files with json
        await modifyHFile(`${path}${configApplicationPath}/config_application.h`, jsonIdsConfig[id].configApplication);
        await modifyHFile(`${path}${generalSetupPath}/General_Setup.h`, jsonIdsConfig[id].generalSetup);
    }
}

async function setupCsv(csvPath, jsonIdsConfig) {
    // Default values
    const default_frequency_plan_id = "EU_863_870_TTN";
    const default_lorawan_version = "MAC_V1_0_3";
    const default_lorawan_phy_version = "RP002_V1_0_3";

    // Prepapre CSV Data
    let csvData = [];
    for (let id in jsonIdsConfig) {
        let csvElem = {};
        csvElem.id = jsonIdsConfig[id].configApplication.name;
        csvElem.name = jsonIdsConfig[id].configApplication.name;
        csvElem.dev_eui = jsonIdsConfig[id].configApplication.devEUI_.replace(/0x|,\s/g, ''); // Remove '0x' and ', '
        csvElem.join_eui = jsonIdsConfig[id].configApplication.appEUI_.replace(/0x|,\s/g, ''); // Remove '0x' and ', '
        csvElem.frequency_plan_id = default_frequency_plan_id;
        csvElem.lorawan_version = default_lorawan_version;
        csvElem.lorawan_phy_version = default_lorawan_phy_version;
        csvElem.app_key = jsonIdsConfig[id].configApplication.appKey_.replace(/,/g, ''); // Remove ','

        csvData.push(csvElem);
    };

    // Create CSV table
    const csvWriter = createCsvWriter({
        path: csvPath,
        fieldDelimiter: ';',
        header: [
            { id: 'id', title: 'id' },
            { id: 'dev_eui', title: 'dev_eui' },
            { id: 'join_eui', title: 'join_eui' },
            { id: 'name', title: 'name' },
            { id: 'frequency_plan_id', title: 'frequency_plan_id' },
            { id: 'lorawan_version', title: 'lorawan_version' },
            { id: 'lorawan_phy_version', title: 'lorawan_phy_version' },
            { id: 'app_key', title: 'app_key' }
        ]
    });

    // Write Data to CSV
    try {
        await csvWriter.writeRecords(csvData);
        console.log(`${csvPath} created`);
    } catch (error) {
        console.error(`Error creating ${csvPath} :`, error);
    }
}

async function zipDirectory(sourceDir, outPath) {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            resolve();
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function copyDir(source, destination) {
    console.log(`Copying ${source} to ${destination}`)
    try {
        await fs.copy(source, destination);
    } catch (err) {
        console.error('Error copying files : ', err);
    }
}

async function createDir(dir) {
    try {
        await fs.access(dir);
        console.log(`Folder already exist : ${dir}`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(dir, { recursive: true });
        } else {
            console.error(`Error verrifying file : ${err}`);
        }
    }
}

async function deleteDir(path) {
    try {
        await fs.remove(path);
        console.log(`${path} directory removed`);
    } catch (err) {
        console.error(`Error suppressing ${path} directory :`, err);
    }
}

async function writeFileAsync(source, modifiedData) {
    try {
        await fs.writeFile(source, modifiedData);
        console.log(`${source} modified`)
    } catch (err) {
        console.error(`Error writing in file : ${err}`);
    }
}

module.exports = {
    generateBinFileName,
    generateMultipleCompileFileName,
    initSharedVolume,
    setupFiles,
    deleteDir,
    setupFilesMulti,
    zipDirectory
};