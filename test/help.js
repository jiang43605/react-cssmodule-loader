module.exports = {
    case1Code: (className) => `
        import css from 'index.css';
        import style from 'index.module.less';

        class Test extends React.Component{
            render(){
                return (
                    <div className=${className}></div>
                );
            }
        }
    `,

    case1TransCode: (className) => `import css from 'index.css';
import style from 'index.module.less';

class Test extends React.Component {
  render() {
    return <div className={${className}}></div>;
  }

}

function _warpFunction(className) {
  if (style[className]) return style[className];
  return className;
}

function _callFunction(result) {
  if (typeof result !== "string") return result;
  const classNames = result.split(" ").filter(_ => _ !== "");
  return classNames.map(_warpFunction).join(" ");
}`,

    case1MultipleTransCode: () => `import css from 'index.css';
import style from 'index.module.less';

class Test extends React.Component {
  render() {
    return <div className={\`\${_warpFunction("test")} \${_warpFunction("testhaha")} \${_warpFunction("wudi")}\`}></div>;
  }

}

function _warpFunction(className) {
  if (style[className]) return style[className];
  return className;
}

function _callFunction(result) {
  if (typeof result !== "string") return result;
  const classNames = result.split(" ").filter(_ => _ !== "");
  return classNames.map(_warpFunction).join(" ");
}`,

    case2Code: (className) => `
        import 'index.module.less';

        class Test extends React.Component{
            render(){
                return (
                    <div className=${className}></div>
                );
            }
        }
    `,

    case2TransCode: (className) => `import _styles from 'index.module.less';

class Test extends React.Component {
  render() {
    return <div className={${className}}></div>;
  }

}

function _warpFunction(className) {
  if (_styles[className]) return _styles[className];
  return className;
}

function _callFunction(result) {
  if (typeof result !== "string") return result;
  const classNames = result.split(" ").filter(_ => _ !== "");
  return classNames.map(_warpFunction).join(" ");
}`,

    case2MultipleTransCode: () => `import _styles from 'index.module.less';

class Test extends React.Component {
  render() {
    return <div className={\`\${_warpFunction("test")} \${_warpFunction("testhaha")} \${_warpFunction("wudi")}\`}></div>;
  }

}

function _warpFunction(className) {
  if (_styles[className]) return _styles[className];
  return className;
}

function _callFunction(result) {
  if (typeof result !== "string") return result;
  const classNames = result.split(" ").filter(_ => _ !== "");
  return classNames.map(_warpFunction).join(" ");
}`,
}


// 待续...