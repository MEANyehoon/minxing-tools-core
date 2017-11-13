const fse = require('fs-extra');
const path = require('path');


const file_template_path = "../file_template";

const file_template_config = require(`${file_template_path}/config.json`);

const getConfig = () => {
    return file_template_config;
}

const add = ({
    name,
    output,
    template
}) => {
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
    var configPath = path.resolve(output, "plugin.properties");

    if (!fse.existsSync(root) || !fse.existsSync(configPath)) {
        console.error(`${root} 不是一个有效的敏行插件项目!`)
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
}


exports.getConfig = getConfig;