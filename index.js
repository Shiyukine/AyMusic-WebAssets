/**
* @type {AyMusic}
*/
var app = null;

//pour JS module, utiliser Utils.newError(info, subtext)
function newError(info, subText)
{
    console.error(info, "\n", subText)
    /*let errPanel = new infoPanel(info, subText, [{
        text: "OK", isPositive: true, onclick: () =>
        {
            errPanel.close()
        }
    }], false)
    await errPanel.showDialog()*/
}