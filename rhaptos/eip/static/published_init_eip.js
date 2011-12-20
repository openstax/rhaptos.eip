/**
 * Initialize EIP for published modules.  Depends on editInPlace.js
 */
function initEip()
{
    if (!gXMLHttpRequest) {
        alert("Sorry, your browser does not support Edit-In-Place.\n" +
              "Please try using either Mozilla Firefox or Internet Explorer 6.");
        return
    }

    if (document.getElementById && document.createElement) {

        try {
            extractLinks();

            createEditNodes();

            gEditNodeInfo.state = STATE_DOWNLOADING_SOURCE;
            source = downloadContent(gURLs.source);
            gEditNodeInfo.state = STATE_VIEWING;
            parseSource(source);

            setupForms();

            window.onbeforeunload = onBeforeUnload;    
        }

        catch(e) {
            openErrorWindow("Editing DISABLED due to the following error:  " + e.message);
            gEditNodeInfo.state = STATE_BROKEN;
        }

    }
}
