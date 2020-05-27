{
    let view = {
        el: '#search-wrapper',
        template: `
        <input type='search' name='keyword' id='keyword' autocomplete="off" >
        <ul class='searchResult'>
        </ul>
        `,
        render() {
            el(this.el).innerHTML = this.template
        },
        update(findResult) {
            el('.searchResult').innerHTML =
                Object.keys(findResult).slice(0, 20).map(r => {
                    let baseInfo = this.split(r)

                    return `<li data-idx='${findResult[r]}'
                    title='${baseInfo[0]} ${baseInfo[1]}'
                    >${baseInfo[0]}<span class='author'>${baseInfo[1]}</span></li>`
                }).join('')
        },
        clear() {
            el('.searchResult').innerHTML = ''
        },
        split(summary, spliter = '-') {
            let summaryArray = summary.split(spliter);

            let dynasty = summaryArray[0];
            let title = summaryArray[1]
            let author = summaryArray[2]
            let first = summaryArray[3]
            return [`[${dynasty}]${author} - ${title}`, first]
        }
    }
    let model = {
        init() {
            let dictJS = document.createElement('script')
            dictJS.src = './js/index/main_data_index.js'
            el('body').appendChild(dictJS)

            dictJS.onload = () => {
                console.log('加载成功')
            }
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
            $.bindEvent(`${this.view.el} #keyword`, 'keyup', () => {
                debounce(function () {
                    let keyword = el('#keyword').value
                    if (!keyword) {
                        this.view.clear()
                    } else {
                        let re = new RegExp(`${keyword}`);
                        let findResult = {};
                        let result_cnt = 0;
                        for (let summary in search_data_index) {
                            if (re.test(summary)) {
                                findResult[summary] = search_data_index[summary];
                                result_cnt++;
                            }
                            if (result_cnt >= 20) {
                                break;
                            }
                        }
                        if (result_cnt > 0) {
                            this.view.update(findResult)
                        } else {
                            this.view.clear()
                        }
                    }
                }.bind(this), 1000)()
            });
            // 点击列表，展示数据
            $.bindEvent('.searchResult > li', 'click', function () {
                let dataIdx = this.getAttribute('data-idx').split('-')
                eventHub.emit('clickSearchResult', { file: dataIdx[0], index: dataIdx[1] })
            })
        },
        bindEventHub() {

        }
    }

    controller.init(view, model)
}