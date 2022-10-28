{
    let view = {
        el: '#asideBar',
        template: `<div class="svg-left active"><svg class="icon" width="128px" height="128.00px" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                    d="M337.87 512.5L771.55 78.82c17.574-17.574 17.574-46.066 0-63.64-17.573-17.573-46.066-17.573-63.64 0L260.796 462.295c-27.727 27.728-27.727 72.682 0 100.41l447.116 447.115c17.573 17.573 46.066 17.573 63.64 0 17.573-17.574 17.573-46.066 0-63.64L337.87 512.5z" />
                </svg>
                </div>
                <div class="svg-right">
                <svg class="icon" width="128px" height="128.00px" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                    d="M686.86 512.5L253.18 78.82c-17.573-17.574-17.573-46.066 0-63.64 17.574-17.573 46.066-17.573 63.64 0l447.115 447.115c27.727 27.728 27.727 72.682 0 100.41L316.82 1009.82c-17.574 17.573-46.066 17.573-63.64 0-17.573-17.574-17.573-46.066 0-63.64L686.86 512.5z" />
                    </svg>
                </div>`,
        render() {
            el(this.el).innerHTML = this.template
        },
        toggle() {
            let isHidden = $.el(`${this.el}  .svg-left`).classList.contains('active')
            if (isHidden) {
                $.el(`${this.el}  .svg-left`).classList.remove('active')
                $.el(`${this.el}  .svg-right`).classList.add('active')

                $.el('aside').classList.add('active')
            } else {
                $.el(`${this.el}  .svg-right`).classList.remove('active')
                $.el(`${this.el}  .svg-left`).classList.add('active')

                $.el('aside').classList.remove('active')
            }
        }
    }

    let model = {}

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {
            $.bindEvent(this.view.el, 'click', () => {
                this.view.toggle()
            })
            $.bindEvent('#download', 'click', () => {
                let scaleTimes = 2

                let canvas = document.createElement('canvas');  //准备空画布
                let _with = SVG.width.baseVal.value
                let _height = SVG.height.baseVal.value
                canvas.width = _with * scaleTimes;
                canvas.height = _height * scaleTimes

                let context = canvas.getContext('2d');  //取得画布的2d绘图上下文
                context.globalCompositeOperation = "multiply"

                // 1. 背景
                let bgImg = new Image()
                style = BG.currentStyle || window.getComputedStyle(BG, false);
                bgImg.src = style.backgroundImage.slice(4, -1).replace(/"/g, "");

                bgImg.onload = function () {
                    let pattern = context.createPattern(bgImg, "repeat")
                    context.fillStyle = pattern
                    context.clearRect(0, 0, canvas.width, canvas.height)
                    context.fillRect(0, 0, canvas.width, canvas.height)

                    // 2. 图片
                    let svgXml = BG.innerHTML;
                    let image = new Image();
                    image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgXml))); //给图片对象写入base64编码的svg流

                    image.onload = function () {
                        context.drawImage(image, 0, 0, _with, _height, 0, 0, canvas.width, canvas.height);

                        // 3. 文字
                        let textSvg = poetry.innerHTML;
                        let textImage = new Image();
                        textImage.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(textSvg))); //给图片对象写入base64编码的svg流

                        textImage.onload = function () {
                            context.globalCompositeOperation = "source-over"

                            let textStyle = window.getComputedStyle(poetry, false)
                            let textHeight = textStyle.height.substring(0, textStyle.height.length - 2)
                            let textWidth = textStyle.width.substring(0, textStyle.width.length - 2)
                            context.drawImage(textImage, 0, 0, textWidth, textHeight, 64, 64, textWidth * scaleTimes, textHeight * scaleTimes);

                            let a = document.createElement('a');
                            a.href = canvas.toDataURL('image/png');  //将画布内的信息导出为png图片数据
                            a.download = `portey-${new Date().toISOString()}.png`;  //设定下载名称
                            a.click(); //点击触发下载
                        }
                    }
                }

            })

            $.bindEvent('#speech', 'click', () => {
                window.eventHub.emit('speech')
            })
        },
        bindEventHub() {

        }
    }
    controller.init(view, model)
}