{
    let TANG_IDX_KEY = 'tang_idx_key'
    let view = {
        el: '#search-wrapper',
        template: `
        <input type='search' name='keyword' id='keyword'>
        <ul class='searchResult'>
        </ul>
        `,
        render() {
            el(this.el).innerHTML = this.template
        },
        update(findResult) {
            el('.searchResult').innerHTML =
                Object.keys(findResult).slice(0, 20).map(r =>
                    `<li data-idx='${findResult[r]}'>${this.split(r)[0]}<span class='author'>${this.split(r)[1]}</span></li>`
                ).join('')
        },
        clear() {
            el('.searchResult').innerHTML = ''
        },
        split(name, spliter = '-') {
            let idx = name.lastIndexOf(spliter)
            let nameA = name.substring(0, idx)
            let nameB = name.substring(idx + spliter.length)

            return [nameA, nameB]
        }
    }
    let model = {
        tangIdx: {},
        init() {
            let jsonData = localStorage.getItem(TANG_IDX_KEY)
            if (jsonData) {
                if (typeof jsonData === 'string') {
                    this.tangIdx = JSON.parse(jsonData)
                }
            } else {
                let dictJS = document.createElement('script')
                dictJS.src = './js/index/tang_poetry_idx.js'
                el('body').appendChild(dictJS)

                dictJS.onload = () => {
                    this.tangIdx = window.tangIdx
                    localStorage.getItem(TANG_IDX_KEY, JSON.stringify(this.tangIdx))
                }
            }
            window.tangIdx = this.tangIdx
        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.model.init()
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {
            // 关键词搜索
            registEvent(`${this.view.el} #keyword`, 'keyup', () => {
                debounce(function () {
                    let keyword = el('#keyword').value
                    if (!keyword) {
                        this.view.clear()
                    } else {
                        let re = new RegExp(`${keyword}`);
                        let keyArray = Object.keys(tangIdx).filter(k => re.test(k))
                        if (keyArray) {
                            keyArray = keyArray.splice(0, Math.min(20, keyArray.length))
                            let findResult = {}
                            keyArray.forEach(_key => {
                                findResult[_key] = this.model.tangIdx[_key]
                            })
                            this.view.update(findResult)
                        } else {
                            this.view.clear()
                        }
                    }
                }.bind(this), 400)()
            })
        },
        bindEventHub() {
            // 点击列表，展示数据
            registEventForce('.searchResult > li', 'click', function () {
                let dataIdx = this.getAttribute('data-idx').split('-')
                eventHub.emit('clickSearchResult', { volume: dataIdx[0], sequence: dataIdx[1] })
            }, '.searchResult')
        }
    }

    controller.init(view, model)
}