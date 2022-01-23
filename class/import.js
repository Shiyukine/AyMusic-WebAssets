export default class Import
{
    /**
     * @param {String|URL} filePath filepath
    */
    static loadJS(filePath)
    {
        return new Promise((resolve) =>
        {
            var script = document.createElement("script")
            document.head.insertBefore(script, document.head.firstChild)
            script.onload = function (txt)
            {
                resolve(txt)
            }
            script.src = filePath
        })
    }

    /**
     * @param {String|URL} filePath filepath
    */
    static loadCSS(filePath)
    {
        var link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = filePath
        document.head.appendChild(link)
    }

    /**
     * @param {String|URL} filePath filepath
    */
    /*
    static loadHTML(filePath)
    {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, false);
        xhr.onreadystatechange = function ()
        {
            if (this.readyState !== 4) return;
            if (this.status !== 200) return; // or whatever error handling you want
        };
        xhr.send();
        return xhr.responseText
    }*/

    /**
     * @param {String|URL} filePath filepath
    */
    static getData(filePath)
    {
        return new Promise((resolve) =>
        {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', filePath, true);
            xhr.onreadystatechange = function ()
            {
                if (this.readyState !== 4) return;
                if (this.status !== 200) return; // or whatever error handling you want
                else resolve(xhr.responseText)
            };
            xhr.send();
        })
    }
}