const babelTypes = require('@babel/types');

class ParseVisitor {
  constructor(options = {}) {
    this.options = options;
    this.styleNames = [];
    this.wrapFunctionIdentifier = undefined;
    this.callFuncIdentifier = undefined;
  }

  visitor() {
    return {
      Program: {
        enter: this.enter.bind(this),
        exit: this.exit.bind(this),
      },
      JSXAttribute: this.JSXAttributeVisitor.bind(this),
      ImportDeclaration: this.ImportDeclarationVisitor.bind(this),
    };
  }

  enter(path) {
    this.wrapFunctionIdentifier = path.scope.generateUidIdentifier(
      'warpFunction'
    );
    this.callFuncIdentifier = path.scope.generateUidIdentifier('callFunction');
  }

  exit(path) {
    const func = this.createwrapFunction();
    const callFunc = this.createCallExpression();
    path.node.body.push(func);
    path.node.body.push(callFunc);
  }

  // JSXAttribute 访问者
  JSXAttributeVisitor(path) {
    if (path.node.name.name !== 'className') return;
    if (path.node.value === null) return;
    // 没获取到倒入的less或css模块，取消后续操作
    if (this.styleNames.length === 0) return;

    let classNames;
    const expr = path.node.value;
    if (babelTypes.isJSXExpressionContainer(expr)) {
      // 支持动态调用
      expr.expression = babelTypes.CallExpression(
        babelTypes.Identifier(this.callFuncIdentifier.name),
        [expr.expression]
      );
    } else if (babelTypes.isStringLiteral(path.node.value)) {
      classNames = this.split(path.node.value.value);
    }

    if (classNames && classNames.length !== 0) {
      path.node.value = this.getCorrectRefExpression(classNames);
    }
  }

  // ImportDeclaration 访问者
  ImportDeclarationVisitor(path) {
    const libName = path.node.source.value;
    const importTypes = path.node.specifiers;

    if (
      this.options.excludeExtensionTest &&
      this.options.excludeExtensionTest.test(libName)
    ) {
      return;
    }

    if (!this.options.extensionTest.test(libName)) {
      return;
    }

    if (importTypes.length === 0) {
      // 使用默认引入模式
      const nameIdentifier = path.scope.generateUidIdentifier('styles');
      importTypes.push(babelTypes.ImportDefaultSpecifier(nameIdentifier));

      this.styleNames.push(nameIdentifier.name);
      return;
    }

    if (this.isImportSpecifier(importTypes)) {
      importTypes.forEach((specifier) =>
        this.styleNames.push([specifier.local.name])
      );

      return;
    }

    if (
      !babelTypes.isImportDefaultSpecifier(importTypes[0]) &&
      !babelTypes.isImportNamespaceSpecifier(importTypes[0])
    ) {
      // const errMsg = codeFrameColumns(content, { ...importTypes[0].loc }, {
      //     message: "'css/less/scss'引入必须采用默认的引入方式！eg: import styles from 'index.less'"
      // });

      // throw new Error(errMsg);

      return;
    }

    this.styleNames.push(importTypes[0].local.name);
  }

  getCorrectRefExpression(arrayString) {
    // 此处无需校验 arrayString
    if (arrayString.length === 1) {
      const className = arrayString[0];

      return babelTypes.JSXExpressionContainer(
        this.getRefExpression(className)
      );
    }

    const expression = [];
    const quasis = [babelTypes.TemplateElement({ raw: '', cooked: '' })];

    arrayString.forEach((className, index) => {
      let quasisItem;

      const expressionItem = this.getRefExpression(className);

      if (index === arrayString.length - 1) {
        quasisItem = babelTypes.TemplateElement({ raw: '', cooked: '' });
      } else {
        quasisItem = babelTypes.TemplateElement({ raw: ' ', cooked: ' ' });
      }

      expression.push(expressionItem);
      quasis.push(quasisItem);
    });

    return babelTypes.JSXExpressionContainer(
      babelTypes.TemplateLiteral(quasis, expression)
    );
  }

