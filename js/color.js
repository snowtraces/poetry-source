var colorCold = [
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

]

var colorWarm = [
    {
        r: 234,
        g: 231,
        b: 243,
        _r: 206,
        _g: 20,
        _b: 22,
        _a: .75
    },
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

]

let colors = colorCold.concat(colorWarm)

let color_idx = 5;
color_idx = Math.floor(Math.random() * Math.floor(colors.length))

let _color = colors[color_idx]
let color = {}
for (const key in _color) {
    if (key.startsWith('_') && key !== '_a') {
        color[key] = _color[key]
    } else {
        color[key] = _color[key]
    }
}