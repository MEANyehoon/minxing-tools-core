'use strict';

const APICloudLib = require("./APICloud");
const AppTemplate = require('./app');
const PageTemplate = require('./page');
const AppBuild = require('./build');
const Package = require('./package');
exports.APICloud = APICloudLib;
exports.clearTemp = Package.clearTemp;
exports.init = AppTemplate.init;
exports.getAppTemplateConfig = AppTemplate.getConfig;
exports.getPageTemplateConfig = PageTemplate.getConfig;
exports.build = AppBuild.build;