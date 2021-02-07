(function(window){
    var saveData = {
        setDataConver: function(obj) {
            if (this.browserCheck()) return
            let name = obj.name
            let data = obj.data
            this.SaveAs(name, data); //自动下载
        },
        SaveAs: function(fileName, csvData) {
            var bw = this.browser();
            if(!bw['edge'] && !bw['ie']) { // 非 ie/edge
                var alink = document.createElement("a");
                alink.id = "linkDwnldLink";
                alink.href = this.getDownloadUrl(csvData);
                document.body.appendChild(alink);
                var linkDom = document.getElementById('linkDwnldLink');
                linkDom.setAttribute('download', fileName);
                linkDom.click();
                document.body.removeChild(linkDom);
            } else if(bw['ie'] >= 10 || bw['edge'] == 'edge') { // ie10+/edge
                var _utf = "\uFEFF";
                var _csvData = new Blob([_utf + csvData], {
                    type: 'text/csv'
                });
                window.navigator.msSaveBlob(_csvData, fileName);
            } else { // ie9-
                var oWin = window.top.open("about:blank", "_blank");
                oWin.document.write('sep=,\r\n' + csvData);
                oWin.document.close();
                oWin.document.execCommand('SaveAs', true, fileName);
                oWin.close();
            }
        },
        getDownloadUrl: function(csvData) {
            var _utf = "\uFEFF"; // 为了使Excel以utf-8的编码模式，同时也是解决中文乱码的问题
            if (window.Blob && window.URL && window.URL.createObjectURL) {
                if (typeof csvData === 'string') {
                    var csvData = new Blob([_utf + csvData], {
                        type: 'text'
                    });
                }
                return URL.createObjectURL(csvData);
            }
            // return 'data:attachment/csv;charset=utf-8,' + _utf + encodeURIComponent(csvData);
        },
        browserCheck: function() {
            // IE9以下的不支持
            var bw = this.browser();
            return bw['ie'] < 9; 
        },
        browser: function() {
            var Sys = {};
            var ua = navigator.userAgent.toLowerCase();
            var s;
            (s = ua.indexOf('edge') !== - 1 ? Sys.edge = 'edge' : ua.match(/rv:([\d.]+)\) like gecko/)) ? Sys.ie = s[1]:
                (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] :
                    (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
                        (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
                            (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
                                (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;
            return Sys;
        }
    };
    window.saveData = saveData;
})(window)