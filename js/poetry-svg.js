{
    const LAST_POETRY_KRY = 'last_poetry'
    let view = {
        el: '#poetry',
        template: `
        <svg id='main-svg' xmlns='http://www.w3.org/2000/svg' height="\${data.maxHeight + data.padding * 2}" width="\${data.maxWidth + data.padding * 2}" >
        <rect id="svg-bg" x="0" y="0" height="\${data.maxHeight + data.padding * 2}" width="\${data.maxWidth + data.padding * 2}" rx="5" ry="5" fill="\${data.color}"/>
         \${data.title}
         \${data.authorName}
         \${data.content}
        </svg> `,
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
            this.load(this.model.fetchLastData())
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {
        },
        load(data) {
            // 1. 解析数据，生成svg结构
            let _data = {}

            // 分段处理
            let content = []
            data.content.forEach(p => {
                let pArray = p.match(/[^。！]+[。！？]/g);
                if (pArray && pArray.length > 0) {
                    pArray.forEach(_p => content.push(_p))
                } else {
                    content.push(p)
                }
            })

            let _width = 50;
            let _height = 24;
            let _padding = 64;
            content = content.map(_p => this.clear(_p))

            _data.padding = _padding
            _data.content = content
            _data.maxHeight = Math.max(...content.map(_p => this.clearHeight(_p, _height)), data.title.length * _height)

            let idx = _padding;
            _data.title = `<text style="writing-mode: vertical-lr;fill: #fff; padding: 2px 5px 0 12px; letter-spacing: 2px; line-height: 1.5em;" x="${idx = idx + 14}" y="${_padding}" font-size="25" font-family="KaiTi" font-weight="700">${this.clear(data.title)}</text>`
            _data.authorName = `<text style="writing-mode: vertical-lr;fill: #fff; padding: 2px 5px 0 12px; letter-spacing: 2px; line-height: 1.5em;opacity:0.75" x="${idx = idx + _width / 2}" y="${_padding + 5}" font-size="15" font-family="KaiTi" fill="#fff">${this.clear(data.authorName)}</text>`
            _data.content = _data.content.map(_p =>
                `<text style="writing-mode: vertical-lr;fill: #fff; padding: 2px 5px 0 12px; letter-spacing: 2px; line-height: 1.5em;" x="${idx = idx + _width}" y="${_padding}" font-size="22" font-family="KaiTi" fill="#fff">${_p}</text>
                <line style="opacity: 0.75" x1="${idx + _width / 2 - 5}" x2="${idx + + _width / 2 - 5}" y1="${_padding}" y2="${_padding + this.clearHeight(_p, _height)}" stroke="#fff" fill="none" stroke-width="1"/>
                `
            ).join("")

            _data.maxWidth = idx + _width / 2 - _padding
            _data.color = `rgba(${color._r}, ${color._g}, ${color._b}, ${color._a || .8})`

            this.view.render(_data)
        },
        clear(instring) {
            return instring.replace(/(，|。|？|！|、)/g, ' ').trim()
        },
        clearHeight(instring, _height) {
            let blankTimes = instring.split(" ").length - 1
            return instring.length * _height - blankTimes * _height / 2
        },
        bindEventHub() {
            eventHub.on('clickSearchResult', (data) => {
                let url = `${global_base_path}/source/${file_path_idx[data.file]}`
                $.get(url).then(result => {
                    return result[data.index]
                }).then(data => {
                    this.load(data)
                    this.model.setLastData(data)
                })
            })

            eventHub.on('speech', () => {
                // 朗读中则停止
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                    return
                }

                let voices = speechSynthesis.getVoices()
                if (voices.length === 0) {
                    voices = speechSynthesis.getVoices()
                }

                function speakbyvoice(text, voice) {
                    var utter = new SpeechSynthesisUtterance(text)
                    for (let v of voices) {
                        if (v.name.includes(voice)) {
                            utter.voice = v
                            break
                        }
                    }
                    utter.rate = 0.8
                    speechSynthesis.speak(utter)
                    return utter
                }
                let data = this.model.fetchLastData()
                speakbyvoice(
                    `${data.title}, ${data.authorName}, ${data.content}`
                    , "Xiaoxiao")
            })
        }
    }

    controller.init(view, model)
}