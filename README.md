# 基于Mocha的 测试框架体系搭建

## 前言
> 我这里要介绍的内容不是仅仅如何使用Mocha 测试框架编写测试代码，我想整理的是基于Mocha的一个测试框架体系搭建，它包括Chai断言库的使用，Istanbul覆盖率测试，以及输出测试报告等等内容

## Mocha 使用教程
> 首先引用官方的一句话，Mocha是一个在Node.js和浏览器上运行的功能丰富的JavaScript测试框架，它可以使异步测试变得简单而有趣。Mocha测试以串行方式运行，允许灵活准确的报告，同时将未捕获的异常映射到正确的测试用例。

### Mocha的测试用例基本语法
首先我们需要安装mocha
```shell
npm install mocha --save-dev
```
mocha本身不支持es import/export等语法，这里使用@babel/register, mocha 运行的时候添加 --require @babel/register 就可以让mocha 支持es 语法
```shell
npm install @babel/core @babel/preset-env @babel/register --save-dev
```
并在根目录创建babel.config.js
```js
// babel.config.js
module.exports = {
    presets: [
        '@babel/env'
    ]
}
```
在package.json里面添加test命令
```json
{
    "scripts": {
        "test": "mocha  --require @babel/register"
    },
}
```
现在你可以通过 **npm run test** 运行 es 代码了
这里先展示一个较为完整的Mocha demo
创建需测试的代码文件
```js
// src/index.js
const isNumber = (num) => {
    return typeof num === 'number';
}

export const add = (...nums) => {
    if(!nums.every(n => isNumber(n))) 
        throw new TypeError('params type need a number');
    return nums.reduce((prev, cur) => {
        return prev + cur;
    }, 0)
}
```
创建测试用例文件
```js
// test/index.test.js
import {add} from '../src/index';
import assert from 'assert';
describe('add()方法测试', () => {
    it.only('add方法的参数必须都是数字，否则会抛出异常', () => {
        assert.throws(add.bind(null, '3'), TypeError);
    });

    it.only('add方法不传值的时候返回的是0', () => {
        assert.equal(add(), 0);
    });

    it('这个测试用例也不会执行');

    it.skip('这个测试用例不会执行，直接通过');
})
```
#### 常用语法Api介绍
+ **describe**
    一个describe包含的测试用例块，称为"测试套件"(test suite)，它表示一组相关的测试用例集合。它是一个函数，第一个参数是测试套件的名称，描述这一组测试的主题，第二个参数是一个实际执行的函数。
    ```js
    describe('add()方法测试', () => {
        //... 测试用例
    })
    ```
+ **it**
    it 表示的是一个测试用例(test case)，它往往表示的是一个具体功能的单元测试，是测试的最小单位。it也是一个函数，它的第一个函数表示测试用例的具体名称，第二个参数是一个执行函数，它可以接受一个参数done方法，异步代码测试就是依赖于这个done实现的
    ```js
     describe('add()方法测试', () => {
         it('add方法的参数必须都是数字，否则会抛出异常', () => {
            assert.throws(add.bind(null, '3'), TypeError);
        });
    });
    ```
+ **done**
    mocha执行所有的测试用例都是同步执行的，当测试异步代码的时候，可以通过在it测试用例执行函数中，接收一个done函数，然后，在异步操作的结束阶段执行done，这样mocha 就可以实现等待异步代码测试了。当然 ，在我们使用了@babel/register之后，可以让mocha 支持async/await ，有了这个api 可以不通过done 函数就实现等待异步代码测试
     ```js
     describe('异步方法测试', () => {
         it('setTimeOut()', (done) => {
            setTimeOut(() => {
               assert.throws(add.bind(null, '3'), TypeError);
            }, 1000)
        });
     });   
    ```
    > 注意mocha 的一个测试用例的默认等待时间最多是 2000毫秒，如果需要等待很长时间 可以手动传入mocha 命令行参数 -t或--timeout参数，来修改默认最长等待时间
    ```shell
    npx mocha -t 4000
    ```
