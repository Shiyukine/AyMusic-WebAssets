/**
* @type {AyMusic}
*/
var app = null;

//pour JS module, utiliser Utils.newError(info, subtext)
async function newError(info, subText)
{
    console.error(info, "\n", subText)
    let errPanel = new infoPanel(document.getElementById("main"), info, subText, [{
        text: "OK", isPositive: true, onclick: () =>
        {
            errPanel.close()
        }
    }], false)
    await errPanel.showDialog()
}