'use strict';
const WebSocketServer = require('ws').Server
const path = require('path')
const URL = require('url');
const fse = require('fs-extra')
const EventEmitter = require('events')
const CLI_COMMAND = -1
const glob = require("glob")
const Utils = require('../utils/utils');
const MXBuild = require('./build');

const WifiSync = {
    port: null,
    tempPath: null,
    socketServer: null,
    workspace: null,
    httpServer: null,
    fileListSynced: {}, // 已同步过的文件,按appId存储,
    clientsCount: 0,
    emitter: new EventEmitter(),
    localIp() {
        var os = require('os'),
            ifaces = os.networkInterfaces();

        let address = []
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details, alias) {
                if ("IPv4" === details.family && details.address !== "127.0.0.1") {
                    address.push(details.address)
                }
            })
        }

        return address
    },
    start({
        tempPath,
        port = 8686
    }) {
        const server = require('http').createServer((req, res) => {
            let urlPath = req.url
            const pathname = URL.parse(req.url).pathname;
            
            const zipPath = path.join(this.tempPath, pathname);
            if (!fse.existsSync(zipPath)) {
                this.notFound({
                    res: res
                })
                return;
            }
            const stat = fse.statSync(zipPath);
            res.setHeader('Accept-Ranges', 'bytes');
            if (req.headers['range']) {
                const range = Utils.parseRange(req.headers["range"], stat.size);
                console.log('parse range->', range);
                if (range) {
                    res.setHeader("Content-Range", "bytes " + range.start + "-" + range.end + "/" + stat.size);
                    res.setHeader("Content-Length", (range.end - range.start + 1));
                    fse.createReadStream(zipPath, {
                        "start": range.start,
                        "end": range.end
                    }).pipe(res);
                } else {
                    res.removeHeader("Content-Length");
                    res.writeHead(416, "Request Range Not Satisfiable");
                    res.end();
                }
            } else {
                res.setHeader('Content-Length', stat.size);
                fse.createReadStream(zipPath).pipe(res);
            }
            
        })

        const wss = new WebSocketServer({
            server: server
        })

        this.port = port;
        this.socketServer = wss;
        this.httpServer = server;
        this.tempPath = tempPath;
        
        wss.on('connection', (socket) => {
            this.handleConnection({
                socket: socket
            })
        })

        server.listen(port, () => {
            console.log(`敏行 Is Listening on ip: ${JSON.stringify(this.localIp())} port: ${server.address().port})`)
        })
    },
    end({}) {
        this.socketServer.close()
        this.httpServer.close()
        console.log("敏行 Wifi 真机同步服务 已关闭...")
    },
    handleConnection({
        socket
    }) {
        ++this.clientsCount

        console.log("connection")
        console.log(`当前连接设备数:${this.clientsCount}, port:${this.port}`)

        /* http服务端的监听端口，下载文件、实时预览时使用该端口. */
        socket.send(JSON.stringify({
            command: 7,
            port: this.port
        }))

        socket.on("error", (err) => {
            // silent...
        })

        socket.on('close', () => {
            console.log('disconnected');
            --this.clientsCount
            console.log(`当前连接设备数:${this.clientsCount}`)
        });

        socket.on("message", (message) => {
            let receiveCmd = '';
            try {
                receiveCmd = JSON.parse(message);
            } catch (e) {
                console.log('JSON parse error->', e);
                receiveCmd = message;
            }
            console.log('socket.on message->', receiveCmd);
            receiveCmd.command = receiveCmd.command - 0;
            if (CLI_COMMAND === receiveCmd.command) { // cli 保留编号.
                let {
                    payload
                } = receiveCmd
                payload = payload || {}
                payload["params"]["socket"] = socket
                this.handleCli(payload)
            }

            if (4 === receiveCmd.command) {
                let cmd = this.replyLoaderHeartbeatCmd({
                    command: receiveCmd.command
                })
                this.sendCommand({
                    socket: socket,
                    cmd: cmd
                })
            }

            if (5 === receiveCmd.command) {
                heartbeatTimes--
            }

            if (2 === receiveCmd.command) {
                this.getZipPathCmd({
                        appId: receiveCmd.appId,
                        timestamp: receiveCmd.timestamp,
                        workspace: this.workspace,
                        tempPath: this.tempPath
                    })
                    .then(cmd => {
                        console.log('response 2-->', cmd);
                        this.sendCommand({
                            socket: socket,
                            cmd: cmd
                        })
                    })
            }

            if (8 === receiveCmd.command) {
                this.handleLog({
                    cmd: receiveCmd
                })
            }
        })
    },
    sync({
        project,
        updateAll
    }) { // 更新,全量或增量.
        if (typeof project !== "string") {
            console.log(`${project} 不是一个有效的文件路径`)
            return
        }

        let projectPath = path.resolve(project);
        let configPath = path.resolve(projectPath, "plugin.properties");
        let workspace = path.resolve(projectPath, "..");
        let appId = null

        if (fse.existsSync(configPath)) {
            const appInfo = Utils.readPropertiesSync(configPath);
            if (appInfo) {
                appId = appInfo['app_id'];
            }
        }

        if (!appId) {
            console.log(`${project} 似乎不是一个有效的敏行项目`);
            return
        }
        this.workspace = workspace

        let cmd = this.syncCmd({
            appId: appId,
            updateAll: updateAll
        })
        this.broadcastCommand({
            socketServer: this.socketServer,
            cmd: cmd
        })
    },
    preview({
        file
    }) { // 页面实时预览.
        if (typeof file !== "string") {
            console.log(`${file} 不是一个有效的文件路径`)
            return
        }

        file = path.resolve(file)

        // 逆序寻找最接近目标文件的config.xml文件.
        let project = path.resolve(file, "..")
        let configPath = null
        let appId = null

        for (; true;) {
            configPath = path.resolve(project, "plugin.properties");
            if (fse.existsSync(configPath)) {
                appId = Utils.getAppId(configPath);
                break
            }

            if (project === path.resolve("/")) {
                break
            }

            project = path.resolve(project, "..")
        }

        if (!appId) {
            console.log(`${file} 似乎不在有效的敏行项目中`)
            return
        }

        this.workspace = path.resolve(project, "..")

        let cmd = this.previewCmd({
            file: file,
            workspace: this.workspace,
            appId: appId
        })
        this.broadcastCommand({
            socketServer: this.socketServer,
            cmd: cmd
        })
    },
    broadcastCommand({
        socketServer,
        cmd
    }) { // 广播.
        console.log('broadcastCommand cmd->', cmd);
        socketServer.clients.forEach((socket) => {
            this.sendCommand({
                socket: socket,
                cmd: cmd
            })
        })
    },
    sendCommand({
        socket,
        cmd
    }) {
        let cmdStr = JSON.stringify(cmd)
        socket.send(cmdStr, (error) => {
            // silent...
        })
    },
    handleLog({
        cmd
    }) {
        this.emitter.emit('log', {
            content: cmd.content,
            level: cmd.level
        })
    },
    on(event, callback) {
        this.emitter.on(event, callback)
    },
    syncCmd({
        appId,
        updateAll = true
    }) { // 发送‘wifi同步测试’指令
        return {
            command: 1,
            appId: appId, //当前应用id
            updateAll: updateAll, //是否全量更新
        }
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
    },
    getZipPathCmd({
        appId,
        timestamp = 0,
        workspace,
        tempPath
    }) {
        return new Promise((resolve, reject) => {
            this.getFileList({
                    appId,
                    timestamp,
                    workspace
                })
                .then(data => {
                    const fileList = data.fileList;
                    const projectPath = data.project;
                    const copiedFiles = [];
                    const fileListCount = fileList.length;
                    const tempAppPath = path.resolve(tempPath, appId);
                    if (fse.existsSync(tempAppPath)) {
                        fse.removeSync(tempAppPath);
                    }
                    fileList.forEach(srcPath => {
                        const fileName = path.basename(srcPath);
                        const relativePath = path.relative(appId, srcPath);
                        srcPath = path.resolve(projectPath, relativePath);
                        const targetPath = path.resolve(tempAppPath, relativePath);
                        fse.copy(srcPath, targetPath, (e) => {
                            if (e) reject(e);
                            copiedFiles.push(targetPath);
                            if (copiedFiles.length === fileListCount) {
                                MXBuild.build({
                                    projectRootPath: tempAppPath,
                                    savePath: tempPath,
                                    projectName: appId
                                }).then(appInfo => {
                                    const zipPath = appInfo.path;
                                    resolve({
                                        command: 3,
                                        zipPath: `${appId}.zip`,
                                        appId: appId,
                                        timestamp: Math.floor(Date.now() / 1000)
                                    })
                                })
                            }
                        })
                    })
                })
        })
    },
    getFileList({
        appId,
        timestamp = 0,
        workspace
    }) {
        console.log('timestamp->', timestamp);
        return new Promise((resolve, reject) => {
            this.projectPath({
                    appId: appId,
                    workspace: workspace
                })
                .then((project) => {
                    console.log('project->', project);
                    let fileList = this.globMatch({
                        project: project
                    }) || [];
                    fileList = fileList.filter((file) => {
                        const stat = fse.statSync(file)
                        const {
                            mtime
                        } = stat
                        const fileListSynced = this.fileListSynced[appId]
                        return mtime.getTime() / 1000.0 > timestamp;
                    }).map(file => {
                        return this.absoluteUrlPath({
                            file: file,
                            workspace: workspace,
                            appId: appId
                        })
                    })

                    resolve({
                        project: project,
                        fileList: fileList
                    });
                })
        })
    },
    fileListCmd({
        appId,
        timestamp = 0,
        workspace
    }) { // 指定时间戳后的""文件列表",

        return new Promise((resolve) => {
            this.projectPath({
                    appId: appId,
                    workspace: workspace
                })
                .then((project) => {
                    console.log('project->', project);
                    let fileList = this.globMatch({
                        project: project
                    }) || [];
                    fileList = fileList.filter((file) => {
                        const stat = fse.statSync(file)
                        const {
                            mtime
                        } = stat
                        const fileListSynced = this.fileListSynced[appId]
                        return (mtime.getTime() / 1000.0 > timestamp) ||
                            !(fileListSynced && fileListSynced[file])
                    }).map(file => {
                        return this.absoluteUrlPath({
                            file: file,
                            workspace: workspace,
                            appId: appId
                        })
                    })

                    resolve({
                        command: 3,
                        list: fileList,
                        timestamp: Math.floor(Date.now() / 1000)
                    })
                })
        })
    },
    replyLoaderHeartbeatCmd({
        command
    }) { // 响应 APPLoader 发送的心跳包
        return {
            command: command
        }
    },
    previewCmd({
        file,
        workspace,
        appId
    }) { // 发送‘页面实时预览’指令
        let absoluteUrlPath = this.absoluteUrlPath({
            file: file,
            workspace: workspace,
            appId: appId
        })

        return {
            command: 6,
            path: absoluteUrlPath,
            appId: appId
        }
    },
    httpPortCmd({
        port
    }) { // 返回 http 端口信息.
        return {
            command: 7,
            port: port // http服务端的监听端口，下载文件、实时预览时使用该端口
        }
    },
    absoluteUrlPath({
        file,
        workspace,
        appId
    }) { // 本地文件对应的服务器地址.
        console.log('work space->', workspace);
        let relativePath = path.relative(workspace, file)
        relativePath = relativePath.replace(/\\/g, "/")
        let absoluteUrlPath = `/${relativePath.replace(/^[^\/]*/,appId)}`
        return absoluteUrlPath
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
    notFound({
        res
    }) { // 404
        res.writeHead(404, {
            "Content-Type": "text/plain"
        })
        res.write("404 Not found")
        res.end()
    },
    handleCli({
        method,
        params
    }) {
        const {
            socket
        } = params
        if (typeof CLI[method] === "function") {
            CLI[method](params)
        } else {
            console.log(`不支持的方法: ${method}`)
            socket.close()
        }
    },
}

const CLI = {
    wifiSync({
        project = "./",
        updateAll = true,
        socket
    }) {
        WifiSync.sync({
            project: project,
            updateAll: updateAll
        })
        socket.close()
    },
    wifiStop({
        socket
    }) {
        WifiSync.end({})
    },
    wifiPreview({
        file,
        socket
    }) {
        WifiSync.preview({
            file: file
        })
        socket.close()
    },
    wifiInfo({
        socket
    }) {
        const wifiInfo = {
            ip: WifiSync.localIp(),
            port: WifiSync.port,
            clientsCount: WifiSync.clientsCount
        }

        let cmd = {
            command: CLI_COMMAND,
            payload: wifiInfo
        }

        WifiSync.sendCommand({
            socket,
            cmd
        })
        socket.close()
    },
    wifiLog({
        socket
    }) {
        WifiSync.on("log", (log) => {
            let cmd = {
                command: CLI_COMMAND,
                payload: log
            }
            WifiSync.sendCommand({
                socket,
                cmd
            })
        })
    }
}

module.exports = WifiSync