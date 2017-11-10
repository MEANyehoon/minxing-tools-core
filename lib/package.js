const fse = require('fs-extra');
const path = require('path');
const glob = require("glob")
const Utils = require('../utils/utils');
const MXBuild = require('./build');
const TIME_STR = '_t_';
const Package = {
    clearTemp(tempPath) {
        fse.existsSync(tempPath) && fse.removeSync(tempPath);
    },   
    getProjectModifyTimestampAndFiles({
        appId,
        workspace
    }) {
        return new Promise((resolve, reject) => {
            this.projectPath({
                appId: appId,
                workspace: workspace
            })
            .then((project) => {
                let fileList = this.globMatch({
                    project: project
                }) || [];
                const time = fileList.reduce((timestamp, file) => {
                    const stat = fse.statSync(file)
                    let {
                        mtime
                    } = stat;
                    mtime = mtime.getTime()/ 1000.0;
                    return mtime > timestamp ? mtime : timestamp;
                }, 0)
                resolve({
                    timestamp: time,
                    project,
                    fileList
                })
            })
        })
    },
    getDownloadCmd({
        appId,
        timestamp = 0,
        workspace,
        tempPath
    }) {
        if (timestamp) {
            // 增量
            return this.getSmartCmd({
                appId,
                workspace,
                tempPath,
                timestamp
            })
        } else {
            // 全量
            return this.getSyncCmd({
                appId,
                workspace,
                tempPath
            })
        }
    },
    getSmartCmd({
        appId,
        timestamp,
        workspace,
        tempPath
    }) {
        return this.getProjectModifyTimestampAndFiles({
            appId,
            workspace
        }).then(data => {
            const lastModifyTime = data.timestamp;
            const allFileList = data.fileList;
            const projectPath = data.project;
            const startToEnd = `${timestamp}-${lastModifyTime}`;
            const fileName = `${appId}${TIME_STR}${startToEnd}.zip`;
            const filePath = path.join(tempPath, fileName);
            if (fse.existsSync(filePath)) {
                return Promise.resolve(`${startToEnd}`)
            } else {
                // 根据timestamp 找增量文件
                return this.zipSmartPackage({
                    fileList: allFileList,
                    projectPath,
                    tempPath,
                    appId,
                    startToEnd: `${timestamp}-${lastModifyTime}`
                });
            }
        }).then(sToE => {
            if (!sToE) {
                return Promise.resolve();
            } else {
                return Promise.resolve({
                    command: 3,
                    zipPath: `${appId}${TIME_STR}${sToE}.zip`,
                    appId: appId,
                    timestamp: sToE.split('-')[1]
                });
            }
        })
    },
    zipSmartPackage({
        fileList,
        projectPath,
        tempPath,
        appId,
        startToEnd
    }) {
        // fileList -> 全路径[];
        // projectPath -> /Users/Roy/Desktop/apicloudtest;
        // tempPath -> /Users/Roy/program/atom-package/atom-minxing-package/temp;
        // name -> appId#timestamp;
        return new Promise(resolve => {
            const start = startToEnd.split('-')[0];
            const end = startToEnd.split('-')[1];
            fileList = fileList.filter(file => {
                const stat = fse.statSync(file)
                let {
                    mtime
                } = stat;
                return mtime.getTime()/ 1000.0 > start;
            });
            if (fileList.length === 0) {
                resolve();
            } else {
                const name = `${appId}${TIME_STR}${startToEnd}`;
                const tempAppPath = path.resolve(tempPath, name);
                const copiedFiles = [];
                const fileListCount = fileList.length;
                fileList.forEach(filePath => {
                    const relativePath = path.relative(projectPath, filePath);
                    const targetPath = path.resolve(tempAppPath, relativePath);
                    fse.copy(filePath, targetPath, (e) => {
                        if (e) reject(e);
                        copiedFiles.push(targetPath);
                        if (copiedFiles.length === fileListCount) {
                            MXBuild.build({
                                projectRootPath: tempAppPath,
                                savePath: tempPath,
                                projectName: name
                            }).then(() => {
                                resolve(startToEnd)
                            })
                        }
                    })
                })
            }
        })

    },
    getSyncCmd({
        appId,
        workspace,
        tempPath
    }) {
        return this.getProjectModifyTimestampAndFiles({
            appId,
            workspace
        })
        .then(data => {
            const {
                fileList,
                timestamp,
                project
            } = data;
            const fileName = `${appId}${TIME_STR}${timestamp}.zip`;
            const filePath = path.join(tempPath, fileName);
            if (fse.existsSync(filePath)) {
                // start-lastmodifytime 查看是否存在该zip文件
                return Promise.resolve(`${timestamp}`)
            } else {
                return this.zipSyncPackage({
                    fileList,
                    projectPath: project,
                    tempPath,
                    appId,
                    timestamp
                })
            }
        })
        .then(newTimestamp => {
            return Promise.resolve({
                command: 3,
                zipPath: `${appId}${TIME_STR}${newTimestamp}.zip`,
                appId: appId,
                timestamp: newTimestamp
            });
        })
    },
    zipSyncPackage({
        fileList,
        projectPath,
        tempPath,
        appId,
        timestamp
    }) {
        // fileList -> 全路径[];
        // projectPath -> /Users/Roy/Desktop/apicloudtest;
        // tempPath -> /Users/Roy/program/atom-package/atom-minxing-package/temp;
        // name -> appId#timestamp;
        return new Promise(resolve => {
            const name = `${appId}${TIME_STR}${timestamp}`;
            const tempAppPath = path.resolve(tempPath, name);
            const copiedFiles = [];
            const fileListCount = fileList.length;
            fileList.forEach(filePath => {
                const relativePath = path.relative(projectPath, filePath);
                const targetPath = path.resolve(tempAppPath, relativePath);
                fse.copy(filePath, targetPath, (e) => {
                    if (e) reject(e);
                    copiedFiles.push(targetPath);
                    if (copiedFiles.length === fileListCount) {
                        MXBuild.build({
                            projectRootPath: tempAppPath,
                            savePath: tempPath,
                            projectName: name
                        }).then(() => {
                            resolve(timestamp)
                        })
                    }
                })
            })
        })
    },
    projectPath({
        appId,
        workspace
    }) { // 特定appId对应的项目的根目录.
        let projectPath = null
        return new Promise((resolve) => {
            fse.walk(workspace, {
                    filter: (file) => {
                        return path.resolve(workspace) === path.resolve(file, "./..")
                    }
                })
                .on('data', (item) => {
                    let itemPath = item.path
                    let itemStats = item.stats
                    let configFilePath = path.join(itemPath, "plugin.properties")

                    if (!itemStats.isDirectory() || !fse.existsSync(configFilePath)) {
                        return
                    }

                    const app_id = Utils.getAppId(configFilePath);
                    if (appId === app_id) {
                        resolve(itemPath)
                    }
                })
                .on('end', function () {
                    resolve(projectPath)
                })
        })
    },
    globMatch({
        project,
        sync = ".syncignore"
    }) { // 读取 .syncignore 忽略后的文件.
        let syncPath = path.resolve(project, sync)
        let syncignore = (fse.existsSync(syncPath) &&
            fse.readFileSync(syncPath, {
                encoding: "utf8"
            })) || ""

        let globmaths = glob.sync("**", {
            nodir: true,
            ignore: syncignore,
            realpath: true,
            cwd: project,
        })

        return globmaths
    }

}

module.exports = Package;