+ **only**
    only是一个静态属性，在describe方法 和it方法上面都有挂载这个静态方法。
    - 当使用describe.only() 编写测试套件的时候，其他的test suite 都不会执行，只有该suite下面的 测试用例会执行，多个only describe是一个并集，所有only的describe都会执行
    - 当使用it.only() 编写测试用例的时候，在该test suite下面的其他test case 都不会执行，但不会影响其他test suite，多个only it 是一个并集执行 
    ```js
     describe.only('会执行的测试套件', () => {
        it.only('会执行的测试用例', () => {
            assert.throws(add.bind(null, '3'), TypeError);
        });
        it.only('忽略的测试用例');
     }); 
     describe('忽略的测试套件', () => {
        // test cases...
     }); 
    ```
+ **skip**
    skip也是describe和it 方法的静态属性，同时也是describe 和 it的执行函数this上下文实例方法.
    > 注意：由于是this的实例方法，当需要使用this.skip的时候，执行函数不能是箭头函数
     - 当使用it.skip() 编写的测试套件会跳过当前test suite执行，多个skip describe是一个并集，所有skip的describe mocha都只会跳过执行
    - 当使用it.skip() 编写的测试用例会跳过执行，不会影响其他test case正常执行，多个skip it 是一个并集执行 
    -  当使用this.skip() 实例方法可以出现在describe和it 的实际执行函数中，它会跳过当前的测试，我们在编写测试代码的时候可以 通过判断环境决定 测试用例是否跳过，相比静态方法 更加灵活
    ```js
     describe('会执行的测试套件', () => {
        it('会执行的测试用例', () => {
            assert.throws(add.bind(null, '3'), TypeError);
        });
        it.skip('跳过的测试用例');
        it('这个测试用例有概率会跳过',function() {
            if(Math.random() > 0.5) {
                this.skip();// 实例方法不能使用箭头函数！！！
            }else {
                assert.equal(1, 1);
            }
        });
     }); 
     describe.skip('跳过的测试套件', () => {
        // test cases...
     }); 
    ```
+ **timeout**
    timeout是describe的上下文实例方法，可以用于针对当前套件所有测试用例延迟等待的效果.当使用该方法的时候，describe 的执行函数不能是箭头函数。默认mocha的最大等待时间是2000ms，当需要针对个别测试套件 做特殊处理，可以使用这个方法只针对该套件修改等待时间
    ```js
    describe('延迟执行测试套件', function() {
        this.timeout(6000);
        it('延迟测试用例', (done) => {
            setTimeout(done, 5000)
        })
    })
    ```
    > 注意：当this.timeout(0)会套件内的所有禁用等待 
       
### Mocha的Hooks
Mocha的Hooks主要有4个，他们的执行顺序分别是 
before => beforeEach => afterEach => after，Mocha的hooks是放在 每个 测试套件 describe 结构里的，他的执行时机是一个suite下的 每个测试用例执行前和执行后 的钩子
+ **before** 这个hooks是在同一个套件suite下，所有的测试用例case执行之前 执行的钩子函数，只执行一次。
+ **beforeEach** 这个钩子同before 一样在该套件下的测试用例case执行之前执行，但是不同的是beforeEach 会在每次执行 test case 前都会执行一次。
+ **afterEach** 该钩子函数执行时机是在该测试套件下的每一个测试用例 test case 执行后都会执行一次。
+ **after** 同before 相反，在该套件所有test case 执行完毕后才会执行的钩子函数，只执行一次
> mocha钩子函数经常用来在每个测试用例执行之前初始化数据用的。
> 每个hooks都是一个函数，第一个参数还可以接收一个描述字符串
```js
describe('Array Test', () => {
    let sourceArr;
    before('Array Test Init', () => {
        console.log('最先执行，且只执行一次');
    })
    beforeEach('Every Test Case', aysnc () => {
        // 每个测试用例执行前都会执行一次
        sourceArr = Mock.mockArray();
    })
    afterEach(() => {
        // 每个测试用例执行完都会执行一次
        sourceArr = [];
    })
    after(() => {
        console.log('最后执行，且只执行一次');
    })
    
    it('这是一个测试用例', () => {
       // do array test
    })
    
    it('这是另一个测试用例', () => {
       // do array test
    })
})
```
> 注意：Mocha的hooks也支持异步操作 执行函数接收done 函数 或者 async/await
```js
describe('Array Test', () => {
    let requestData;
    before(async () => {
        requestData = await getSyncData()
    })
    
    beforeEach('sync hooks', (done) => {
        setTimeOut(() => {
            done();
        }, 1000)
    })
)}
```
> 最后有一个注意点，mocha的hooks 一般是放在describe 结构体中的，但是也可以放在describe结构体之外，当放在最外层的时候，钩子会作用于所有测试套件的测试用例之前或之后执行
### Mocha的命令行配置
这里只介绍几个常用的mocha 命令
+ **mocha [test path]** 
    执行需要测试的文件路径匹配字符串,也可以传入多个路径
    ```shell
    npx mocha test/*.test.js spec/*.spec.js
    ```
