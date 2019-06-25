/* eslint-disable */
const parse = require('@babel/parser').parse;
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const Visitor = require('./visitor');
const loaderUtils = require('loader-utils');


module.exports = function (content) {
    const resource = this.resourcePath;
    const options = loaderUtils.getOptions(this);
    const visitor = new Visitor();

    if (options && options.test) {
        if (options.test(resource) === false) {
            return;
        }
    } else if (/\/node_modules\//g.test(resource)) {
        return content;
    }

    const ast = parse(content, {
        sourceType: "module",
        sourceFilename: resource,
        plugins: [
            "jsx",
            "decorators-legacy",
            "classProperties",
            "objectRestSpread",
            "asyncGenerators",
            "typescript",
            "dynamicImport"
        ]
    });

    traverse(ast, visitor.visitor());
    const transformContent = generate(ast, { sourceMaps: true }, { [resource]: content });

    this.callback(null, transformContent.code, transformContent.map);
}

module.exports.raw = false;

