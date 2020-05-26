{
    const LAST_POETRY_KRY = 'last_poetry'
    let view = {
        el: '#poetry',
        template: `
        <div class="title-wraper">
            <h2 class="poetryTitle">\${data.title}</h2>
            <div class="poetryAuthor">\${data.authorName}</div>
        </div>
        <div class="poetryParagraph">
            \${
                data.content.map(p => '<p>' + p.replace(/(，|。|？|！|、)/g, ' ') + '</p>')
                    .join('')
            }
        </div> `,
        render(data) {
            el(this.el).innerHTML = evalTemplate(this.template, data)
        },
    }

    let model = {
        data: null,
        defaultData: {
            "id": "4cf43776e20ab133d51141b47ccf8e13",
            "title": "春江花月夜",
            "authorName": "张若虚",
            "authorId": "4cf43776e20ab13368264bdb5f2c22cb",
            "dynasty": "唐",
            "content": [
                "春江潮水连海平，海上明月共潮生。",
                "滟滟随波千万里，何处春江无月明！",
                "江流宛转绕芳甸，月照花林皆似霰。",
                "空里流霜不觉飞，汀上白沙看不见。",
                "江天一色无纤尘，皎皎空中孤月轮。",
                "江畔何人初见月？江月何年初照人？",
                "人生代代无穷已，江月年年望相似。",
                "不知江月待何人，但见长江送流水。",
                "白云一片去悠悠，青枫浦上不胜愁。",
                "谁家今夜扁舟子？何处相思明月楼？",
                "可怜楼上月徘徊，应照离人妆镜台。",
                "玉户帘中卷不去，捣衣砧上拂还来。",
                "此时相望不相闻，愿逐月华流照君。",
                "鸿雁长飞光不度，鱼龙潜跃水成文。",
                "昨夜闲潭梦落花，可怜春半不还家。",
                "江水流春去欲尽，江潭落月复西斜。",
                "斜月沉沉藏海雾，碣石潇湘无限路。",
                "不知乘月几人归，落月摇情满江树。"
            ],
        },
        fetchLastData() {
            let lastData = localStorage.getItem(LAST_POETRY_KRY)
            return lastData ? JSON.parse(lastData) : this.defaultData
        },
        setLastData(data) {
            localStorage.setItem(LAST_POETRY_KRY, JSON.stringify(data))
        }
    }

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.fetchLastData())
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {
        },
        bindEventHub() {
            eventHub.on('clickSearchResult', (data) => {
                let url = `/source/${file_path_idx[data.file]}`
                httpRequest(url).then(result => {
                    result = JSON.parse(result)
                    return result[data.index]
                }).then(data => {
                    let content = []
                    data.content.forEach(p => {
                        let pArray = p.match(/[^。！？]+[。！？]/g);
                        if (pArray && pArray.length > 0) {
                            pArray.forEach(_p => content.push(_p))
                        } else {
                            content.push(p)
                        }
                    })
                    data.content = content

                    this.view.render(data)
                    this.model.setLastData(data)
                })
            })
        }
    }

    controller.init(view, model)
}