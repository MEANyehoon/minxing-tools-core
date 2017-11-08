'use strict';

var fse = require('fs-extra')
const fs = require("fs")
var path = require('path')
var archiver = require('archiver');
var prompt = require('prompt')
const WifiSync = require("./WifiSync")
const file_template_path = "../file_template"
const app_template_path = "../app_template"
// const file_template_config = require(`./../file_template/config.json`)
// const app_template_config = require(`./../app_template/config.json`)
const properties_template_path = "./plugin.properties";
const APICloud = {
    appTemplateConfig() { // 应用模板配置.
        return app_template_config
    },
    fileTemplateConfig() { // 文件模板配置.
        return file_template_config
    },
    startWifi({
        tempPath,
        port
    }) { /* 启动wifi服务. */
        return WifiSync.start({
            tempPath: tempPath,
            port: port
        })
    },
    endWifi({}) { /* 停止 wifi 服务. */
        return WifiSync.end({});
    },
    syncWifi({
        projectPath,
        syncAll
    }) { /* wifi 增量/全量同步. */
        return WifiSync.sync({
            project: projectPath,
            updateAll: syncAll
        })
    },
    previewWifi({
        file
    }) { /* 预览. */
        if (!file || "" === file) {
            console.error("预览路径不能为空!")
            return
        }

        return WifiSync.preview({
            file: file
        })
    },
    wifiInfo() { /* 获取wifi配置信息,如端口号等. */
        // 注意: 这个要动态获取.
        const wifiInfo = {
            ip: WifiSync.localIp(),
            port: WifiSync.port,
            clientsCount: WifiSync.clientsCount
        }
        return wifiInfo
    },
    wifiLog(callback) {
        return new Promise(resolve => {
            WifiSync.on("log", (log) => {
                callback(log)
                resolve()
            })
        })
    },
    addFileTemplate({
        name,
        output,
        template
    }) {
        name += ""
        output += ""
        template += ""

        const realTemplateName = file_template_config[template]
        if (!realTemplateName) {
            console.error(
                `找不到页面框架模板:${template},目前支持的页面模板为:${Object.keys(file_template_config)}`)
            return
        }

        var root = path.resolve(output);
        var configPath = path.resolve(output, "config.xml")

        if (!fse.existsSync(root) || !fse.existsSync(configPath)) {
            console.error(`${root} 不是一个有效的APICloud项目!`)
            return
        }

        try {
            let templatePath = path.join(__dirname, file_template_path, realTemplateName)

            fse.walk(templatePath)
                .on('data', function (item) {
                    let itemPath = item.path
                    let itemStats = item.stats

                    let relativePath = path.relative(templatePath, itemPath)
                    let targetPath = path.resolve(root, relativePath)
                    let targetDir = path.dirname(targetPath)

                    if (itemStats.isDirectory()) { // 说明是目录.
                        return
                    }

                    let fileName = path.basename(targetPath)
                    fileName = fileName.replace(/apicloudFrame|apicloudWindow(?=\.html)/g, (match) => {
                        let matchDict = {
                            "apicloudFrame": `${name}_frame`,
                            "apicloudWindow": `${name}_window`
                        }
                        return matchDict[match]
                    })

                    targetPath = path.resolve(targetDir, fileName)
                    fse.copySync(itemPath, targetPath, {
                        filter: () => (!/^[.]+/.test(fileName))
                    })

                    if (/\.html$/.test(fileName)) {
                        let targetFileText = fse.readFileSync(targetPath, 'utf8')
                        targetFileText = targetFileText.replace(/apicloudFrame|apicloudWindow/g, (match) => {
                            let matchDict = {
                                "apicloudFrame": `${name}_frame`,
                                "apicloudWindow": `${name}_window`
                            }
                            return matchDict[match]
                        })

                        fse.writeFileSync(targetPath, targetFileText)
                    }
                })
                .on('end', function () {
                    return
                })
        } catch (err) {
            console.error(`创建 APICloud 页面框架失败: ` + err)
            return
        }
    },
    uploadToMinxing({
        projectRootPath
    }) {
        const url = atom.config.get('mx.minxingServerUrl');
        const loginName = atom.config.get('mx.minxingLoginName');
        const password = atom.config.get('mx.minxingPassword');

        console.log('upload to minxing url->', url);
        console.log('upload to minxing loginName->', loginName);
        console.log('upload to minxing password->', password);
    }

}

module.exports = APICloud;