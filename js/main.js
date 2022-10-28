let jsList = [
    './js/util/function.js',

    './js/event-hub.js',
    './js/search-tool.js',
    './js/aside-bar.js',
    './js/color-selector.js',
    './js/poetry-svg.js',

    './js/background.js',
    './js/index/file_path_idx.js',
]

let developModel = false;

let cssList = [
    './css/main.css',
]

let version = developModel ? new Date().getTime() : '20221028';

function loadScript(url) {
    let script = document.createElement('script');
    script.src = `${url}?version=${version}`;
    let body = document.querySelector('body');
    body.append(script);
    
    return script;
}
function loadCss(url) {
    let link = document.createElement('link');
    link.rel = 'stylesheet'
    link.href = `${url}?version=${version}`;
    let head = document.querySelector('head');
    head.append(link);

    return link;
}

function syncLoad(urlList, loadFunction) {
    let len = urlList.length;
    if (len === 0) {
        return
    }
    let el = loadFunction(urlList[0]);
    el.onload = () => {
        urlList.shift()
        syncLoad(urlList, loadFunction)
    }
}

window.onload = function () {
    // syncLoad(cssList, loadCss)
    syncLoad(jsList, loadScript)
}

window.addEventListener("popstate", function (e) {
    let path = window.location.href
    let url_segs = path.split('/#/')
    if (url_segs.length >= 2) {
        let page = url_segs[1]
        window.eventHub.emit('open-sheet', [page, false])
    } else {
        window.eventHub.emit('open-home')
    }
}, false);