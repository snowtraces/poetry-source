{
    let COLOR_KEY = 'color_index';
    let view = {
        el: '#color-selector',
        template: `\${data.map((c, idx) => \`<div class="\${c.active ? 'active' : ''}" data-idx=\${idx} style="background:rgba(\${c._r}, \${c._g}, \${c._b})"></div>\`).join('')}`,
        render(data) {
            el(this.el).innerHTML = evalTemplate(this.template, data)
        },
        init(color) {
            window.color = color
        }
    }

    let model = {
        colorCold: [
            {
                r: 231,
                g: 238,
                b: 246,
                _r: 13,
                _g: 57,
                _b: 111,
                _a: .75
            },
            {
                r: 236,
                g: 247,
                b: 251,
                _r: 0,
                _g: 56,
                _b: 87,
                _a: .75
            },

            {
                r: 252,
                g: 242,
                b: 248,
                _r: 16,
                _g: 50,
                _b: 54,
                _a: .75
            },
            {
                r: 255,
                g: 248,
                b: 245,
                _r: 67,
                _g: 60,
                _b: 57,
                _a: .75
            },

        ],

        colorWarm: [
            {
                r: 251,
                g: 249,
                b: 247,
                _r: 119,
                _g: 59,
                _b: 49,
                _a: .75
            },
            {
                r: 255,
                g: 240,
                b: 229,
                _r: 100,
                _g: 18,
                _b: 11,
                _a: .75
            },
            {
                r: 246,
                g: 238,
                b: 240,
                _r: 43,
                _g: 18,
                _b: 22,
                _a: .75
            },
        ],
        getAllColor() {
            let allColors = this.colorCold.concat(this.colorWarm);
            let color_key = localStorage.getItem(COLOR_KEY);
            if (color_key) {
                allColors[parseInt(color_key)].active = true;
            }
            return allColors;
        },
        getColor() {
            let colors = this.colorCold.concat(this.colorWarm);
            let color_key = localStorage.getItem(COLOR_KEY);
            if (!color_key) {
                return colors[0]
            } else {
                return colors[parseInt(color_key)]
            }
        }

    }

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.init(this.model.getColor())
            this.view.render(this.model.getAllColor())
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {
            $.bindEvent('#color-selector > div', 'click', function (e) {
                let idx = e.target.dataset.idx;
                localStorage.setItem(COLOR_KEY, idx || 0)
                location.reload()
            })
        },
        bindEventHub() {

        }
    }

    controller.init(view, model)
}
