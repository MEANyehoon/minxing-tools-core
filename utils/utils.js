const Fse = require('fs-extra');
const Path = require('path');
const projectStructure = require('./project_structure.json');

exports.validatePackageName = (name) => {
    let valid = true;
    if (!name.match(/^[\w]{1,20}$/i)) {
        console.error(
            '"%s" 应用名称无效. 应用名称应在20个字符以内,且不能包含空格和符号!',
            name
        );
        valid = false;
    }
    return valid;
}

function getProjectStructure() {
    return projectStructure;
}
exports.getProjectStructure = getProjectStructure;
exports.fetchProjectRootInfoByFile =  (file) => {
    if (typeof file !== "string") {
        console.log(`${file} 不是一个有效的文件路径`);
        return;
    }

    // 逆序寻找最接近目标文件的plugin.properties文件.
    let project = Path.resolve(file);
    let configPath = null;
    let type = null;

    for (; true;) {
        configPath = Path.resolve(project, "plugin.properties");
        if (Fse.existsSync(configPath)) {
            type = getAppType(configPath);
            break;
        }

        if (project === Path.resolve("/")) {
            break;
        }

        project = Path.resolve(project, "..")
    }
    if (type) {
        const directoryPath = Path.resolve(project, getProjectStructure()[type]);
        if (Fse.existsSync(directoryPath) && Fse.statSync(directoryPath).isDirectory()) {
            return {
                type,
                path: project
            };
        } else {
            return ''
        }
    } else {
        return ''
    }
}


function readPropertiesSync(propertiesPath) {
    var fs = require('fs');
    //读取并解析plugin.properties文件
    var content = fs.readFileSync(propertiesPath, "utf-8");
    var regexjing = /\s*(#+)/; //去除注释行的正则
    var regexkong = /\s*=\s*/; //去除=号前后的空格的正则
    var obj = {}; //存储键值对
    var arr_case = null;
    var regexline = /.+/g; //匹配换行符以外的所有字符的正则
    while (arr_case = regexline.exec(content)) { //过滤掉空行
        if (!regexjing.test(arr_case)) { //去除注释行
            obj[arr_case.toString().split(regexkong)[0]] = arr_case.toString().split(regexkong)[1].split(';')[0]; //存储键值对
        }
    }
    return obj;
}

function getAppId(propertiesPath) {
    return readPropertiesSync(propertiesPath)['app_id'];
}

function getAppType(propertiesPath) {
    return readPropertiesSync(propertiesPath)['type'];
}


const parseRange = (str, size) => {
    if (str.indexOf(",") != -1) {
        return;
    }
    str = str.replace('bytes=', '');
    var range = str.split("-"),
        start = parseInt(range[0], 10),
        end = parseInt(range[1], 10);
    // Case: -100
    if (isNaN(start)) {
        start = size - end;
        end = size - 1;
        // Case: 100-
    } else if (isNaN(end)) {
        end = size - 1;
    }
    // Invalid
    if (isNaN(start) || isNaN(end) || start > end || end > size) {
        return;
    }

    return {
        start: start,
        end: end
    };
}
exports.readPropertiesSync = readPropertiesSync;
exports.getAppId = getAppId;
exports.parseRange = parseRange;