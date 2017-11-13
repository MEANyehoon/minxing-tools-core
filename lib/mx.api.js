'use strict';

const APICloudLib = require("./APICloud");
const AppBuild = require('./build');
const Package = require('./package');


const project = require('./project_template');
const page = require('./page_template');
const Template = {
    project,
    page
}
exports.Template = Template;



exports.APICloud = APICloudLib;
exports.clearTemp = Package.clearTemp;
exports.build = AppBuild.build;



