"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var parse = require('@babel/parser').parse;

var traverse = require('@babel/traverse')["default"];

var generate = require('@babel/generator')["default"];

var Visitor = require('./visitor');

var loaderUtils = require('loader-utils');

var defaultExtensionTest = /\.module\.(less|scss|css)$/;

module.exports = function (content) {
  var resource = this.resourcePath;
  var options = loaderUtils.getOptions(this) || {};
  var visitor = new Visitor({
    extensionTest: options.extensionTest || defaultExtensionTest,
    excludeExtensionTest: null
  });

  if (options && options.test) {
    if (options.test(resource) === false) {
      return;
    }
  } else if (/\/node_modules\//g.test(resource)) {
    return content;
  }

  var ast = parse(content, {
    sourceType: 'module',
    sourceFilename: resource,
    plugins: ['jsx', 'decorators-legacy', 'classProperties', 'objectRestSpread', 'asyncGenerators', 'typescript', 'dynamicImport']
  });
  traverse(ast, visitor.visitor());
  var transformContent = generate(ast, {
    sourceMaps: true
  }, _defineProperty({}, resource, content));
  this.callback(null, transformContent.code, transformContent.map);
};

module.exports.raw = false;