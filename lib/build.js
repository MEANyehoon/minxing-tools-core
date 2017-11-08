const Utils = require('../utils/utils');
const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const archiver = require('archiver');



const build = ({ projectRootPath, savePath, projectName }) => {

    return new Promise((resolve, reject) => {
        let appInfo = {};
        if(!projectName) {
            appInfo = Utils.readPropertiesSync(path.join(projectRootPath, 'plugin.properties'));
            projectName = path.basename(projectRootPath);
        }
        const zipPath = path.resolve(savePath, `${projectName}.zip`)
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip');

        output.on('close', function () {
            resolve(Object.assign({}, appInfo, {path: zipPath}));
        });

        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
            } else {
                reject(err);
            }
        });

        archive.on('error', function (err) {
            reject(err);
        });

        archive.directory(`${projectRootPath}/`, false);

        archive.pipe(output);
        archive.finalize();
    })
}

exports.build = build;