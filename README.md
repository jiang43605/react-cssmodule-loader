# react-cssmodule-loader

> 该程序的运作方式依赖于css的模块化功能，且文件的后缀名必须是`xxx.module.less`、`xxx.module.sass`、`xxx.module.css`中的一个。

### 功能：
以往要做css的模块化，需要满足两个条件：
 - 在import阶段，需要显式的指定一个导出名称：import styles from 'index.module.less'
 - 无法直接在className中指定对应的css名称，需要调用：`<div className={style.youCss}></div>`

这很繁琐！使用本loader可自动帮你完成这些步骤，你可仍然按照以前的习惯编码！

### 具备以下特点：
 - 可以完美兼容现有代码逻辑
 - 如果要添加css模块支持，仅需更改文件名（为'module.xxx'）

### 使用：

安装：`npm i react-cssmodule-loader`

webpack配置：
```js
...
{
    test: /\.js(x)?$/,
    use: [
             {
                 loader: 'babel-loader',
             },
             {
                 // 注意：该插件必须在最后一个
                 loader: 'react-cssmodule-loader'
             }
    ]
}

...
{
    test: /\.module.(less|css|sass)$/,
    loader: [
        ...
        {
            loader: 'css-loader', 
            options: {
                // 注意：module.xxx下务必打开模块化功能 
                modules: true
            }
        },
       ...
    ]
}
...
```

然后你可以随意使用，最后总能得到你想要的结果！另外，如果你同时引入了多个模块，则后面的模块总会覆盖前面的值。 
```js
<div className="card top-margin"><div>        
<div className={"card top-margin"}><div>      
<div className={'card top-margin'}><div>      
<div className={`card top-margin`}><div>      

<div className={youFunc(parmas)}>             
<div className={isTrue()? 'hide' : 'visibel'}>

import styles1 from 'index.module.less';
import styles2 from 'app.module.css';
import { left, right } from 'other.module.less';
import 'main.module.sass';

// 可兼容原始代码！老的无需变更！
import 'normal.less'
import 'normal.css'
import 'normal.sass'

<div className={styles1.sider + ' ' + styles2.top + 'main-css'}></div>
<div className={ `${left} ${right}` }></div>
```

### 注意：  
在大多数情况下，使用本loader后无需再使用以下两种方式：  
```js
import styles from 'index.module.less';
import { style1, style2 } from 'index.module.less';
```

如果你必须使用，需注意以下情况（发生在同时导入多个css模块的情况下）：  
```js
// 使用默认导入
// 假设：<div className={styles.top}></div>
// 期望得到：<div className="_jkasicidnjew"></div>
// 实际情况：可能得到其它的一个类名，而不是`_jkasicidnjew`
// 这种可能情况的发生，取决于你是否在任何其它css模块中定义了一个和`_jkasicidnjew`一样的类名
import styles from 'index.module.less';
```

如果你的className是动态注入的，你需要使用引用，而不能直接给一个类名，例如：
```js
// import 'index.module.less'; // 应该使用下面的形式
import styles from 'index.module.less';

const props = {
    className: styles.top   // 正确
 // className: 'top'        // 错误
}

<div {...props}></div>
```
