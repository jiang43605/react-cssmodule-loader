"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var babelTypes = require('@babel/types');

var ParseVisitor = /*#__PURE__*/function () {
  function ParseVisitor() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ParseVisitor);

    this.options = options;
    this.styleNames = [];
    this.wrapFunctionIdentifier = undefined;
    this.callFuncIdentifier = undefined;
  }

  _createClass(ParseVisitor, [{
    key: "visitor",
    value: function visitor() {
      return {
        Program: {
          enter: this.enter.bind(this),
          exit: this.exit.bind(this)
        },
        JSXAttribute: this.JSXAttributeVisitor.bind(this),
        ImportDeclaration: this.ImportDeclarationVisitor.bind(this)
      };
    }
  }, {
    key: "enter",
    value: function enter(path) {
      this.wrapFunctionIdentifier = path.scope.generateUidIdentifier('warpFunction');
      this.callFuncIdentifier = path.scope.generateUidIdentifier('callFunction');
    }
  }, {
    key: "exit",
    value: function exit(path) {
      var func = this.createwrapFunction();
      var callFunc = this.createCallExpression();
      path.node.body.push(func);
      path.node.body.push(callFunc);
    } // JSXAttribute 访问者

  }, {
    key: "JSXAttributeVisitor",
    value: function JSXAttributeVisitor(path) {
      if (path.node.name.name !== 'className') return;
      if (path.node.value === null) return; // 没获取到倒入的less或css模块，取消后续操作

      if (this.styleNames.length === 0) return;
      var classNames;
      var expr = path.node.value;

      if (babelTypes.isJSXExpressionContainer(expr)) {
        // 支持动态调用
        expr.expression = babelTypes.CallExpression(babelTypes.Identifier(this.callFuncIdentifier.name), [expr.expression]);
      } else if (babelTypes.isStringLiteral(path.node.value)) {
        classNames = this.split(path.node.value.value);
      }

      if (classNames && classNames.length !== 0) {
        path.node.value = this.getCorrectRefExpression(classNames);
      }
    } // ImportDeclaration 访问者

  }, {
    key: "ImportDeclarationVisitor",
    value: function ImportDeclarationVisitor(path) {
      var _this = this;

      var libName = path.node.source.value;
      var importTypes = path.node.specifiers;

      if (this.options.excludeExtensionTest && this.options.excludeExtensionTest.test(libName)) {
        return;
      }

      if (!this.options.extensionTest.test(libName)) {
        return;
      }

      if (importTypes.length === 0) {
        // 使用默认引入模式
        var nameIdentifier = path.scope.generateUidIdentifier('styles');
        importTypes.push(babelTypes.ImportDefaultSpecifier(nameIdentifier));
        this.styleNames.push(nameIdentifier.name);
        return;
      }

      if (this.isImportSpecifier(importTypes)) {
        importTypes.forEach(function (specifier) {
          return _this.styleNames.push([specifier.local.name]);
        });
        return;
      }

      if (!babelTypes.isImportDefaultSpecifier(importTypes[0]) && !babelTypes.isImportNamespaceSpecifier(importTypes[0])) {
        // const errMsg = codeFrameColumns(content, { ...importTypes[0].loc }, {
        //     message: "'css/less/scss'引入必须采用默认的引入方式！eg: import styles from 'index.less'"
        // });
        // throw new Error(errMsg);
        return;
      }

      this.styleNames.push(importTypes[0].local.name);
    }
  }, {
    key: "getCorrectRefExpression",
    value: function getCorrectRefExpression(arrayString) {
      var _this2 = this;

      // 此处无需校验 arrayString
      if (arrayString.length === 1) {
        var className = arrayString[0];
        return babelTypes.JSXExpressionContainer(this.getRefExpression(className));
      }

      var expression = [];
      var quasis = [babelTypes.TemplateElement({
        raw: '',
        cooked: ''
      })];
      arrayString.forEach(function (className, index) {
        var quasisItem;

        var expressionItem = _this2.getRefExpression(className);

        if (index === arrayString.length - 1) {
          quasisItem = babelTypes.TemplateElement({
            raw: '',
            cooked: ''
          });
        } else {
          quasisItem = babelTypes.TemplateElement({
            raw: ' ',
            cooked: ' '
          });
        }

        expression.push(expressionItem);
        quasis.push(quasisItem);
      });
      return babelTypes.JSXExpressionContainer(babelTypes.TemplateLiteral(quasis, expression));
    }
  }, {
    key: "isImportSpecifier",
    value: function isImportSpecifier(specifiers) {
      return specifiers.every(babelTypes.isImportSpecifier);
    }
  }, {
    key: "split",
    value: function split(value) {
      return value.split(' ').filter(function (_) {
        return _ !== '';
      });
    }
  }, {
    key: "getRefExpression",
    value: function getRefExpression(className) {
      var funcName = this.wrapFunctionIdentifier.name;
      return babelTypes.CallExpression(babelTypes.Identifier(funcName), [babelTypes.StringLiteral(className)]);
    } // 根据styleNames创建包裹函数

  }, {
    key: "createwrapFunction",
    value: function createwrapFunction() {
      var funcName = this.wrapFunctionIdentifier.name;
      var paramName = 'className';
      var body = [];
      this.styleNames.reverse().forEach(function (styleName) {
        var ifstatement;

        if (Array.isArray(styleName)) {
          var name = styleName[0];
          ifstatement = babelTypes.IfStatement(babelTypes.BinaryExpression('===', babelTypes.Identifier(name), babelTypes.Identifier(paramName)), babelTypes.ReturnStatement(babelTypes.Identifier(paramName)));
        } else {
          ifstatement = babelTypes.IfStatement(babelTypes.MemberExpression(babelTypes.Identifier(styleName), babelTypes.Identifier(paramName), true), babelTypes.ReturnStatement(babelTypes.MemberExpression(babelTypes.Identifier(styleName), babelTypes.Identifier(paramName), true)));
        }

        body.push(ifstatement);
      });
      body.push(babelTypes.ReturnStatement(babelTypes.Identifier(paramName)));
      return babelTypes.FunctionDeclaration(babelTypes.Identifier(funcName), [babelTypes.Identifier(paramName)], babelTypes.BlockStatement(body));
    }
  }, {
    key: "createCallExpression",
    value: function createCallExpression() {
      var funcName = this.callFuncIdentifier.name;
      var paramName = 'result';
      var classNames = 'classNames';
      var body = [];
      var ifStatement = babelTypes.ifStatement(babelTypes.BinaryExpression('!==', babelTypes.UnaryExpression('typeof', babelTypes.Identifier(paramName)), babelTypes.StringLiteral('string')), babelTypes.ReturnStatement(babelTypes.Identifier(paramName)));
      var statement1 = babelTypes.VariableDeclaration('const', [babelTypes.VariableDeclarator(babelTypes.Identifier(classNames), babelTypes.CallExpression(babelTypes.MemberExpression(babelTypes.CallExpression(babelTypes.MemberExpression(babelTypes.Identifier(paramName), babelTypes.Identifier('split')), [babelTypes.StringLiteral(' ')]), babelTypes.Identifier('filter')), [babelTypes.ArrowFunctionExpression([babelTypes.Identifier('_')], babelTypes.BinaryExpression('!==', babelTypes.Identifier('_'), babelTypes.StringLiteral('')))]))]);
      var statement2 = babelTypes.ReturnStatement(babelTypes.CallExpression(babelTypes.MemberExpression(babelTypes.CallExpression(babelTypes.MemberExpression(babelTypes.Identifier(classNames), babelTypes.Identifier('map')), [babelTypes.Identifier(this.wrapFunctionIdentifier.name)]), babelTypes.Identifier('join')), [babelTypes.StringLiteral(' ')]));
      body.push(ifStatement);
      body.push(statement1);
      body.push(statement2);
      return babelTypes.FunctionDeclaration(babelTypes.Identifier(funcName), [babelTypes.Identifier(paramName)], babelTypes.BlockStatement(body));
    }
  }]);

  return ParseVisitor;
}();

module.exports = ParseVisitor;