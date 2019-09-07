window.Snow = (function (window, Snow) {
    const log = console.log.bind(console)
    const error = console.error.bind(console)

    const el = (selector) => { return document.querySelector(selector) }
    const elAll = (selector) => { return document.querySelectorAll(selector) }

    const registEvent = (selector, event, func) => {
        const nodeList = elAll(selector)
        let eventList = event.split(' ').map(e => e.trim())
        nodeList.forEach(
            node => {
                eventList.forEach(e => {
                    node.addEventListener(e, func, false)
                })
            }
        )
    }

    const registEventForce = function (selector, event, func) {
        let eventList = event.split(' ').map(e => e.trim())
        eventList.forEach(e => {
            document.addEventListener(e, (_e) => {
                const _list = elAll(selector)
                _list.forEach(
                    item => {
                        if (_e.target === item) {
                            func.call(item)
                        }
                    }
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
    const copy = function (targetEL) {
        if (!targetEL || !targetEL.value) {
            error('无可复制内容！')
            return false
        }

        targetEL.focus()
        targetEL.setSelectionRange(0, target.value.length)
        document.execCommand("copy")
        targetEL.blur()
        return true
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

    const buildMsgEl = function() {
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
                top: 50px;
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

    const func = {
        el: el,
        elAll: elAll,
        registEvent: registEvent,
        registEventForce: registEventForce,
        firstUpperCase: firstUpperCase,
        copy: copy,
        log: log,
        errorMsg: errorMsg,
        successMsg: successMsg,
    }
    for (const _func in func) {
        Snow[_func] = func[_func]
        window[_func] = func[_func]
    }
    return Snow
})(window, window.Snow || {})