  isImportSpecifier(specifiers) {
    return specifiers.every(babelTypes.isImportSpecifier);
  }

  split(value) {
    return value.split(' ').filter((_) => _ !== '');
  }

  getRefExpression(className) {
    const funcName = this.wrapFunctionIdentifier.name;
    return babelTypes.CallExpression(babelTypes.Identifier(funcName), [
      babelTypes.StringLiteral(className),
    ]);
  }

  // 根据styleNames创建包裹函数
  createwrapFunction() {
    const funcName = this.wrapFunctionIdentifier.name;
    const paramName = 'className';
    const body = [];

    this.styleNames.reverse().forEach((styleName) => {
      let ifstatement;

      if (Array.isArray(styleName)) {
        const name = styleName[0];

        ifstatement = babelTypes.IfStatement(
          babelTypes.BinaryExpression(
            '===',
            babelTypes.Identifier(name),
            babelTypes.Identifier(paramName)
          ),
          babelTypes.ReturnStatement(babelTypes.Identifier(paramName))
        );
      } else {
        ifstatement = babelTypes.IfStatement(
          babelTypes.MemberExpression(
            babelTypes.Identifier(styleName),
            babelTypes.Identifier(paramName),
            true
          ),
          babelTypes.ReturnStatement(
            babelTypes.MemberExpression(
              babelTypes.Identifier(styleName),
              babelTypes.Identifier(paramName),
              true
            )
          )
        );
      }

      body.push(ifstatement);
    });

    body.push(babelTypes.ReturnStatement(babelTypes.Identifier(paramName)));

    return babelTypes.FunctionDeclaration(
      babelTypes.Identifier(funcName),
      [babelTypes.Identifier(paramName)],
      babelTypes.BlockStatement(body)
    );
  }

  createCallExpression() {
    const funcName = this.callFuncIdentifier.name;
    const paramName = 'result';
    const classNames = 'classNames';
    const body = [];

    const ifStatement = babelTypes.ifStatement(
      babelTypes.BinaryExpression(
        '!==',
        babelTypes.UnaryExpression('typeof', babelTypes.Identifier(paramName)),
        babelTypes.StringLiteral('string')
      ),
      babelTypes.ReturnStatement(babelTypes.Identifier(paramName))
    );

    const statement1 = babelTypes.VariableDeclaration('const', [
      babelTypes.VariableDeclarator(
        babelTypes.Identifier(classNames),
        babelTypes.CallExpression(
          babelTypes.MemberExpression(
            babelTypes.CallExpression(
              babelTypes.MemberExpression(
                babelTypes.Identifier(paramName),
                babelTypes.Identifier('split')
              ),
              [babelTypes.StringLiteral(' ')]
            ),
            babelTypes.Identifier('filter')
          ),
          [
            babelTypes.ArrowFunctionExpression(
              [babelTypes.Identifier('_')],
              babelTypes.BinaryExpression(
                '!==',
                babelTypes.Identifier('_'),
                babelTypes.StringLiteral('')
              )
            ),
          ]
        )
      ),
    ]);

    const statement2 = babelTypes.ReturnStatement(
      babelTypes.CallExpression(
        babelTypes.MemberExpression(
          babelTypes.CallExpression(
            babelTypes.MemberExpression(
              babelTypes.Identifier(classNames),
              babelTypes.Identifier('map')
            ),
            [babelTypes.Identifier(this.wrapFunctionIdentifier.name)]
          ),
          babelTypes.Identifier('join')
        ),
        [babelTypes.StringLiteral(' ')]
      )
    );

    body.push(ifStatement);
    body.push(statement1);
    body.push(statement2);

    return babelTypes.FunctionDeclaration(
      babelTypes.Identifier(funcName),
      [babelTypes.Identifier(paramName)],
      babelTypes.BlockStatement(body)
    );
  }
}

module.exports = ParseVisitor;
