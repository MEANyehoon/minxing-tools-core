/**
 * 项目模版
 * TODO rename => project.js
 */

const fse = require('fs-extra');
const fs = require("fs");
const path = require('path');
const prompt = require('prompt')
const Utils = require('../utils/utils');
const project_template_path = "../project_template";

const APICloud_template_path = `${project_template_path}/apicloud`;
const APICloud_template_config = require(`${APICloud_template_path}/config.json`);

const html5_template_path = `${project_template_path}/html5`;
const html5_template_config = require(`${html5_template_path}/config.json`);

const template_path = {
    "APICloud": APICloud_template_path,
    "html5": html5_template_path
}

const template_config = {
    "APICloud": APICloud_template_config,
    "html5": html5_template_config
};

const initConfig = {
    pluginProperties(root, name) {
        const propertiesFilePath = path.join(root, "plugin.properties");
        let propertiesText = fse.readFileSync(propertiesFilePath, 'utf8')
        propertiesText = propertiesText.replace(/template#app_id/g, `${name}`)
        fse.writeFileSync(propertiesFilePath, propertiesText, 'utf8');
    },
    APICloud(root, name) {
        const configFilePath = path.join(root, "widget", "config.xml");
        let configText = fse.readFileSync(configFilePath, 'utf8')
        configText = configText.replace(/\<name\>.*\<\/name\>/g, `<name>${name}</name>`);
        fse.writeFileSync(configFilePath, configText, 'utf8');

        this.pluginProperties(root, name);
    },
    html5(root, name) {
        this.pluginProperties(root, name);
    }
}
// 根据模板初始化APICloud项目
const add = ({
    type,
    name,
    template,
    output
}) => {
    type += "";
    name += "";
    template += "";
    output += "";

    const config = template_config[type];

    if (!config[template]) {
        console.error(`不支持的模板类型:${template} 可选模板: ${Object.keys(app_template_config)}`)
        return
    }

    if(!Utils.validatePackageName(name)) {
        return false;
    }

    const root = path.resolve(output, name);

    if (fse.existsSync(root)) {
        this.createAfterConfirmation(type, name, template, output);
    } else {
        createProject(type, name, template, output);
    }
}
function createAfterConfirmation(type, name, template, output) {
    prompt.start();

    const property = {
        name: 'yesno',
        message: '目录 ' + path.resolve(output, name) + ' 已存在. 是否继续?',
        validator: /[是|否]+/,
        warning: '必须回复 是 或 否',
        default: '否'
    };

    prompt.get(property, (err, result) => {
        if (result.yesno === '是') {
            createProject(type, name, template, output);
        } else {
            return
        }
    });
}

function createProject(type, name, template, output) {
    const root = path.resolve(output, name)

    if (!fse.existsSync(root)) {
        fse.mkdirSync(root);
    }

    try {
        const templatePath = path.join(__dirname, template_path[type], template)
        fse.copySync(templatePath, root)

        initConfig[type](root, name);
        return;
    } catch (err) {
        console.error(`创建${type}类型的项目失败:` + err)
        return;
    }
}

const getConfig = () => {
    return {
        "APICloud": APICloud_template_config,
        "html5": html5_template_config
    }
}


exports.add = add;
exports.getConfig = getConfig;