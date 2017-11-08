'use strict';

const APICloudLib = require("./APICloud");
const AppTemplate = require('./app');
const PageTemplate = require('./page');
const AppBuild = require('./build');

exports.APICloud = APICloudLib;

exports.init = AppTemplate.init;
exports.getAppTemplateConfig = AppTemplate.getConfig;
exports.getPageTemplateConfig = PageTemplate.getConfig;
exports.build = AppBuild.build;