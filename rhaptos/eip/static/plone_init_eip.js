var textEdited = false;

function onTextEdit(e)
{
    if (!e) e = window.event;
    textEdited = true;
}


/**
 * Initialize EIP for modules in the workspace  Depends on editInPlace.js
 */
function initEip(textareaid)
{
    var bFullSourceEditing;
    var strEditSourceParameter;
    var strEditSourceIntParameter;
    var bValidationError;
    var strEditInPlace;
    var strFullSourceEdit;

    if (!gXMLHttpRequest) {
        return;
    }

    strEditSourceParameter    = getUrlParameter('edit_source');
    strEditSourceIntParameter = getUrlParameter('edit_source:int');

    bFullSourceEditing = ( (strEditSourceParameter    && strEditSourceParameter.length    > 0) ||
                           (strEditSourceIntParameter && strEditSourceIntParameter.length > 0) );

    gButtonMode = 'save';

    // minimal check to see if the current browser has *robust* JavaScript DOM support
    if (document.getElementById && document.createElement) {

        if ( bFullSourceEditing ) {
            // what the server sent us does not need to be changed

            // debug only:
            bValidationError = ( $('eipEditInPlaceEditingMode') == null );
        }
        else {
            try {
                // populate global variable gURLs with values found in the <html><head>'s <link> nodes
                // these links will be used by EIP to commuicate withthe server.
                extractLinks();

                //pull the source out of the text area
                var nodeTextArea = document.getElementById(textareaid);
                var reg = new RegExp(/\s*<\?/);
                var strCnxmlSource = nodeTextArea.value.replace(reg, '<?');
                // Install a minimal handler for the textarea
                nodeTextArea.onchange = onTextEdit;

                // side effect: sets global variable gSource.doc (CNXML DOM)
                parseSource(strCnxmlSource);

                //Download the rendered content
                var strContentHtml = downloadContent(gURLs.content);
                var nodeContentParentHtml = nodeTextArea.parentNode;

                // currently we only support MS/InternetExplorer and Mozilla/FireFox
                // Opera and Safari/Chrome (Webkit) need AJAX support for consideration
                if (Prototype.Browser.IE){
                    var eip = document.createElement('div');
                    nodeContentParentHtml.insertBefore(eip, nodeTextArea);
                    eip.outerHTML = strContentHtml;
                    $('cnx_main').style.display='none';
                    $('cnx_main').style.zoom='1';
                }
                else if (Prototype.Browser.Gecko){
                    var docContentHtml = parseXmlTextToDOMDocument(strContentHtml);
                    var nodeNewContentHtml = document.importNode(docContentHtml.documentElement, true);
                    nodeTextArea.style.display='none';
                    nodeContentParentHtml.insertBefore(nodeNewContentHtml, nodeTextArea);
                }

                // create div[@id='eipMasterEditContainerDiv'],
                // make it a sibling of div[@id='cnx_main'], and hide it.
                createEditNodes();

                // gather i18n strings
                strEditInPlace    = $('eipEditInPlaceEditingMode').innerHTML;
                strFullSourceEdit = $('eipFullSourceEditingMode' ).innerHTML;

                // Change the top edit line to Edit In Place
                strNewTopHtml = "<span id='eipEditInPlaceEditingMode'>" + strEditInPlace + "</span> | " +
                                "<a href='module_text?edit_source=1' id='eipFullSourceEditingMode'>" + strFullSourceEdit + "</a>";
                $('eipTopEditingMode').innerHTML = strNewTopHtml;

                // tragically named.  modify the content's rendered HTML.
                // add "Insert..." nodes into the HTML, add the edit links
                // for each section node, and add the hover text for each editable node.
                setupForms();
            }

            catch(e) {
                openErrorWindow("Editing DISABLED due to the following error:  " + e.message);
                gEditNodeInfo.state = STATE_BROKEN;
            }

        }
    }
}

function beginEip()
{
    if (!gXMLHttpRequest) {
        return;
    }

    // Hide the source form and display EIP
    document.getElementById('edit_form').style.display='none';
    document.getElementById('cnx_main').style.display='block';

}

function onLoad(e) 
{
    var strEditSourceParameter;
    var strEditSourceIntParameter;
    var bFullSourceEditing;

    strEditSourceParameter    = getUrlParameter('edit_source');
    strEditSourceIntParameter = getUrlParameter('edit_source:int');

    bFullSourceEditing = ( (strEditSourceParameter    && strEditSourceParameter.length    > 0) ||
                           (strEditSourceIntParameter && strEditSourceIntParameter.length > 0) );

    if ( Prototype.Browser.Gecko ) {
        if ( ! bFullSourceEditing ) {
            // for the firefox browser when the page gets reloaded via the back button,
            // all of the global javascript state gets rolled back to its state just after
            // the first page load.  this implies that all of the changes to the CNXML DOM
            // are discarded.  here we reload the CNXML DOM.  we tried but failed to locate
            // a firefox page load event to indicate whether or not this onload is the first
            // or subsequent page load.  thus, we reset the CNXML DOM every page load.
            var reg;
            var strCnxmlSource;
            var strMassagedCnxmlSource;

            strCnxmlSource = downloadSourceFragment(gURLs["source_fragment"], '/');

            reg = new RegExp(/<\?.*?\?>\s*/);
            strMassagedCnxmlSource = strCnxmlSource.replace(reg, "");
            strMassagedCnxmlSource = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + strMassagedCnxmlSource;

            // side effect: sets gSource.doc
            parseSource(strMassagedCnxmlSource);
        }
    }

    // If we get here, the page supports javascript so we can remove the javascript warning
    warning = document.getElementById('javascript_warning');

    if (gXMLHttpRequest) {
        warning.parentNode.removeChild(warning);
    }
    else {
        warning.innerHTML="Sorry, your browser does not support Edit-In-Place.\nPlease try using a recent version of Mozilla Firefox or Internet Explorer.";
    }
}

window.onload = onLoad;

/*
    "pageshow event works the same as the load event, except that it fires every time the page is loaded
    (whereas the load event doesn?t fire in Firefox 1.5 when the page is loaded from cache). The first time the
    page loads, the pageshow event fires just after the firing of the load event. The pageshow event uses a
    boolean property called persisted that is set to false on the initial load. It is set to true if it is not
    the initial load (in other words, it is set to true when the page is cached)."

   https://developer.mozilla.org/en/Using_firefox_1.5_caching
*/
function onPageShow(e) {
    // e.persisted was always false no matter how we got here
    if ( e.persisted ) {
        alert('onPageShow happened. persisted/cached is true.');
    }
    else {
        alert('onPageShow happened. persisted/cached is false.');
    }
}

//if ( Prototype.Browser.Gecko ) {
//    window.onpageshow = onPageShow;
//}
