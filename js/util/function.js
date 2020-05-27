window.$ = (function (window, $) {
    const log = console.log.bind(console)
    const error = console.error.bind(console)

    /**
     * dom选择
     */
    const el = (selector) => document.querySelector(selector)
    const elAll = (selector) => document.querySelectorAll(selector)

    /**
     * 事件绑定
     */
    const bindEvent = (selector, event, func) => {
        const nodeList = elAll(selector)
        if (!nodeList || nodeList.length === 0) {
            bindEventForce(selector, event, func)
        } else {
            let eventList = event.split(' ').map(e => e.trim())
            nodeList.forEach(
                node => eventList.forEach(e => node.addEventListener(e, func, false))
            )
        }
    }

    /**
     * 事件绑定委托，默认使用document处理event
     */
    const bindEventForce = function (selector, event, func, delegation) {
        let eventList = event.split(' ').map(e => e.trim())
        eventList.forEach(e => {
            (delegation ? el(delegation) : document).addEventListener(e, (_e) => {
                const _list = elAll(selector)
                _list.forEach(
                    item => (_e.target === item || item.contains(_e.target)) && func.call(item, _e)
                )
            }, false)
        })
    }

    /**
     * 首字母大写
     */
    const firstUpperCase = ([first, ...rest]) => first.toUpperCase() + rest.join('')

    /**
     * 复制文本
     */
    const copy = function (text) {
        return new Promise((resolve, reject) => {
            var targetEL = document.createElement("textarea")
            targetEL.style.position = "fixed"
            targetEL.style.left = "-9999px"
            targetEL.style.top = "0"
            document.body.append(targetEL)
            targetEL.textContent = text

            targetEL.focus()
            targetEL.setSelectionRange(0, targetEL.value.length)
            document.execCommand('copy')
            targetEL.blur()
            targetEL.remove()

            resolve()
        })
    }

    /**
     * 日志功能
     */
    const errorMsg = function (msg) {
        let msgEL = buildMsgEl()
        el('#snowMsgContent').innerHTML = msg || '失败'
        msgEL.classList.add('error-msg')
        msgEL.classList.add('active')
        setTimeout(function () {
            msgEL.classList.remove('error-msg')
            msgEL.classList.remove('active')
        }, 800)
    }
    const successMsg = function (msg) {
        let msgEL = buildMsgEl()
        el('#snowMsgContent').innerHTML = msg || '成功'
        msgEL.classList.add('success-msg')
        msgEL.classList.add('active')
        setTimeout(function () {
            msgEL.classList.remove('success-msg')
            msgEL.classList.remove('active')
        }, 800)
    }

    const buildMsgEl = function () {
        if (el('#snowMsg')) {
            return el('#snowMsg')
        }
        let msg = document.createElement('div')
        msg.id = 'snowMsg'
        let msgContent = document.createElement('div')
        msgContent.id = 'snowMsgContent'
        msg.appendChild(msgContent)
        el('body').appendChild(msg)

        let msgStyle = document.createElement('style')
        msgStyle.textContent = `
        /* 消息提示 */
            #snowMsg {
                position: fixed;
                left: 0;
                right: 0;
                top: 30px;
                z-index: 999999;
                width: auto;
                max-width: 200px;
                margin: auto;
                border-radius: 5px;
                padding: 10px;
                color: #fff;
                text-align: center;
                opacity: .9;
                display: none;
                z-index: -1;
            }
            #snowMsg.error-msg {
                background-color: #f00;
            }
            #snowMsg.success-msg {
                background-color: #2196F3;
            }
            #snowMsg.active {
                display: block;
                z-index: 1;
            }
        `
        el('body').appendChild(msgStyle)
        return msg
    }

    /**
     * 抖动处理
     */
    const debounce = function (func, delay) {
        let timeout = null
        return function () {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                func.call()
            }, delay || 300)
        }
    }

    /**
     * 字符串模板动态执行
     */
    const evalTemplate = function (template, ...params) {
        let _template = 'return \`' + template + '\`'
        let func = new Function('data', _template)
        return func(params[0])
    }

    /**
     * 异步请求
     */
    const get = function (url, data) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            if (data) {
                url = url + '?' + Object.keys(data).map(key => `${key}=${data[key]}`).join('&')
            }
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (xhr.responseText
                            && (xhr.responseText.charAt(0) === '[' || xhr.responseText.charAt(0) === '{')) {
                            let result = JSON.parse(xhr.responseText)
                            resolve(result);
                        } else {
                            resolve(xhr.responseText)
                        }
                    } else {
                        reject ? reject() : errorMsg(result.msg || '失败')
                    }
                }
            }
            xhr.send(null);
        })
    }
    const post = function (url, data) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (xhr.responseText
                            && (xhr.responseText.charAt(0) === '[' || xhr.responseText.charAt(0)) === '{') {
                            let result = JSON.parse(xhr.responseText)
                            resolve(result);
                        } else {
                            resolve(xhr.responseText)
                        }
                        successMsg(result.msg || '成功')
                    } else {
                        reject ? reject() : errorMsg(result.msg || '失败')
                    }
                }
            }
            xhr.send(json2FormData(data));
        })
    }

    const json2FormData = function (data) {
        let formData = new FormData()
        for (let key in data) {
            formData.set(key, data[key])
        }
        return formData
    }

    const func = {
        el: el,
        elAll: elAll,
        bindEvent: bindEvent,
        bindEventForce: bindEventForce,
        firstUpperCase: firstUpperCase,
        copy: copy,
        log: log,
        errorMsg: errorMsg,
        successMsg: successMsg,
        debounce: debounce,
        evalTemplate: evalTemplate,
        post: post,
        get: get,
    }
    for (const _func in func) {
        $[_func] = func[_func]
        window[_func] = func[_func]
    }
    return $
})(window, window.$ || {})