+ **--ignore**    
    忽略执行指定路径的测试文件
    ```shell
    npx mocha --ignore spec/some.spec.js
    ```
+ **--full-trace**    
    mocha 完整的堆栈跟踪，方便调试
+ **--reporter**
    mocha 测试结果输出报告,默认报告器为spec，也可以使用第三方报告器，推荐mochawesome, 
    首先需要安装
    ```shell
    npm install mochawesome --save-dev
    ```
    然后运行很简单，--reporter 加上这个报告器即可
    ```shell
    npx mocha --reporter mochawesome
    ```
    还有dot, tap, nyan, landing, list, progress 等等内置reporter模式
    
+ **--timeout** 
    设置全局延迟时间，同this.timeout效果相仿，但是作用于全局
    ```shell
    npx mocha --timeout 5000
    ```
+ **--extension**    
    定义什么样后缀的文件可以被加载当作测试文件测试，可以配合watch recursive等命令使用,也可以支持多个
    ```shell
    npx mocha --extention js --extention mjs
    ```
+ **--recursive** 
    这个命令参数用来让mocha测试文件的时候会递归子目录查找所有的测试文件，配合extension
    ```shell
    npx mocha --extention js --recursive
    ```
+ **--watch**
    监视文件发生变化会重新运行mocha test，可以配合extension 取消监听某些文件的变化
    ```shell
    npx mocha --extention js --watch
    ```
+ **--grep,-g** 
    后面传入regexp，用于搜索所有测试套件 describe的标题或者 测试用例 it 的标题描述 中包含指定 regexp内容的 测试用例，并将只运行 符合这一部分的匹配的测试用例
    ```shell
    npx mocha --grep Get
    ```
