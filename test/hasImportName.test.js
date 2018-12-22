const _ = require('../src');
const help = require('./help');

const options = {
    resourcePath: '/user/test/index.jsx'
}

const loader = function (code) {
    let transformCode;
    options.callback = (err, content) => {
        transformCode = content;
    }

    _.call(options, code);
    return transformCode;
}

describe('测试：有倒入模块名时', () => {
    test('普通赋值', () => {
        let code = help.case1Code('"test"');
        let normalTransformCode = help.case1TransCode('_warpFunction("test")');
        let transformCode = loader.call(options, code);
        expect(transformCode).toBe(normalTransformCode);
    });

    test('语句块单引号', () => {
        let code = help.case1Code("{'test'}");
        let normalTransformCode = help.case1TransCode("_callFunction('test')");
        let transformCode = loader.call(options, code);
        expect(transformCode).toBe(normalTransformCode);
    });

    test('语句块双引号', () => {
        let code = help.case1Code('{ "test" }');
        let normalTransformCode = help.case1TransCode('_callFunction("test")');
        let transformCode = loader.call(options, code);
        expect(transformCode).toBe(normalTransformCode);
    });

    test('多语句块双引号', () => {
        let code = help.case1Code('"  test testhaha wudi "');
        let normalTransformCode = help.case1MultipleTransCode();
        let transformCode = loader.call(options, code);
        expect(transformCode).toBe(normalTransformCode);
    });

    test('语句块模版字符', () => {
        let code = help.case1Code('{ `test` }');
        let normalTransformCode = help.case1TransCode('_callFunction(`test`)');
        let transformCode = loader.call(options, code);
        expect(transformCode).toBe(normalTransformCode);
    });

    test('多语句块模版字符', () => {
        let code = help.case1Code('{ ` test testhaha wudi ` }');
        let normalTransformCode = help.case1TransCode('_callFunction(` test testhaha wudi `)');
        let transformCode = loader.call(options, code);
        expect(transformCode).toBe(normalTransformCode);
    });

    test('动态取值', () => {
        let code = help.case1Code('{ func()? "top" : "left" }');
        let normalTransformCode = help.case1TransCode('_callFunction(func() ? "top" : "left")');
        let transformCode = loader.call(options, code);
        expect(transformCode).toBe(normalTransformCode);
    });
})
