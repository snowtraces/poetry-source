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
        update(baseNode, findResult) {
            el('.searchResult').innerHTML =
            (baseNode.isW ? 
                `<li data-idx='${baseNode.data}'>${this.split(baseNode.word)[0]}<span class='author'>${this.split(baseNode.word)[1]}</span></li>` 
                : '')
            + Object.keys(findResult).slice(0, 20).map(r => 
                `<li data-idx='${findResult[r]}'>${this.split(r)[0]}<span class='author'>${this.split(r)[1]}</span></li>`
                ).join('')
        },
        clear(){
            el('.searchResult').innerHTML = ''
        },
        split(name, spliter = '-'){
            let idx = name.lastIndexOf(spliter)
            let nameA = name.substring(0, idx)
            let nameB = name.substring(idx + spliter.length)

            return [nameA, nameB]
        }
    }
    let model = {
        tree: new Trie(TANG_IDX_KEY, false),
        init() {
            this.tree.init('./js/index/tang_poetry_idx.js', 'tangIdx')
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
                debounce(function(){
                    let keyword =  el('#keyword').value
                    if (!keyword) {
                        this.view.clear()
                    } else {
                        let baseNode = this.model.tree.search(keyword)
                        if (baseNode) {
                            let findResult = this.model.tree.findWord({ [baseNode.word]: baseNode }, {})
                            this.view.update(baseNode, findResult)
                        } else {
                            this.view.clear()
                        }
                    }
                }.bind(this))()
            })
        },
        bindEventHub() {
            // 点击列表，展示数据
            registEventForce('.searchResult > li', 'click', function(){
                let dataIdx = this.getAttribute('data-idx').split('-')
                eventHub.emit('clickSearchResult', {volume: dataIdx[0], sequence: dataIdx[1]})
            })
        }
    }

    controller.init(view, model)
}