+ **--growl** 
    该命令行参数用于让mocha的测试结果显示可以在桌面显示，感觉没啥子卵用, 该命令行参数需要安装 growl平台的一些软件.
    安装方式 for MacOs,其他平台安装方式可以查看[growl](https://github.com/mochajs/mocha/wiki/Growl-Notifications)
    ```shell
    sudo gem install terminal-notifier
    npm install growl
    ```
    运行mocha
    ```shell
    npx mocha --growl
    ```
## 断言库 Chai 使用教程
> 引用官方的一句话 chai是一个TDD(测试驱动开发)/BDD(行为驱动开发) 双模驱动的测试断言库, 这句话说的莫名其妙
+ TDD（Test-Driven Development测试驱动开发）
    测试先于编写代码的思想用于指导软件开发
+ BDD（Behavior Driven Development行为驱动开发） 
    是一种敏捷软件开发的技术，它鼓励软件项目中的开发者、QA和非技术人员或商业参与者之间的协作
    
```shell
npm install chai --save-dev
```
### Chai断言库的基本语法
#### BDD 
BDD 模式的断言库 有两种，expect, should。两者都使用相同的可链接语言来构造断言，但它们在最初构造断言的方式上有所不同
+ expect 使用构造函数来创建断言对象实例
+ should使用Object.prototype提供一个getter方法来实现，不兼容IE, 一般建议使用expect
```shell
const chai = require('chai');
const expect = chai.expect;
const should = expect.should();
```
expect/should 都支持链式调用语言链，为了提高断言的可阅读性。
语言链有
+ to
+ be
+ been
+ is
+ that
+ which
+ and
+ has
+ have
+ with
+ at
+ of
+ same
+ but
+ does
 
> expect/should常用api 请参考 [chai BDD](https://www.chaijs.com/api/bdd/)
#### TDD 
TDD模式的断言库只有一种 assert，该assert 和nodejs 的断言库十分相似，但是chai的assert 在node的assert 基础上提供了更多的api语法糖，方便编写测试代码
> assert 常用api 请参考 [chai TDD](https://www.chaijs.com/api/assert/)

chai的相关api是在太多，不需要刻意的整理 ，需要的时候查阅下即可


## Istanbul使用教程
> 引用官方一句话，istanbul使用行计数器检测您的ES5和ES2015 + JavaScript代码，以便您可以跟踪单元测试运行代码库的情况。

> istanbul的 **nyc 命令行客户端** 适用于大多数JavaScript测试框架： tap， mocha， AVA等。

+ 安装方法
```shell
npm install nyc --save-dev
```
+ 使用方法
终端命令行使用
```shell
npx nyc mocha
```
package.json script
```json
{
  "scripts": {
    "test": "nyc mocha"
  }
}
```
### babel-plugin-istanbul 插件介绍
如果需要完美支持es6/es2015+的代码测试，还需要安装babel插件 [babel-plugin-istanbul](https://www.npmjs.com/package/babel-plugin-istanbul)
```shell
npm install babel-plugin-istanbul --save-dev
```
在babel的配置文件中添加 istanbul babel插件的引用
```js
//babel.config.js
module.exports = {
    presets: [
        '@babel/env'
    ],
    env: {
        plugins:  [
            "istanbul", 
            {
                exclude: [
                    '**/*.test.js', 
                    '*\*/*.spec.js' 
                ],
                useInlineSourceMaps: false
            }
        ]
    },
    plugins: [
        [
            '@babel/plugin-transform-runtime', {
                corejs: 3
            }
        ]
    ]
}
```
该插件提供了几个常用的可配置选项，方便正确的覆盖率测试结果
+ exclude 
    一般情况下，我们不希望测试文件记录到覆盖率测试中，可以通过这个配置选项 忽略 指定的测试文件

+ useInlineSourceMaps
    插件默认情况下会生成sourcemap 映射附加到已经测试的代码，以便代码覆盖率可以重新映射回原始源。这个可能会是内存密集型行为，可以设置为false 取消 生成sourcemap
> 经实验验证，该插件 并不适用于 @babel/register 

### istanbul 的测试结果 reporter
nyc 提供了命令行参数，支持多种reporter 输出覆盖率测试结果,多个reporter 可以共存，用--reporter=value 形式提供多个reporter;
```shell
npx nyc --reporter=lcov --reporter=text mocha --reporter=mochawesome
```

## 基于mocha的测试框架整体搭建
创建package.json的script命令
```json
{
     "scripts": {
        "test": "nyc --reporter=lcov --reporter=text mocha --require @babel/register --reporter=mochawesome --recursive"
      },
}
```
创建babel.config.js文件, 由于使用的@babel/register，不需要安装过多的插件
```js
// babel.config.js
module.exports = {
    presets: [
        '@babel/env'
    ],
}
```
创建两个需要测试的源文件
```js
// src/index.js
const isNumber = (num) => {
    return typeof num === 'number';
}

export const add = (...nums) => {
    if(!nums.every(n => isNumber(n))) throw new TypeError('params type need a number');
    return nums.reduce((prev, cur) => {
        return prev + cur;
    }, 0)
}
```
```js
export const isArray = (target) => {
	return Object.prototype.toString.call(target) === '[object Array]';
};
```

创建对应的测试文件
```js
// test/index.test.js
import {add} from '../src/index';
import {expect} from 'chai';
describe('add()方法测试', function() {
    this.timeout(5000)
    it('add方法的参数必须都是数字，否则会抛出异常', () => {
        expect(add.bind(null, '3')).to.throw(TypeError)
    });

    it('add方法不传值的时候返回的是0', () => {
        expect(add()).to.equal(0)
    });

    it('add方法可以接收多个值的求和结果', () => {
        expect(add(1,2,3,4)).to.equal(10);
    });

    it('这个测试用例有概率会执行', function() {
        if(Math.random() > 0.5) {
            this.skip();
        }else {
            expect(add()).to.equal(0);
        }
    });

    it.skip('这个测试用例不会执行，直接通过');

    it('该方法延迟执行', (done) => {
        setTimeout(() => {
            expect(add(1,2,3,4)).to.equal(10)
            done();
        }, 4500);
    });

})
```
```js
// test/other.test.js
import {isArray} from '../src/other';
import {expect} from 'chai';
describe('isArray()方法测试', function() {
    it('isArray()返回值类型是Boolean', () => {
        expect(isArray()).to.be.a('boolean');
    });

    it('isArray()可以测试数据是否是数组', () => {
        expect(isArray(3)).to.be.false;
        expect(isArray([1,2])).to.be.true;
    });
})
```

最后运行script命令即可运行测试
```shell
npm run test
```