/* Check to See if an activeX object is required for xmlHTTP */

var gXMLHttpRequest;
var web_browser;

if        ( Sarissa._SARISSA_IS_IE ) {
    web_browser = 'ie';
} else if ( Sarissa._SARISSA_IS_MOZ ) {
    web_browser = 'mozilla';
} else if ( Sarissa._SARISSA_IS_SAFARI ) {
    web_browser = 'safari';
} else {
    web_browser = null;
}

if ( window.XMLHttpRequest ) {
    gXMLHttpRequest = new window.XMLHttpRequest();
}
else {
    gXMLHttpRequest =  null;
}


