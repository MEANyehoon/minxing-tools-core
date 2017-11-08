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


function readPropertiesSync(propertiesPath) {
    console.log('read properties sync->', propertiesPath);
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


const parseRange = (str, size) => {
    if (str.indexOf(",") != -1) {
        return;
    }
    console.log('parseRange range->', str);
    console.log('parseRange size->', size);
    str = str.replace('bytes=', '');
    var range = str.split("-"),
        start = parseInt(range[0], 10),
        end = parseInt(range[1], 10);
        console.log(`start:${start}-end:${end}`);
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