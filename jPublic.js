/**
 * @file js工具库.
 * @copyright jPublic.js 2019
 * @author https://github.com/smltq/jPublic.git
 */
(function () {
    // 基线开始
    //----------------------
    /**
     * 获得root,兼容web,微信,note等
     */
    var root = (typeof self == 'object' && self.self === self && self) ||
        (typeof global == 'object' && global.global === global && global) || this || {};

    var ArrayProto = Array.prototype, ObjProto = Object.prototype;

    /**
     * 为快速访问核心原型创建快速引用变量
     */
    var push = ArrayProto.push,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    /**
     * 定义将要实现的 ECMAScript 5 原生方法
     */
    var nativeKeys = Object.keys;

    var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

    /**
     * 创建全局对象:_
     * @global
     * @module _
     */
    var _ = function (obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        this._wrapped = obj;
    };

    /**
     * 当前版本号
     * @type {string}
     * @default
     * @readOnly
     * @alias module:_.VERSION
     */
    _.VERSION = '1.8.3';

    if (typeof exports != 'undefined' && !exports.nodeType) {
        if (typeof module != 'undefined' && !module.nodeType && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }
    // 基线结束

    //私有成员开始
    //----------------------
    var optimizeCb = function (func, context, argCount) {
        if (context === void 0) return func;
        switch (argCount == null ? 3 : argCount) {
            case 1:
                return function (value) {
                    return func.call(context, value);
                };
            case 3:
                return function (value, index, collection) {
                    return func.call(context, value, index, collection);
                };
            case 4:
                return function (accumulator, value, index, collection) {
                    return func.call(context, accumulator, value, index, collection);
                };
        }
        return function () {
            return func.apply(context, arguments);
        };
    };

    var shallowProperty = function (key) {
        return function (obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    var has = function (obj, path) {
        return obj != null && hasOwnProperty.call(obj, path);
    }

    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    var getLength = shallowProperty('length');
    var isArrayLike = function (collection) {
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    var builtinIteratee;
    var cb = function (value, context, argCount) {
        if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
        if (value == null) return _.identity;
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);
        if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
        return _.property(value);
    };

    var createAssigner = function (keysFunc, defaults) {
        return function (obj) {
            var length = arguments.length;
            if (defaults) obj = Object(obj);
            if (length < 2 || obj == null) return obj;
            for (var index = 1; index < length; index++) {
                var source = arguments[index],
                    keys = keysFunc(source),
                    l = keys.length;
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    if (!defaults || obj[key] === void 0) obj[key] = source[key];
                }
            }
            return obj;
        };
    };

    var collectNonEnumProps = function (obj, keys) {
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;
        var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

        //构造函数是一种特殊情况
        var prop = 'constructor';
        if (has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

        while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                keys.push(prop);
            }
        }
    };
    //私有成员结束

    //集合函数开始
    //---------------
    /**
     * 生成可应用于集合中的每个元素的回调。<br>
     * _.iteratee支持许多常见回调用例的简写语法。<br>
     * 根据值的类型，_.iteratee 各种结果
     * @param {*}   value   迭代值
     * @param {Object}  context 上下文
     * @alias module:_.iteratee
     * @method
     * @example
     * // 空值
     * _.iteratee();
     * => _.identity()
     * // 函数
     * _.iteratee(function(n) { return n * 2; });
     * => function(n) { return n * 2; }
     * // 对象
     * _.iteratee({firstName: 'Chelsea'});
     * => _.matcher({firstName: 'Chelsea'});
     * // 其它
     * _.iteratee('firstName');
     * => _.property('firstName');
     */
    _.iteratee = builtinIteratee = function (value, context) {
        return cb(value, context, Infinity);
    };

    /**
     * 返回一个断言函数，这个函数会给你一个断言可以用来辨别给定的对象是否匹配attrs指定键/值属性。
     * @param attrs
     * @alias module:_.matcher
     * @example
     * var ready = _.matcher({selected: true, visible: true});
     * var readyToGoList = _.filter(list, ready);
     */
    _.matcher = function (attrs) {
        attrs = _.extendOwn({}, attrs);
        return function (obj) {
            return _.isMatch(obj, attrs);
        };
    };

    /**
     * 类似于 extend, 但只复制自己的属性覆盖到目标对象。（注：不包括继承过来的属性）。
     * @type {Function}
     * @method
     * @alias module:_.extendOwn
     * @example
     * var a = {
     *       foo: false
     *   };
     *
     * var b = {
     *       bar: true
     *   };
     * _.extendOwn(a,b)
     * =>{ foo: false, bar: true };
     */
    _.extendOwn = createAssigner(_.keys);

    /**
     * 判断properties中的键和值是否包含在object中。
     * @param {Object} object   查找目标
     * @param {Object} attrs    查找对象
     * @alias module:_.isMatch
     * @example
     * var stooge = {name: 'moe', age: 32};
     * _.isMatch(stooge, {age: 32});
     * => true
     */
    _.isMatch = function (object, attrs) {
        var keys = _.keys(attrs), length = keys.length;
        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
            var key = keys[i];
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    };

    /**
     * 遍历list中的所有元素，按顺序用遍历输出每个元素。<br>
     * 如果传递了context参数，则把iteratee绑定到context对象上。<br>
     * 每次调用iteratee都会传递三个参数：(element, index, list)。<br>
     * 如果list是个JavaScript对象，iteratee的参数是 (value, key, list))。<br>
     * 返回list以方便链式调用。<br>
     * @param {Object} obj   遍历目标
     * @param {Function} iteratee   迭代器
     * @param {Object} context  绑定的目标对象
     * @alias module:_.each
     * @example
     * _.each([1, 2, 3], alert);
     * => 依次提示每个数字...
     * _.each({one: 1, two: 2, three: 3}, alert);
     * => 依次提示每个数字...
     */
    _.each = function (obj, iteratee, context) {
        iteratee = optimizeCb(iteratee, context);
        var i, length;
        if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    };
    //集合函数结束

    //通用函数开始
    //---------------
    /**
     * 返回一个对象里所有的方法名, 而且是已经排序的 — 也就是说, 对象里每个方法(属性值是一个函数)的名称.
     * @param {Object}  obj 查找对象
     * @returns {this}
     * @alias module:_.functions
     * @example
     * _.functions(_);
     * => ["arrayDiff", "arrayEquals", "arrayIsRepeat", "clone", "debounce", "defineColor" ...
     */
    _.functions = function (obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };

    /**
     * 获得当前Url参数值
     * @param {String}  name    参数名
     * @returns {string|null}
     * @alias module:_.getUrlParam
     */
    _.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        }
        return null;
    };

    /**
     * 函数去抖,空闲时间大于或等于wait，执行fn
     * @param {Function}    fn          要调用的函数
     * @param {Integer}     wait        延迟时间(单位毫秒)
     * @param {Boolean}     immediate   给immediate参数传递false绑定的函数先执行，而不是wait之后执行
     * @returns 实际调用函数
     * @alias module:_.debounce
     * @example
     * var lazyLayout = _.debounce(calculateLayout, 300);
     * $(window).resize(lazyLayout);
     */
    _.debounce = function (fn, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) fn.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) fn.apply(context, args);
        }
    };

    /**
     * 函数节流 每wait时间间隔，执行fn
     * @param {Function}    fn      要调用的函数
     * @param {Integer}     wait    延迟时间，单位毫秒
     * @param {Object}      scope   scope代替fn里this的对象
     * @returns {Function} 实际调用函数
     * @alias module:_.throttle
     * @example
     * var throttled = _.throttle(updatePosition, 100);
     * $(window).scroll(throttled);
     */
    _.throttle = function (fn, wait, scope) {
        wait || (wait = 250);
        var last, deferTimer;
        return function () {
            var context = scope || this;
            var now = _.now(), args = arguments;
            if (last && now < last + wait) {
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    fn.apply(context, args);
                }, wait);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    };

    /**
     * 函数只执行一次
     * @param {Function}    fn      要执行的函数
     * @param {Object}      context 上下文
     * @returns {function(): *}
     * @alias module:_.runOnce
     * @example
     * var a = 0;
     * var canOnlyFireOnce = runOnce(function () {
     *      a++;
     *      console.log(a);
     * });
     * canOnlyFireOnce(); =>1
     * canOnlyFireOnce(); => nothing
     * canOnlyFireOnce(); => nothing
     */
    _.runOnce = function (fn, context) {
        var result;
        return function () {
            if (fn) {
                result = fn.apply(context || this, arguments);
                fn = null;
            }
            return result;
        };
    };

    /**
     * 轮询条件函数，根据状态执行相应回调
     * @param {Function}    fn          条件函数
     * @param {Function}    callback    成功回调
     * @param {Function}    errback     失败回调
     * @param {Integer}     timeout     超时间隔(毫秒)
     * @param {Integer}     interval    轮询间隔(毫秒)
     * @alias module:_.poll
     * @example
     * 确保元素可见
     * poll(
     *    function () {
     *       return document.getElementById('lightbox').offsetWidth > 0;
     *    },
     *    function () {
     *       // Done, success callback
     *    },
     *    function () {
     *      // Error, failure callback
     *    }
     * );
     */
    _.poll = function (fn, callback, errback, timeout, interval) {
        var endTime = Number(new Date()) + (timeout || 2000);
        interval = interval || 100;
        (function p() {
            // 如果条件满足，调用回调
            if (fn()) {
                callback();
            }
            //如果在结束时间内，继续进入循环判断
            else if (Number(new Date()) < endTime) {
                setTimeout(p, interval);
            }
            //超时，抛出异常
            else {
                errback(new Error('timed out for ' + fn + ': ' + arguments));
            }
        })();
    };

    /**
     * 返回一个min 和 max之间的随机整数。<br>
     * 如果你只传递一个参数，那么将返回0和这个参数之间的整数
     * @param min 随机数下限,没传默认为0
     * @param max 随机数上限
     * @returns {number}
     * @alias module:_.getRandom
     * @example
     * _.random(0, 100);
     * => 48
     */
    _.getRandom = function (min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    /**
     * 获取表单数据
     * @param {Object}    frm   表单对象
     * @alias module:_.getFormJson
     * @example
     * 获得表单数据，自动拼接成json对象，提交给服务端
     * $.ajax({
     *     type: 'post',
     *     url: 'your url',
     *     data: _.getFormJson($('#formId')),
     *     success: function(data) {
     *       // your code
     *     }
     *   });
     */
    _.getFormJson = function (frm) {
        var o = {};
        var a = frm.serializeArray();
        _.each(a, function () {
            o[this.name] = this.value;
        });
        return o;
    };

    /**
     * 复制文本到剪切板(适用于Chrome、Firefox、Internet Explorer和Edge，以及Safari)
     * @alias module:_.copyToClipboard
     */
    _.copyToClipboard = function (text) {
        if (window.clipboardData && window.clipboardData.setData) {
            return clipboardData.setData("Text", text);
        } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            var textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy");
            } catch (ex) {
                console.warn("复制到剪贴板异常:", ex);
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    };

    /**
     * 定义操作列
     * @param {Array} arr   一个数组
     * @param {Integer} value   对应行的id值
     * @returns {string} 返回html字符串
     * @alias module:_.defineOperate
     *
     * @example
     * var arr = [
     *      { text: "删除", fn: "detailDataGrid.Delete({0})" },
     *      {text: "修改", fn: "detailDataGrid.Edit({0})" }]
     * _.defineOperate(arr,3)
     * =><a style='cursor: pointer;' onclick='detailDataGrid.Delete(3)' href='javascript:;'>删除</a> | <a style='cursor: pointer;' onclick='detailDataGrid.Edit(3)' href='javascript:;'>修改</a>
     */
    _.defineOperate = function (arr, value) {
        var str = "";
        var len = arr.length, i = 0;
        while (i < len) {
            str += _.format("<a style='cursor: pointer;' onclick='{1}' href='javascript:;'>{0}</a>", arr[i].text, _.format(arr[i].fn, value));
            str += (i == len - 1 ? "" : " | ");
            i++;
        }
        return str;
    };

    /**
     * 获取当前网站根路径
     * @returns {string}
     * @alias module:_.getRootPath
     * @example
     * http://localhost:8083/tqlin
     */
    _.getRootPath = function () {
        var curPath = window.document.location.href;
        var pathName = window.document.location.pathname;
        var pos = curPath.indexOf(pathName);
        var localhostPaht = curPath.substring(0, pos);
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return (localhostPaht + projectName);
    };

    /**
     * 格式化字符串
     * @param {String} format   要格式化的字符串
     * @returns {string | void}
     * @returns {string}
     * @alias module:_.format
     * @example
     * _.format("Hello, {0}!","World")=>Hello, World
     * _.format("Hello, {0}, My {1}!","World","Love You")=>Hello, World, My Love You
     */
    _.format = function (format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };

    /**
     * 去左右空格
     * @param {String} str 字符串
     * @param {String} chars 要移除的字符（默认为空白字符)
     * @returns {string}
     * @alias module:_.trim
     * @example
     * _.trim(" Hello ")=>"Hello"
     * _.trim("_Hello_","_")=>"Hello"
     */
    _.trim = function (str, chars) {
        return this.ltrim(this.rtrim(str, chars), chars);
    };

    /**
     * 去左空格
     * @param {String} str 字符串
     * @param {String} chars 要移除的字符（默认为空白字符)
     * @returns {string}
     * @alias module:_.ltrim
     * @example
     * _.ltrim(" Hello ")=>"Hello "
     * _.ltrim("_Hello_","_")=>"Hello_"
     */
    _.ltrim = function (str, chars) {
        chars = chars || "\\s";
        return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
    };

    /**
     * 去右空格
     * @param str 字符串
     * @param chars 要移除的字符（默认为空白字符)
     * @returns {string}
     * @alias module:_.rtrim
     * @example
     * _.ltrim(" Hello ")=>" Hello"
     * _.ltrim("_Hello_","_")=>"_Hello"
     */
    _.rtrim = function (str, chars) {
        chars = chars || "\\s";
        return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
    };

    /**
     * 如果obj是一个函数（Function），返回true。
     * @param {Object} obj 要检查的对象
     * @returns {boolean}
     * @alias module:_.isFunction
     * @example
     * _.isFunction(alert);
     * => true
     */
    _.isFunction = function (obj) {
        return typeof obj == 'function' || false;
    };

    /**
     * 如果object是一个对象，返回true。需要注意的是JavaScript数组和函数是对象，字符串和数字不是。
     * @param {Object} obj  要检查的对象
     * @returns {boolean}
     * @alias module:_.isObject
     * @example
     * _.isObject({});
     * => true
     * _.isObject(1);
     * => false
     */
    _.isObject = function (obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    /**
     * 是否为空字符串
     * @param {String} str 要检查的字符串
     * @returns {boolean}
     * @alias module:_.isNullOrEmpty
     * @example
     * _.isNullOrEmpty("   ");
     * =>true
     *
     * .isNullOrEmpty(' ');
     * =>true
     *
     * var student = {className: "测试班", name: "我是张三", age: 18};
     * _.isNullOrEmpty(student.skill);
     * =>true
     *
     * _.isNullOrEmpty(undefined);
     * =>true
     *
     * _.isNullOrEmpty(null);
     * =>true
     *
     * _.isNullOrEmpty("");
     * =>true
     *
     * _.isNullOrEmpty('')
     * =>true
     */
    _.isNullOrEmpty = function (str) {
        if (!str || _.trim(str) === '') {
            return true;
        }
        return false;
    };

    /**
     * 如果object 不包含任何值(没有可枚举的属性)，返回true。
     * 对于字符串和类数组（array-like）对象，如果length属性为 0，那么_.isEmpty检查返回true。
     * @param {Object} obj  要检查的对象
     * @returns {boolean}
     * @example
     * _.isEmpty([1, 2, 3]);
     * => false
     * _.isEmpty({});
     * => true
     */
    _.isEmpty = function (obj) {
        if (obj == null) return true;
        if (isArrayLike(obj) && (_.isArray(obj) || _.isArguments(obj))) return obj.length === 0;
        if (_.isString(obj)) return _.isNullOrEmpty(obj);
        return _.keys(obj).length === 0;
    };

    /**
     * 如果obj是一个数组，返回true。
     * @param {Object}  obj 要检查的对象
     * @returns {boolean}
     * @alias module:_.isArray
     * @example
     * (function(){ return _.isArray(arguments); })();
     * => false
     * _.isArray([1,2,3]);
     * => true
     */
    _.isArray = function (obj) {
        return toString.call(obj) === '[object Array]';
    };

    /**
     * 是否数值
     * @param {Object} value    要检查的对象
     * @returns {boolean}
     * @alias module:_.isNumeric
     * @example
     * // true
     * _.isNumeric( "-10" )
     * _.isNumeric( "0" )
     * _.isNumeric( 0xFF )
     * _.isNumeric( "0xFF" )
     * _.isNumeric( "8e5" )
     * _.isNumeric( "3.1415" )
     * _.isNumeric( +10 )
     * _.isNumeric( 0144 )

     // false
     * _.isNumeric( "-0x42" )
     * _.isNumeric( "7.2acdgs" )
     * _.isNumeric( "" )
     * _.isNumeric( {} )
     * _.isNumeric( NaN )
     * _.isNumeric( null )
     * _.isNumeric( true )
     * _.isNumeric( Infinity )
     * _.isNumeric( undefined )
     */
    _.isNumeric = function (value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    };

    /**
     * 如果object是一个字符串，返回true。
     * @param {String} value 要检查的值
     * @returns {boolean}
     * @alias module:_.isString
     * @example
     * _.isString("moe");
     * => true
     */
    _.isString = function (value) {
        return typeof value === 'string';
    };

    /**
     * 如果object是一个参数对象，返回true。
     * @param {Object} obj  要检查的对象
     * @example
     * (function(){ return _.isArguments(arguments); })(1, 2, 3);
     * => true
     * _.isArguments([1,2,3]);
     * => false
     * @returns {*}
     */
    _.isArguments = function (obj) {
        return has(obj, 'callee');
    };

    /**
     * 截取字符串
     * @param {String}  str     原始字符串
     * @param {Integer} limit   长度限制(默认限制长度100)
     * @param {String}  suffix  超过替换字符（默认用'...'替代）
     * @returns {string|*}
     * @alias module:_.truncate
     * @example
     * _.truncate('We are doing JS string exercises.')
     * =>We are doing JS string exercises.
     *
     * _.truncate('We are doing JS string exercises.',19)
     * =>We are doing JS ...
     *
     * _.truncate('We are doing JS string exercises.',15,'!!')
     * =>We are doing !!
     */
    _.truncate = function (str, limit, suffix) {
        limit = limit || 100;
        if (_.isString(str)) {
            if (typeof suffix !== 'string') {
                suffix = '...';
            }
            if (str.length > limit) {
                return str.slice(0, limit - suffix.length) + suffix;
            }
            return str;
        }
    };

    /**
     * 金额格式化
     * @param {Number}  value   原始金额数值
     * @param {Integer} digit   保留小数位置(默认2位)
     * @returns {string}
     * @alias module:_.fmoney
     * @example
     * _.fmoney(100000000)
     * =>100,000,000.00
     *
     * _.fmoney(100000000.3434343, 3)
     * =>100,000,000.343
     */
    _.fmoney = function (value, digit) {
        digit = digit > 0 && digit <= 20 ? digit : 2;
        if (typeof (value) == "undefined" || (!value && value != 0)) {
            return '';
        }
        value = parseFloat((value + "").replace(/[^\d\.-]/g, "")).toFixed(digit) + "";
        var ss = value.split(".");
        var r = ss[1];
        ss[0] = ss[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
        return ss[0] + "." + r.substring(0, digit);
    };

    /**
     * 定义文字颜色
     * @param {String}  value   原始文字
     * @param {String}  color   要定义的颜色（默认红色）
     * @returns {string}
     * @alias module:_.defineColor
     * @example
     * _.defineColor(“Hello”)
     * =><span style="color:#FF0000">Hello</span>
     */
    _.defineColor = function (value, color) {
        return '<span style="color:' + (color || "#FF0000") + '">' + value + "</span>";
    };

    /**
     * 字节格式化
     * @param {Number}  bytes       字节值
     * @param {Integer} decimals    小数位数
     * @returns {string}
     * @alias module:_.formatBytes
     * @example
     * formatBytes(1024);
     * =>1 KB
     *
     * formatBytes('1024');
     * =>1 KB
     *
     * formatBytes(1234);
     * =>1.21 KB
     *
     * formatBytes(1234, 3);
     * =>1.205 KB
     */
    _.formatBytes = function (bytes, decimals) {
        if (bytes == 0) return '0 Bytes';
        var k = 1024,
            dm = decimals <= 0 ? 0 : decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * 如果list中的所有元素都通过predicate的真值检测就返回true。<br>
     * （注：如果存在原生的every方法，就使用原生的every。）<br>
     * predicate 通过 iteratee 进行转换，以简化速记语法。
     * @param {Array}       list        要检查的列表
     * @param {Function}    predicate   检测函数
     * @param {Object}      context     上下文
     * @returns {boolean}
     * @alias module:_.every
     * @example
     * _.every([2, 4, 5], function(num) { return num % 2 == 0; });
     * => false
     */
    _.every = function (list, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(list) && _.keys(list),
            length = (keys || list).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (!predicate(list[currentKey], currentKey, list)) return false;
        }
        return true;
    };

    /**
     * 如果list中有任何一个元素通过 predicate 的真值检测就返回true。<br>
     * 一旦找到了符合条件的元素, 就直接中断对list的遍历。<br>
     * predicate 通过 iteratee 进行转换，以简化速记语法。
     * @param {Array}       list        要检查的列表
     * @param {Function}    predicate   检测函数
     * @param {Object}      context     上下文
     * @returns {boolean}
     * @alias module:_.some
     * @example
     * _.some([null, 0, 'yes', false]);
     * => true
     */
    _.some = function (list, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(list) && _.keys(list),
            length = (keys || list).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (predicate(list[currentKey], currentKey, list)) return true;
        }
        return false;
    };

    /**
     * 一个用来创建整数灵活编号的列表的函数，便于each 和 map循环。<br>
     * 如果省略start则默认为 0；<br>
     * step 默认为 1.返回一个从start 到stop的整数的列表，用step来增加 （或减少）独占。<br>
     * 值得注意的是，如果stop值在start前面（也就是stop值小于start值），那么值域会被认为是零长度，而不是负增长。-如果你要一个负数的值域 ，请使用负数step.
     * @param {Integer} start   开始位置
     * @param {Integer} stop    结束位置
     * @param {Integer} step    步长
     * @returns {any[]}
     * @alias module:_.range
     * @example
     * _.range(10);
     * => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     * _.range(1, 11);
     * => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     * _.range(0, 30, 5);
     * => [0, 5, 10, 15, 20, 25]
     * _.range(0, -10, -1);
     * => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
     * _.range(0);
     * => []
     */
    _.range = function (start, stop, step) {
        if (stop == null) {
            stop = start || 0;
            start = 0;
        }
        if (!step) {
            step = stop < start ? -1 : 1;
        }
        var length = Math.max(Math.ceil((stop - start) / step), 0);
        var range = Array(length);

        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }
        return range;
    };

    /**
     * 检索object拥有的所有可枚举属性的名称。
     * @param {Object}  obj 要检索的对象
     * @returns {Array|*}
     * @alias module:_.keys
     * @example
     * _.keys({one: 1, two: 2, three: 3});
     * => ["one", "two", "three"]
     */
    _.keys = function (obj) {
        if (!_.isObject(obj)) return [];
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        for (var key in obj) if (has(obj, key)) keys.push(key);
        // Ahem, IE < 9.
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };

    /**
     * 创建 一个浅复制（浅拷贝）的克隆object。任何嵌套的对象或数组都通过引用拷贝，不会复制。
     * @param {Object}  obj 要克隆的对象
     * @returns {*|_|*}
     * @alias module:_.clone
     * @example
     * _.clone({name: 'moe'});
     * => {name: 'moe'};
     */
    _.clone = function (obj) {
        if (!_.isObject(obj)) return obj;
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    _.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };

    //通用函数结束

    //日期相关开始
    //-----------------------
    /**
     * 获取当前时间戳，兼容旧环境（毫秒）
     * @method
     * @alias module:_.now
     * @example
     * _.now()
     * =>521557891109615
     */
    _.now = Date.now || function () {
        return new Date().valueOf();
    };

    /**
     * 获取当前服务器时间(Date)
     * @returns {Date}
     * @alias module:_.serverTime
     * @example
     * _.serverTime()
     * =>Wed May 15 2019 11:33:22 GMT+0800 (中国标准时间)
     */
    _.serverTime = function () {
        var xmlHttp = new XMLHttpRequest() || new ActiveXObject("Microsoft.XMLHTTP");
        xmlHttp.open("HEAD", location.href, false);
        xmlHttp.send();
        return new Date(xmlHttp.getResponseHeader("Date"));
    };

    /**
     * 获取月份第一天
     * @param {Date}    date    日期(默认当前日期)
     * @returns {Date}
     * @alias module:_.firstDay
     * _.dateFormat(_.firstDay());
     * =>2019-05-01 00:00:00
     */
    _.firstDay = function (date) {
        date || (date = new Date());
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    /**
     * 获取月份最后一天
     * @param {Date}    date    日期(默认当前日期)
     * @returns {Date}
     * @alias module:_.lastDay
     * @example
     * _.dateFormat(_.lastDay());
     * =>2019-05-31 00:00:00
     */
    _.lastDay = function (date) {
        date || (date = new Date());
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    };

    /**
     * 获得本周的开始日期
     * @param {Date}    date    日期(默认当前日期)
     * @returns {Date}
     * @alias module:_.getWeekStartDate
     * @example
     * _.dateFormat(_.getWeekStartDate());
     * =>2019-05-13 00:00:00
     */
    _.getWeekStartDate = function (date) {
        date || (date = new Date());
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 1);
    };

    /**
     * 获得本周的结束日期
     * @param {Date}    date    日期(默认当前日期)
     * @returns {Date}
     * @alias module:_.getWeekEndDate
     * @example
     * _.dateFormat(_.getWeekEndDate());
     * =>2019-05-13 00:00:00
     */
    _.getWeekEndDate = function (date) {
        date || (date = new Date());
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7 - date.getDay());
    };

    /**
     * 将 Date 转化为指定格式的String 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q)<br>
     * 可以用 1-2 个占位符 年(y)可以用 1-4 个占位符 毫秒(S)只能用 1 个占位符(是 1-3 位的数字)<br>
     * @param {Date}    date    日期(默认当前时间)
     * @param {String}  format  格式化字符串(默认yyyy-MM-dd hh:mm:ss)
     * @returns {*}
     * @alias module:_.dateFormat
     * @example
     * _.dateFormat(date,"yyyy-MM-dd hh:mm:ss.S") ==> 2016-05-04 08:09:04.423
     * _.dateFormat(date,"yyyy-M-d h:m:s.S") ==>2016-05-04 8:9:4.18
     */
    _.dateFormat = function (date, format) {
        date instanceof Date || (date = new Date(date));
        format = format || "yyyy-MM-dd hh:mm:ss";
        var o = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            "S": date.getMilliseconds()
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return format;
    };

    /**
     * 返回日期的yyyy-MM-dd格式
     * @param date 日期
     * @alias module:_.shortDateFormat
     * @example
     * _.shortDateFormat(_.now());
     * =>2019-05-15
     */
    _.shortDateFormat = function (date) {
        if (!date) {
            return "";
        }
        return this.dateFormat(date, 'yyyy-MM-dd');
    };

    /**
     * 将时间格式化为指定格式的String
     * @param {Number}  n   时间(单位秒)
     * @returns {string}
     * @alias module:_.formatTime
     * @example
     * _.formatTime(25);
     * => '0:00:25'
     * _.formatTime(63846);
     * => '17:44:06'
     */
    _.formatTime = function (n) {
        var hours = Math.floor(n / 60 / 60);
        var minutes = Math.floor((n - (hours * 60 * 60)) / 60);
        var seconds = Math.round(n - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
    };

    /**
     * 反格式化,与formatTime函数相反
     * @param {String}  string  要格式化的时间字符串
     * @returns {number}
     * @alias module:_.unformatTime
     * @example
     * _.unformatTime('0:00:25');
     * => 25
     * _.unformatTime('17:44:06');
     * => 63846
     */
    _.unformatTime = function (string) {
        var timeArray = string.split(':'), seconds = 0;
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.length === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    };
    //日期相关结束

    //数组工具相关开始
    //-------------
    /**
     * 数组差集，以第一个数组为主
     * @param {Array}   a   主数组
     * @param {Array}   b   次数组
     * @returns {*}
     * @alias module:_.difference
     * @example
     * var a = [1,2,3,4,5]
     * var b = [2,4,6,8,10]
     * _.difference(a, b)
     * =>[1,3,5]
     */
    _.difference = function (a, b) {
        var filtered = a.filter(function (e) {
            return b.indexOf(e) === -1;
        });
        return filtered;
    };

    /**
     * 洗牌数组
     * @param {String}  array   要洗牌的数组
     * @returns {Array}
     * @alias module:_.shuffle
     * @example
     * var a = [1,2,3,4,5]
     * _.shuffle(a)
     * => [3, 2, 4, 5, 1]
     */
    _.shuffle = function (array) {
        var copy = [], n = array.length, i;
        while (n) {
            i = Math.floor(Math.random() * n--);
            copy.push(array.splice(i, 1)[0]);
        }
        return copy;
    };

    /**
     * 数组元素是否重复
     * @param {Array}   arr 要检查的数组对象
     * @returns {boolean}
     * @alias module:_.isRepeat
     * @example
     * var a = [1, 2, 3, 4, 5];
     * var b = [1, 2, 3, 5, 5];
     * _.isRepeat(a);
     * =>false
     *
     * _.isRepeat(b);
     * =>true
     */
    _.isRepeat = function (arr) {
        var hash = {};
        for (var i in arr) {
            if (hash[arr[i]]) {
                return true;
            }
            hash[arr[i]] = true;
        }
        return false;
    };

    /**
     * 数组去重
     * @param {Array}   arr 要去重的数组
     * @returns {Array}
     * @alias module:_.unique
     * @example
     * var b = [1, 2, 3, 5, 5];
     * _.unique(b);
     * => [1, 2, 3, 5]
     */
    _.unique = function (arr) {
        var a = [];
        for (var i = 0, l = arr.length; i < l; i++) {
            if (a.indexOf(arr[i]) === -1) {
                a.push(arr[i]);
            }
        }
        return a;
    };

    /**
     * 判断数组是否相等,默认为严格模式比较
     * @param {Array}   a       第一个数组
     * @param {Array}   b       第二个数组
     * @param {Boolean} strict  是否严格比较（默认为true)
     * @returns {boolean}
     * @alias module:_.equals
     * @example
     * var arr1 = [1, 2, 3, 4];
     * var arr2 = [2, 1, 4, 3];
     * var arr3 = [2, 2, 3, 4];
     * var arr4 = [1, 2, 3, 4];
     * _.equals(arr1,arr2);
     * => false
     *
     * _.equals(arr1,arr2, false);
     * =>true
     *
     * _.equals(arr1,arr3);
     * =>false
     *
     * _.equals(arr1,arr3, false);
     * =>false
     *
     * _.equals(arr1,arr4);
     * =>true
     *
     * _.equals(arr1,arr4, false);
     * =>true
     */
    _.equals = function (a, b, strict) {
        if (!b) return false;
        if (arguments.length == 2) strict = true;
        if (a.length != b.length) return false;
        for (var i = 0; i < a.length; i++) {
            if (a[i] instanceof Array && b[i] instanceof Array) {
                if (!a[i].equals(b[i], strict)) return false;
            } else if (strict && a[i] != b[i]) {
                return false;
            } else if (!strict) {
                return _.equals(a.sort(), b.sort(), true);
            }
        }
        return true;
    };
    //数组工具相关结束

    /**
     * 精度范围
     * @readonly
     * @alias module:_.EPSILON
     */
    _.EPSILON = Math.pow(2, -52);

    /**
     * 默认数值保留小数位数
     * @readonly
     * @alias module:_.DEFAULT_SCALE
     */
    _.DEFAULT_SCALE = 2;

    /**
     * 加
     * @param {*}  x   第一个数值
     * @param {*}  y   第二个数组
     * @returns {number}
     * @alias module:_.numAdd
     * @example
     * _.numAdd('3',5);
     * =>8
     */
    _.numAdd = function (x, y) {
        var result = Number(x) + Number(y);
        return result;
    };

    /**
     * 减
     * @param {*}   x   第一个数值
     * @param {*}   y   第二个数值
     * @returns {number}
     * @alias module:_.numSubtract
     * @example
     * _.numSubtract('7',5);
     * =>2
     */
    _.numSubtract = function (x, y) {
        var result = Number(x) - Number(y);
        return result;
    };

    /**
     * 乘
     * @param {*}   x    第一个数值
     * @param {*}   y    第二个数值
     * @returns {number}
     * @alias module:_.numMultiply
     * @example
     * _.numMultiply('2',3);
     * =>6
     */
    _.numMultiply = function (x, y) {
        var result = Number(x) * Number(y);
        return result;
    };

    /**
     * 除
     * @param {*}   x    第一个数值
     * @param {*}   y    第二个数值
     * @returns {number}
     * @alias module:_.numDivide
     * @example
     * _.numDivide(9,'3');
     * =>3
     */
    _.numDivide = function (x, y) {
        var result = Number(x) / Number(y);
        return result;
    };

    /**
     * 固定小数位数
     * @param {Number}  x       要处理的数值
     * @param {Number}  digits  小数位置，默认保留2位
     * @returns {string|*}
     * @alias module:_.toFixed
     * @example
     * _.toFixed(548.6512)
     * =>548.65
     */
    _.toFixed = function (x, digits) {
        if (typeof (x) == "undefined" || x === '') {
            return '';
        } else if (!_.isNumeric(x)) {
            return x;
        }
        digits = digits || this.DEFAULT_SCALE;
        x = (x + '').replace("E", "e");
        if ((x + '').indexOf('e') != -1) {
            return (+(Math.round(+(x)) + 'e' + -digits)).toFixed(digits);
        }
        return (+(Math.round(+(x + 'e' + digits)) + 'e' + -digits)).toFixed(digits);
    };

    /**
     * 移除数值指数表示
     * @param {Number}  x   要处理的数值
     * @returns {string}
     * @alias module:_.toFixed
     * @example
     *         var numbers = [
     *             1.1234567890123456789e+30,
     *             1.1234567890123456789e-30,
     *             -1.1234567890123456789e+30,
     *             -1.1234567890123456789e-30]
     * var i;
     * for (i=0;i<numbers.length;i++) {
     *        console.log(_.removeExponent(numbers[i]));
     *   }
     * =>1123456789012345700000000000000
     * =>0.0000000000000000000000000000011234567890123458
     * =>-1123456789012345700000000000000
     * =>0.00000000000000000000000000000.11234567890123458
     */
    _.removeExponent = function (x) {
        if (Math.abs(x) < 1.0) {
            var e = parseInt(x.toString().split('e-')[1]);
            if (e) {
                x *= Math.pow(10, e - 1);
                x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
            }
        } else {
            var e = parseInt(x.toString().split('+')[1]);
            if (e > 20) {
                e -= 20;
                x /= Math.pow(10, e);
                x += (new Array(e + 1)).join('0');
            }
        }
        return x;
    };

    /**
     * 判断两个小数数值是否相等
     * @param {Number}  x   第一个数值
     * @param {Number}  y   第二个数值
     * @returns {boolean}
     * @alias module:_.numEqual
     * @example
     * _.numEqual(0.1+0.2, 0.3);
     * =>true
     */
    _.numEqual = function (x, y) {
        return Math.abs(x - y) < this.EPSILON;
    };

    /**
     * 比较两数大小，x>y返回1，x==y返回0，否则返回-1
     * @param {Number}  x   第一个数值
     * @param {Number}  y   第二个数值
     * @returns {number}
     * @alias module:_.numCompare
     * @example
     * _.numCompare(3,5);
     * =>-4
     *
     * -.numCompare('aaa',3);
     * =>抛出异常Parameter is not a number!
     */
    _.numCompare = function (x, y) {
        if (!_.isNumeric(x) || !_.isNumeric(y)) {
            throw "Parameter is not a number!";
        }
        if (_.numEqual(x, y)) return 0;
        else if (x > y) return 1;
        else return -1;
    };

    //这里继续扩展函数
    //示例:_.a1=function(){};

    /**
     * 允许自己的实用程序函数扩展jPublic。传递一个 {name: function}定义的哈希添加到jPublic对象，以及面向对象封装。
     * @param obj
     * @returns {_}
     * @alias module:_.extend
     * @example
     * _.extend({
     *  abc: function(str) {
     *      return str;
     *  }
     * });
     * _.abc("Hello");
     * =>"Hello"
     */
    _.extend = function (obj) {
        _.each(_.functions(obj), function (name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function () {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return chainResult(this, func.apply(_, args));
            };
        });
        return _;
    };
    _.extend(_);
}());