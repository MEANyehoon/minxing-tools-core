
const file_template_path = "../file_template";

const file_template_config = require(`${file_template_path}/config.json`);

const getConfig = () => {
    return file_template_config;
}

exports.getConfig = getConfig;