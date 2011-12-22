/**
 * editInPlaceSpecific.js
 *
 * This file contains information
 * specific to a particular version
 * of CNXML for which editInPlace
 * is being utilized.
 */

// BNW
//
// OOA:
//
// we need objects for the XML DOM and the HTML DOM.  Depending how we
// are called we either start with the HTML DOM tree or the XML source
// as a string (i.e. serialized). the types for the XML DOM and the HTML
// DOM are predefined.
//
// we also need an object to represent the edit-in-place event.  the likely
// candidate would be an edit node object.  we would need to define this
// type.

var gDOMParser = new DOMParser();

if (typeof(Node) == 'undefined') {
    Node = new Object();
    Node.ELEMENT_NODE                   = 1;
    Node.ATTRIBUTE_NODE                 = 2;
    Node.TEXT_NODE                      = 3;
    Node.CDATA_SECTION_NODE             = 4;
    Node.ENTITY_REFERENCE_NODE          = 5;
    Node.ENTITY_NODE                    = 6;
    Node.PROCESSING_INSTRUCTION_NODE    = 7;
    Node.COMMENT_NODE                   = 8;
    Node.DOCUMENT_NODE                  = 9;
    Node.DOCUMENT_TYPE_NODE             = 10;
    Node.DOCUMENT_FRAGMENT_NODE         = 11;
    Node.NOTATION_NODE                  = 12;
}

// hack for kef ...
var g_strTextEditBoxSize       = '14';
var g_strCodeTextEditBoxSize   = '12';
var g_strTableTextEditBoxSize  = '11';
var g_strFigureTextEditBoxSize = '11';

// Namespaces
var CNXML_NS    = "http://cnx.rice.edu/cnxml";          // xmlns="http://cnx.rice.edu/cnxml"
var MDML_NS     = "http://cnx.rice.edu/mdml/0.4";       // xmlns:md="http://cnx.rice.edu/mdml/0.4"
var BIBTEXML_NS = "http://bibtexml.sf.net/";            // xmlns:bib="http://bibtexml.sf.net/"
var MATHML_NS   = "http://www.w3.org/1998/Math/MathML"; // xmlns:m="http://www.w3.org/1998/Math/MathML"
var XHTML_NS    = "http://www.w3.org/1999/xhtml";
var QML_NS      = "http://cnx.rice.edu/qml/1.0"         // xmlns:q="http://cnx.rice.edu/qml/1.0"

var gNameSpaces = 'xmlns=\"'   + CNXML_NS  + '\" ' +
                  'xmlns:m=\"' + MATHML_NS + '\" ' +
                  'xmlns:q=\"' + QML_NS    + '\"';

/**
 * Regular expressions used multiple times in
 * this script.
 */

var gRegExps = {
    cnxml:    new RegExp("^(<[\\w\\W]*?)\\sxmlns\\=[\"']"       + CNXML_NS    + "['\"]([\\w\\W]*)")
  , mathml:   new RegExp("^(<[\\w\\W]*?)\\sxmlns\\:m\\=[\"']"   + MATHML_NS   + "['\"]([\\w\\W]*)")
  , qml:      new RegExp("^(<[\\w\\W]*?)\\sxmlns\\:q\\=[\"']"   + QML_NS      + "['\"]([\\w\\W]*)")
  , mdml:     new RegExp("^(<[\\w\\W]*?)\\sxmlns\\:md\\=[\"']"  + MDML_NS     + "['\"]([\\w\\W]*)")
  , bibtexml: new RegExp("^(<[\\w\\W]*?)\\sxmlns\\:bib\\=[\"']" + BIBTEXML_NS + "['\"]([\\w\\W]*)")
  , mathml2:  new RegExp("\\sxmlns\\:m\\=[\"']" + MATHML_NS   + "['\"]", "g")
};

/**
 * These are the class names of tags that are
 * editable. If you switch the value to false,
 * the tag with that class will become un-editable.
 */

var gEditableTags = {
    'para': true
  , 'equation': true
  , 'rule': true
  , 'definition': true
  , 'exercise': true
  , 'list': true
  , 'figure': true
  , 'note': true
  , 'code': true
  , 'example': true
  , 'table' : true
  // , 'media' : true
  // , 'section' : true      // true but requires special handling
  // , 'section/name' : true // true but requires special handling
};

// the following table is hand generated which is not a Good Thing (tm).
// hopefully at some point in the future, this can be machine generated
// from the CNXML sysntax.
var gValidCnxmlTags = {
    'section': true
  , 'example': true
  , 'exercise': true
  , 'problem': true
  , 'solution': true
  , 'proof': true
  , 'statement': true
  , 'emphasis': true
  , 'quote': true
  , 'foreign': true
  , 'code': true
  , 'cnxn': true
  , 'link': true
  , 'cite': true
  , 'term': true
  , 'document': true
  , 'metadata': true
  , 'content': true
  , 'para': true
  , 'title': true
  , 'definition': true
  , 'meaning': true
  , 'glossary': true
  , 'seealso': true
  , 'note': true
  , 'rule': true
  , 'list': true
  , 'item': true
  , 'figure': true
  , 'subfigure': true
  , 'caption': true
  , 'media': true
  , 'param': true
  , 'equation': true
  , 'table': true
  , 'tgroup': true
  , 'colspec': true
  , 'spanspec': true
  , 'thead': true
  , 'tfoot': true
  , 'tbody': true
  , 'row': true
  , 'entrytbl': true
  , 'entry': true
  // new to CNXML 0.6
  , 'audio': true
  , 'cite-title': true
  , 'commentary': true
  , 'div': true
  , 'download': true
  , 'featured-links': true
  , 'flash': true
  , 'footnote': true
  , 'image': true
  , 'java-applet': true
  , 'label': true
  , 'labview': true
  , 'link-group': true
  , 'longdesc': true
  , 'newline': true
  , 'object': true
  , 'preformat': true
  , 'space': true
  , 'span': true
  , 'sub': true
  , 'sup': true
  , 'text': true
  , 'title': true
  , 'video': true
};

// http://www.duke.edu/websrv/file-extensions.html
var gMimeFileType= {
  // default is application/octet-stream
    'ai': 'application/postscript'
  , 'aif': 'audio/x-aiff'
  , 'aifc': 'audio/x-aiff'
  , 'aiff': 'audio/x-aiff'
  , 'asc': 'text/plain'
  , 'au': 'audio/basic'
  , 'avi': 'video/x-msvideo'
  , 'bcpio': 'application/x-bcpio'
  , 'bin': 'application/octet-stream'
  , 'c': 'text/plain'
  , 'cc': 'text/plain'
  , 'ccad': 'application/clariscad'
  , 'cdf': 'application/x-netcdf'
  , 'class': 'application/octet-stream'
  , 'cpio': 'application/x-cpio'
  , 'cpt': 'application/mac-compactpro'
  , 'csh': 'application/x-csh'
  , 'css': 'text/css'
  , 'dcr': 'application/x-director'
  , 'dir': 'application/x-director'
  , 'dms': 'application/octet-stream'
  , 'doc': 'application/msword'
  , 'drw': 'application/drafting'
  , 'dvi': 'application/x-dvi'
  , 'dwg': 'application/acad'
  , 'dxf': 'application/dxf'
  , 'dxr': 'application/x-director'
  , 'eps': 'application/postscript'
  , 'etx': 'text/x-setext'
  , 'exe': 'application/octet-stream'
  , 'ez': 'application/andrew-inset'
  , 'f': 'text/plain'
  , 'f90': 'text/plain'
  , 'fli': 'video/x-fli'
  , 'gif': 'image/gif'
  , 'gtar': 'application/x-gtar'
  , 'gz': 'application/x-gzip'
  , 'h': 'text/plain'
  , 'hdf': 'application/x-hdf'
  , 'hh': 'text/plain'
  , 'hqx': 'application/mac-binhex40'
  , 'htm': 'text/html'
  , 'html': 'text/html'
  , 'ice': 'x-conference/x-cooltalk'
  , 'ief': 'image/ief'
  , 'iges': 'model/iges'
  , 'igs': 'model/iges'
  , 'ips': 'application/x-ipscript'
  , 'ipx': 'application/x-ipix'
  , 'jpe': 'image/jpeg'
  , 'jpeg': 'image/jpeg'
  , 'jpg': 'image/jpeg'
  , 'js': 'application/x-javascript'
  , 'kar': 'audio/midi'
  , 'latex': 'application/x-latex'
  , 'lha': 'application/octet-stream'
  , 'lsp': 'application/x-lisp'
  , 'lzh': 'application/octet-stream'
  , 'm': 'text/plain'
  , 'man': 'application/x-troff-man'
  , 'me': 'application/x-troff-me'
  , 'mesh': 'model/mesh'
  , 'mid': 'audio/midi'
  , 'midi': 'audio/midi'
  , 'mif': 'application/vnd.mif'
  , 'mime': 'www/mime'
  , 'mov': 'video/quicktime'
  , 'movie': 'video/x-sgi-movie'
  , 'mp2': 'audio/mpeg'
  , 'mp3': 'audio/mpeg'
  , 'mpe': 'video/mpeg'
  , 'mpeg': 'video/mpeg'
  , 'mpg': 'video/mpeg'
  , 'mpga': 'audio/mpeg'
  , 'ms': 'application/x-troff-ms'
  , 'msh': 'model/mesh'
  , 'nc': 'application/x-netcdf'
  , 'oda': 'application/oda'
  , 'pbm': 'image/x-portable-bitmap'
  , 'pdb': 'chemical/x-pdb'
  , 'pdf': 'application/pdf'
  , 'pgm': 'image/x-portable-graymap'
  , 'pgn': 'application/x-chess-pgn'
  , 'png': 'image/png'
  , 'pnm': 'image/x-portable-anymap'
  , 'pot': 'application/mspowerpoint'
  , 'ppm': 'image/x-portable-pixmap'
  , 'pps': 'application/mspowerpoint'
  , 'ppt': 'application/mspowerpoint'
  , 'ppz': 'application/mspowerpoint'
  , 'pre': 'application/x-freelance'
  , 'prt': 'application/pro_eng'
  , 'ps': 'application/postscript'
  , 'qt': 'video/quicktime'
  , 'ra': 'audio/x-realaudio'
  , 'ram': 'audio/x-pn-realaudio'
  , 'ras': 'image/cmu-raster'
  , 'rgb': 'image/x-rgb'
  , 'rm': 'audio/x-pn-realaudio'
  , 'roff': 'application/x-troff'
  , 'rpm': 'audio/x-pn-realaudio-plugin'
  , 'rtf': 'text/rtf'
  , 'rtx': 'text/richtext'
  , 'scm': 'application/x-lotusscreencam'
  , 'set': 'application/set'
  , 'sgm': 'text/sgml'
  , 'sgml': 'text/sgml'
  , 'sh': 'application/x-sh'
  , 'shar': 'application/x-shar'
  , 'silo': 'model/mesh'
  , 'sit': 'application/x-stuffit'
  , 'skd': 'application/x-koan'
  , 'skm': 'application/x-koan'
  , 'skp': 'application/x-koan'
  , 'skt': 'application/x-koan'
  , 'smi': 'application/smil'
  , 'smil': 'application/smil'
  , 'snd': 'audio/basic'
  , 'sol': 'application/solids'
  , 'spl': 'application/x-futuresplash'
  , 'src': 'application/x-wais-source'
  , 'step': 'application/STEP'
  , 'stl': 'application/SLA'
  , 'stp': 'application/STEP'
  , 'sv4cpio': 'application/x-sv4cpio'
  , 'sv4crc': 'application/x-sv4crc'
  , 'swf': 'application/x-shockwave-flash'
  , 't': 'application/x-troff'
  , 'tar': 'application/x-tar'
  , 'tcl': 'application/x-tcl'
  , 'tex': 'application/x-tex'
  , 'texi': 'application/x-texinfo'
  , 'texinfo': 'application/x-texinfo'
  , 'tif': 'image/tiff'
  , 'tiff': 'image/tiff'
  , 'tr': 'application/x-troff'
  , 'tsi': 'audio/TSP-audio'
  , 'tsp': 'application/dsptype'
  , 'tsv': 'text/tab-separated-values'
  , 'txt': 'text/plain'
  , 'unv': 'application/i-deas'
  , 'ustar': 'application/x-ustar'
  , 'vcd': 'application/x-cdlink'
  , 'vda': 'application/vda'
  , 'viv': 'video/vnd.vivo'
  , 'vivo': 'video/vnd.vivo'
  , 'vrml': 'model/vrml'
  , 'wav': 'audio/x-wav'
  , 'wrl': 'model/vrml'
  , 'xbm': 'image/x-xbitmap'
  , 'xlc': 'application/vnd.ms-excel'
  , 'xll': 'application/vnd.ms-excel'
  , 'xlm': 'application/vnd.ms-excel'
  , 'xls': 'application/vnd.ms-excel'
  , 'xlw': 'application/vnd.ms-excel'
  , 'xml': 'text/xml'
  , 'xpm': 'image/x-xpixmap'
  , 'xwd': 'image/x-xwindowdump'
  , 'xyz': 'chemical/x-pdb'
  , 'zip': 'application/zip'
};

function findMimeType(strFileSuffix) {
    var strMimeType;

    if ( strFileSuffix != null && strFileSuffix.length > 0 ) {
        strMimeType = gMimeFileType[strFileSuffix.toLowerCase()];

        if ( strMimeType == null || strMimeType.length == 0 ) {
            strMimeType = 'application/octet-stream';
        }
    }
    else {
        strMimeType = 'application/octet-stream';
    }

    return strMimeType;
}

/**
 * editInPlaceGeneral.js
 *
 * This portion of editInPlace
 * contains code general to any
 * CNXML-language editInPlace.
 *
 * requires:  editInPlaceSpecific.js
 */


/**
 * CONSTANTS ( have been changed to variables for IE)
 */


// Validation / Preview
var SERVER_VALIDATION_OK_STATUS = 200;
var SERVER_ADD_OK_STATUS = 204;
var SERVER_DELETE_OK_STATUS = 204;

// XMLHttpRequest readyState codes, from Microsoft
var XHR_UNINITIALIZED = 0; // created, not initialized (open not called yet)
var XHR_LOADING = 1; // send method not called yet
var XHR_LOADED = 2; // send has been called, response not yet received
var XHR_INTERACTIVE = 3; // partial response data received
var XHR_COMPLETED = 4; // complete response received

// Internal State
var STATE_VIEWING = 0;
var STATE_EDITING = 1;
var STATE_VALIDATING = 2;
var STATE_COMMITTING = 3;
var STATE_BROKEN = 4;
var STATE_DOWNLOADING_SOURCE = 5;

/**
 * GLOBAL VARIABLES.
 */
var gEdited = false;


/**
 * Contains infromation about the
 * node that we're editing.
 */
var gEditNodeInfo = {
  state: STATE_VIEWING
};


/**
 * URLs obtained from links or hardcoded.
 */
var gURLs = {
  source: undefined,  // url to obtain the document source
  module: undefined,  // url to go to upon cancellation
  preview: undefined, // validator for previewing
  content: undefined, // url to obtain content 'cnx_main'
  update: undefined   // url to perform updates
};


/**
 * Contains objects related to the
 * original source version of this document.
 */
var gSource = {
    strXmlSource: undefined,
    nodeBeingEdited: undefined,
    strNameSpaces: undefined,
    doc: undefined
};


/**
 * Objects used to send
 * information to the server.
 */
var gRequest = {
    nodeReplacementXML: undefined,
    xhr: undefined
};


//
// OO Notes
//

// JavaScript can be hacked to support OO via the prototype attribute. If an atribute
// is not found locally to a class, its prototype chain is walked, looking for a hit.
// To get OO behavior a 'this' (or object) must be used be present within class methods to trigger
// the prototype protocol.  This is decidedly not what most C++/Java programmers would
// expect.
//
// Private data members and methods are reachable directly within their class definiton,
// i.e. no 'this' is needed.  Derived classes need get/set helpers to access private data members.
//
// Public data members and methods are made public by explicitly assigning them
// as attributes to the 'this' and are thus reachable via the variable 'this'.
//
// If methods are used for UI event handlers, the 'this' in the callback is wrong.
// The 'this' in event handlers will likely reference a UI widgit.  To get the right 'this' we use
// prototype.js framework's Event.observe() and bindAsEventListener() calls. For example
//
//        Event.observe(this.getSaveButton(), 'click',
//                      this.onSave.bindAsEventListener(this));
//
// Here the Save Button HTML node's on-click handler is set to a class method.  The bindAsEventListener()
// call attaches 'this' to class method.  During event handling the class method will be called
// for the 'this' object.

// Orginally EIP had one edit form for all of the editable CNXML nodes.  For a better user experience,
// we needed different edit forms for the different editable nodes.  We created a base editing class,
// WorkFlowStep, which mimiced the original edit form  We created a derived class, for each CNXML editable
// node, that we wanted to give a specialized edit form.  A simple example of a derived WorkFlowStep class
// would be :
//
// function Para_WorkFlowStep() {
//     this.init = init;
//     this.gotTitle = gotTitle;
// 
//     init();
// 
//     return this;
// 
//     function init() {
//         Para_WorkFlowStep.prototype.init();
//     };
// 
//     function gotTitle() {
//         return true;
//     };
// };
// Para_WorkFlowStep.prototype = new WorkFlowStep();
//
// We create a new instance of class Para_WorkFlowStep in the factory function createWorkFlowStep():
//
//        oWorkFlowStep = new Para_WorkFlowStep();
//
// The logic within Para_WorkFlowStep is executed on instantiation via the 'new'.  In Para_WorkFlowStep
// instantiation,
//   1. we convert private data members into public data members
//   2. we call the init() method, which mainly intialization the private and public data members
//   3. we return
//   4. the logic following the return is not executed and contains the method definitions

// JS libraries

// Getting fade animationto work

// Getting the Cancel button to work

// HTML generation technique

//
// WorkFlowStep factory.
//

var g_oWorkFlowStep;

function createWorkFlowStep(strXmlTag, bEditingExistingNode) {
    var oWorkFlowStep;

    if      ( strXmlTag == 'table' ) {
        oWorkFlowStep = new Table_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'code' ) {
        oWorkFlowStep = new Code_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'list' ) {
        oWorkFlowStep = new List_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag('list');
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'exercise' ) {
        oWorkFlowStep = new Exercise_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'example' ) {
        oWorkFlowStep = new Example_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'figure' ) {
        oWorkFlowStep = new Figure_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'media' ) {
        // DEAD CODE: CNXML <media> nodes can not be edited or added.
        // Media_WorkFlowStep has a likely bit-rotted media file uploader implementation.
        oWorkFlowStep = new Media_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'note' ) {
        oWorkFlowStep = new Note_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'rule' ) {
        oWorkFlowStep = new Rule_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'para' ) {
        oWorkFlowStep = new Para_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'equation' ) {
        oWorkFlowStep = new Equation_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'section' ) {
        oWorkFlowStep = new Section_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else if ( strXmlTag == 'title' ) {
        oWorkFlowStep = new Title_WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }
    else {
        // this is our default behavior (and why we have to explicitly set
        // the EditedXmlTag versus having the init() methods do it).
        // CNXML <definition> is the only tag currently using the default edit form.
        oWorkFlowStep = new WorkFlowStep();
        oWorkFlowStep.setEditedXmlTag(strXmlTag);
        oWorkFlowStep.setEditingExistingNode(bEditingExistingNode);
    }

    return g_oWorkFlowStep = oWorkFlowStep;
};


function WorkFlowStep() {
    // private
    var m_bEditingExistingNode; // versus adding

    // edit state
    var m_strEditedXmlTag;
    var m_nodeEditedHtml;
    var m_nodeEditedXml;
    var m_strXPathToEditedXmlNode;
    // change state
    var m_strChangedXmlTag;
    var m_nodeChangedHtml;
    var m_nodeChangedXml;
    var m_strXPathToChangedXmlNode;
    var m_strChangedXml;
    // add state
    var m_strInsertionPosition;
    var m_strXPathToInsertionXmlNode;

    var m_nodeEditedHtmlClone;
    var m_nodeHtmlEditContainerDiv;
    var m_nodeTextArea;
    var m_nodeSaveButton;
    var m_nodeDeleteButton;
    var m_strOpenTag;
    var m_strCloseTag;
    var m_nodeTitleInput;
    var m_nodeCaptionInput;
    var m_strTitleOpenTag;
    var m_strCaptionOpenTag;

    // derived class would need 2 accessor funcs and make the following call
    //     this.getHtmlEditContainerDiv().appendchild(...);
    // versus
    //     this.m_nodeHtmlEditContainerDiv.appendchild(...);
    //this.m_nodeHtmlEditContainerDiv = m_nodeHtmlEditContainerDiv;

    this.setEditedXmlTag = setEditedXmlTag;
    this.getEditedXmlTag = getEditedXmlTag;
    this.setEditedHtmlNode = setEditedHtmlNode;
    this.getEditedHtmlNode = getEditedHtmlNode;
    this.setEditedXmlNode = setEditedXmlNode;
    this.getEditedXmlNode = getEditedXmlNode;
    this.setXPathToEditedXmlNode = setXPathToEditedXmlNode;
    this.getXPathToEditedXmlNode = getXPathToEditedXmlNode;
    this.setEditNodeState = setEditNodeState;

    this.setChangedXmlTag = setChangedXmlTag;
    this.getChangedXmlTag = getChangedXmlTag;
    this.setChangedHtmlNode = setChangedHtmlNode;
    this.getChangedHtmlNode = getChangedHtmlNode;
    this.setChangedXmlNode = setChangedXmlNode;
    this.getChangedXmlNode = getChangedXmlNode;
    this.setXPathToChangedXmlNode = setXPathToChangedXmlNode;
    this.getXPathToChangedXmlNode = getXPathToChangedXmlNode;
    this.setChangedXml = setChangedXml;
    this.getChangedXml = getChangedXml;
    this.setChangeNodeState = setChangeNodeState;

    this.setInsertionPosition = setInsertionPosition;
    this.getInsertionPosition = getInsertionPosition;
    this.setXPathToInsertionXmlNode = setXPathToInsertionXmlNode;
    this.getXPathToInsertionXmlNode = getXPathToInsertionXmlNode;
    this.setAddNodeState = setAddNodeState;

    this.setEditedHtmlNodeClone = setEditedHtmlNodeClone;
    this.getEditedHtmlNodeClone = getEditedHtmlNodeClone;
    this.reviveClone            = reviveClone;

    this.setHtmlEditContainerDiv = setHtmlEditContainerDiv;
    this.getHtmlEditContainerDiv = getHtmlEditContainerDiv;

    this.setTextArea = setTextArea;
    this.getTextArea = getTextArea;

    this.setSaveButton = setSaveButton;
    this.getSaveButton = getSaveButton;

    this.setNodeDeleteButton = setNodeDeleteButton;
    this.getNodeDeleteButton = getNodeDeleteButton;

    this.setEditingExistingNode = setEditingExistingNode;
    this.getEditingExistingNode = getEditingExistingNode;

    this.setOpenTag = setOpenTag;
    this.getOpenTag = getOpenTag;

    this.setCloseTag = setCloseTag;
    this.getCloseTag = getCloseTag;

    this.setTitleInput = setTitleInput;
    this.getTitleInput = getTitleInput;

    this.setCaptionInput = setCaptionInput;
    this.getCaptionInput = getCaptionInput;

    this.setTitleOpenTag = setTitleOpenTag;
    this.getTitleOpenTag = getTitleOpenTag;

    this.setCaptionOpenTag = setCaptionOpenTag;
    this.getCaptionOpenTag = getCaptionOpenTag;

    this.gotTitle = gotTitle;
    this.gotCaption = gotCaption;

    this.setupEditForm = setupEditForm;
    this.replaceIDs = replaceIDs;
    this.displayEditForm = displayEditForm;
    this.fadeOutBackground = fadeOutBackground;
    this.fadeInBackground = fadeInBackground;
    this.centerEditForm = centerEditForm;
    this.addNode = addNode;
    this.editNode = editNode;
    this.initializeXmlNode = initializeXmlNode;
    this.getEditedLabel = getEditedLabel;
    this.getEditedXml = getEditedXml;

    this.getLabel = getLabel;
    this.getTitle = getTitle;
    this.getCaption = getCaption;
    this.crackXml = crackXml;
    this.init = init;

    this.onSave    = onSave;
    this.onCancel  = onCancel;
    this.onDelete  = onDelete;
    this.handleSave    = handleSave;
    this.handleCancel  = handleCancel;
    this.handleDelete  = handleDelete;

    this.onServerEditRequestReturn = onServerEditRequestReturn;
    this.onServerAddRequestReturn  = onServerAddRequestReturn;
    this.onServerDeleteRequest     = onServerDeleteRequest;
    this.handleServerEditRequestReturn = handleServerEditRequestReturn;
    this.handleServerAddRequestReturn  = handleServerAddRequestReturn;
    this.handleServerDeleteRequest     = handleServerDeleteRequest;

    init();

    return this;

    function init() {
        m_bEditingExistingNode = null;
        m_nodeEditedHtml = null;
        m_nodeEditedHtmlClone = null;
        m_nodeEditedXml = null;
        m_strXPathToEditedXmlNode = null;
        m_nodeHtmlEditContainerDiv = null;
        m_nodeTextArea = null;
        m_nodeSaveButton = null;
        m_nodeDeleteButton = null;
        m_strOpenTag = null;
        m_strCloseTag = null;
        m_nodeTitleInput = null;
        m_nodeCaptionInput = null;
        m_strTitleOpenTag = null;
        m_strCaptionOpenTag = null;
    };

    function setEditedXmlTag(strEditedXmlTag) {
        m_strEditedXmlTag = strEditedXmlTag;
    };

    function getEditedXmlTag() {
        return m_strEditedXmlTag;
    };

    function setEditedHtmlNode(nodeHtml) {
        m_nodeEditedHtml = nodeHtml;
    };

    function getEditedHtmlNode() {
        return m_nodeEditedHtml;
    };

    function setEditedHtmlNodeClone(nodeEditedHtmlClone) {
        m_nodeEditedHtmlClone = nodeEditedHtmlClone;
    };

    function getEditedHtmlNodeClone() {
        return m_nodeEditedHtmlClone;
    };

    function reviveClone(nodeHtmlClone) {
        var nodeNewHtml;
        nodeNewHtml = recreateHtml(nodeHtmlClone);
        reestablishCallbacks(nodeNewHtml);
        recreateInserts(nodeNewHtml);
        return nodeNewHtml;
    };

    function setEditedXmlNode(nodeEditedXml) {
        m_nodeEditedXml = nodeEditedXml;
    };

    function getEditedXmlNode() {
        return m_nodeEditedXml;
    };

    function setXPathToEditedXmlNode(strXPathToEditedXmlNode) {
        m_strXPathToEditedXmlNode = strXPathToEditedXmlNode;
    };

    function getXPathToEditedXmlNode() {
        return m_strXPathToEditedXmlNode;
    };

    function setEditNodeState(nodeEditedHtml, nodeEditedXml, strXPathToEditedXmlNode) {
        // m_strEditedXmlTag is set by WorkFlow factory
        this.setEditedHtmlNode(nodeEditedHtml);
        this.setEditedXmlNode(nodeEditedXml);
        this.setXPathToEditedXmlNode(strXPathToEditedXmlNode);
    };

    function setChangedXmlTag(strChangedXmlTag) {
        m_strChangedXmlTag = strChangedXmlTag;
    };

    function getChangedXmlTag() {
        return m_strChangedXmlTag;
    };

    function setChangedHtmlNode(nodeHtml) {
        m_nodeChangedHtml = nodeHtml;
    };

    function getChangedHtmlNode() {
        return m_nodeChangedHtml;
    };

    function setChangedHtmlNodeClone(nodeChangedHtmlClone) {
        m_nodeChangedHtmlClone = nodeChangedHtmlClone;
    };

    function getChangedHtmlNodeClone() {
        return m_nodeChangedHtmlClone;
    };

    function setChangedXmlNode(nodeChangedXml) {
        m_nodeChangedXml = nodeChangedXml;
    };

    function getChangedXmlNode() {
        return m_nodeChangedXml;
    };

    function setXPathToChangedXmlNode(strXPathToChangedXmlNode) {
        m_strXPathToChangedXmlNode = strXPathToChangedXmlNode;
    };

    function getXPathToChangedXmlNode() {
        return m_strXPathToChangedXmlNode;
    };

    function setChangedXml(strChangedXml) {
        m_strChangedXml = strChangedXml;
    };

    function getChangedXml() {
        return m_strChangedXml;
    };

    function setChangeNodeState(strChangedXmlTag, nodeChangedHtml, nodeChangedXml, strXPathToChangedXmlNode, strChangedXml) {
        this.setChangedXmlTag(strChangedXmlTag);
        this.setChangedHtmlNode(nodeChangedHtml);
        this.setChangedXmlNode(nodeChangedXml);
        this.setXPathToChangedXmlNode(strXPathToChangedXmlNode);
        this.setChangedXml(strChangedXml);
    };

    function setInsertionPosition(strInsertionPosition) {
        m_strInsertionPosition = strInsertionPosition;
    };

    function getInsertionPosition() {
        return m_strInsertionPosition;
    };

    function setXPathToInsertionXmlNode(strXPathToInsertionXmlNode) {
        m_strXPathToInsertionXmlNode = strXPathToInsertionXmlNode;
    };

    function getXPathToInsertionXmlNode() {
        return m_strXPathToInsertionXmlNode;
    };

    function setAddNodeState(nodeEditedHtml, nodeEditedXml, strInsertionPosition, strXPathToInsertionXmlNode) {
        this.setEditedHtmlNode(nodeEditedHtml);
        this.setEditedXmlNode(nodeEditedXml);
        this.setInsertionPosition(strInsertionPosition);
        this.setXPathToInsertionXmlNode(strXPathToInsertionXmlNode);
    };

    function setHtmlEditContainerDiv(nodeHtmlContainerDiv) {
        m_nodeHtmlEditContainerDiv = nodeHtmlContainerDiv;
    };

    function getHtmlEditContainerDiv() {
        return m_nodeHtmlEditContainerDiv;
    };

    function setTextArea(nodeTextArea) {
        m_nodeTextArea = nodeTextArea;
    };

    function getTextArea(nodeTextArea) {
        return m_nodeTextArea;
    };

    function setSaveButton(nodeSaveButton) {
        m_nodeSaveButton = nodeSaveButton;
    };

    function getSaveButton() {
        return m_nodeSaveButton;
    };

    function setNodeDeleteButton(nodeDeleteButton) {
        m_nodeDeleteButton = nodeDeleteButton;
    };

    function getNodeDeleteButton() {
        return m_nodeDeleteButton;
    };

    function setEditingExistingNode (bEditingExistingNode) {
        m_bEditingExistingNode = bEditingExistingNode;
    };

    function getEditingExistingNode () {
        return m_bEditingExistingNode;
    };

    function setOpenTag(strOpenTag) {
        m_strOpenTag = strOpenTag;
    };

    function getOpenTag() {
        return m_strOpenTag;
    };

    function setCloseTag(strCloseTag) {
        m_strCloseTag = strCloseTag;
    };

    function getCloseTag() {
        return m_strCloseTag;
    };

    function setTitleInput(nodeTitleInput) {
        m_nodeTitleInput = nodeTitleInput;
    };

    function getTitleInput() {
        return m_nodeTitleInput;
    };

    function setCaptionInput(nodeCaptionInput) {
        m_nodeCaptionInput = nodeCaptionInput;
    };

    function getCaptionInput() {
        return m_nodeCaptionInput;
    };

    function setTitleOpenTag(strTitleOpenTag) {
        m_strTitleOpenTag = strTitleOpenTag;
    };

    function getTitleOpenTag() {
        return m_strTitleOpenTag;
    };

    function setCaptionOpenTag(strCaptionOpenTag) {
        m_strCaptionOpenTag = strCaptionOpenTag;
    };

    function getCaptionOpenTag() {
        return m_strCaptionOpenTag;
    };

    function gotTitle() {
        return false;
    };

    function gotCaption() {
        return false;
    };

    function getLabel(nodeCnxml) {
        var i;
        var nodeChild;
        var strLabel;

        if ( nodeCnxml ) {
            for ( i = 0; i < nodeCnxml.childNodes.length; i++ ) {
                nodeChild = nodeCnxml.childNodes[i];
                if ( nodeChild.nodeType == Node.TEXT_NODE ) {
                    if ( isWhitespaceTextNode(nodeChild) ) {
                        continue;
                    }
                    else {
                        return null;
                    }
                }
                else if ( nodeChild.nodeType == Node.COMMENT_NODE ) {
                    continue;
                }
                else if ( nodeChild.nodeType == Node.ELEMENT_NODE ) {
                    if ( nodeChild.nodeName == 'label' ) {
                        // strLabel = serializeAndMassageXmlNode(nodeChild);
                        return nodeChild;
                    }
                    else {
                        return null;
                    }
                }
                else {
                    return null;
                }
            }
            // white space text and or comment nodes only => no <label> nodes here
            return null;
        }
        else {
            return null;
        }
    };

    function getTitle(nodeCnxml) {
        var i;
        var nodeChild;
        var strTitle;

        if ( nodeCnxml ) {
            for ( i = 0; i < nodeCnxml.childNodes.length; i++ ) {
                nodeChild = nodeCnxml.childNodes[i];
                if ( nodeChild.nodeType == Node.TEXT_NODE ) {
                    if ( isWhitespaceTextNode(nodeChild) ) {
                        continue;
                    }
                    else {
                        return null;
                    }
                }
                else if ( nodeChild.nodeType == Node.COMMENT_NODE ) {
                    continue;
                }
                else if ( nodeChild.nodeType == Node.ELEMENT_NODE ) {
                    if ( nodeChild.nodeName == 'label' ) {
                        continue;
                    }
                    else if ( nodeChild.nodeName == 'title' ) {
                        // strTitle = serializeAndMassageXmlNode(nodeChild);
                        return nodeChild;
                    }
                    else {
                        return null;
                    }
                }
                else {
                    return null;
                }
            }
            // white space text nodes and or comment nodes and  a <label> node or only => no <title> nodes here
            return null;
        }
        else {
            return null;
        }
    };

    function getCaption(nodeCnxml) {
        var i;
        var nodeChild;
        var strTitle;

        if ( nodeCnxml ) {
            for ( i = 0; i < nodeCnxml.childNodes.length; i++ ) {
                nodeChild = nodeCnxml.childNodes[i];
                if ( nodeChild.nodeType == Node.ELEMENT_NODE ) {
                    if ( nodeChild.nodeName == 'caption' ) {
                        return nodeChild;
                    }
                }
            }
            return null;
        }
        else {
            return null;
        }
    };

    function crackXml(strXml, nodeXml) {
        var oXmlParts;
        var strOpenTag;
        var strContents;
        var strCloseTag;
        var bOpeningTagOK;
        var bContentsOK;
        var bClosingTagOK;
        var nodeLabel;
        var nodeTitle;
        var nodeCaption;
        var strLabelCnxml;
        var strTitleCnxml;
        var strCaptionCnxml;
        var strTagBody;
        var reTitleCnxmlEscaped;
        var reCaptionCnxmlEscaped;
        var bGotTitle;
        var bGotCaption;
        var strAttributes;

        strXml.replace(/^(<[\w\W]*?>)([\w\W]*)(<\/[\w\W]*?>)/,
                       function(wholeMatch, openTag, contents, closeTag) {
                           strOpenTag = openTag;
                           strContents = contents;
                           strCloseTag = closeTag;
                           return contents;
                       });

        bOpeningTagOK = ( strOpenTag != null && strOpenTag.length > 0 );
        bContentsOK   = true;
        bClosingTagOK = ( strCloseTag != null && strCloseTag.length > 0 );

        if ( bOpeningTagOK && bContentsOK && bClosingTagOK ) {
            // plan A
            oXmlParts = new Object();
            oXmlParts.strOpenTag  = strOpenTag;
            oXmlParts.strContents = ( strContents ? strContents : '' );
            oXmlParts.strCloseTag = strCloseTag;
            if ( oXmlParts.strContents.length > 0 ) {
                strTagBody = oXmlParts.strContents.replace(/^\s+/,'');
                nodeLabel = this.getLabel(nodeXml);
                nodeTitle = this.getTitle(nodeXml);
                nodeCaption = this.getCaption(nodeXml);
                strLabelCnxml   = ( nodeLabel   ? serializeAndMassageXmlNode(nodeLabel)   : '' );
                strTitleCnxml   = ( nodeTitle   ? serializeAndMassageXmlNode(nodeTitle)   : '' );
                strCaptionCnxml = ( nodeCaption ? serializeAndMassageXmlNode(nodeCaption) : '' );
                // special processing for <title>
                if ( nodeTitle && strTitleCnxml.length > 0 ) {
                    reTitleCnxmlEscaped = escapeRegularExpression(strTitleCnxml);
                    bGotTitle = ( strTagBody.search(reTitleCnxmlEscaped) != -1 );
                    if ( bGotTitle ) {
                        oXmlParts.oTitleXmlParts = this.crackXml(strTitleCnxml, nodeTitle);
                        strTagBody = strTagBody.replace(reTitleCnxmlEscaped, "");
                    }
                }
                // special processing for <caption> 
                if ( nodeCaption && strCaptionCnxml.length > 0 ) {
                    reCaptionCnxmlEscaped = escapeRegularExpression(strCaptionCnxml);
                    bGotCaption = ( strTagBody.search(reCaptionCnxmlEscaped) != -1 );
                    if ( bGotCaption ) {
                        oXmlParts.oCaptionXmlParts = this.crackXml(strCaptionCnxml, nodeCaption);
                        strTagBody = strTagBody.replace(reCaptionCnxmlEscaped, "");
                    }
                }
                oXmlParts.strContents = strTagBody;
            }
        }
        else {
            // plan B - look for empty tags like "<para />"
            strOpenTag = null;
            strCloseTag = null;
            strXml.replace(/^(<)([A-Za-z]*)\s*(.*?)(\/>)/,
                           function(wholeMatch, startDelimiter, openTag, attributes, closeTag) {
                               strOpenTag = openTag;
                               strAttributes = attributes;
                               strCloseTag = closeTag;
                               return openTag;
                           });

            bOpeningTagOK = ( strOpenTag != null && strOpenTag.length > 0 );
            bClosingTagOK = ( strCloseTag != null && strCloseTag.length > 0 );
            if ( bOpeningTagOK && bClosingTagOK ) {
                oXmlParts = new Object();
                oXmlParts.strOpenTag  = '<' + strOpenTag + ( strAttributes ? (' ' + strAttributes) : '') + '>';
                oXmlParts.strContents = '';
                oXmlParts.strCloseTag = '</' + strOpenTag + '>';
            }
            else {
                // Plan C - there is no Plan C.
                oXmlParts = null;
            }
        }

        return oXmlParts;
    };

    function addNode(nodeHtmlForm) {
        var nodeNewHtml;
        var nodeNewXml;
        var nodeXmlText;
        var infoInsertion;
        var strNewXml;
        var strXPathToEditedNode;
        var strInsertionPosition;
        var strXPathToInsertionXmlNode;

        // both the new Xml and Html nodes are placeholders.  Our intent to make
        // "add new" code reuse the bulk of the "edit existing" code
        nodeNewHtml = createElement(this.getEditedXmlTag());
        nodeNewXml = createElementNS(gSource.doc, this.getEditedXmlTag());

        addIdToXmlNode(nodeNewXml, nodeNewHtml.getAttribute('id'));

        nodeXmlText = gSource.doc.createTextNode(' ');
        nodeNewXml.appendChild(nodeXmlText);

        infoInsertion = addNewNodeToHtmlAndXml(nodeHtmlForm, nodeNewHtml, nodeNewXml);
        strInsertionPosition       = infoInsertion.strInsertionPosition;
        strXPathToInsertionXmlNode = infoInsertion.strXPathInsertionNode;

        // create the before and after add selectors.
        insertElementList(nodeNewHtml, 'after');
        insertElementList(nodeNewHtml, 'before');

        strXPathToEditedNode = buildXPathFromHtml(nodeNewHtml);

//var strXPathToEditedNodeFromXml = buildXPathFromXml(nodeNewXml, null);
//alert("XML XPATH is\n\n" + strXPathToEditedNodeFromXml + "\n\nHTML XPATH is\n\n" + strXPathToEditedNode +
//      (strXPathToEditedNodeFromXml==strXPathToEditedNode?"":"\n\nEPIC FAIL"));
        this.setAddNodeState(nodeNewHtml, nodeNewXml, strInsertionPosition, strXPathToInsertionXmlNode);

        // decorate nodeNewXml and return its serialization (which is not used here but good for debug)
        strNewXml = this.initializeXmlNode(nodeNewXml);

        this.editNode(nodeNewHtml, strNewXml);
    };

    function editNode(nodeHtml, strXml) {
        var strId;
        var nodeXmlBeingEdited;
        var nodeClonedXml;
        var strXPathToEditedNode;

        // FIXME
        //   Eventually replace gSource.nodeBeingEdited with m_nodeEditedXml

        // find the xml edit node via its id attribute
        gSource.nodeBeingEdited = null;
        strId = nodeHtml.getAttribute('id');
        if ( strId ) {
            nodeXmlBeingEdited = getNodeById(strId, gSource.doc);
            if ( nodeXmlBeingEdited != null ) {
//                var strXPathFromXml  = buildXPathFromXml(nodeXmlBeingEdited, null);
//                var strXPathFromHtml = buildXPathFromHtml(nodeHtml);
//alert("XML XPATH is\n\n" + strXPathFromXml + "\n\nHTML XPATH is\n\n" + strXPathFromHtml +
//      (strXPathFromXml==strXPathFromHtml?"":"\n\nEPIC FAIL!!!"));
                strXPathToEditedNode = buildXPathFromXml(nodeXmlBeingEdited, null);
                gSource.nodeBeingEdited = nodeXmlBeingEdited;
            }
        }
        // or via its XPath.
        if ( gSource.nodeBeingEdited == null ) {
            // FIXME
            //   should never get here since all editable tags require @ids as of CNXML 0.6
            //   code below is future proofing but could (and did) hide bad behavior
            strXPathToEditedNode = buildXPathFromHtml(nodeHtml);
            nodeXmlBeingEdited = getNodeByXPath(strXPathToEditedNode, gSource.doc);
            if ( nodeXmlBeingEdited != null ) {
                gSource.nodeBeingEdited = nodeXmlBeingEdited;
            }
        }

        if ( strXml === undefined ) {
            // Clone the XML node, to tease out a serialized string.
            nodeClonedXml = gSource.nodeBeingEdited; // for debugging
            nodeClonedXml = gSource.nodeBeingEdited.cloneNode(true);

            // Add the MathML Namespace to top level tag before serializing so
            // that it won't show up on sub-elements
            // FIXME
            //   sarissa-ble???,
            ///  we add the NS here to only take it out on the call to serializeAndMassageXmlNode()???
            if ( nodeClonedXml.setAttributeNS ) {
                nodeClonedXml.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:m', MATHML_NS);
            } else {
                if ( nodeClonedXml.getAttribute('xmlns:m') == null ) {
                    nodeClonedXml.setAttribute('xmlns:m', MATHML_NS);
                    // once NS is set in IE it becomes read only ...
                }
            }

            strXml = serializeAndMassageXmlNode(nodeClonedXml);
            nodeClonedXml = null;
        }
        else {
            // got here via addNode()
        }

        this.setEditNodeState(nodeHtml, gSource.nodeBeingEdited, strXPathToEditedNode);

        this.setupEditForm(strXml);

        // 2. a) opacity fade, b) open editable, c) scroll
        this.fadeOutBackground();
        setTimeout("g_oWorkFlowStep.displayEditForm()", 500);
        setTimeout("g_oWorkFlowStep.centerEditForm()",  600);

        // 6. a) open editable, b) scroll, c) opacity fade
        //this.displayEditForm();
        //this.centerEditForm();
        //setTimeout("g_oWorkFlowStep.fadeOutBackground()", 500);

        // 8. a) open, b) simultaneous opacity fade and scroll
        //this.displayEditForm();
        //var iDestX, iDestY;
            // IE no likee ...
            // [iDestX,iDestY] = getCenterScrollDestinations($('eipMasterEditContainerDiv'));
        //var destinations = getCenterScrollDestinations($('eipMasterEditContainerDiv'));
        //iDestX = destinations[0];
        //iDestY = destinations[1];
        //ssf.smoothScrollAndFadeOut(iDestX, iDestY, $('cnx_main'));

        gEditNodeInfo.state = STATE_EDITING;
    };

    function fadeOutBackground() {
        sf.smoothFadeOut($('cnx_main'));
    };

    function fadeInBackground() {
        sf.smoothFadeIn($('cnx_main'));
    };

    function centerEditForm() {
        centerNode($('eipMasterEditContainerDiv'));
    };

    function setupEditForm(strXml) {
        var nodeWarningMessage;
        var nodeWarningText;
        var nodeHelpMessage;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeOpeningTag;
        var nodeOpeningTagText;
        var nodeClosingTag;
        var nodeClosingTagText;
        var nodeCaptionEditDiv;
        var nodeCancelButton;
        var nodeDeleteButton;
        var nodeLabelText;
        var nodeTitleEdit;
        var nodeText;
        var oXmlParts;
        var strContents;
        var nodeHtmlClone;
        var oTitleXmlParts;
        var strTitle;
        var oCaptionXmlParts;
        var strCaption;

        oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.setOpenTag(oXmlParts.strOpenTag);
        strContents = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);
        oTitleXmlParts = oXmlParts.oTitleXmlParts;
        if ( oTitleXmlParts && oTitleXmlParts.strOpenTag ) {
            this.setTitleOpenTag(oTitleXmlParts.strOpenTag);
        }
        oCaptionXmlParts = oXmlParts.oCaptionXmlParts;
        if ( oCaptionXmlParts && oCaptionXmlParts.strOpenTag ) {
            this.setCaptionOpenTag(oCaptionXmlParts.strOpenTag);
        }

        // <DIV class='eipEditContainer'>
        // note that node $('eipMasterEditContainerDiv') is a hidden sibling of $('cnx_main')
        this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
        $('eipMasterEditContainerDiv').innerHTML = ' ';

        // BNW
        //   the great satan IE 6.66 pretends that class is not an attribute. the following code fails:
        //this.getHtmlEditContainerDiv().setAttribute('class', 'eipEditContainer');
        this.getHtmlEditContainerDiv().className = 'eipEditContainer';

        var nodePopups = document.createElement('div');
        nodePopups.className = 'eipPopUps';

        //   <DIV class="eipHelpMessage"><A></A></DIV>
        nodeHelpMessage = document.createElement('div');
        nodeHelpMessage.className = 'eipHelpMessage';
        nodeHelpLink = document.createElement('a');
        nodeHelpLink.onclick = function(event){openHelp(g_oWorkFlowStep.getEditedXmlTag());};
        nodeHelpText = document.createTextNode('Help editing <' + this.getEditedXmlTag() + '>');
        nodeHelpLink.appendChild(nodeHelpText);
        nodeHelpMessage.appendChild(nodeHelpLink);
        nodePopups.appendChild(nodeHelpMessage);
        
        // Add launch button for MathEditor
        MathEditor.addLaunchButton(nodePopups);
        this.getHtmlEditContainerDiv().appendChild(nodePopups);
        
        // <DIV class="eipOpeningTagLabel"> opening tag </DIV>
        nodeOpeningTag = document.createElement('div');
        nodeOpeningTag.className = 'eipOpeningTagLabel';
        nodeOpeningTagText = document.createTextNode(this.getOpenTag());
        nodeOpeningTag.appendChild(nodeOpeningTagText);
        this.getHtmlEditContainerDiv().appendChild(nodeOpeningTag);

        // <DIV class='eipTitleDiv'>Title (optional): <INPUT type="text" size="40" /></DIV>
        if ( this.gotTitle() ) {
            if ( oTitleXmlParts ) {
                strTitle = ( oTitleXmlParts.strContents ? oTitleXmlParts.strContents : '' );
            }
            else {
                strTitle = '';
            }
            nodeTitleEdit = document.createElement('div');
            nodeTitleEdit.className = 'eipTitleDiv';
            nodeText = document.createTextNode('Title (optional):');
            nodeTitleEdit.appendChild(nodeText);
            this.setTitleInput(document.createElement('input'));
            this.getTitleInput().setAttribute('type', 'text');
            this.getTitleInput().setAttribute('size', '40');
            this.getTitleInput().value = strTitle.replace(/\n/g, " ");
            nodeTitleEdit.appendChild(this.getTitleInput());
            this.getHtmlEditContainerDiv().appendChild(nodeTitleEdit);
        }

        // <TEXTAREA class="eipXMLEditor" rows="7"/> stuff to edit </TEXTAREA>
        this.setTextArea(document.createElement('textarea'));
        this.getTextArea().className = 'eipXMLEditor';
        this.getTextArea().setAttribute('rows', g_strTextEditBoxSize);
        if ( strContents ) {
            this.getTextArea().value = strContents;
        }
        this.getHtmlEditContainerDiv().appendChild(this.getTextArea());

        // <DIV class="eipCaptionDiv"> <caption> <TEXTAREA rows="2"></TEXTAREA> </caption> (optional) </DIV>
        if ( this.gotCaption() ) {
            if ( oCaptionXmlParts ) {
                strCaption = ( oCaptionXmlParts.strContents ? oCaptionXmlParts.strContents : '' );
            }
            else {
                strCaption = '';
            }
            nodeCaptionEditDiv = document.createElement('div');
            nodeCaptionEditDiv.className = 'eipCaptionDiv';
            nodeText = document.createTextNode('Caption (optional):');
            nodeCaptionEditDiv.appendChild(nodeText);
            this.setCaptionInput(document.createElement('textarea'));
            if ( Prototype.Browser.Gecko ) this.getCaptionInput().setAttribute('rows', '1');
            else                           this.getCaptionInput().setAttribute('rows', '2');
            this.getCaptionInput().value = strCaption;
            nodeCaptionEditDiv.appendChild(this.getCaptionInput());
            this.getHtmlEditContainerDiv().appendChild(nodeCaptionEditDiv);
        }

        // <DIV class="eipClosingTagLabel"> closing tag </DIV>
        m_nodeClosingTag = document.createElement('div');
        m_nodeClosingTag.className = 'eipOpeningTagLabel';
        nodeClosingTagText = document.createTextNode(this.getCloseTag());
        m_nodeClosingTag.appendChild(nodeClosingTagText);
        this.getHtmlEditContainerDiv().appendChild(m_nodeClosingTag);

        // <BUTTON class="eipSaveButton" alt="Save">Save  </BUTTON>
        this.setSaveButton(document.createElement('button'));
        this.getSaveButton().className = 'eipSaveButton';
        nodeLabelText = document.createTextNode('Save');
        this.getSaveButton().setAttribute('alt', 'Save');
        Event.observe(this.getSaveButton(), 'click',
                      this.onSave.bindAsEventListener(this));
        this.getSaveButton().appendChild(nodeLabelText);
        this.getSaveButton().disabled = false;
        this.getHtmlEditContainerDiv().appendChild(this.getSaveButton());

        // <BUTTON alt="Cancel" class="eipCancelButton">Cancel  </BUTTON>
        nodeCancelButton = document.createElement('button');
        nodeCancelButton.className = 'eipCancelButton';
        nodeCancelButton.setAttribute('alt', "Cancel");
        nodeLabelText = document.createTextNode('Cancel');
        nodeCancelButton.appendChild(nodeLabelText);
        Event.observe(nodeCancelButton, 'click',
                      this.onCancel.bindAsEventListener(this));
        this.getHtmlEditContainerDiv().appendChild(nodeCancelButton);

        // <BUTTON alt="Delete" class="eipDeleteButton">Delete  </BUTTON>
        var bIsNodeDeletable;
        bIsNodeDeletable = isNodeDeletable(this.getEditedHtmlNode());
        var bEditingExistingNode = this.getEditingExistingNode();

        if ( bEditingExistingNode && bIsNodeDeletable ) {
            this.setNodeDeleteButton(document.createElement('button'));
            this.getNodeDeleteButton().className = 'eipDeleteButton';
            this.getNodeDeleteButton().setAttribute('alt', 'Delete');
            nodeLabelText = document.createTextNode('Delete');
            this.getNodeDeleteButton().appendChild(nodeLabelText);
            Event.observe(this.getNodeDeleteButton(), 'click',
                          this.onDelete.bindAsEventListener(this));
            this.getNodeDeleteButton().disabled = false;
            this.getHtmlEditContainerDiv().appendChild(this.getNodeDeleteButton());
        }

        // </div>

        // clone the to-be-replaced HTML node, so that if we cancel the
        // edit op we can undo.  we will replace the the edited html node
        // (in displayEditForm() called by the caller).  when the user hits
        // the cancel button, we replace the edit html form with the
        // cloned node.  when a html node is removed from the DOM, it can
        // not be placed directly back into the DOM and have the same
        // functionality, especially wrt the event callbacks.
        // a cloned node in FF can later have its event callback added back in
        // without issue.  drum roll please.  cloning the node in IE is not as
        // well behaved; the events callback will not work when added back into
        // the clone.  the solution hopefully is to remove the event callback prior
        // to cloning.  (note: we tried tricks with recreating the clone node
        // by hand via the innerHTML property, which worked except for the case
        // where an interior node had a namespace like for mathml, of course
        // only in IE.)

        // before we clone the node, we must first remove the event callbacks
        // recursively from the HTML tree rooted by the edited html node.
        stopObserving(this.getEditedHtmlNode());

        // clone the edited html node.
        nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
        this.setEditedHtmlNodeClone(nodeHtmlClone);
    };

    function replaceIDs(nodeHtml) {
        // replace all of the @id in the children of nodeHtml
        var i;
        var nodeChild;
        var strIdAttributeValue;

        if ( nodeHtml ) {
            for ( i = 0; i < nodeHtml.childNodes.length; i++ ) {
                nodeChild = nodeHtml.childNodes[i];
                if ( nodeChild.nodeType == Node.ELEMENT_NODE ) {
                    // fix thy children
                    replaceIDs(nodeChild);
                    // and then fix thyself
                    strIdAttributeValue = nodeChild.getAttribute('id');
                    if ( strIdAttributeValue ) {
                        nodeChild.setAttribute('id', createUniqueHtmlId());
                    }
                }
            }
        }
    };

    function displayEditForm() {
        // trickery is afoot: we create a copy of the edit area, insert copy into
        // the HTML, absolutely position $('eipMasterEditContainerDiv'),
        // and finally make the text area opaque (which is driving reason for
        // the trickery). $('cnx_main') when made opaque (faded, greyed) also
        // maks all of its children opaque. we insert an edit form (a copy actually)
        // and it gets made opaque.  explicity making the child no longer opaque does
        // not work; it stays opaque.  thus, we created a hidden sibling to $('cnx_main')
        // which we absolutely position on top of the opaque edit form, which unhides it
        // and which hides the opaque child-of-cnx_main edit form.

        // create the ghost edit form
        var nodeGhostEditDivContainer;
        nodeGhostEditDivContainer = $(document.createElement('div'));
        nodeGhostEditDivContainer.setAttribute('id', 'eipGhostEditContainerDiv');
        nodeGhostEditDivContainer.className = 'eipEditContainer';

        // note that we replace the id attributes to prevent having duplicate IDs in the HTML DOM.
        nodeGhostEditDivContainer.innerHTML = $('eipMasterEditContainerDiv').innerHTML;
        this.replaceIDs(nodeGhostEditDivContainer);

        // replace the live text with the ghost edit form
        replaceHtmlNode(nodeGhostEditDivContainer, this.getEditedHtmlNode());
        // $('eipGhostEditContainerDiv') is now live

        // insert the hidden edit form on top of the ghost edit form
        var pos = Position.cumulativeOffset($('eipGhostEditContainerDiv'));
        var iEditLeft = pos[0];
        var iEditTop  = pos[1];

        var dim = $('eipGhostEditContainerDiv').getDimensions();
        var iEditWidth  = dim.width;
        var iEditHeight = dim.height;

        $('eipMasterEditContainerDiv').style.position = 'absolute';
        $('eipMasterEditContainerDiv').style.top      = iEditTop    + 'px';
        $('eipMasterEditContainerDiv').style.left     = iEditLeft   + 'px';
        $('eipMasterEditContainerDiv').style.width    = iEditWidth  + 'px';
        $('eipMasterEditContainerDiv').style.height   = iEditHeight + 'px';
        $('eipMasterEditContainerDiv').show();

        // for some reason the height and width grew ... beat them into submission
        dim = $('eipMasterEditContainerDiv').getDimensions();
        var iActualEditWidth  = dim.width;
        var iActualEditHeight = dim.height;
        var iGrowth;
        if ( iActualEditWidth != iEditWidth ) {
            iGrowth = iActualEditWidth - iEditWidth;
            $('eipMasterEditContainerDiv').style.width = (iEditWidth - iGrowth) + 'px';
        }
        if ( iActualEditHeight != iEditHeight ) {
            iGrowth = iActualEditHeight - iEditHeight;
            $('eipMasterEditContainerDiv').style.height = (iEditHeight - iGrowth) + 'px';
        }

        // for some reason within figures, top and left are wrong ... beat them into submission
        // FF only bug which is really looking like a FF bug
        var topleft = getTopLeft('eipGhostEditContainerDiv');
        var iAlternativeTop  = topleft[0];
        var iAlternativeLeft = topleft[1];
        topleft = getTopLeft('eipMasterEditContainerDiv');
        iAlternativeTop  = topleft[0];
        iAlternativeLeft = topleft[1];

        var nodeTextArea = this.getTextArea();
        if ( nodeTextArea ) {
            this.getTextArea().focus();
        }
    };

    function onSave(e) {
        return this.handleSave(e);
    };

    function onCancel(e) {
        return this.handleCancel(e);
    };

    function onDelete(e) {
        return this.handleDelete(e);
    };

    function initializeXmlNode(nodeXml) {
        var strNewXml;

        strNewXml = serializeAndMassageXmlNode(nodeXml);

        // default action: is do nothing.  derived classes can decorate <tag></tag> as they like

        return strNewXml;
    };

    function getEditedLabel(strXml) {
        var strLabelCnxml;
        var docXml;
        var nodeRootXml;
        var i;
        var nodeChild;

        strLabelCnxml = '';
        docXml = parseXmlTextToDOMDocument(strXml);
        nodeRootXml = docXml.documentElement;
        if ( nodeRootXml ) {
            for (i = 0; i < nodeRootXml.childNodes.length; i++) {
                nodeChild = nodeRootXml.childNodes[i];
                if ( nodeChild.nodeType == Node.ELEMENT_NODE ) {
                    if ( nodeChild.nodeName == 'label' ) {
                        strLabelCnxml = serializeAndMassageXmlNode(nodeChild);
                        return strLabelCnxml;
                    }
                }
            }
        }

        return strLabelCnxml;
    };

    function getEditedXml() {
        var strXml;
        var strTagContents;
        var nodeTitleInput;
        var strTitle;
        var strTitleXml;
        var nodeCaptionInput;
        var strCaption;
        var strCaptionXml;
        var strLabelCnxml;
        var reLabelCnxml;

        // lose the leading whitespace
        strTagContents = this.getTextArea().value.replace(/^\s+/,'');

        // some tags will have a Title Input
        nodeTitleInput = this.getTitleInput();
        if ( nodeTitleInput ) {
            strTitle = nodeTitleInput.value;
            strTitleXml = '';
            if ( strTitle && strTitle.length > 0 ) {
                strTitleXml = ( this.getTitleOpenTag() ? this.getTitleOpenTag() : '<title>' );
                strTitleXml += strTitle;
                strTitleXml += '</title>';
            }
            if ( strTitleXml.length > 0 ) {
                // title must come after label (which may or may not be hiding out in strTagContents),
                // else must be first thing
                strXml = addNamespacesToTagText(this.getOpenTag());
                strXml += strTagContents;
                strXml += this.getCloseTag();
                strLabelCnxml = this.getEditedLabel(strXml);
                if ( strLabelCnxml && strLabelCnxml.length > 0 ) {
                    reLabelCnxml = escapeRegularExpression(strLabelCnxml);
                    strTagContents = strTagContents.replace(reLabelCnxml, strLabelCnxml + strTitleXml);
                 }
                else {
                    strTagContents = strTitleXml + strTagContents;
                }
            }
        }

        // some tags will have a Caption Input
        nodeCaptionInput = this.getCaptionInput();
        if ( nodeCaptionInput ) {
            strCaption  = nodeCaptionInput.value;
            strCaptionXml = '';
            if ( strCaption && strCaption.length > 0 ) {
                strCaptionXml = ( this.getCaptionOpenTag() ? this.getCaptionOpenTag() : '<caption>' );
                strCaptionXml += strCaption;
                strCaptionXml += '</caption>';
            }
            if ( strCaptionXml.length > 0 ) {
                strTagContents = strTagContents + strCaptionXml;
            }
        }

        strXml = addNamespacesToTagText(this.getOpenTag());
        strXml += strTagContents;
        strXml += this.getCloseTag();

        return strXml;
    };

    function handleSave(e) {
        this.getSaveButton().disabled = true;

        if (gEditNodeInfo.state == STATE_VALIDATING) {
            try {
                gRequest.xhr.abort();
            }
            catch(e) {
            }
        }

        var strXml;
        var bIsTagEmpty;
        var bAddingNewNode;
        var bWellFormed;

        // create the new table XML string from the UI ...
        strXml = this.getEditedXml();
        if ( strXml == null || strXml.length == 0 ) {
            // we ran into a little trouble in town ... getEditedXml() better have notified the user.
            this.getSaveButton().disabled = false;
            return false;
        }

        var strTagContents;
        strXml.replace(/^(<[\w\W]*?>)([\w\W]*)(<\/[\w\W]*?>)/,
                       function(wholeMatch, openTag, contents, closeTag) {
                           strTagContents = contents;
                       });
        bIsTagEmpty =  ( strTagContents == null || strTagContents.length == 0 );

        bAddingNewNode = ( ! getEditingExistingNode() );

        if ( !bIsTagEmpty ) {
            try {
                checkWellFormed(strXml, getEditedXmlNode());
                bWellFormed = true;
            }
            catch (e) {
                var strErrorMsg = "<p>Unable to parse the newly edited CNXML text.</p>" +
                                  "<p>Please either fix the changes you have made, or click \'Cancel\' to undo the         changes.</p>" +
                                  "<p>Error information:</p>" +
                                  "<textarea rows='5' readonly='yes'>" +
                                  e.toString() + '\n' +
                                  "</textarea>";
                Ext.MessageBox.show({
                  title: 'Error',
                  msg: strErrorMsg,
                  buttons: Ext.MessageBox.OK,
                  width: 600
                });
                bWellFormed = false;
                this.getSaveButton().disabled = false;
                return false;
            }
        }

        if ( bAddingNewNode ) {
            var strServerRequestUrl     = gURLs.update;
            var strChangedXmlTag        = this.getEditedXmlTag();
            var strChangedXml           = strXml;
            var strXPathInsertionNode   = getXPathToInsertionXmlNode();
            var strInsertionPosition    = getInsertionPosition();
            var nodeChangedXml          = this.getEditedXmlNode();
            var nodeChangedHtml         = $('eipGhostEditContainerDiv');
            var funcServerReturnCalback = this.onServerAddRequestReturn.bind(this);

            this.setChangeNodeState(strChangedXmlTag, nodeChangedHtml, nodeChangedXml, null, strChangedXml);

            sendAdd(strServerRequestUrl, strChangedXmlTag, strChangedXml, strXPathInsertionNode,
                    strInsertionPosition, funcServerReturnCalback);
        }
        else {
            var strServerRequestUrl      = gURLs.update;
            var strChangedXmlTag         = this.getEditedXmlTag();
            var strChangedXml            = strXml;
            var strXPathToChangedXmlNode = this.getXPathToEditedXmlNode();
            var nodeChangedXml           = this.getEditedXmlNode();
            var nodeChangedHtml          = $('eipGhostEditContainerDiv');
            var funcServerReturnCalback  = this.onServerEditRequestReturn.bind(this);

            this.setChangeNodeState(strChangedXmlTag, nodeChangedHtml, nodeChangedXml, strXPathToChangedXmlNode, strChangedXml);

            sendSource(strServerRequestUrl, strChangedXmlTag,
                       strChangedXml, strXPathToChangedXmlNode,
                       funcServerReturnCalback);

        }

        Event.stop(e);
    };

    function handleCancel(e) {
        // if we're sending, try to abort
        if (gEditNodeInfo.state == STATE_VALIDATING) {
            try {
                gRequest.xhr.abort();
            }
            catch(e) {
            }
        }

        // nodeHtmlEditedClone is a cloned HTML node with no parent.
        var bAddingNewNode = ( ! getEditingExistingNode() );

        if ( bAddingNewNode ) {
            // now take the saved xpath, and find the XML node.
            var strXPath = this.getXPathToEditedXmlNode();
            var nodeOldXml = getNodeByXPath(strXPath, gSource.doc);
            var nodeXmlParent = nodeOldXml.parentNode;
            nodeXmlParent.removeChild(nodeOldXml);

            var nodeEditedHtml = $('eipGhostEditContainerDiv');
            var nodeEditedHtmlParent = nodeEditedHtml.parentNode;
            nodeEditedHtmlParent.removeChild(nodeEditedHtml.previousSibling);
            nodeEditedHtmlParent.removeChild(nodeEditedHtml);

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();
        } else {
            // remove the editing textarea and buttons, replacing with the clone
            // of the original node

            var nodeEditedHtml = $('eipGhostEditContainerDiv');
            var nodeHtmlEditedClone = this.reviveClone(this.getEditedHtmlNodeClone());
            replaceHtmlNode(nodeHtmlEditedClone, nodeEditedHtml);

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();
        }

        // change back to viewing state
        gEditNodeInfo.state = STATE_VIEWING;
    };

    function handleDelete(e) {
        var nodeXmlToBeDeleted;
        var nodeHtmlToBeDeleted;
        var nodeXmlParent;
        var bDoDelete;
        var bAddingNewNode;
        var strXPath;
        var funcServerReturnCalback;

        nodeXmlToBeDeleted = this.getEditedXmlNode();
        nodeXmlParent = nodeXmlToBeDeleted.parentNode;

        nodeHtmlToBeDeleted = $('eipGhostEditContainerDiv');

        //Count Nodes and see if there is only one
        var iNodeCount = 0;
        for (i=0;i<nodeXmlParent.childNodes.length;i++){
            if ( nodeXmlParent.childNodes.item(i).nodeType == Node.ELEMENT_NODE &&
                nodeXmlParent.childNodes.item(i).nodeName != 'title' ) {
                iNodeCount++;
            }
        }

        if ( iNodeCount == 1 ) {
            alert("Sorry, you cannot delete this element");
            onCancel();
            return;
        }

        bDoDelete = window.confirm("Are you sure you want to delete this entire element?");
        if ( bDoDelete ) {
            bAddingNewNode = ( ! this.getEditingExistingNode() );
            if ( !bAddingNewNode ) {
                strXPath = this.getXPathToEditedXmlNode();
                funcServerReturnCalback = this.onServerDeleteRequest.bind(this);
                sendDelete(gURLs.update, nodeXmlToBeDeleted, strXPath, funcServerReturnCalback);
                return;
            }
            else {
                // should never get here since newly added but not saved nodes
                // do not have a delete buttom in their edit UI.
                deleteHtmlAndXml(nodeHtmlToBeDeleted, nodeXmlToBeDeleted);
            }
        }
        else {
            onCancel();
            return;
        }
    };

    function onServerEditRequestReturn() {
        this.handleServerEditRequestReturn();
    };

    function onServerAddRequestReturn() {
        this.handleServerAddRequestReturn();
    };

    function onServerDeleteRequest() {
        this.handleServerDeleteRequest();
    };

    function handleServerEditRequestReturn() {
        // ignore if we've left the validation state or
        // this isn't the completion state
        if (gEditNodeInfo.state != STATE_VALIDATING ||
            gRequest.xhr.readyState != XHR_COMPLETED)
            return;

        var nodeNewHtml;
        var nodeExistingHtml;
        var strNewHtml;
        var nodeOldXml;
        var strNewXml;
        var strNewXmlXPath;
        var nodeNewXml;

        var bServerSubmittedToOurWill = ( gRequest.xhr.status == SERVER_VALIDATION_OK_STATUS );

        if ( bServerSubmittedToOurWill ) {
            // if the server returned ok, ...

            strNewHtml = gRequest.xhr.responseText;

            // retrieve the changed XML from the server, parse it, and replace the old XML node
            nodeOldXml = this.getChangedXmlNode();
            strNewXmlXPath = this.getXPathToEditedXmlNode();
            strNewXml = downloadSourceFragment(gURLs["source_fragment"], strNewXmlXPath);
            nodeNewXml = replaceXml(strNewXml, nodeOldXml);

            // parse the response and replace the editing Html with the display Html
            nodeExistingHtml = this.getChangedHtmlNode();
            nodeNewHtml = replaceHtml(strNewHtml, nodeExistingHtml);  // updates the HTML DOM
            setupFormsBySubtree(nodeNewHtml);
            addHoverText(nodeNewHtml);

            this.setEditedHtmlNode(nodeNewHtml); // needed for any post-add processing in derived classes

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();

            gEditNodeInfo.state = STATE_VIEWING;
            gEdited = true;

            // do WorkFlowStep cleanup here if any ...
        }
        else {
            // go back to editing state, turn preview button back on
            gEditNodeInfo.state = STATE_EDITING;
            this.getSaveButton().disabled = false;
            var strErrorMsg = "<p>The XML you submitted was invalid.</p>" +
                              "<p>Please either fix the changes you have made, or click \'Cancel\' to undo the         changes.</p>" +
                              "<p>Error message:</p>" +
                              "<textarea rows='5' readonly='yes'>" +
                              gRequest.xhr.responseText + '\n' +
                              "</textarea>";
            Ext.MessageBox.show({
               title: 'Error',
               msg: strErrorMsg,
               buttons: Ext.MessageBox.OK,
               width: 600
            });
       }
       // MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    };

    function handleServerAddRequestReturn() {
        if (gEditNodeInfo.state != STATE_VALIDATING ||
            gRequest.xhr.readyState != XHR_COMPLETED)
            return;

        var nodeOldXml;
        var strNewXml;
        var nodeNewXml;
        var nodeExistingHtml;
        var strNewHtml;
        var nodeNewHtml;
        var strNewXmlXPath;

        var bServerSubmittedToOurWill = ( gRequest.xhr.status == SERVER_VALIDATION_OK_STATUS );

        if ( bServerSubmittedToOurWill ) {
            strNewHtml = gRequest.xhr.responseText;

            // parse the response and replace the editing Html with the display Html
            nodeExistingHtml = $('eipGhostEditContainerDiv');
            nodeNewHtml = replaceHtml(strNewHtml, nodeExistingHtml);  // updates the HTML DOM
            setupFormsBySubtree(nodeNewHtml);
            addHoverText(nodeNewHtml);

            // this.getXPathToEditedXmlNode() returns the XPATH for the initial, tentative,
            // added node in CNXML DOM.  some nodes like <code> can be saved with an enclosing 
            // <figure> => original XPATH is wrong.  need to rebuild the xpath here.
            strNewXmlXPath = buildXPathFromHtml(nodeNewHtml);

            // retrieve the changed XML from the server, parse it, and replace the old XML node
            nodeOldXml = this.getChangedXmlNode();
            strNewXml = downloadSourceFragment(gURLs["source_fragment"], strNewXmlXPath);
            nodeNewXml = replaceXml(strNewXml, nodeOldXml);

            this.setEditedHtmlNode(nodeNewHtml); // needed for any post add processing in derived classes

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();

            gEditNodeInfo.state = STATE_VIEWING;
            gEdited = true;
        }
        else {
            gEditNodeInfo.state = STATE_EDITING;
            this.getSaveButton().disabled = false;
            var strErrorMsg = "<p>The XML you submitted was invalid.</p>" +
                              "<p>Please either fix the changes you have made, or click \'Cancel\' to undo the         changes.</p>" +
                              "<p>Error message:</p>" +
                              "<textarea rows='5' readonly='yes'>" +
                              gRequest.xhr.responseText + '\n' +
                              "</textarea>";
            Ext.MessageBox.show({
               title: 'Error',
               msg: strErrorMsg,
               buttons: Ext.MessageBox.OK,
               width: 600
            });
        }
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    };

    function handleServerDeleteRequest() {
        var nodeXmlToBeDeleted;
        var nodeHtmlToBeDeleted;
        var nodeDeleteButton;

        // ignore if we've left the validation state or
        // this isn't the completion state
        if (gEditNodeInfo.state != STATE_VALIDATING ||
            gRequest.xhr.readyState != XHR_COMPLETED) return;

        //IE doesn't understand the http response code 204, for some reason it sees the code as 1223
        if ( gRequest.xhr.status == SERVER_DELETE_OK_STATUS ||     // Mozilla status code
             gRequest.xhr.status == SERVER_VALIDATION_OK_STATUS || // IE status code
             gRequest.xhr.status == '1223')                        // no longer seen IE status code???
        {
            nodeXmlToBeDeleted  = this.getEditedXmlNode();
            nodeHtmlToBeDeleted = $('eipGhostEditContainerDiv');

            deleteHtmlAndXml(nodeHtmlToBeDeleted, nodeXmlToBeDeleted);
            gEditNodeInfo.state = STATE_VIEWING;

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();
       }
        else {
            gEditNodeInfo.state = STATE_EDITING;
            nodeDeleteButton = getNodeDeleteButton();
            nodeDeleteButton.disabled = false;
            var strErrorMsg = "<p>An unexpected error accurred on the server while deleting.</p>" +
                              "<p>Click \'Cancel\'.</p>" +
                              "<p>Error message:</p>" +
                              "<textarea rows='5' readonly='yes'>" +
                              gRequest.xhr.responseText + '\n' +
                              "</textarea>";
            Ext.MessageBox.show({
               title: 'Error',
               msg: strErrorMsg,
               buttons: Ext.MessageBox.OK,
               width: 600
            });
        }
    };
};


function Para_WorkFlowStep() {
    this.init = init;
    this.gotTitle = gotTitle;

    init();

    return this;

    function init() {
        Para_WorkFlowStep.prototype.init();
    };

    function gotTitle() {
        return true;
    };
};
Para_WorkFlowStep.prototype = new WorkFlowStep();


function Equation_WorkFlowStep() {
    this.init = init;
    this.gotTitle = gotTitle;

    init();

    return this;

    function init() {
        Equation_WorkFlowStep.prototype.init();
    };

    function gotTitle() {
        return true;
    };
};
Equation_WorkFlowStep.prototype = new WorkFlowStep();


function Note_WorkFlowStep() {
    // private
    var m_strTypeAttributeValue;
    var m_bUserDefinedTypeAttribute;
    var m_nodeNoteTypeSelect;

    this.init = init;
    this.gotTitle = gotTitle;
    this.crackXml = crackXml;
    this.setupEditForm = setupEditForm;
    this.getEditedXml = getEditedXml;

    init();

    return this;

    function init() {
        Note_WorkFlowStep.prototype.init();
        m_strTypeAttributeValue = null;
        m_bUserDefinedTypeAttribute = false;
        m_nodeNoteTypeSelect = null;
    };

    function gotTitle() {
        return true;
    };

    function crackXml(strXml, nodeXml) {
        var oXmlParts;
        var strFirstPart;
        var strTypeAttribute;
        var strLastPart;

        oXmlParts = Note_WorkFlowStep.prototype.crackXml(strXml, nodeXml);

        // slice and dice type attribute out of oXmlParts.strOpenTag
        //oXmlParts.strOpenTag = '<note id="eip-605" type="tip" display="block" class="CrazyStyle">'
        if      ( oXmlParts.strOpenTag.search("type='") != -1 ) {
            oXmlParts.strOpenTag.replace(/([\w\W]*?)type='(.*?)'(\s*\w*=.*>|\s*>)/,
                                         function(wholeMatch, firstPart, typePart, lastPart) {
                                             strFirstPart = firstPart;
                                             strTypeAttribute = typePart;
                                             strLastPart = lastPart;
                                             return wholeMatch;
                                         });
            oXmlParts.strTypeAttribute = strTypeAttribute;
            oXmlParts.strOpenTag = strFirstPart + strLastPart.strip();
        }
        else if ( oXmlParts.strOpenTag.search("type=\"") != -1 ) {
            oXmlParts.strOpenTag.replace(/([\w\W]*?)type="(.*?)"(\s*\w*=.*>|\s*>)/,
                                         function(wholeMatch, firstPart, typePart, lastPart) {
                                             strFirstPart = firstPart;
                                             strTypeAttribute = typePart;
                                             strLastPart = lastPart;
                                             return wholeMatch;
                                         });
            oXmlParts.strTypeAttribute = strTypeAttribute;
            oXmlParts.strOpenTag = strFirstPart + strLastPart.strip();
        }
        else {
            oXmlParts.strType = null;
        }
        return oXmlParts;
    }

    function setupEditForm(strXml) {
        var nodeWarningMessage;
        var nodeWarningText;
        var nodeHelpMessage;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeOpeningTag;
        var nodeOpeningTagText;
        var nodeClosingTag;
        var nodeClosingTagText;
        var nodeCancelButton;
        var nodeDeleteButton;
        var nodeLabelText;
        var nodeTitleEdit;
        var nodeText;
        var oXmlParts;
        var oTitleXmlParts;
        var strContents;
        var strTitle;
        var nodeHtmlClone;
        var nodeNoteTypeDiv;
        var nodeNoteTypeSpan;
        var nodeNoteTypeText;
        var nodeNoteTypeSelect;
        var strSelectHtml;
        var nodeTitleEdit;

        oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.setOpenTag(oXmlParts.strOpenTag);
        strContents = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);
        oTitleXmlParts = oXmlParts.oTitleXmlParts;
        if ( oTitleXmlParts && oTitleXmlParts.strOpenTag ) {
            this.setTitleOpenTag(oTitleXmlParts.strOpenTag);
        }

        m_strTypeAttributeValue = oXmlParts.strTypeAttribute;
        if ( m_strTypeAttributeValue ) {
            m_bUserDefinedTypeAttribute = ( m_strTypeAttributeValue != "note" &&
                                            m_strTypeAttributeValue != "warning" &&
                                            m_strTypeAttributeValue != "important" &&
                                            m_strTypeAttributeValue != "aside" &&
                                            m_strTypeAttributeValue != "tip" );
            if ( m_bUserDefinedTypeAttribute ) {
                if ( m_strTypeAttributeValue ) {
                    // add the @type back into the opening tag, which is displayed in the edit UI
                    var strOldIsNewOpeningTag;
                    strOldIsNewOpeningTag = this.getOpenTag().replace(/>$/,
                                                                      " type=\"" +  m_strTypeAttributeValue +
                                                                      "\">");
                    this.setOpenTag(strOldIsNewOpeningTag);
                }
            }
        }
        else {
            m_bUserDefinedTypeAttribute = false;
        }

        // <DIV class='eipEditContainer'>
        // note that node $('eipMasterEditContainerDiv') is a hidden sibling of $('cnx_main')
        this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
        $('eipMasterEditContainerDiv').innerHTML = ' ';

        this.getHtmlEditContainerDiv().className = 'eipEditContainer';

        var nodePopups = document.createElement('div');
        nodePopups.className = 'eipPopUps';

        //   <DIV class="eipHelpMessage"><A></A></DIV>
        nodeHelpMessage = document.createElement('div');
        nodeHelpMessage.className = 'eipHelpMessage';
        nodeHelpLink = document.createElement('a');
        nodeHelpLink.onclick = function(event){openHelp(g_oWorkFlowStep.getEditedXmlTag());};
        nodeHelpText = document.createTextNode('Help editing <' + this.getEditedXmlTag() + '>');
        nodeHelpLink.appendChild(nodeHelpText);
        nodeHelpMessage.appendChild(nodeHelpLink);
        nodePopups.appendChild(nodeHelpMessage);
        
        // Add launch button for MathEditor
        MathEditor.addLaunchButton(nodePopups);
        this.getHtmlEditContainerDiv().appendChild(nodePopups);

        // <DIV class="eipOpeningTagLabel"> opening tag 
        nodeOpeningTag = document.createElement('div');
        nodeOpeningTag.className = 'eipOpeningTagLabel';
        nodeOpeningTagText = document.createTextNode(this.getOpenTag());
        nodeOpeningTag.appendChild(nodeOpeningTagText);
        // </DIV>
        this.getHtmlEditContainerDiv().appendChild(nodeOpeningTag);

        // <DIV class="eipNoteType">
        nodeNoteTypeDiv = document.createElement('div');
        nodeNoteTypeDiv.className = 'eipNoteType';
        //   <SPAN class="eipNoteTypeSpan">Type:
        nodeNoteTypeSpan = document.createElement('span');
        nodeNoteTypeSpan.className = 'eipNoteTypeSpan';
        nodeNoteTypeText = document.createTextNode("Type:");
        nodeNoteTypeSpan.appendChild(nodeNoteTypeText);
        //   </SPAN>
        nodeNoteTypeDiv.appendChild(nodeNoteTypeSpan);
        //   <SELECT><OPTION/>*</SELECT>
        if ( m_bUserDefinedTypeAttribute ) {
            strSelectHtml = "\n" +
                            "<select class=\"eipDisabled\">\n" +
                            "  <option value=\"user-defined\">(User defined)</option>\n" +
                            "</select>";
            nodeNoteTypeDiv.innerHTML += strSelectHtml;
            nodeNoteTypeSelect = nodeNoteTypeDiv.lastChild;
            nodeNoteTypeSelect.disabled = true; // or "disabled"
        }
        else {
            strSelectHtml = "\n" +
                            "<select class=\"eipNodeTypeSelect\">\n" +
                            "  <option value=\"note\">Note</option>\n" +
                            "  <option value=\"warning\">Warning</option>\n" +
                            "  <option value=\"important\">Important</option>\n" +
                            "  <option value=\"aside\">Aside</option>\n" +
                            "  <option value=\"tip\">Tip</option>\n" +
                            "</select>";
            nodeNoteTypeDiv.innerHTML += strSelectHtml;
            m_nodeNoteTypeSelect = nodeNoteTypeDiv.lastChild;
            m_nodeNoteTypeSelect.selectedIndex = ( m_strTypeAttributeValue == null        ? 0 :
                                                   m_strTypeAttributeValue == "note"      ? 0 :
                                                   m_strTypeAttributeValue == "warning"   ? 1 :
                                                   m_strTypeAttributeValue == "important" ? 2 :
                                                   m_strTypeAttributeValue == "aside"     ? 3 :
                                                   m_strTypeAttributeValue == "tip"       ? 4 : 0 );
        }
        // </DIV>
        this.getHtmlEditContainerDiv().appendChild(nodeNoteTypeDiv);

        // <DIV class='eipTitleDiv'>Title (optional): <INPUT type="text" size="40" /></DIV>
        if ( oTitleXmlParts ) {
            strTitle = ( oTitleXmlParts.strContents ? oTitleXmlParts.strContents : '' );
        }
        else {
            strTitle = '';
        }
        nodeTitleEdit = document.createElement('div');
        nodeTitleEdit.className = 'eipTitleDiv';
        nodeText = document.createTextNode('Title (optional):');
        nodeTitleEdit.appendChild(nodeText);
        this.setTitleInput(document.createElement('input'));
        this.getTitleInput().setAttribute('type', 'text');
        this.getTitleInput().setAttribute('size', '40');
        this.getTitleInput().value = strTitle.replace(/\n/g, " ");
        nodeTitleEdit.appendChild(this.getTitleInput());
        this.getHtmlEditContainerDiv().appendChild(nodeTitleEdit);
        // </DIV>

        // <TEXTAREA class="eipXMLEditor" rows="7"/> stuff to edit </TEXTAREA>
        this.setTextArea(document.createElement('textarea'));
        this.getTextArea().className = 'eipXMLEditor';
        this.getTextArea().setAttribute('rows', g_strTextEditBoxSize);
        if ( strContents ) {
            this.getTextArea().value = strContents;
        }
        this.getHtmlEditContainerDiv().appendChild(this.getTextArea());

        // <DIV class="eipClosingTagLabel"> closing tag </DIV>
        m_nodeClosingTag = document.createElement('div');
        m_nodeClosingTag.className = 'eipOpeningTagLabel';
        nodeClosingTagText = document.createTextNode(this.getCloseTag());
        m_nodeClosingTag.appendChild(nodeClosingTagText);
        this.getHtmlEditContainerDiv().appendChild(m_nodeClosingTag);

        // <BUTTON class="eipSaveButton" alt="Save">Save  </BUTTON>
        this.setSaveButton(document.createElement('button'));
        this.getSaveButton().className = 'eipSaveButton';
        nodeLabelText = document.createTextNode('Save');
        this.getSaveButton().setAttribute('alt', 'Save');
        Event.observe(this.getSaveButton(), 'click',
                      this.onSave.bindAsEventListener(this));
        this.getSaveButton().appendChild(nodeLabelText);
        this.getSaveButton().disabled = false;
        this.getHtmlEditContainerDiv().appendChild(this.getSaveButton());

        // <BUTTON alt="Cancel" class="eipCancelButton">Cancel  </BUTTON>
        nodeCancelButton = document.createElement('button');
        nodeCancelButton.className = 'eipCancelButton';
        nodeCancelButton.setAttribute('alt', "Cancel");
        nodeLabelText = document.createTextNode('Cancel');
        nodeCancelButton.appendChild(nodeLabelText);
        Event.observe(nodeCancelButton, 'click',
                      this.onCancel.bindAsEventListener(this));
        this.getHtmlEditContainerDiv().appendChild(nodeCancelButton);

        // <BUTTON alt="Delete" class="eipDeleteButton">Delete  </BUTTON>
        var bIsNodeDeletable;
        bIsNodeDeletable = isNodeDeletable(this.getEditedHtmlNode());
        var bEditingExistingNode = this.getEditingExistingNode();

        if ( bEditingExistingNode && bIsNodeDeletable ) {
            this.setNodeDeleteButton(document.createElement('button'));
            this.getNodeDeleteButton().className = 'eipDeleteButton';
            this.getNodeDeleteButton().setAttribute('alt', 'Delete');
            nodeLabelText = document.createTextNode('Delete');
            this.getNodeDeleteButton().appendChild(nodeLabelText);
            Event.observe(this.getNodeDeleteButton(), 'click',
                          this.onDelete.bindAsEventListener(this));
            this.getNodeDeleteButton().disabled = false;
            this.getHtmlEditContainerDiv().appendChild(this.getNodeDeleteButton());
        }

        // </DIV>

        // before we clone the node, we must first remove the event callbacks
        // recursively from the HTML tree rooted by the edited html node.
        stopObserving(this.getEditedHtmlNode());

        // clone the edited html node.
        nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
        this.setEditedHtmlNodeClone(nodeHtmlClone);
    };

    function getEditedXml() {
        var strXml;
        var strOpenTag;
        var strTagContents;
        var strType;
        var strTypeAttribute;
        var strTypeAttributeValue;
        var iSelectedIndex;
        var bDefaultTypeValueSelected;
        var bNoInitialTypeValue;
        var nodeTitleInput;
        var strTitleXml;
        var nodeLabel;
        var strLabelCnxml;
        var reLabelCnxml;

        if ( m_bUserDefinedTypeAttribute ) {
            // type value is already part of the opening tag, 
            // which is what is displayed in edit UI
            strTypeAttribute = null;
        }
        else {
            // get the current selected type value
            iSelectedIndex = m_nodeNoteTypeSelect.selectedIndex;
            strTypeAttributeValue = m_nodeNoteTypeSelect.options[iSelectedIndex].value;
            bDefaultTypeValueSelected = ( iSelectedIndex == 0 );
            bNoInitialTypeValue = ( m_strTypeAttributeValue == null );
            if ( bNoInitialTypeValue && bDefaultTypeValueSelected ) {
                // there was no initial type attribute, which has an implied, default type of "note"
                // user did not change the type attribute, so we want to not assign a type attribute
                // value.
                strTypeAttribute = null;
            }
            else {
                strTypeAttribute = "type=\"" + strTypeAttributeValue +"\"";
            }
        }
        if ( strTypeAttribute ) {
            strOpenTag = this.getOpenTag().replace(/>$/, " " +  strTypeAttribute + ">");
        }
        else {
            strOpenTag = this.getOpenTag();
        }

        strTagContents = this.getTextArea().value.replace(/^\s+/,'');

        nodeTitleInput = this.getTitleInput();
        if ( nodeTitleInput ) {
            strTitle = nodeTitleInput.value;
            strTitleXml = '';
            if ( strTitle && strTitle.length > 0 ) {
                strTitleXml = ( this.getTitleOpenTag() ? this.getTitleOpenTag() : '<title>' );
                strTitleXml += strTitle;
                strTitleXml += '</title>';
            }
            if ( strTitleXml.length > 0 ) {
                // title must come after label (which may or may not be hiding out in strTagContents),
                // else must be first thing
                strXml = addNamespacesToTagText(this.getOpenTag());
                strXml += strTagContents;
                strXml += this.getCloseTag();
                strLabelCnxml = this.getEditedLabel(strXml);
                if ( strLabelCnxml && strLabelCnxml.length > 0 ) {
                    reLabelCnxml = escapeRegularExpression(strLabelCnxml);
                    strTagContents = strTagContents.replace(reLabelCnxml, strLabelCnxml + strTitleXml);
                }
                else {
                    strTagContents = strTitleXml + strTagContents;
                }
            }
        }

        strXml = addNamespacesToTagText(strOpenTag);
        strXml += strTagContents;
        strXml += this.getCloseTag();

        return strXml;
    };
}
Note_WorkFlowStep.prototype = new WorkFlowStep();


function Rule_WorkFlowStep() {
    // private
    var m_strTypeAttributeValue;
    var m_bUserDefinedTypeAttribute;
    var m_nodeRuleTypeSelect;

    this.init = init;
    this.gotTitle = gotTitle;
    this.crackXml = crackXml;
    this.setupEditForm = setupEditForm;
    this.getEditedXml = getEditedXml;

    init();

    return this;

    function init() {
        Note_WorkFlowStep.prototype.init();
        m_strTypeAttributeValue = null;
        m_bUserDefinedTypeAttribute = false;
        m_nodeRuleTypeSelect = null;
    };

    function gotTitle() {
        return true;
    };

    function crackXml(strXml, nodeXml) {
        var oXmlParts;
        var strFirstPart;
        var strTypeAttribute;
        var strLastPart;

        oXmlParts = Note_WorkFlowStep.prototype.crackXml(strXml, nodeXml);

        // slice and dice type attribute out of oXmlParts.strOpenTag
        //oXmlParts.strOpenTag = '<rule id="eip-605" type="tip" display="block" class="CrazyStyle">'
        if      ( oXmlParts.strOpenTag.search("type='") != -1 ) {
            oXmlParts.strOpenTag.replace(/([\w\W]*?)type='(.*?)'(\s*\w*=.*>|\s*>)/,
                                         function(wholeMatch, firstPart, typePart, lastPart) {
                                             strFirstPart = firstPart;
                                             strTypeAttribute = typePart;
                                             strLastPart = lastPart;
                                             return wholeMatch;
                                         });
            oXmlParts.strTypeAttribute = strTypeAttribute;
            oXmlParts.strOpenTag = strFirstPart + strLastPart.strip();
        }
        else if ( oXmlParts.strOpenTag.search("type=\"") != -1 ) {
            oXmlParts.strOpenTag.replace(/([\w\W]*?)type="(.*?)"(\s*\w*=.*>|\s*>)/,
                                         function(wholeMatch, firstPart, typePart, lastPart) {
                                             strFirstPart = firstPart;
                                             strTypeAttribute = typePart;
                                             strLastPart = lastPart;
                                             return wholeMatch;
                                         });
            oXmlParts.strTypeAttribute = strTypeAttribute;
            oXmlParts.strOpenTag = strFirstPart + strLastPart.strip();
        }
        else {
            oXmlParts.strType = null;
        }
        return oXmlParts;
    }

    function setupEditForm(strXml) {
        var nodeWarningMessage;
        var nodeWarningText;
        var nodeHelpMessage;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeOpeningTag;
        var nodeOpeningTagText;
        var nodeClosingTag;
        var nodeClosingTagText;
        var nodeCancelButton;
        var nodeDeleteButton;
        var nodeLabelText;
        var nodeTitleEdit;
        var nodeText;
        var oXmlParts;
        var oTitleXmlParts;
        var strContents;
        var strTitle;
        var nodeHtmlClone;
        var nodeRuleTypeDiv;
        var nodeRuleTypeSpan;
        var nodeRuleTypeText;
        var nodeRuleTypeSelect;
        var strSelectHtml;

        oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.setOpenTag(oXmlParts.strOpenTag);
        strContents = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);
        oTitleXmlParts = oXmlParts.oTitleXmlParts;
        if ( oTitleXmlParts && oTitleXmlParts.strOpenTag ) {
            this.setTitleOpenTag(oTitleXmlParts.strOpenTag);
        }

        m_strTypeAttributeValue = oXmlParts.strTypeAttribute;
        if ( m_strTypeAttributeValue ) {
            m_bUserDefinedTypeAttribute = ( m_strTypeAttributeValue != "rule" &&
                                            m_strTypeAttributeValue != "theorem" &&
                                            m_strTypeAttributeValue != "lemma" &&
                                            m_strTypeAttributeValue != "corrolary" &&
                                            m_strTypeAttributeValue != "law" &&
                                            m_strTypeAttributeValue != "proposition" );
        }
        else {
            m_bUserDefinedTypeAttribute = false;
        }

        // <DIV class='eipEditContainer'>
        // note that node $('eipMasterEditContainerDiv') is a hidden sibling of $('cnx_main')
        this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
        $('eipMasterEditContainerDiv').innerHTML = ' ';

        this.getHtmlEditContainerDiv().className = 'eipEditContainer';

        var nodePopups = document.createElement('div');
        nodePopups.className = 'eipPopUps';

        //   <DIV class="eipHelpMessage"><A></A></DIV>
        nodeHelpMessage = document.createElement('div');
        nodeHelpMessage.className = 'eipHelpMessage';
        nodeHelpLink = document.createElement('a');
        nodeHelpLink.onclick = function(event){openHelp(g_oWorkFlowStep.getEditedXmlTag());};
        nodeHelpText = document.createTextNode('Help editing <' + this.getEditedXmlTag() + '>');
        nodeHelpLink.appendChild(nodeHelpText);
        nodeHelpMessage.appendChild(nodeHelpLink);
        nodePopups.appendChild(nodeHelpMessage);
        
        // Add launch button for MathEditor
        MathEditor.addLaunchButton(nodePopups);
        this.getHtmlEditContainerDiv().appendChild(nodePopups);

        // <DIV class="eipOpeningTagLabel"> opening tag 
        nodeOpeningTag = document.createElement('div');
        nodeOpeningTag.className = 'eipOpeningTagLabel';
        nodeOpeningTagText = document.createTextNode(this.getOpenTag());
        nodeOpeningTag.appendChild(nodeOpeningTagText);
        // </DIV>
        this.getHtmlEditContainerDiv().appendChild(nodeOpeningTag);

        // <DIV class="eipRuleType">
        nodeRuleTypeDiv = document.createElement('div');
        nodeRuleTypeDiv.className = 'eipRuleType';
        //   <SPAN class="eipRuleTypeSpan">Type:
        nodeRuleTypeSpan = document.createElement('span');
        nodeRuleTypeSpan.className = 'eipRuleTypeSpan';
        nodeRuleTypeText = document.createTextNode("Type:");
        nodeRuleTypeSpan.appendChild(nodeRuleTypeText);
        //   </SPAN>
        nodeRuleTypeDiv.appendChild(nodeRuleTypeSpan);
        //   <SELECT><OPTION/>*</SELECT>
        if ( m_bUserDefinedTypeAttribute ) {
            strSelectHtml = "\n" +
                            "<select class=\"eipDisabled\">\n" +
                            "  <option value=\"user-defined\">(User defined)</option>\n" +
                            "</select>";
            nodeRuleTypeDiv.innerHTML += strSelectHtml;
            nodeRuleTypeSelect = nodeRuleTypeDiv.lastChild;
            nodeRuleTypeSelect.disabled = true; // or "disabled"
        }
        else {
            strSelectHtml = "\n" +
                            "<select class=\"eipNodeTypeSelect\">\n" +
                            "  <option value=\"rule\">Rule</option>\n" +
                            "  <option value=\"theorem\">Theorem</option>\n" +
                            "  <option value=\"lemma\">Lemma</option>\n" +
                            "  <option value=\"corrolary\">Corrolary</option>\n" +
                            "  <option value=\"law\">Law</option>\n" +
                            "  <option value=\"proposition\">Proposition</option>\n" +
                            "</select>";
            nodeRuleTypeDiv.innerHTML += strSelectHtml;
            m_nodeRuleTypeSelect = nodeRuleTypeDiv.lastChild;
            m_nodeRuleTypeSelect.selectedIndex = ( m_strTypeAttributeValue == null          ? 0 :
                                                   m_strTypeAttributeValue == "rule"        ? 0 :
                                                   m_strTypeAttributeValue == "theorem"     ? 1 :
                                                   m_strTypeAttributeValue == "lemma"       ? 2 :
                                                   m_strTypeAttributeValue == "corrolary"   ? 3 :
                                                   m_strTypeAttributeValue == "law"         ? 4 :
                                                   m_strTypeAttributeValue == "proposition" ? 5 : 0 );
        }
        // </DIV>
        this.getHtmlEditContainerDiv().appendChild(nodeRuleTypeDiv);

        // <DIV class='eipTitleDiv'>Title (optional): <INPUT type="text" size="40" />
        if ( oTitleXmlParts ) {
            strTitle = ( oTitleXmlParts.strContents ? oTitleXmlParts.strContents : '' );
        }
        else {
            strTitle = '';
        }
        nodeTitleEdit = document.createElement('div');
        nodeTitleEdit.className = 'eipTitleDiv';
        nodeText = document.createTextNode('Title (optional):');
        nodeTitleEdit.appendChild(nodeText);
        this.setTitleInput(document.createElement('input'));
        this.getTitleInput().setAttribute('type', 'text');
        this.getTitleInput().setAttribute('size', '40');
        if ( strTitle ) {
            this.getTitleInput().value = strTitle.replace(/\n/g, " ");
        }
        nodeTitleEdit.appendChild(this.getTitleInput());
        // </DIV>
        this.getHtmlEditContainerDiv().appendChild(nodeTitleEdit);

        // <TEXTAREA class="eipXMLEditor" rows="7"/> stuff to edit </TEXTAREA>
        this.setTextArea(document.createElement('textarea'));
        this.getTextArea().className = 'eipXMLEditor';
        this.getTextArea().setAttribute('rows', g_strTextEditBoxSize);
        if ( strContents ) {
            this.getTextArea().value = strContents;
        }
        this.getHtmlEditContainerDiv().appendChild(this.getTextArea());

        // <DIV class="eipClosingTagLabel"> closing tag </DIV>
        m_nodeClosingTag = document.createElement('div');
        m_nodeClosingTag.className = 'eipOpeningTagLabel';
        nodeClosingTagText = document.createTextNode(this.getCloseTag());
        m_nodeClosingTag.appendChild(nodeClosingTagText);
        this.getHtmlEditContainerDiv().appendChild(m_nodeClosingTag);

        // <BUTTON class="eipSaveButton" alt="Save">Save  </BUTTON>
        this.setSaveButton(document.createElement('button'));
        this.getSaveButton().className = 'eipSaveButton';
        nodeLabelText = document.createTextNode('Save');
        this.getSaveButton().setAttribute('alt', 'Save');
        Event.observe(this.getSaveButton(), 'click',
                      this.onSave.bindAsEventListener(this));
        this.getSaveButton().appendChild(nodeLabelText);
        this.getSaveButton().disabled = false;
        this.getHtmlEditContainerDiv().appendChild(this.getSaveButton());

        // <BUTTON alt="Cancel" class="eipCancelButton">Cancel  </BUTTON>
        nodeCancelButton = document.createElement('button');
        nodeCancelButton.className = 'eipCancelButton';
        nodeCancelButton.setAttribute('alt', "Cancel");
        nodeLabelText = document.createTextNode('Cancel');
        nodeCancelButton.appendChild(nodeLabelText);
        Event.observe(nodeCancelButton, 'click',
                      this.onCancel.bindAsEventListener(this));
        this.getHtmlEditContainerDiv().appendChild(nodeCancelButton);

        // <BUTTON alt="Delete" class="eipDeleteButton">Delete  </BUTTON>
        var bIsNodeDeletable;
        bIsNodeDeletable = isNodeDeletable(this.getEditedHtmlNode());
        var bEditingExistingNode = this.getEditingExistingNode();

        if ( bEditingExistingNode && bIsNodeDeletable ) {
            this.setNodeDeleteButton(document.createElement('button'));
            this.getNodeDeleteButton().className = 'eipDeleteButton';
            this.getNodeDeleteButton().setAttribute('alt', 'Delete');
            nodeLabelText = document.createTextNode('Delete');
            this.getNodeDeleteButton().appendChild(nodeLabelText);
            Event.observe(this.getNodeDeleteButton(), 'click',
                          this.onDelete.bindAsEventListener(this));
            this.getNodeDeleteButton().disabled = false;
            this.getHtmlEditContainerDiv().appendChild(this.getNodeDeleteButton());
        }

        // </DIV>

        // before we clone the node, we must first remove the event callbacks
        // recursively from the HTML tree rooted by the edited html node.
        stopObserving(this.getEditedHtmlNode());

        // clone the edited html node.
        nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
        this.setEditedHtmlNodeClone(nodeHtmlClone);
    };

    function getEditedXml() {
        var strXml;
        var strOpenTag;
        var strTagContents;
        var strType;
        var strTypeAttribute;
        var strTypeAttributeValue;
        var iSelectedIndex;
        var bDefaultTypeValueSelected;
        var bNoInitialTypeValue;
        var nodeTitleInput;
        var strTitle;
        var strTitleXml;
        var strLabelCnxml;
        var reLabelCnxml;

        if ( m_bUserDefinedTypeAttribute ) {
            strTypeAttribute = "type=\"" + m_strTypeAttributeValue +"\"";
        }
        else {
            // get the current selected type value
            iSelectedIndex = m_nodeRuleTypeSelect.selectedIndex;
            strTypeAttributeValue = m_nodeRuleTypeSelect.options[iSelectedIndex].value;
            bDefaultTypeValueSelected = ( iSelectedIndex == 0 );
            bNoInitialTypeValue = ( m_strTypeAttributeValue == null );
            if ( bNoInitialTypeValue && bDefaultTypeValueSelected ) {
                // there was no initial type attribute, which has an implied, default type of "note"
                // user did not change the type attribute, so we want to not assign a type attribute
                // value.
                strTypeAttribute = null;
            }
            else {
                strTypeAttribute = "type=\"" + strTypeAttributeValue +"\"";
            }
        }
        if ( strTypeAttribute ) {
            strOpenTag = this.getOpenTag().replace(/>$/, " " +  strTypeAttribute + ">");
        }
        else {
            strOpenTag = this.getOpenTag();
        }

        strTagContents = this.getTextArea().value.replace(/^\s+/,'');

        nodeTitleInput = this.getTitleInput();
        if ( nodeTitleInput ) {
            strTitle = nodeTitleInput.value;
            strTitleXml = '';
            if ( strTitle && strTitle.length > 0 ) {
                strTitleXml = ( this.getTitleOpenTag() ? this.getTitleOpenTag() : '<title>' );
                strTitleXml += strTitle;
                strTitleXml += '</title>';
            }
            if ( strTitleXml.length > 0 ) {
                // must come after label (which may or may not be hiding out in strTagContents),
                // else must be first thing
                strXml = addNamespacesToTagText(this.getOpenTag());
                strXml += strTagContents;
                strXml += this.getCloseTag();
                strLabelCnxml = this.getEditedLabel(strXml);
                if ( strLabelCnxml && strLabelCnxml.length > 0 ) {
                    reLabelCnxml = escapeRegularExpression(strLabelCnxml);
                    strTagContents = strTagContents.replace(reLabelCnxml, strLabelCnxml + strTitleXml);
                }
                else {
                    strTagContents = strTitleXml + strTagContents;
                }
            }
        }

        strXml = addNamespacesToTagText(strOpenTag);
        strXml += strTagContents;
        strXml += this.getCloseTag();

        return strXml;
    };
}
Rule_WorkFlowStep.prototype = new WorkFlowStep();


function Title_WorkFlowStep() {
    var m_strSectionTitle;

    this.init = init;
    this.gotTitle = gotTitle;
    this.getEditedXml = getEditedXml;
    this.setupEditForm = setupEditForm;
    this.editNode = editNode;
    this.addNode = addNode;

    this.handleCancel = handleCancel;
    this.handleDelete = handleDelete;

    this.onServerDeleteRequest = onServerDeleteRequest;

    this.handleServerEditRequestReturn = handleServerEditRequestReturn;
    this.handleServerAddRequestReturn = handleServerAddRequestReturn;
    this.handleServerDeleteRequest = handleServerDeleteRequest;

    init();

    return this;

    function init() {
        Title_WorkFlowStep.prototype.init();
    };

    function gotTitle() {
        return false;
    };

    function addNode(nodeHtmlSectionHeader) {
        var nodeHtmlSection;
        var strXPathSection;
        var nodeNewHtml;
        var nodeNewXml;
        var nodeXmlText;
        var nodeParentXml;
        var nodeXmlSectionChild;
        var infoInsertion;
        var strNewXml;

        nodeHtmlSection = findSectionNode(nodeHtmlSectionHeader);
        strXPathSection = buildXPathFromHtml(nodeHtmlSection);

        // html node exists whether or not the CNXML <title> is actually there.
        // we do not need to create a new HTML here (unlike the prototype's addNode())
        nodeNewHtml = nodeHtmlSectionHeader;

        nodeNewXml = createElementNS(gSource.doc, this.getEditedXmlTag());
        nodeXmlText = gSource.doc.createTextNode(' ');
        nodeNewXml.appendChild(nodeXmlText);

        // do not need to call addNewNodeToHtmlAndXml() here. html node is modified in place.
        // just need to add the xml node.
        nodeParentXml = getNodeByXPath(strXPathSection, gSource.doc);
        nodeXmlSectionChild = nodeParentXml.firstChild;
        while ( nodeXmlSectionChild ) {
            if ( nodeXmlSectionChild.nodeType == Node.ELEMENT_NODE ) {
                break;
            }
            nodeXmlSectionChild = nodeXmlSectionChild.nextSibling;
        }

        infoInsertion = new Object();
        if ( nodeXmlSectionChild.nodeName == 'label' ) {
            // insert title after the label
            infoInsertion.strXPathInsertionNode = strXPathSection + '/cnx:label[1]';
            infoInsertion.strInsertionPosition = 'after';
            nodeParentXml.insertBefore(nodeNewXml, nodeXmlSectionChild.nextSibling);
        }
        else {
            // insert title before this node
            infoInsertion.strXPathInsertionNode = strXPathSection + '/cnx:' + nodeXmlSectionChild.nodeName + '[1]';
            infoInsertion.strInsertionPosition = 'before';
            nodeParentXml.insertBefore(nodeNewXml, nodeXmlSectionChild);
        }

        this.setAddNodeState(nodeNewHtml, nodeNewXml,
                             infoInsertion.strInsertionPosition, infoInsertion.strXPathInsertionNode);

        // decorate nodeNewXml and return its serialization (which is not used here but good for debug)
        strNewXml = this.initializeXmlNode(nodeNewXml);

        this.editNode(nodeNewHtml, strNewXml);
    }

    function editNode(nodeHtml, strXml) {
        var nodeSectionHeaderHtml;
        var nodeSectionHtml;
        var strId;
        var nodeSectionXml;
        var nodeSectionLabelXml;
        var nodeSectionTitleXml;
        var i;
        var strChildNodeName;
        var nodeXmlBeingEdited;
        var strXPathToEditedNode;
        var nodeClonedXml;

        nodeSectionHeaderHtml = nodeHtml;
        nodeSectionHtml = nodeSectionHeaderHtml.parentNode;

        // find the xml edit node via its parent's id attribute
        strId = nodeSectionHtml.getAttribute('id');
        nodeSectionXml = getNodeById(strId, gSource.doc);
        nodeSectionLabelXml = null;
        nodeSectionTitleXml = null;
        for (i = 0; i < nodeSectionXml.childNodes.length; i++) {
            strChildNodeName = nodeSectionXml.childNodes[i].nodeName;
            if ( strChildNodeName == 'label' ) {
                nodeSectionLabelXml = nodeSectionXml.childNodes[i];
            }
            else if ( strChildNodeName == 'title' ) {
                nodeSectionTitleXml = nodeSectionXml.childNodes[i];
                // label if it exists must preceed title
                break;
            }
        }
        nodeXmlBeingEdited = nodeSectionTitleXml;
        strXPathToEditedNode = buildXPathFromXml(nodeXmlBeingEdited, null);

        gSource.nodeBeingEdited = nodeXmlBeingEdited;

        if ( strXml === undefined ) {
            // Clone the XML node, to tease out a serialized string.
            nodeClonedXml = gSource.nodeBeingEdited; // for debugging
            nodeClonedXml = gSource.nodeBeingEdited.cloneNode(true);

            // Add the MathML Namespace to top level tag before serializing so
            // that it won't show up on sub-elements
            // FIXME
            //   sarissa-ble???,
            ///  we add the NS here to only take it out on the call to serializeAndMassageXmlNode()???
            if ( nodeClonedXml.setAttributeNS ) {
                nodeClonedXml.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:m', MATHML_NS);
            } else {
                if ( nodeClonedXml.getAttribute('xmlns:m') == null ) {
                    nodeClonedXml.setAttribute('xmlns:m', MATHML_NS);
                    // once NS is set in IE it becomes read only ...
                }
            }

            strXml = serializeAndMassageXmlNode(nodeClonedXml);
            nodeClonedXml = null;
        }
        else {
            // got here via addNode()
        }

        this.setEditNodeState(nodeHtml, gSource.nodeBeingEdited, strXPathToEditedNode);

        this.setupEditForm(strXml);

        // a) opacity fade, b) open editable, c) scroll
        this.fadeOutBackground();
        setTimeout("g_oWorkFlowStep.displayEditForm()", 500);
        setTimeout("g_oWorkFlowStep.centerEditForm()",  600);

        gEditNodeInfo.state = STATE_EDITING;
    };

    function getEditedXml() {
        var strNewXml;

        strNewXml = addNamespacesToTagText(this.getOpenTag());
        strNewXml += this.getTitleInput().value;
        strNewXml += this.getCloseTag();

        return strNewXml;
    };

    function setupEditForm(strXml) {
        var oXmlParts;
        var strContents;
        var nodeChild;
        var nodeHelpMessage;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeNameDiv;
        var nodeLabelText;
        var nodeCancelButton;
        var nodeDeleteButton;
        var nodeHtmlClone;
        var bIsNodeDeletable;
        var bEditingExistingNode;

        oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.setOpenTag(oXmlParts.strOpenTag);
        strContents = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);

        m_strSectionTitle = strContents;

        // <DIV id='eipEditContainer'>
        this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
        $('eipMasterEditContainerDiv').innerHTML = ' ';

        //   <div class="eipTitleEditContainer">
        nodeTitleEditContainer = document.createElement('div');
        nodeTitleEditContainer.className = 'eipTitleEditContainer';
        this.getHtmlEditContainerDiv().appendChild(nodeTitleEditContainer);

        //     <div class="eipTitleDiv">Title:
        nodeNameDiv = document.createElement('div');
        nodeNameDiv.className = 'eipTitleDiv';
        nodeTitleEditContainer.appendChild(nodeNameDiv);
        nodeLabelText = document.createTextNode('Title: ');
        nodeNameDiv.appendChild(nodeLabelText);
        //     <input type="text" class="eipTitle" />
        this.setTitleInput(document.createElement('input'));
        this.getTitleInput().setAttribute('type', 'text');
        this.getTitleInput().setAttribute('size', '40');
        this.getTitleInput().className = 'eipTitle';
        if ( m_strSectionTitle ) {
            this.getTitleInput().setAttribute('value', m_strSectionTitle.replace(/\n/g, " "));
        }
        nodeNameDiv.appendChild(this.getTitleInput());
        //   </div>

        // <button class="eipSaveButton" />
        this.setSaveButton(document.createElement('button'));
        this.getSaveButton().className = 'eipSaveButton';
        nodeLabelText = document.createTextNode('Save');
        this.getSaveButton().setAttribute('alt', 'Save');
        Event.observe(this.getSaveButton(), 'click',
                      this.onSave.bindAsEventListener(this));
        this.getSaveButton().appendChild(nodeLabelText);
        this.getSaveButton().disabled = false;
        nodeTitleEditContainer.appendChild(this.getSaveButton());

        // <button class="eipCancelButton" />
        nodeCancelButton = document.createElement('button');
        nodeCancelButton.className = 'eipCancelButton';
        nodeCancelButton.setAttribute('alt', 'Cancel');
        nodeLabelText = document.createTextNode('Cancel');
        nodeCancelButton.appendChild(nodeLabelText);
        Event.observe(nodeCancelButton, 'click',
                      this.onCancel.bindAsEventListener(this));
        nodeTitleEditContainer.appendChild(nodeCancelButton);

        // before we remove the to-be-edited HTML node from its DOM
        // determine if the node can be deleted (i.e. it is not an only child)
        // conditionally disable delete button later
        bIsNodeDeletable = true;
        bEditingExistingNode = this.getEditingExistingNode();

        if ( bEditingExistingNode && bIsNodeDeletable ) {
            nodeDeleteButton = document.createElement('button');
            nodeDeleteButton.className = 'eipDeleteButton';
            nodeDeleteButton.setAttribute('alt', 'Delete');
            nodeLabelText = document.createTextNode('Delete');
            nodeDeleteButton.appendChild(nodeLabelText);
            Event.observe(nodeDeleteButton, 'click',
                          this.onDelete.bindAsEventListener(this));
            nodeTitleEditContainer.appendChild(nodeDeleteButton);
        }
        //   </div>

        // before we clone the node, we must first remove the event callbacks
        // recursively from the HTML tree rooted by the edited html node.
        stopObserving(this.getEditedHtmlNode());

        // clone the edited html node.
        var nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
        this.setEditedHtmlNodeClone(nodeHtmlClone);
    };

    function handleCancel(e) {
        // if we're sending, try to abort
        if (gEditNodeInfo.state == STATE_VALIDATING) {
            try {
                gRequest.xhr.abort();
            }
            catch(e) {
            }
        }

        var bAddingNewNode;
        var strXPath;
        var nodeXml;
        var nodeXmlParent;
        var nodeEditedHtml;
        var nodeHtmlContainerParent;
        var nodeNewXml;
        var nodeHtmlSection;
        var nodeHtmlEditedClone;
        var strNewXmlXPath;

        bAddingNewNode = ( ! this.getEditingExistingNode() );

        // remove the editing textarea and buttons, replacing with the clone
        // of the original node

        // hard assumptions below that we are dealing with a section name.

        if ( bAddingNewNode ) {
            nodeEditedHtml = $('eipGhostEditContainerDiv');
            nodeHtmlEditedClone = this.getEditedHtmlNodeClone();
            replaceHtmlNode(nodeHtmlEditedClone, nodeEditedHtml);

            // now take the saved xpath, and find the XML node.
            strXPath = this.getXPathToEditedXmlNode();
            nodeXml = getNodeByXPath(strXPath, gSource.doc);
            if ( nodeXml.parentNode && nodeXml.parentNode.nodeName == 'section' ) {
                nodeHtmlSection = findSectionNode(nodeHtmlEditedClone);
                if ( nodeHtmlSection ) {
                    reestablishSectionCallbacks(nodeHtmlSection);
                }
            }

            nodeXmlParent = nodeXml.parentNode;
            nodeXmlParent.removeChild(nodeXml);

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();
        }
        else {
            nodeEditedHtml = $('eipGhostEditContainerDiv');
            nodeHtmlEditedClone = this.getEditedHtmlNodeClone();
            replaceHtmlNode(nodeHtmlEditedClone, nodeEditedHtml);

            // the section name contains the hover text for the section.
            // we replaced the section name with a clone (that we made before editting started)
            // which causes all of the existing event callbacks to be dropped.
            strNewXmlXPath = this.getXPathToEditedXmlNode();
            nodeNewXml = getNodeByXPath(strNewXmlXPath, gSource.doc);
            if ( nodeNewXml.parentNode && nodeNewXml.parentNode.nodeName == 'section' ) {
                nodeHtmlSection = findSectionNode(nodeHtmlEditedClone);
                if ( nodeHtmlSection ) {
                    reestablishSectionCallbacks(nodeHtmlSection);
                }
            }

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();
        }

        // change back to viewing state
        gEditNodeInfo.state = STATE_VIEWING;
    };

    function handleDelete(e) {
        var nodeXmlToBeDeleted;
        var nodeHtmlToBeDeleted;
        var nodeXmlParent;
        var bDoDelete;
        var bAddingNewNode;
        var strXPath;
        var funcServerReturnCalback;

        nodeXmlToBeDeleted = this.getEditedXmlNode();
        nodeXmlParent = nodeXmlToBeDeleted.parentNode;

        nodeHtmlToBeDeleted = $('eipGhostEditContainerDiv');

        bDoDelete = window.confirm("Are you sure you want to delete this entire element?");
        if ( bDoDelete ) {
            bAddingNewNode = ( ! this.getEditingExistingNode() );
            if ( !bAddingNewNode ) {
                strXPath = this.getXPathToEditedXmlNode();
                funcServerReturnCalback = this.onServerDeleteRequest.bind(this);
                sendDelete(gURLs.update, nodeXmlToBeDeleted, strXPath, onServerDeleteRequest);
                return;
            }
            else {
                // should never get here since newly added but not saved nodes
                // do not have a delete buttom in their edit UI.
                deleteHtmlAndXml(nodeHtmlToBeDeleted, nodeXmlToBeDeleted);
            }
        }
        else {
            onCancel();
            return;
        }
    };

    function onServerDeleteRequest() {
         g_oWorkFlowStep.handleServerDeleteRequest();
    };

    function updateHtml(nodeOldHtml, strNewTitle, nodeSectionXml) {
        var nodeNewHtml;
        var nodeSectionLabelXml;
        var nodeSectionTitleXml;
        var i;
        var nodeChild;
        var strLabel;
        var strTitle;
        var bLabelExists;
        var bLabelEmpty;
        var bTitleExists;
        var bTitleEmpty;
        var nodeSectionLabelHtml;
        var nodeSectionTitleHtml;
/*
nodeOldHtml looks like:
    <h2 class="section-header">
        <span id="html-element-806" class="eipClickToEdit">
            <a class="eipClickToEditSectionTitle" href="javascript:">edit section title</a>
            <a class="eipClickToEditEntireSection" href="javascript:">edit entire section</a>
        </span>
        <span class="cnx_label">Label: </span>            <!-- OPTIONAL -->
        <strong class="title">This is a title.</strong>   <!-- OPTIONAL -->
        &nbsp;
    </h2>
*/
        // locate the label and title iin the XML
        nodeSectionLabelXml = null;
        nodeSectionTitleXml = null;
        for (i = 0; i < nodeSectionXml.childNodes.length; i++) {
            nodeChild = nodeSectionXml.childNodes[i];
            if ( nodeChild.nodeName.toLowerCase() == 'label' ) {
                nodeSectionLabelXml = nodeChild;
            }
            else if ( nodeChild.nodeName.toLowerCase() == 'title' ) {
                nodeSectionTitleXml = nodeChild;
                // label must preceed title
                break;
            }
        }

        if ( nodeSectionLabelXml ) {
            bLabelExists = true;
            strLabel = serializeAndMassageXmlNode(nodeSectionLabelXml);
            bLabelEmpty = ( strLabel.endsWith('/>') );
        }
        else {
            bLabelExists = false;
        }

        if ( nodeSectionTitleXml ) {
            bTitleExists = true;
            strTitle = serializeAndMassageXmlNode(nodeSectionTitleXml);
            bTitleEmpty = ( strTitle.endsWith('/>') );
        }
        else {
            bTitleExists = false;
        }

        // look up the HTML markup for the label and title
        nodeSectionLabelHtml = null;
        nodeSectionTitleHtml = null;
        for (i = 0; i < nodeOldHtml.childNodes.length; i++) {
            nodeChild = nodeOldHtml.childNodes[i];
            if ( nodeChild.nodeName && nodeChild.nodeName.toLowerCase() == 'span' &&
                 nodeChild.className && nodeChild.className == 'cnx_label' ) {
                nodeSectionLabelHtml = nodeChild;
            }
            else if ( nodeChild.nodeName && nodeChild.nodeName.toLowerCase() == 'strong' &&
                      nodeChild.className && nodeChild.className == 'title' ) {
                nodeSectionTitleHtml = nodeChild;
            }
        }

        // update nodeOldHtml to reflect the change across the save.
        if ( nodeSectionTitleHtml ) {
            // when we started editing we had a nonempty title
            if ( strNewTitle == null || strNewTitle.length == 0 ) {
                // it is empty now
                if ( bLabelExists && bLabelEmpty ) {
                    // add a "<!--empty title tag-->" node???
                }
                nodeSectionTitleHtml.parentNode.removeChild(nodeSectionTitleHtml);
            }
            else {
                // FIXME: mostly the right thing to do ...
                nodeSectionTitleHtml.innerHTML = strNewTitle;
            }
        }
        else {
            // when we started editing we had an empty title
            if ( strNewTitle == null || strNewTitle.length == 0 ) {
                // and remains empty across the save.  do nothing.
            }
            else {
                // find and remove optional "<!--empty title tag-->" node???
                nodeSectionTitleHtml = document.createElement('strong');
                nodeSectionTitleHtml.className = 'title';
                // FIXME: mostly the right thing to do ...
                nodeSectionTitleHtml.innerHTML = strNewTitle;
                // insert before the last node ...
                nodeOldHtml.insertBefore(nodeSectionTitleHtml, nodeOldHtml.lastChild);
            }
        }

        // remove the edit entire section / edit section title links
        for (i=0; i<nodeOldHtml.childNodes.length; i++) {
            nodeChild = nodeOldHtml.childNodes[i];
            if ( nodeChild.nodeName.toLowerCase() == 'span' ) {
                if ( nodeChild.className == 'eipClickToEdit' ) {
                    nodeOldHtml.removeChild(nodeChild);
                    break;
                }
            }
        }

        return nodeOldHtml;
/*
if label and title do not exist or are empty
    if label and title are empty
        <!--empty title tag-->&nbsp;
    else
        &nbsp;

if label exists and title does not exist (or is empty)
    if title is empty
        <span class="cnx_label">Label</span><!--empty title tag-->&nbsp;
    else
        <span class="cnx_label">Label</span>&nbsp;

if label does not exist (or is empty) and title exists
    <strong class="title">filled title</strong>&nbsp;

if label and title exists
    <span class="cnx_label">Label: </span><strong class="title">filled title</strong>&nbsp;
*/
    };

    function handleServerEditRequestReturn() {
        // ignore if we've left the validation state or
        // this isn't the completion state
        if (gEditNodeInfo.state != STATE_VALIDATING ||
            gRequest.xhr.readyState != XHR_COMPLETED)
            return;

        var nodeOldHtml;
        var nodeNewHtml;
        var nodeEditHtml;
        var nodeOldXml;
        var strNewXml;
        var strNewXmlXPath;
        var nodeNewXml;
        var nodeSection;
        var strXPathToChangedXmlNode;

        var bServerSubmittedToOurWill = ( gRequest.xhr.status == SERVER_VALIDATION_OK_STATUS );

        if ( bServerSubmittedToOurWill ) {
            // if the server returned ok, ...

            // remember the submitted XML change, parse it, and replace the old XML node
            nodeOldXml = this.getChangedXmlNode();
            strNewXmlXPath = this.getXPathToEditedXmlNode();
            strNewXml = downloadSourceFragment(gURLs["source_fragment"], strNewXmlXPath);
            nodeNewXml = replaceXml(strNewXml, nodeOldXml);

            // parse the response and replace the editing Html with the display Html??? No!!!
            // we need context in order to xform the CNXML properly into HTML.
            // our server lacked that context (i.e. server does not know the parent of
            // the <title>). instead of using the return HTML string, we modify
            // the original HTML (that we cloned at edit start).
var strNewHtml = gRequest.xhr.responseText;
            nodeEditHtml = $('eipGhostEditContainerDiv');
            nodeOldHtml = this.getEditedHtmlNodeClone();
            nodeNewHtml = updateHtml(nodeOldHtml, this.getTitleInput().value, nodeNewXml.parentNode);
            replaceHtmlNode(nodeNewHtml, nodeEditHtml, nodeNewXml);

            setupFormsBySubtree(nodeNewHtml);
            if ( nodeNewXml && nodeNewXml.parentNode && nodeNewXml.parentNode.nodeName == 'section' ) {
                // the section name contains the edit links for the section
                // we replaced the section name with a clone we made before editting started
                // assigning to the new section name HTML node's innerHTML wipes out the
                // name value as well as the edit links for the section.
                nodeSection = findSectionNode(nodeNewHtml);
                if ( nodeSection ) {
                    addHoverSectionText(nodeSection);
                }
            }

            this.setEditedHtmlNode(nodeNewHtml); // needed for any post-add processing in derived classes

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();

            gEditNodeInfo.state = STATE_VIEWING;
            gEdited = true;

            // do WorkFlowStep cleanup here if any ...
        }
        else {
            // go back to editing state, turn preview button back on
            gEditNodeInfo.state = STATE_EDITING;
            this.getSaveButton().disabled = false;
            var strErrorMsg = "<p>The XML you submitted was invalid.</p>" +
                              "<p>Please either fix the changes you have made, or click \'Cancel\' to undo the         changes.</p>" +
                              "<p>Error message:</p>" +
                              "<textarea rows='5' readonly='yes'>" +
                              gRequest.xhr.responseText + '\n' +
                              "</textarea>";
            Ext.MessageBox.show({
               title: 'Error',
               msg: strErrorMsg,
               buttons: Ext.MessageBox.OK,
               width: 600
            });
        }
    };

    function handleServerAddRequestReturn() {
        if (gEditNodeInfo.state != STATE_VALIDATING ||
            gRequest.xhr.readyState != XHR_COMPLETED)
            return;

        var nodeOldXml;
        var strNewXml;
        var nodeNewXml;
        var nodeExistingHtml;
        var strNewHtml;
        var nodeOldHtml;
        var nodeNewHtml;
        var strNewXmlXPath;
        var nodeHtmlSection;

        var bServerSubmittedToOurWill = ( gRequest.xhr.status == SERVER_VALIDATION_OK_STATUS );

        if ( bServerSubmittedToOurWill ) {
            strNewHtml = gRequest.xhr.responseText;

            // retrieve the changed XML from the server, parse it, and replace the old XML node
            nodeOldXml = this.getChangedXmlNode();
            strNewXmlXPath = this.getXPathToEditedXmlNode();
            strNewXml = downloadSourceFragment(gURLs["source_fragment"], strNewXmlXPath);
            nodeNewXml = replaceXml(strNewXml, nodeOldXml);

            // parse the response and replace the editing Html with the display Html
            // we need context in order to xform the CNXML properly into HTML.
            // our server lacked that context (i.e. server does not know the parent of
            // the <title>). instead of using the return HTML string, we modify
            // the original HTML (that we cloned at edit start).
            nodeExistingHtml = $('eipGhostEditContainerDiv');
            nodeOldHtml = this.getEditedHtmlNodeClone();
            nodeNewHtml = updateHtml(nodeOldHtml, this.getTitleInput().value, nodeNewXml.parentNode);
            replaceHtmlNode(nodeNewHtml, nodeExistingHtml);

            setupFormsBySubtree(nodeNewHtml);
            if ( nodeNewXml.parentNode && nodeNewXml.parentNode.nodeName == 'section' ) {
                // the section name contains the hover text for the section
                // we replaced the section name with a clone we made before editting started
                // assigning to the new section name HTML node's innerHTML wipes out the
                // name value as well as the hover test for the section.
                nodeHtmlSection = findSectionNode(nodeNewHtml);
                if ( nodeHtmlSection ) {
                    addHoverSectionText(nodeHtmlSection);
                }
            }

            this.setEditedHtmlNode(nodeNewHtml); // needed for any post add processing in derived classes

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();

            gEditNodeInfo.state = STATE_VIEWING;
            gEdited = true;
        }
        else {
            gEditNodeInfo.state = STATE_EDITING;
            this.getSaveButton().disabled = false;
            var strErrorMsg = "<p>The XML you submitted was invalid.</p>" +
                              "<p>Please either fix the changes you have made, or click \'Cancel\' to undo the         changes.</p>" +
                              "<p>Error message:</p>" +
                              "<textarea rows='5' readonly='yes'>" +
                              gRequest.xhr.responseText + '\n' +
                              "</textarea>";
            Ext.MessageBox.show({
               title: 'Error',
               msg: strErrorMsg,
               buttons: Ext.MessageBox.OK,
               width: 600
            });
        }
    };

    function handleServerDeleteRequest() {
        var nodeXmlToBeDeleted;
        var nodeEditedHtml;
        var nodeHtmlContainerParent;
        var nodeOldHtml;
        var nodeNewHtml;
        var strXPath;
        var nodeXml;
        var nodeHtmlSection;
        var nodeXmlParent;
        var nodeDeleteButton;

        // ignore if we've left the validation state or
        // this isn't the completion state
        if (gEditNodeInfo.state != STATE_VALIDATING ||
            gRequest.xhr.readyState != XHR_COMPLETED) return;

        // IE doesn't understand the http response code 204, for some reason it sees the code as 1223
        if ( gRequest.xhr.status == SERVER_DELETE_OK_STATUS ||     // Mozilla status code
             gRequest.xhr.status == SERVER_VALIDATION_OK_STATUS || // IE status code
             gRequest.xhr.status == '1223')                        // no longer seen IE status code???
        {
            nodeXmlToBeDeleted  = this.getEditedXmlNode();
            nodeEditedHtml = $('eipGhostEditContainerDiv');

            // now take the saved xpath, and find the XML node.
            strXPath = this.getXPathToEditedXmlNode();
            nodeXml = getNodeByXPath(strXPath, gSource.doc);
            nodeXmlParent = nodeXml.parentNode;
            nodeXmlParent.removeChild(nodeXml);

            nodeHtmlContainerParent = nodeEditedHtml.parentNode;
            nodeOldHtml = this.getEditedHtmlNodeClone();
            nodeNewHtml = updateHtml(nodeOldHtml, null, nodeXmlParent);
            replaceHtmlNode(nodeNewHtml, nodeEditedHtml);

            // nodeXml is nodeXmlToBeDeleted???
            if ( (nodeXmlParent != null) && (nodeXmlParent.nodeName == 'section') ) {
                nodeHtmlSection = findSectionNode(nodeNewHtml);
                if ( nodeHtmlSection ) {
                    addHoverSectionText(nodeHtmlSection);
                }
            }

            //deleteHtmlAndXml(nodeHtmlToBeDeleted, nodeXmlToBeDeleted);
            gEditNodeInfo.state = STATE_VIEWING;

            $('eipMasterEditContainerDiv').hide();
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            this.fadeInBackground();
        }
        else {
            gEditNodeInfo.state = STATE_EDITING;
            nodeDeleteButton = getNodeDeleteButton();
            nodeDeleteButton.disabled = false;
            var strErrorMsg = "<p>An unexpected error accurred on the server while deleting.</p>" +
                              "<p>Click \'Cancel\'.</p>" +
                              "<p>Error message:</p>" +
                              "<textarea rows='5' readonly='yes'>" +
                              gRequest.xhr.responseText + '\n' +
                              "</textarea>";
            Ext.MessageBox.show({
               title: 'Error',
               msg: strErrorMsg,
               buttons: Ext.MessageBox.OK,
               width: 600
            });
        }
    };
};
Title_WorkFlowStep.prototype = new WorkFlowStep();


function Section_WorkFlowStep() {
    this.init = init;
    this.gotTitle = gotTitle;
    this.initializeXmlNode = initializeXmlNode;
    this.getEditedXml = getEditedXml;
    this.reviveClone = reviveClone;
    this.setupEditForm = setupEditForm;

    init();

    return this;

    function init() {
        Section_WorkFlowStep.prototype.init();
    };

    function gotTitle() {
        return true;
    };

    function initializeXmlNode(nodeXml) {
        var id ;
        var strNewXml;
        var docXml;
        var nodeRootXml;

        id = createUniqueId();
        strNewXml = '<motherofallnodes>' +
                    '<title>title</title>\n' +
                    '<para id="' + id + '">\n' +
                    'Insert paragraph text here.\n' +
                    '</para>' +
                    '</motherofallnodes>';

        // parse the new XMl with bogus tag
        docXml = parseXmlTextToDOMDocument(strNewXml);
        nodeRootXml = docXml.documentElement;

        // harvest the child of the parse via copying them destructively into nodeXml
        var bPreserveExisting = false;
        Sarissa.copyChildNodes(nodeRootXml, nodeXml, bPreserveExisting);

        strNewXml = serializeAndMassageXmlNode(nodeXml);

        return strNewXml;
    };

    function getEditedXml() {
        var strNewXml;
        var strTagContents;
        var nodeTitleInput;
        var strTitle;
        var strTitleXml;
        var strLabelCnxml;
        var reLabelCnxml;

        strTagContents = this.getTextArea().value.replace(/^\s+/,'');

        nodeTitleInput = this.getTitleInput();
        if ( nodeTitleInput ) {
            strTitle = nodeTitleInput.value;
            strTitleXml = '';
            if ( strTitle && strTitle.length > 0 ) {
                strTitleXml = ( this.getTitleOpenTag() ? this.getTitleOpenTag() : '<title>' );
                strTitleXml += strTitle;
                strTitleXml += '</title>';
            }
            if ( strTitleXml.length > 0 ) {
                // must come after label (which may or may not be hiding out in strTagContents),
                // else must be first thing
                strXml = addNamespacesToTagText(this.getOpenTag());
                strXml += strTagContents;
                strXml += this.getCloseTag();
                strLabelCnxml = this.getEditedLabel(strXml);
                if ( strLabelCnxml && strLabelCnxml.length > 0 ) {
                    reLabelCnxml = escapeRegularExpression(strLabelCnxml);
                    strTagContents = strTagContents.replace(reLabelCnxml, strLabelCnxml + strTitleXml);
                }
                else {
                    strTagContents = strTitleXml + strTagContents;
                }
            }
        }

        strNewXml = addNamespacesToTagText(this.getOpenTag());
        strNewXml += strTagContents;
        strNewXml += this.getCloseTag();

        return strNewXml;
    };

    function reviveClone(nodeHtmlClone) {
        var nodeNewHtml;
        nodeNewHtml = recreateHtml(nodeHtmlClone);
        reestablishSectionCallbacks(nodeNewHtml);
        recreateInserts(nodeNewHtml);
        return nodeNewHtml;
    };

    function setupEditForm(strXml) {
        var oXmlParts;
        var oTitleXmlParts;
        var strContents;
        var nodeChild;
        var nodeHelpMessage;
        var nodeOpeningTag;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeNameDiv;
        var nodeClosingTagText;
        var nodeLabelText;
        var nodeCancelButton;
        var nodeDeleteButton;
        var strSectionSansTitle;
        var nodeHtmlClone;

        oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.setOpenTag(oXmlParts.strOpenTag);
        strContents = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);

        oTitleXmlParts = oXmlParts.oTitleXmlParts;
        if ( oTitleXmlParts && oTitleXmlParts.strOpenTag ) {
            this.setTitleOpenTag(oTitleXmlParts.strOpenTag);
        }
        strSectionSansTitle = strContents;

        // <DIV id='eipEditContainer'>
        this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
        $('eipMasterEditContainerDiv').innerHTML = ' ';

        var nodePopups = document.createElement('div');
        nodePopups.className = 'eipPopUps';

        //   <DIV class="eipHelpMessage"><A></A></DIV>
        nodeHelpMessage = document.createElement('div');
        nodeHelpMessage.className = 'eipHelpMessage';
        nodeHelpLink = document.createElement('a');
        nodeHelpLink.onclick = function(event){openHelp(g_oWorkFlowStep.getEditedXmlTag());};
        nodeHelpText = document.createTextNode('Help editing <' + this.getEditedXmlTag() + '>');
        nodeHelpLink.appendChild(nodeHelpText);
        nodeHelpMessage.appendChild(nodeHelpLink);
        nodePopups.appendChild(nodeHelpMessage);
        
        // Add launch button for MathEditor
        MathEditor.addLaunchButton(nodePopups);
        this.getHtmlEditContainerDiv().appendChild(nodePopups);

        // <DIV class="eipOpeningTagLabel"> opening tag </DIV>
        nodeOpeningTag = document.createElement('div');
        nodeOpeningTag.className = 'eipOpeningTagLabel';
        nodeOpeningTagText = document.createTextNode(this.getOpenTag());
        nodeOpeningTag.appendChild(nodeOpeningTagText);
        this.getHtmlEditContainerDiv().appendChild(nodeOpeningTag);

        //   <DIV class="eipTitleDiv">Title (optional): <INPUT type="text" size="40" /></DIV>
        nodeNameDiv = document.createElement('div');
        nodeNameDiv.className = 'eipTitleDiv';
        nodeLabelText = document.createTextNode('Title (optional): ');
        nodeNameDiv.appendChild(nodeLabelText);
        //     <input type="text" class="eipTitle" />
        this.setTitleInput(document.createElement('input'));
        this.getTitleInput().setAttribute('type', 'text');
        this.getTitleInput().setAttribute('size', '40');
        this.getTitleInput().className = 'eipTitle';
        if ( oTitleXmlParts ) {
            strTitle = ( oTitleXmlParts.strContents ? oTitleXmlParts.strContents : '' );
            this.getTitleInput().setAttribute('value', strTitle.replace(/\n/g, " "));
        }
        nodeNameDiv.appendChild(this.getTitleInput());
        //   </DIV>
        this.getHtmlEditContainerDiv().appendChild(nodeNameDiv);

        // <TEXTAREA class="eipXMLEditor" rows="7"/> stuff to edit </TEXTAREA>
        this.setTextArea(document.createElement('textarea'));
        this.getTextArea().className = 'eipXMLEditor';
        this.getTextArea().setAttribute('rows', g_strTextEditBoxSize);
        if ( strContents ) {
            this.getTextArea().value = strSectionSansTitle;
        }
        this.getHtmlEditContainerDiv().appendChild(this.getTextArea());

        // <DIV class="eipClosingTagLabel"> closing tag </DIV>
        m_nodeClosingTag = document.createElement('div');
        m_nodeClosingTag.className = 'eipOpeningTagLabel';
        nodeClosingTagText = document.createTextNode(this.getCloseTag());
        m_nodeClosingTag.appendChild(nodeClosingTagText);
        this.getHtmlEditContainerDiv().appendChild(m_nodeClosingTag);

        // <button class="eipSaveButton" />
        this.setSaveButton(document.createElement('button'));
        this.getSaveButton().className = 'eipSaveButton';
        nodeLabelText = document.createTextNode('Save');
        this.getSaveButton().setAttribute('alt', 'Save');
        Event.observe(this.getSaveButton(), 'click',
                      this.onSave.bindAsEventListener(this));
        this.getSaveButton().appendChild(nodeLabelText);
        this.getSaveButton().disabled = false;
        this.getHtmlEditContainerDiv().appendChild(this.getSaveButton());

        // <button class="eipCancelButton" />
        nodeCancelButton = document.createElement('button');
        nodeCancelButton.className = 'eipCancelButton';
        nodeCancelButton.setAttribute('alt', 'Cancel');
        nodeLabelText = document.createTextNode('Cancel');
        nodeCancelButton.appendChild(nodeLabelText);
        Event.observe(nodeCancelButton, 'click',
                      this.onCancel.bindAsEventListener(this));
        this.getHtmlEditContainerDiv().appendChild(nodeCancelButton);

        // before we remove the to-be-edited HTML node from its DOM
        // determine if the node can be deleted (i.e. it is not an only child)
        // conditionally disable delete button later
        var bIsNodeDeletable;
        bIsNodeDeletable = isNodeDeletable(this.getEditedHtmlNode());
        var bEditingExistingNode = this.getEditingExistingNode();

        if ( bEditingExistingNode && bIsNodeDeletable ) {
            nodeDeleteButton = document.createElement('button');
            nodeDeleteButton.className = 'eipDeleteButton';
            nodeDeleteButton.setAttribute('alt', 'Delete');
            nodeLabelText = document.createTextNode('Delete');
            nodeDeleteButton.appendChild(nodeLabelText);
            Event.observe(nodeDeleteButton, 'click',
                          this.onDelete.bindAsEventListener(this));
            this.getHtmlEditContainerDiv().appendChild(nodeDeleteButton);
        }
        //   </div>

        // before we clone the node, we must first remove the event callbacks
        // recursively from the HTML tree rooted by the edited html node.
        stopObserving(this.getEditedHtmlNode());

        // clone the edited html node.
        nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
        this.setEditedHtmlNodeClone(nodeHtmlClone);
    };
};
Section_WorkFlowStep.prototype = new WorkFlowStep();


function Code_WorkFlowStep() {
    this.init = init;
    this.gotTitle = gotTitle;
    this.gotCaption = gotCaption;
    this.initializeXmlNode = initializeXmlNode;

    init();

    return this;

    function init() {
        Code_WorkFlowStep.prototype.init();
    };

    function gotTitle() {
        return true;
    };

    function gotCaption() {
        return true;
    };

    function initializeXmlNode(nodeXml) {
        var strDisplay;
        var strNewXml;

        strDisplay = nodeXml.getAttribute('display');
        if ( strDisplay == null || strDisplay != 'block' ) {
            nodeXml.setAttribute('display', 'block');
        }

        strNewXml = serializeAndMassageXmlNode(nodeXml);

        return strNewXml;
    };
};
Code_WorkFlowStep.prototype = new WorkFlowStep();


function List_WorkFlowStep() {
    var m_strClassAttribute;
    var m_strInitialListType;
    var m_strInitialListStyle;

    this.init = init;
    this.gotTitle = gotTitle;
    this.initializeXmlNode = initializeXmlNode;
    this.getEditedXml = getEditedXml;
    this.crackXml = crackXml;
    this.setupEditForm = setupEditForm;

    init();

    return this;

    function init() {
        List_WorkFlowStep.prototype.init();
        m_strClassAttribute = '';
        m_strInitialListType = null;
        m_strInitialListStyle = null;
    };

    function gotTitle() {
        return true;
    };

    function initializeXmlNode(nodeXml) {
        var strXml;
        var strNewXml;
        var strOpenTag;
        var strContents;
        var strCloseTag;
        var docXml;
        var nodeRootXml;
        var nodeNewXml;

        strXml = serializeAndMassageXmlNode(nodeXml);

        var oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.getOpenTag(oXmlParts.strOpenTag);
        strContents   = oXmlParts.strContents;
        this.getCloseTag(oXmlParts.strCloseTag);

        strNewXml = '<motherofallnodes>' +
                    '<item>Your first item here</item>\n' +
                    '<item>Your second item here</item>\n' +
                    '<item>Etc.</item>' +
                    '</motherofallnodes>';

        // parse the new XMl with bogus tag
        docXml = parseXmlTextToDOMDocument(strNewXml);
        nodeRootXml = docXml.documentElement;

        // harvest the child of the parse via copying them destructively into nodeXml
        var bPreserveExisting = false;
        Sarissa.copyChildNodes(nodeRootXml, nodeXml, bPreserveExisting);

        strNewXml = serializeAndMassageXmlNode(nodeXml);

        return strNewXml;
    };

    function getEditedXml() {
        var strListType;
        var strListStyle;
        var strClassName;
        var strClassAttribute;
        var vClassParts;
        var iSelectedIndex;
        var strClassAttribute;
        var strOpenTag;
        var strTagContents;
        var nodeTitleInput;
        var strTitle;
        var strTitleXml;
        var strLabelCnxml;
        var reLabelCnxml;
        var strXml;

        strClassName = m_strClassAttribute;

        // Note: we make a good have effort to keep @list-type and @{bullet,number}-style the same
        // if they do not change across a save.  both attributes have default values, which adds to
        // the complexity, since the easiest thing for us to do is replaced the implicit atribute
        // with an explicit attribute.   Here is our rules of the road:
        // Rule !: no change to default style or type => EIP won't change it across a save
        // Rule 2: change either style or type => EIP will not respect initial null/default values
        // We miss <list bullet-style='open-circle'> which is pretty twisted and not likely to occur in the wild.

        if ( $('eipListTypeBulletedRadioButton').checked == true ) {
            strListType = "list-type=\"bulleted\"";
            iSelectedIndex = $('eipListTypeBulletedSelect').selectedIndex;
            strListStyle = ( iSelectedIndex == 0 ? "bullet-style=\"bullet\"" :
                             iSelectedIndex == 1 ? "bullet-style=\"open-circle\"" :
                             iSelectedIndex == 2 ? "bullet-style=\"pilcrow\"" :
                             iSelectedIndex == 3 ? "bullet-style=\"rpilcrow\"" :
                             iSelectedIndex == 4 ? "bullet-style=\"asterisk\"" :
                             iSelectedIndex == 5 ? "bullet-style=\"dash\"" :
                             iSelectedIndex == 6 ? "bullet-style=\"section\"" :
                             iSelectedIndex == 7 ? "bullet-style=\"none\"" :
                             iSelectedIndex == 8 ? "bullet-style=\"" + $('eipListTypeBulletedLiteralInput').value + "\"":
                                                   "bullet-style=\"bullet\"" );
            // respect the default type and style inputs
            if ( m_strInitialListType == null ) {
                if ( m_strInitialListStyle == null && iSelectedIndex == 0 ) {
                    strListType = '';
                    strListStyle = '';
                }
            }
            if ( m_strInitialListType == 'bulleted' ) {
                if ( m_strInitialListStyle == null && iSelectedIndex == 0 ) {
                    strListStyle = '';
                }
            }
        }

        else if ( $('eipListTypeEnumeratedRadioButton').checked == true ) {
            strListType = "list-type=\"enumerated\"";
            iSelectedIndex = $('eipListTypeEnumeratedSelect').selectedIndex;
            strListStyle = ( iSelectedIndex == 0 ? "number-style=\"arabic\"" :
                             iSelectedIndex == 1 ? "number-style=\"upper-alpha\"" :
                             iSelectedIndex == 2 ? "number-style=\"lower-alpha\"" :
                             iSelectedIndex == 3 ? "number-style=\"upper-roman\"" :
                             iSelectedIndex == 4 ? "number-style=\"lower-roman\"" :
                                                   "number-style=\"arabic\"" );
            // respect the default style input
            if ( m_strInitialListType == 'enumerated' ) {
                if ( m_strInitialListStyle == null && iSelectedIndex == 0 ) {
                    strListStyle = '';
                }
            }
        }

        else if ( $('eipListTypeStepEnumeratedRadioButton').checked == true ) {
            strListType = "list-type=\"enumerated\"";
            if ( strClassName != null && strClassName.length > 0 ) {
                vClassParts = strClassName.split(" ");
                vClassParts.splice(0, 0, 'stepwise');
                strClassName = vClassParts.join(" ");
            }
            else {
                strClassName = 'stepwise';
            }
            iSelectedIndex = $('eipListTypeStepEnumeratedSelect').selectedIndex;
            strListStyle = ( iSelectedIndex == 0 ? "number-style=\"arabic\"" :
                             iSelectedIndex == 1 ? "number-style=\"upper-alpha\"" :
                             iSelectedIndex == 2 ? "number-style=\"lower-alpha\"" :
                             iSelectedIndex == 3 ? "number-style=\"upper-roman\"" :
                             iSelectedIndex == 4 ? "number-style=\"lower-roman\"" :
                                                   "number-style=\"arabic\"" );
            // respect the default style input
            if ( m_strInitialListType == 'enumerated' ) {
                if ( m_strInitialListStyle == null && iSelectedIndex == 0 ) {
                    strListStyle = '';
                }
            }
        }

        else if ( $('eipListTypeLabeledItemRadioButton').checked == true ) {
            strListType = "list-type=\"labeled-item\"";
            strListStyle = '';
        }

        if ( strClassName && strClassName.length > 0 ) {
            strClassAttribute = "class=\"" + strClassName + "\"";
        }
        else {
            strClassAttribute = '';
        }

        strOpenTag = this.getOpenTag().replace(/>$/,
                                               " " +
                                               strListType + " " +
                                               strListStyle + " " +
                                               strClassAttribute + ">");

        // lose the leading whitespace
        strTagContents = this.getTextArea().value.replace(/^\s+/,'');

        // add <title> to strTagContents
        nodeTitleInput = this.getTitleInput();
        if ( nodeTitleInput ) {
            strTitle = nodeTitleInput.value;
            strTitleXml = '';
            if ( strTitle && strTitle.length > 0 ) {
                strTitleXml = ( this.getTitleOpenTag() ? this.getTitleOpenTag() : '<title>' );
                strTitleXml += strTitle;
                strTitleXml += '</title>';
            }
            if ( strTitleXml.length > 0 ) {
                // title must come after label (which may or may not be hiding out in strTagContents),
                // else must be first thing
                strXml = addNamespacesToTagText(this.getOpenTag());
                strXml += strTagContents;
                strXml += this.getCloseTag();
                strLabelCnxml = this.getEditedLabel(strXml);
                if ( strLabelCnxml && strLabelCnxml.length > 0 ) {
                    reLabelCnxml = escapeRegularExpression(strLabelCnxml);
                    strTagContents = strTagContents.replace(reLabelCnxml, strLabelCnxml + strTitleXml);
                }
                else {
                    strTagContents = strTitleXml + strTagContents;
                }
            }
        }

        strXml = addNamespacesToTagText(strOpenTag);
        strXml += strTagContents;
        strXml += this.getCloseTag();

        return strXml;
    };

    function crackXml(strXml, nodeXml) {
        var oXmlParts;
        var strClassName;
        var iStepwiseIndex;
        var bStepWise;
        var vClassParts;
        var i;
        var re;

        oXmlParts = List_WorkFlowStep.prototype.crackXml(strXml, nodeXml);

        strClassName = nodeXml.getAttribute('class');
        if ( strClassName ) {
            // remove class from the from oXmlParts.strOpenTag
            re = new RegExp("\\sclass=['\"]" + strClassName + "['\"]");
            oXmlParts.strOpenTag = oXmlParts.strOpenTag.replace(re, "");
        }
        else {
            strClassName = '';
        }

        // set oXmlParts.strListType
        if ( nodeXml.getAttribute('list-type') != null ) {
            oXmlParts.strListType = nodeXml.getAttribute('list-type');
        }
        else {
            oXmlParts.strListType = 'bulleted';
        }

        // set oXmlParts.strListStyle
        re = new RegExp("\\slist-type=['\"]" + oXmlParts.strListType + "['\"]");
        oXmlParts.strOpenTag = oXmlParts.strOpenTag.replace(re, "");
        if      ( oXmlParts.strListType == 'bulleted' || oXmlParts.strListType == null ) {
            if ( nodeXml.getAttribute('bullet-style') ) {
                oXmlParts.strListStyle = nodeXml.getAttribute('bullet-style');
                re = new RegExp("\\sbullet-style=['\"]" + oXmlParts.strListStyle + "['\"]");
                oXmlParts.strOpenTag = oXmlParts.strOpenTag.replace(re, "");
            }
            else {
                oXmlParts.strListStyle = null;
            }
        }
        else if ( oXmlParts.strListType == 'enumerated' ) {
            iStepwiseIndex = ( strClassName ? strClassName.indexOf('stepwise') : -1 );
            bStepWise = ( iStepwiseIndex != -1 );
            if ( bStepWise ) {
                oXmlParts.strListType = 'step-enumerated';
                // remove 'stepwise' from strClassName
                vClassParts = strClassName.split(" ");
                for (i=0; i<vClassParts.length; i++) {
                    if ( vClassParts[i] == 'stepwise' ) {
                        vClassParts.splice(i, 1);
                        strClassName = vClassParts.join(" ");
                        break;
                    }
                }
            }
            if ( nodeXml.getAttribute('number-style') ) {
                oXmlParts.strListStyle = nodeXml.getAttribute('number-style');
                re = new RegExp("\\snumber-style=['\"]" + oXmlParts.strListStyle + "['\"]");
                oXmlParts.strOpenTag = oXmlParts.strOpenTag.replace(re, "");
            }
            else {
                oXmlParts.strListStyle = null;
            }
        }
        else if ( oXmlParts.strListType == 'labeled-item' ) {
            oXmlParts.strListStyle = null;
        }

        oXmlParts.strClassName = strClassName;

        return oXmlParts;
    };

    function initializeSelectsAndRadioButtons(strType, strStyle) {
        // first set the selects ...
        if      ( strType == 'bulleted' ) {
            $('eipListTypeBulletedSelect').selectedIndex =
                ( strStyle == null            ? 0 :
                  strStyle == 'bullet'        ? 0 :
                  strStyle == 'open-circle'   ? 1 :
                  strStyle == 'pilcrow'       ? 2 :
                  strStyle == 'rpilcrow'      ? 3 :
                  strStyle == 'asterisk'      ? 4 :
                  strStyle == 'dash'          ? 5 :
                  strStyle == 'section'       ? 6 :
                  strStyle == 'none'          ? 7 : 8 );
            // selectedIndex == 8 ids the user-defined option and
            // strStyle will contain a string literal to use as the "bullet".
            if ( $('eipListTypeBulletedSelect').selectedIndex == 8 ) {
                $('eipListTypeBulletedLiteralInput').value = strStyle;
                $('eipListTypeBulletedLiteralInput').show();
            }
            else {
                $('eipListTypeBulletedLiteralInput').hide();
            }
        }
        else if ( strType == 'enumerated' ) {
            $('eipListTypeEnumeratedSelect').selectedIndex =
                ( strStyle == null          ? 0 :
                  strStyle == 'arabic'      ? 0 :
                  strStyle == 'upper-alpha' ? 1 :
                  strStyle == 'lower-alpha' ? 2 :
                  strStyle == 'upper-roman' ? 3 :
                  strStyle == 'lower-roman' ? 4 : 0 );
            $('eipListTypeBulletedLiteralInput').hide();
        }
        else if ( strType == 'step-enumerated' ) {
            $('eipListTypeStepEnumeratedSelect').selectedIndex = 
                ( strStyle == null          ? 0 :
                  strStyle == 'arabic'      ? 0 :
                  strStyle == 'upper-alpha' ? 1 :
                  strStyle == 'lower-alpha' ? 2 :
                  strStyle == 'upper-roman' ? 3 :
                  strStyle == 'lower-roman' ? 4 : 0 );
            $('eipListTypeBulletedLiteralInput').hide();
        }
        else if ( strType == 'labeled-item' ) {
            // no select
            $('eipListTypeBulletedLiteralInput').hide();
        }

        // ... and then set the radio button which will drive bahavior
        if      ( strType == 'bulleted' ) {
            $('eipListTypeBulletedRadioButton').click();
        }
        else if ( strType == 'enumerated' ) {
            $('eipListTypeEnumeratedRadioButton').click();
        }
        else if ( strType == 'step-enumerated' ) {
            $('eipListTypeStepEnumeratedRadioButton').click();
        }
        else if ( strType == 'labeled-item' ) {
            $('eipListTypeLabeledItemRadioButton').click();
        }
    };

    function handleClick(event, strRadioButtonId) {
        var nodeRadioButton;
        var bRadioButtonChecked;
        nodeRadioButton = $(strRadioButtonId);
        bRadioButtonChecked = ( nodeRadioButton.checked == true );
        if      ( strRadioButtonId == 'eipListTypeBulletedRadioButton' ) {
            $('eipListTypeBulletedSelect').disabled = false;
            $('eipListTypeBulletedSelect').className = '';
            $('eipListTypeBulletedLiteralInput').disabled = false;
            $('eipListTypeBulletedLiteralInput').className = '';
            $('eipListTypeEnumeratedSelect').disabled = true;
            $('eipListTypeEnumeratedSelect').className = 'eipDisabled';
            $('eipListTypeStepEnumeratedSelect').disabled = true;
            $('eipListTypeStepEnumeratedSelect').className = 'eipDisabled';
        }
        else if ( strRadioButtonId == 'eipListTypeEnumeratedRadioButton' ) {
            $('eipListTypeBulletedSelect').disabled = true;
            $('eipListTypeBulletedSelect').className = 'eipDisabled';
            $('eipListTypeBulletedLiteralInput').disabled = true;
            $('eipListTypeBulletedLiteralInput').className = 'eipDisabled';
            $('eipListTypeEnumeratedSelect').disabled = false;
            $('eipListTypeEnumeratedSelect').className = '';
            $('eipListTypeStepEnumeratedSelect').disabled = true;
            $('eipListTypeStepEnumeratedSelect').className = 'eipDisabled';
        }
        else if ( strRadioButtonId == 'eipListTypeStepEnumeratedRadioButton' ) {
            $('eipListTypeBulletedSelect').disabled = true;
            $('eipListTypeBulletedSelect').className = 'eipDisabled';
            $('eipListTypeBulletedLiteralInput').disabled = true;
            $('eipListTypeBulletedLiteralInput').className = 'eipDisabled';
            $('eipListTypeEnumeratedSelect').disabled = true;
            $('eipListTypeEnumeratedSelect').className = 'eipDisabled';
            $('eipListTypeStepEnumeratedSelect').disabled = false;
            $('eipListTypeStepEnumeratedSelect').className = '';
        }
        else if ( strRadioButtonId == 'eipListTypeLabeledItemRadioButton' ) {
            $('eipListTypeBulletedSelect').disabled = true;
            $('eipListTypeBulletedSelect').className = 'eipDisabled';
            $('eipListTypeBulletedLiteralInput').disabled = true;
            $('eipListTypeBulletedLiteralInput').className = 'eipDisabled';
            $('eipListTypeEnumeratedSelect').disabled = true;
            $('eipListTypeEnumeratedSelect').className = 'eipDisabled';
            $('eipListTypeStepEnumeratedSelect').disabled = true;
            $('eipListTypeStepEnumeratedSelect').className = 'eipDisabled';
        }
    };

    function handleUserDefinedBulletLiteral(event) {
        // IDs of interest:
        //   eipListTypeBulletedSelect -- <select> containing the user defined option
        //   eipUserDefinedBulletLiteralOption -- user defined <option>, element whicj triggers this callback
        //   eipListTypeBulletedLiteralInput -- input for the user defined bullet literal
        if ( $('eipListTypeBulletedSelect').selectedIndex == 8 ) {
            $('eipListTypeBulletedLiteralInput').show();
        }
        else {
            $('eipListTypeBulletedLiteralInput').hide();
        }
    };

    function setupEditForm(strXml) {
        var oXmlParts;
        var oTitleXmlParts;
        var strOpenTag;
        var strType;
        var strTypeValue;
        var strContents;
        var strTitle;
        var nodeHelpMessage;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeOpeningTag;
        var nodeOpeningTagText;
        var strOpeningTag;
        var nodeTitleEdit;
        var nodeText;
        var nodeListType;
        var bUserDefinedListType;
        var nodeClosingTagText;
        var nodeLabelText;
        var nodeCancelButton;
        var nodeHtmlClone;

        m_strInitialListType = ( this.getEditedXmlNode().getAttribute('list-type')
                                   ? this.getEditedXmlNode().getAttribute('list-type')
                                   : null );
        m_strInitialListStyle = ( this.getEditedXmlNode().getAttribute('bullet-style')
                                    ? this.getEditedXmlNode().getAttribute('bullet-style')
                                    : ( this.getEditedXmlNode().getAttribute('number-style')
                                          ? this.getEditedXmlNode().getAttribute('number-style')
                                          : null ) );

        oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        m_strClassAttribute = oXmlParts.strClassName; //need to save it since it is not part of the UI state

        this.setOpenTag(oXmlParts.strOpenTag);
        strContents = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);
        oTitleXmlParts = oXmlParts.oTitleXmlParts;
        if ( oTitleXmlParts && oTitleXmlParts.strOpenTag ) {
            this.setTitleOpenTag(oTitleXmlParts.strOpenTag);
        }

        // <DIV class='eipEditContainer'>
        this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
        $('eipMasterEditContainerDiv').innerHTML = ' ';

        this.getHtmlEditContainerDiv().className = 'eipEditContainer';

        var nodePopups = document.createElement('div');
        nodePopups.className = 'eipPopUps';

        //   <DIV class="eipHelpMessage"><A></A></DIV>
        nodeHelpMessage = document.createElement('div');
        nodeHelpMessage.className = 'eipHelpMessage';
        nodeHelpLink = document.createElement('a');
        nodeHelpLink.onclick = function(event){openHelp(g_oWorkFlowStep.getEditedXmlTag());};
        nodeHelpText = document.createTextNode('Help editing <' + this.getEditedXmlTag() + '>');
        nodeHelpLink.appendChild(nodeHelpText);
        nodeHelpMessage.appendChild(nodeHelpLink);
        nodePopups.appendChild(nodeHelpMessage);
        
        // Add launch button for MathEditor
        MathEditor.addLaunchButton(nodePopups);
        this.getHtmlEditContainerDiv().appendChild(nodePopups);

        // <DIV class="eipOpeningTagLabel"> opening tag </DIV>
        nodeOpeningTag = document.createElement('div');
        nodeOpeningTag.className = 'eipOpeningTagLabel';
        strOpeningTag = this.getOpenTag();
        nodeOpeningTagText = document.createTextNode(strOpeningTag);
        nodeOpeningTag.appendChild(nodeOpeningTagText);
        this.getHtmlEditContainerDiv().appendChild(nodeOpeningTag);

        nodeListType = document.createElement('div');
        nodeListType.className = 'eipListType';
        nodeListType.innerHTML = "" +
          "<table>\n" +
          "  <tbody>\n" +
          "    <tr>\n" +
          "      <td rowspan=\"4\">Type:</td>\n" +
          "      <td onclick=\"javascript:$('eipListTypeBulletedRadioButton').click();\">\n" +
          "        <input name=\"eipListRadioButtons\" type=\"radio\" value=\"bulleted\"\n" +
          "               class=\"eipListTypeRadioButtons\" id=\"eipListTypeBulletedRadioButton\">\n" +
          "        <span>Bulleted</span>\n" +
          "        <select id=\"eipListTypeBulletedSelect\">\n" +
          "          <option value=\"bullet\">Bullet [&#149;]</option>\n" +
          "          <option value=\"open-circle\">Open circle [&#9675;]</option>\n" +
          "          <option value=\"pilcrow\">Pilcrow [&#182;]</option>\n" +
          "          <option value=\"rpilcrow\">Reverse pilcrow [&#8267;]</option>\n" +
          "          <option value=\"asterisk\">Asterisk [*]</option>\n" +
          "          <option value=\"dash\">Dash [&#150;]</option>\n" +
          "          <option value=\"section\">Section [&#167;]</option>\n" +
          "          <option value=\"none\">(no mark)</option>\n" +
          "          <option id=\"eipUserDefinedBulletLiteralOption\" value=\"user-provided\">Literal text ...</option>\n" +
          "        </select>\n" +
          "        <input id=\"eipListTypeBulletedLiteralInput\" type=\"text\" size=\"3\"/>\n" +
          "      </td>\n" +
          "    </tr>\n" +
          "    <tr>\n" +
          "      <td onclick=\"javascript:$('eipListTypeEnumeratedRadioButton').click();\">\n" +
          "        <input name=\"eipListRadioButtons\" type=\"radio\" value=\"enumerated\"\n" +
          "               class=\"eipListTypeRadioButtons\" id=\"eipListTypeEnumeratedRadioButton\">\n" +
          "        <span>Enumerated</span>\n" +
          "        <select id=\"eipListTypeEnumeratedSelect\">\n" +
          "          <option value=\"arabic\">Arabic [1, 2, 3, ...]</option>\n" +
          "          <option value=\"upper-alpha\">Upper Alpha [A, B, C, ...]</option>\n" +
          "          <option value=\"lower-alpha\">Lower Alpha [a, b, c, ...]</option>\n" +
          "          <option value=\"upper-roman\">Upper Roman [I, II, III, ...]</option>\n" +
          "          <option value=\"lower-roman\">Lower Roman [i, ii, iii, ...]</option>\n" +
          "        </select>\n" +
          "      </td>\n" +
          "    </tr>\n" +
          "    <tr>\n" +
          "      <td onclick=\"javascript:$('eipListTypeStepEnumeratedRadioButton').click();\">\n" +
          "        <input name=\"eipListRadioButtons\" type=\"radio\" value=\"stepwise\" onchange=\"\"\n" +
          "               class=\"eipListTypeRadioButtons\" id=\"eipListTypeStepEnumeratedRadioButton\">\n" +
          "        <span>Stepwise</span>\n" +
          "        <select id=\"eipListTypeStepEnumeratedSelect\">\n" +
          "          <option value=\"arabic\">Arabic [Step 1, Step 2, Step 3, ...]</option>\n" +
          "          <option value=\"upper-alpha\">Upper Alpha [Step A, Step B, Step C, ...]</option>\n" +
          "          <option value=\"lower-alpha\">Lower Alpha [Step a, Step b, Step c, ...]</option>\n" +
          "          <option value=\"upper-roman\">Upper Roman [Step I, Step II, Step III, ...]</option>\n" +
          "          <option value=\"lower-roman\">Lower Roman [Step i, Step ii, Step iii, ...]</option>\n" +
          "        </select>\n" +
          "      </td>\n" +
          "    </tr>\n" +
          "    <tr>\n" +
          "      <td onclick=\"javascript:$('eipListTypeLabeledItemRadioButton').click();\">\n" +
          "        <input name=\"eipListRadioButtons\" type=\"radio\" value=\"labeled-item\" onchange=\"\"\n" +
          "               class=\"eipListTypeRadioButtons\" id=\"eipListTypeLabeledItemRadioButton\">\n" +
          "        <span>Labeled Item</span>\n" +
          "      </td>\n" +
          "    </tr>\n" +
          "  </tbody>\n" +
          "</table>";
        this.getHtmlEditContainerDiv().appendChild(nodeListType);
        Event.observe($('eipListTypeBulletedRadioButton'), 'click',
                        handleClick.bindAsEventListener(this, 'eipListTypeBulletedRadioButton'));
        Event.observe($('eipListTypeEnumeratedRadioButton'), 'click',
                        handleClick.bindAsEventListener(this, 'eipListTypeEnumeratedRadioButton'));
        Event.observe($('eipListTypeStepEnumeratedRadioButton'), 'click',
                        handleClick.bindAsEventListener(this, 'eipListTypeStepEnumeratedRadioButton'));
        Event.observe($('eipListTypeLabeledItemRadioButton'), 'click',
                        handleClick.bindAsEventListener(this, 'eipListTypeLabeledItemRadioButton'));
        Event.observe($('eipListTypeBulletedSelect'), 'change',
                        handleUserDefinedBulletLiteral.bindAsEventListener(this));
        initializeSelectsAndRadioButtons(oXmlParts.strListType, oXmlParts.strListStyle);

        //   <DIV class="eipTitleDiv">Title (optional):<INPUT type="text" size="40" /></DIV>
        if ( this.gotTitle(this.getEditedXmlTag()) ) {
            if ( oTitleXmlParts ) {
                strTitle = ( oTitleXmlParts.strContents ? oTitleXmlParts.strContents : '' );
            }
            else {
                strTitle = '';
            }
            nodeTitleEdit = document.createElement('div');
            nodeTitleEdit.className = 'eipTitleDiv';
            nodeText = document.createTextNode('Title (optional):');
            nodeTitleEdit.appendChild(nodeText);
            this.setTitleInput(document.createElement('input'));
            this.getTitleInput().setAttribute('type', 'text');
            this.getTitleInput().setAttribute('size', '40');
            this.getTitleInput().value = strTitle.replace(/\n/g, " ");
            nodeTitleEdit.appendChild(this.getTitleInput());
            this.getHtmlEditContainerDiv().appendChild(nodeTitleEdit);
        }

        // <TEXTAREA class="eipXMLEditor" rows="7"/> stuff to edit </TEXTAREA>
        this.setTextArea(document.createElement('textarea'));
        this.getTextArea().className = 'eipXMLEditor';
        this.getTextArea().setAttribute('rows', g_strTextEditBoxSize);
        if ( strContents ) {
            this.getTextArea().value = strContents;
        }
        this.getHtmlEditContainerDiv().appendChild(this.getTextArea());

        // <DIV class="eipClosingTagLabel"> closing tag </DIV>
        m_nodeClosingTag = document.createElement('div');
        m_nodeClosingTag.className = 'eipOpeningTagLabel';
        nodeClosingTagText = document.createTextNode(this.getCloseTag());
        m_nodeClosingTag.appendChild(nodeClosingTagText);
        this.getHtmlEditContainerDiv().appendChild(m_nodeClosingTag);

        // <BUTTON class="eipSaveButton" alt="Save">Save  </BUTTON>
        this.setSaveButton(document.createElement('button'));
        this.getSaveButton().className = 'eipSaveButton';
        nodeLabelText = document.createTextNode('Save');
        this.getSaveButton().setAttribute('alt', 'Save');
        Event.observe(this.getSaveButton(), 'click',
                      this.onSave.bindAsEventListener(this));
        this.getSaveButton().appendChild(nodeLabelText);
        this.getSaveButton().disabled = false;
        this.getHtmlEditContainerDiv().appendChild(this.getSaveButton());

        // <BUTTON alt="Cancel" class="eipCancelButton">Cancel  </BUTTON>
        nodeCancelButton = document.createElement('button');
        nodeCancelButton.className = 'eipCancelButton';
        nodeCancelButton.setAttribute('alt', "Cancel");
        nodeLabelText = document.createTextNode('Cancel');
        nodeCancelButton.appendChild(nodeLabelText);
        Event.observe(nodeCancelButton, 'click',
                      this.onCancel.bindAsEventListener(this));
        this.getHtmlEditContainerDiv().appendChild(nodeCancelButton);

        // <BUTTON alt="Delete" class="eipDeleteButton">Delete  </BUTTON>
        var bIsNodeDeletable;
        bIsNodeDeletable = isNodeDeletable(this.getEditedHtmlNode());
        var bEditingExistingNode = this.getEditingExistingNode();

        if ( bEditingExistingNode && bIsNodeDeletable ) {
            this.setNodeDeleteButton(document.createElement('button'));
            this.getNodeDeleteButton().className = 'eipDeleteButton';
            this.getNodeDeleteButton().setAttribute('alt', 'Delete');
            nodeLabelText = document.createTextNode('Delete');
            this.getNodeDeleteButton().appendChild(nodeLabelText);
            Event.observe(this.getNodeDeleteButton(), 'click',
                          this.onDelete.bindAsEventListener(this));
            this.getNodeDeleteButton().disabled = false;
            this.getHtmlEditContainerDiv().appendChild(this.getNodeDeleteButton());
        }

        // </div>

        // before we clone the node, we must first remove the event callbacks
        // recursively from the HTML tree rooted by the edited html node.
        stopObserving(this.getEditedHtmlNode());

        // clone the edited html node.
        nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
        this.setEditedHtmlNodeClone(nodeHtmlClone);
    };
};
List_WorkFlowStep.prototype = new WorkFlowStep();


function Exercise_WorkFlowStep() {
    this.init = init;
    this.gotTitle = gotTitle;
    this.initializeXmlNode = initializeXmlNode;

    init();

    return this;

    function init() {
        Exercise_WorkFlowStep.prototype.init();
    };

    function gotTitle() {
        return true;
    };

    function initializeXmlNode(nodeXml) {
        var strXml;
        var strOpenTag;
        var strContents;
        var strCloseTag;
        var strNewXml;
        var docXml;
        var nodeRootXml;
        var nodeNewXml;

        strXml = serializeAndMassageXmlNode(nodeXml);

        var oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.getOpenTag(oXmlParts.strOpenTag);
        strContents   = oXmlParts.strContents;
        this.getCloseTag(oXmlParts.strCloseTag);

        strNewXml = '<motherofallnodes>' +
                    '<problem id=\"' + createUniqueId() + '\">\n' +
                    '  <para id=\'' + createUniqueId() + '\'>\n' +
                    '    Insert Problem Text Here\n' +
                    '  </para>\n' +
                    '</problem>\n' +
                    '\n' +
                    '<solution id=\"' + createUniqueId() + '\">\n' +
                    '  <para id=\'' + createUniqueId() + '\'>\n' +
                    '    Insert Solution Text Here\n' +
                    '  </para>\n' +
                    '</solution>\n' +
                    '</motherofallnodes>';

        // parse the new XMl with bogus tag
        docXml = parseXmlTextToDOMDocument(strNewXml);
        nodeRootXml = docXml.documentElement;

        // harvest the child of the parse via copying them destructively into nodeXml
        var bPreserveExisting = false;
        Sarissa.copyChildNodes(nodeRootXml, nodeXml, bPreserveExisting);

        strNewXml = serializeAndMassageXmlNode(nodeXml);

        return strNewXml;
    };
}
Exercise_WorkFlowStep.prototype = new WorkFlowStep();


function Example_WorkFlowStep() {
    this.init = init;
    this.gotTitle = gotTitle;
    this.initializeXmlNode = initializeXmlNode;

    init();

    return this;

    function init() {
        Example_WorkFlowStep.prototype.init();
    };

    function gotTitle() {
        return true;
    };

    function initializeXmlNode(nodeXml) {
        var strXml;
        var strOpenTag;
        var strContents;
        var strCloseTag;
        var strNewXml;
        var docXml;
        var nodeRootXml;
        var nodeNewXml;

        strXml = serializeAndMassageXmlNode(nodeXml);

        var oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.getOpenTag(oXmlParts.strOpenTag);
        strContents   = oXmlParts.strContents;
        this.getCloseTag(oXmlParts.strCloseTag);

        strNewXml = '<motherofallnodes>' +
                    '<para id=\'' + createUniqueId() + '\'>\n' +
                    '  Insert Example Text Here\n' +
                    '</para>\n' +
                    '</motherofallnodes>';

        // parse the new XMl with bogus tag
        docXml = parseXmlTextToDOMDocument(strNewXml);
        nodeRootXml = docXml.documentElement;

        // harvest the child of the parse via copying them destructively into nodeXml
        var bPreserveExisting = false;
        Sarissa.copyChildNodes(nodeRootXml, nodeXml, bPreserveExisting);

        strNewXml = serializeAndMassageXmlNode(nodeXml);

        return strNewXml;
    };
}
Example_WorkFlowStep.prototype = new WorkFlowStep();


function Media_WorkFlowStep() {
    // private member variables
    // access private member directly and not via 'this'
    var m_vModuleFiles;
    var m_vWorkareaFiles;
    var m_nodeTitleInput; // FIXME always in base class
    var m_nodeFileImportInput;
    var m_nodeSelect;
    var m_nodeFileUriInput;
    var m_nodeMediaPreviewDiv;
    var m_nodeCaptionInput;
    var m_nodeClosingTag;
    var m_nodeSaveButton;
    var m_nodeDeleteButton;
    var m_vnodeRadioButtons;
    var m_strMediaParameters;
    var m_nodeParameterEditDiv;
    var m_nodeParameterTextArea;
    var m_nodeHideShowtext;
    var m_nodeHiddenSubmitButton;
    var m_nodeHiddenIFrame;
    var m_vModuleFilesPostUpload;
    var m_strInitialMimeType;
    var m_strInitialFileExtension;
    var m_nodeEncloseWithFigureCheckbox;

    this.setNodeMediaPreviewDiv = setNodeMediaPreviewDiv;
    this.getNodeMediaPreviewDiv = getNodeMediaPreviewDiv;

    this.init = init;
    this.gotTitle = gotTitle;
    this.initializeXmlNode = initializeXmlNode;
    this.getEditedXml = getEditedXml;
    this.setupEditForm = setupEditForm;
    this.displayEditForm = displayEditForm;
    this.onFileUpload = onFileUpload;
    this.followFocus = followFocus;

    this.onSave         = onSave;
    this.onSavePart2    = onSavePart2;
    this.onCancel       = onCancel;
    this.onDelete       = onDelete;

    this.handleSave         = handleSave;
    this.handleSavePart2    = handleSavePart2;
    this.handleSaveCommon   = handleSaveCommon;

    this.onServerEditRequestReturn     = onServerEditRequestReturn;
    this.onServerAddRequestReturn      = onServerAddRequestReturn;

    this.onPreviewMedia     = onPreviewMedia;
    this.handlePreviewMedia = handlePreviewMedia;

    this.createSelect = createSelect;
    this.toggleShowHideParams = toggleShowHideParams;
    this.determineFileUploadSuccess = determineFileUploadSuccess;

    init();

    return this;

    function init() {
        Media_WorkFlowStep.prototype.init();

        m_vModuleFiles = null;
        m_vWorkareaFiles = null;
        m_nodeTitleInput = null;
        m_nodeMediaPreviewDiv = null;
        m_nodeCaptionInput = null;
        m_strMediaParameters = null;
        m_nodeParameterTextArea = null;
        m_nodeHideShowtext = null;
        m_nodeHiddenSubmitButton = null;
        m_nodeEncloseWithFigureCheckbox = null;
    };

    function gotTitle() {
        return false;
    };

    function setNodeMediaPreviewDiv(nodeMediaPreviewDiv) {
        m_nodeMediaPreviewDiv = nodeMediaPreviewDiv;
    };

    function getNodeMediaPreviewDiv() {
        return m_nodeMediaPreviewDiv;
    };

    function initializeXmlNode(nodeXml) {
        var strXml;
        var strOpenTag;
        var strContents;
        var strCloseTag;
        var strMediaFile;
        var strMimeType;
        var vFileParts;
        var iLastFilePart;
        var strFileExtension;
        var i;
        var strNewXml;
        var docXml;
        var nodeRootXml;
        var nodeNewXml;

        strXml = serializeAndMassageXmlNode(nodeXml);

        var oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.setOpenTag(oXmlParts.strOpenTag);
        strContents   = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);

        if ( m_vModuleFiles == null ) {
            m_vModuleFiles = downloadModuleFiles();
        }
        if ( m_vWorkareaFiles == null ) {
            m_vWorkareaFiles = downloadWorkareaFiles();
        }

        strMediaFile = '';
        strMimeType = '';

        // pick out the first file we come to in the module or work area
        // and get its mime type
        if ( m_vModuleFiles && m_vModuleFiles.length > 0 ) {
            strMediaFile = m_vModuleFiles[0].strFileName;
        }
        else if ( m_vWorkareaFiles && m_vWorkareaFiles.length > 0 ) {
            strMediaFile = m_vWorkareaFiles[0].strFileName;
        }

        if ( strMediaFile && strMediaFile.length > 0 ) {
            vFileParts = strMediaFile.split('.');
            iLastFilePart = vFileParts.length-1;
            strFileExtension = vFileParts[iLastFilePart];

            strMimeType = findMimeType(strFileExtension);
        }
        else {
            strMimeType = findMimeType('');  // get the default
        }

        nodeXml.setAttribute('type', strMimeType);
        nodeXml.setAttribute('src', strMediaFile);

        strNewXml = serializeAndMassageXmlNode(nodeXml);

        return strNewXml;
    };

    function followFocus(strRadioButtonId) {
        var nodeRadioButton;

        if ( strRadioButtonId != null && strRadioButtonId.length > 0 ) {
            nodeRadioButton = m_vnodeRadioButtons[strRadioButtonId];
            if ( nodeRadioButton != null ) {
                nodeRadioButton.click();
            }
        }
    };

    function buildFileUploadForm(nodeHtmlContainer) {
        var strFileUploadForm;
        var i;
        var nodeForm;
        var j;
        var nodeInput;
        var strType;
        var nodeUploadDiv;

        strFileUploadForm  = '<div>\n';
        strFileUploadForm += '  <form action=\"handleMediaUpload\"\n';
        strFileUploadForm += '        method=\"post\"\n';
        strFileUploadForm += '        enctype=\"multipart/form-data\"\n';
        strFileUploadForm += '        target=\"eipHiddenIFrame\"\n';
        strFileUploadForm += '        id=\"eipAddFileForm\">\n';
        strFileUploadForm += '      <input type=\"file\" name=\"file\" id=\"eipMediaFileUpload\" onclick=\"javascript:g_oWorkFlowStep.followFocus(\'eipMediaFileUploadRadioButton\');\"/>\n';
        strFileUploadForm += '      <input type=\"submit\" name=\"submit\" id=\"eipHiddenSubmitButton\" value=\"Upload\" style=\"display: none;\" />\n';
        strFileUploadForm += '  </form>\n';
        strFileUploadForm += '  <iframe name=\"eipHiddenIFrame\"\n';
        strFileUploadForm += '          id=\"eipHiddenIFrameId\"\n';
        strFileUploadForm += '          onload=\"javascript:g_oWorkFlowStep.onFileUpload();\"\n';
        strFileUploadForm += '          style=\"width:0px; height:0px; border: 0px\">\n';
        strFileUploadForm += '  </iframe>\n';
        strFileUploadForm += '</div>';

        nodeHtmlContainer.innerHTML = strFileUploadForm;
        nodeUploadDiv = nodeHtmlContainer.firstChild;

        for (i=0; i<nodeUploadDiv.childNodes.length; i++) {
            if ( nodeUploadDiv.childNodes[i].nodeName.toLowerCase() == 'form' ) {
                nodeForm = nodeUploadDiv.childNodes[i];
                for (j=0; j<nodeForm.childNodes.length; j++) {
                    if ( nodeForm.childNodes[j].nodeName.toLowerCase() == 'input' ) {
                        nodeInput = nodeForm.childNodes[j];
                        strType = nodeInput.getAttribute('type');
                        if ( strType && strType.length > 0 ) {
                            if ( strType.toLowerCase() == 'file' ) {
                                m_nodeFileImportInput = nodeInput;
                            }
                            if ( strType.toLowerCase() == 'submit' ) {
                                m_nodeHiddenSubmitButton = nodeInput;
                            }
                        }
                    }
                }
            }
            if ( nodeUploadDiv.childNodes[i].nodeName.toLowerCase() == 'iframe' ) {
                m_nodeHiddenIFrame = nodeUploadDiv.childNodes[i];
            }
        }

        //m_nodeFileImportInput    = nodeUploadDiv.getElementById('eipMediaFileUpload');
        //m_nodeHiddenSubmitButton = nodeUploadDiv.getElementById('eipHiddenSubmitButton');
        //var fubar;
        //fubar = m_nodeFileImportInput;
        //fubar = m_nodeHiddenSubmitButton;
        //fubar = null;
    };

    function createSelect(nodeFigureSelectDiv) {
        // our regular method of creating nodes and appending them as children
        // of existing nodes failed for SELECT nodes.  Once a SELECT node is
        // created some of its attributes can be changed (or can be changed
        // without effect).  the solution was to create a string of the
        // entire serialized SELECT node and assign it in its entirity in one
        // modnlithic step.

        // <SELECT onchange="javascript:onPreviewMedia(value)" class="eipFigureSelect" size="4" >
        //     <OPTGROUP label="In this workspace:">
        //         <OPTION value="Members/bnwest/WallaceAndGrommet.jpg;375;275">WallaceAndGrommet.jpg</option>
        //     </OPTGROUP>
        // </SELECT>

        var iSelectSize;
        var strSelect;
        var i;
        var j;
        var nodeDivChild;
        var nodeSelect;
        var bDisabled;

        iSelectSize = 2;
        if ( m_vModuleFiles && m_vModuleFiles.length ) {
            iSelectSize += m_vModuleFiles.length;
        }
        if ( m_vWorkareaFiles && m_vWorkareaFiles.length ) {
            iSelectSize += m_vWorkareaFiles.length;
        }
        if ( iSelectSize > 10 ) iSelectSize = 10;

        strSelect = '<SELECT onchange=\"javascript:g_oWorkFlowStep.followFocus(\'eipMediaModuleFileRadioButton\');g_oWorkFlowStep.onPreviewMedia(value);\" id=\"eipFigureSelect\" ' +
                    'size=\"' + iSelectSize + '\" >\n';

        strSelect += '  <OPTGROUP label="In this module:">\n';

        if ( m_vModuleFiles ) {
            for (i=0; i<m_vModuleFiles.length; i++) {
                strSelect += '    <OPTION value=\"' +
                            m_vModuleFiles[i].strFileUrl + ';' +
                            m_vModuleFiles[i].iFigureWidth + ';' +
                            m_vModuleFiles[i].iFigureHeight + '\">' +
                            m_vModuleFiles[i].strFileName + '</OPTION>\n';
            }
        }

        strSelect += '  </OPTGROUP>\n';

        // might make since to push this adding option-to-select logic off onto chooseSelection
        strSelect += '  <OPTGROUP label="In this work area:">\n';

        if ( m_vWorkareaFiles  ) {
            for (i=0; i<m_vWorkareaFiles.length; i++) {
                bDisabled = false;
                if ( m_vModuleFiles ) {
                    for (j=0; j<m_vModuleFiles.length; j++) {
                        if ( m_vModuleFiles[j].strFileName == m_vWorkareaFiles[i].strFileName ) {
                            bDisabled = true;
                            break;
                        }
                    }
                }
                if ( bDisabled ) {
                    // show the shadowed file but grey it out => not selectable
                    if ( Prototype.Browser.IE  ) {
                        // IE 6 and 7 does not support the HTML 4.0 standard for the
                        // disabled attribute on the OPTION tag. We included the shadowed
                        // entries for information purposes only.  EiP provides no workflow
                        // to replace a module's file with a work area's like named file
                        // (in the case where the work area has a newer, better file).
                        // Thus, the easiest solution to the problem is not have the
                        // shadowed entries in IE since they are information only.  The
                        // alternative would be to be provide full support for the disable
                        // attribute which would be non-trivial and provided little bang
                        // for the buck.
                        m_vWorkareaFiles[i].bSkipped = true;
                    }
                    else {
                        strSelect += '    <OPTION value=\"' +
                                    m_vWorkareaFiles[i].strFileUrl + ';' +
                                    m_vWorkareaFiles[i].iFigureWidth + ';' +
                                    m_vWorkareaFiles[i].iFigureHeight + '\" ' +
                                    'disabled=\"disabled\"' + '>' +
                                    m_vWorkareaFiles[i].strFileName + '</OPTION>\n';
                            m_vWorkareaFiles[i].bSkipped = false;
                    }
                }
                else {
                    strSelect += '    <OPTION value=\"' +
                                    m_vWorkareaFiles[i].strFileUrl + ';' +
                                    m_vWorkareaFiles[i].iFigureWidth + ';' +
                                    m_vWorkareaFiles[i].iFigureHeight + '\">' +
                                    m_vWorkareaFiles[i].strFileName + '</OPTION>\n';
                    m_vWorkareaFiles[i].bSkipped = false;
                }
            }
        }

        strSelect += '  </OPTGROUP>\n';

        strSelect += '</SELECT>\n';

        // FIXME
        //   call replaceHtml() instead? replaceHtml() has issues.
        nodeFigureSelectDiv.innerHTML = strSelect;

        nodeSelect = null;
        for (i=0; i<nodeFigureSelectDiv.childNodes.length; i++) {
            nodeDivChild = nodeFigureSelectDiv.childNodes[i];
            if ( nodeDivChild.nodeName.toLowerCase() == 'select' ) {
                nodeSelect = nodeDivChild;
                break;
            }
        }

        return nodeSelect;
    };

    function chooseSelection(nodeMediaXml) {
        // the CNX server returns XML in the following format to represent
        // files in the module and in the workspace:
        //
        // <media src="http://stevens.cnx.rice.edu:8080/Members/bnwest/WallaceAndGrommet.jpg"
        //  width="375" id="WallaceAndGrommet.jpg" height="275" />
        // <media src="http://stevens.cnx.rice.edu:8080/Members/bnwest/m13035/SCW-Week-1.jpg"
        //  width="400" id="SCW-Week-1.jpg" height="300" />
        //
        // by the time this function is called, this XML has been cracked and stored in
        // m_vModuleFiles and m_vWorkareaFiles with data members:
        // strFileUrl, strFileName, iFigureWidth, and iFigureHeight.
        //
        // by the time this function is called, m_vModuleFiles and m_vWorkareaFiles have
        // been used to populate the HTML SELECT, which is global m_nodeSelect.  each
        // file will have an OPTION HTML node.  the value attribute of the option node contains
        // the file URL, picture width, and the picture height as a text string with the three
        // separated by a semicolon, eg 'file-url;width;height'. the onClick handler for the
        // SELECT, onPreviewMedia(), will use the three values to display the file (if applicable).
        //
        // CNXML source node which we will use to determine the SELECT entry is parameter
        // nodeMediaXml which looks like:
        //
        // <media type="image/jpg" src="image1.jpg"/>
        //
        // this fuction is going to take the 'src' attribute and map it to an entry in the
        // SELECT.  This is not straightforward since that src attribute can take many forms.
        // a file from *the wild* can also be used as the src value, which means the src file will
        // not be in either the module or workspace file list.
        //
        // The Best Use form of the src attribute is simply the file name which will be resolved
        // to a file in the module.  Files from the work area (aka workspace or workgroup) can be
        // used, but as a part of the module publication process these files will be copied into
        // the module.  We will assume hand edited media tag follow the same best use rule.  If
        // not, all will be made right via publication.

        var strFile;
        var vFileParts;
        var bFileNameOnly;
        var i;
        var j;
        var bFound;
        var nodeOption;
        var nodeText;

        // strFile is either a file name w/o a path or a URL.
        strFile = nodeMediaXml.getAttribute('src');
        vFileParts = strFile.split('/');
        bFileNameOnly = ( vFileParts.length == 1 );

        bFound = false;

        // on media tag creation both the src and type attributes are empty strings
        if ( strFile == null || strFile.length == 0 ) {
            // choose the first file we find in the module list followed by the work area list.
            // if both are empty, start user off in the import/upload node input (versus putting
            // them into URI input and encouraging them to enter a file from the web).
            if ( m_vModuleFiles.length > 0 ) {
                // fake an onChange event
                m_nodeSelect.selectedIndex = 0;
                onPreviewMedia(m_vModuleFiles[0].strFileUrl + ';' +
                            m_vModuleFiles[0].iFigureWidth + ';' +
                            m_vModuleFiles[0].iFigureHeight);
                m_vnodeRadioButtons['eipMediaModuleFileRadioButton'].checked = 'checked';
                m_nodeSelect.focus();
            }
            else if ( m_vWorkareaFiles.length > 0 ) {
                // fake an onChange event
                m_nodeSelect.selectedIndex = 0;
                onPreviewMedia(m_vWorkareaFiles[0].strFileUrl + ';' +
                            m_vWorkareaFiles[0].iFigureWidth + ';' +
                            m_vWorkareaFiles[0].iFigureHeight);
                m_vnodeRadioButtons['eipMediaModuleFileRadioButton'].checked = 'checked';
                m_nodeSelect.focus();
            }
            else {
                m_vnodeRadioButtons['eipMediaFileUploadRadioButton'].checked = 'checked';
                m_nodeFileImportInput.focus();
            }
             bFound = true;
        }

        // is the file in the module? work area?
        if ( !bFound ) {
            if ( bFileNameOnly ) {
                if ( m_vModuleFiles ) {
                    for (i=0,j=0; i<m_vModuleFiles.length; i++, j++) {
                        if ( m_vModuleFiles[i].strFileName == strFile ) {
                            m_nodeSelect.selectedIndex = j;
                            // fake an onChange event
                            onPreviewMedia(m_vModuleFiles[i].strFileUrl + ';' +
                                        m_vModuleFiles[i].iFigureWidth + ';' +
                                        m_vModuleFiles[i].iFigureHeight);
                            m_vnodeRadioButtons['eipMediaModuleFileRadioButton'].checked = 'checked';
                            m_nodeSelect.focus();
                            bFound = true;
                            break;
                        }
                    }
                }

                // is the file in the work area?
                if ( !bFound ) {
                    if ( m_vWorkareaFiles ) {
                        for (i=0; i<m_vWorkareaFiles.length; i++,j++) {
                            if ( m_vWorkareaFiles[i].bSkipped ) {
                                // IE does not support disabled OPTIONs in SELECT, which we skip entirely
                                j--;
                                continue;
                            }
                            if ( m_vWorkareaFiles[i].strFileName == strFile ) {
                                m_nodeSelect.selectedIndex = j;
                                // fake an onChange event
                                onPreviewMedia(m_vWorkareaFiles[i].strFileUrl + ';' +
                                            m_vWorkareaFiles[i].iFigureWidth + ';' +
                                            m_vWorkareaFiles[i].iFigureHeight);
                                m_vnodeRadioButtons['eipMediaModuleFileRadioButton'].checked = 'checked';
                                m_nodeSelect.focus();
                                bFound = true;
                                break;
                            }
                        }
                    }
                }
            }
        }

        // is the file a URL?
        if ( !bFound ) {
            m_nodeFileUriInput.setAttribute('value', strFile);
            m_vnodeRadioButtons['eipMediaUriRadioButton'].checked = 'checked';
            m_nodeFileUriInput.focus();
        }
    };

    function setupEditForm(strXml) {
        var oXmlParts;
        var strContents;
        var nodeWarningMessage;
        var nodeWarningText;
        var nodeHelpMessage;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeText;
        var nodeTextSpan;
        var strHtml;
        var strType;
        var strSrc;
        var nodeTable;
        var nodeTBody;
        var nodeTr;
        var nodeTd;
        var nodeLabel;
        var nodeText;
        var nodeInput;
        var nodeForm;
        var nodeIFrame;
        var nodeFileInputDiv;
        var nodeCheckboxDiv;
        var bIsParentAFigure;
        var bIsParentASubfigure;
        var vFileParts;
        var iLastFilePart;
        var strFileExtension;
        var nodeHtmlClone;

        // <media type="image/jpg" src="image1.jpg"/> ... </media>
        strType = this.getEditedXmlNode().getAttribute('type');
        strSrc  = this.getEditedXmlNode().getAttribute('src');

        vFileParts = strSrc.split('.');
        iLastFilePart = vFileParts.length-1;
        strFileExtension = vFileParts[iLastFilePart];

        m_strInitialMimeType = ( strType != null ? strType : '' );
        m_strInitialFileExtension = ( strFileExtension != null ? strFileExtension : '' );

        oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());
        this.setOpenTag(oXmlParts.strOpenTag);
        m_strMediaParameters = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);

        if ( m_strMediaParameters == ' ' ) {
            // special case.  most times when we create a new Xml node we add
            // a text child with one blank space.  since for media, the presence of
            // a child indicates that params are present and triggers a slightly
            // different UI and since a single blank space does not a param make,
            // we substitute an empty string.
            m_strMediaParameters = '';
        }

        // <DIV id='eipEditContainer'>
        this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
        $('eipMasterEditContainerDiv').innerHTML = ' ';

        var nodePopups = document.createElement('div');
        nodePopups.className = 'eipPopUps';

        //   <DIV class="eipHelpMessage"><A></A></DIV>
        nodeHelpMessage = document.createElement('div');
        nodeHelpMessage.className = 'eipHelpMessage';
        nodeHelpLink = document.createElement('a');
        nodeHelpLink.onclick = function(event){openHelp(g_oWorkFlowStep.getEditedXmlTag());};
        nodeHelpText = document.createTextNode('Help editing <' + this.getEditedXmlTag() + '>');
        nodeHelpLink.appendChild(nodeHelpText);
        nodeHelpMessage.appendChild(nodeHelpLink);
        nodePopups.appendChild(nodeHelpMessage);
        
        // Add launch button for MathEditor
        MathEditor.addLaunchButton(nodePopups);
        this.getHtmlEditContainerDiv().appendChild(nodePopups);

        m_vnodeRadioButtons = new Object();

        // <table class="eipMediaEditor">
        nodeTable = document.createElement('table');
        nodeTable.className = 'eipMediaEditor';
        // <tbody>
        nodeTBody = document.createElement('tbody');
        //   <tr>
        nodeTr = document.createElement('tr');
        //     <td colspan="3" class="eipMediaFileUploadLabel">
        nodeTd = document.createElement('td');
        nodeTd.colSpan = '3';
        nodeTd.className = "eipMediaFileUploadLabel";
        //       <label for=\"eipMediaFileUpload\">Upload a new media file</label>
        nodeLabel = document.createElement('label');
        nodeLabel.setAttribute('for', 'eipMediaFileUpload');
        nodeText = document.createTextNode('Upload a new media file');
        nodeLabel.appendChild(nodeText);
        nodeTd.appendChild(nodeLabel);
        //     </td>
        nodeTr.appendChild(nodeTd);
        //   </tr>
        nodeTBody.appendChild(nodeTr);
        //   <tr class="eipMediaRadioGroup">
        nodeTr = document.createElement('tr');
        nodeTr.className = 'eipMediaRadioGroup';
        //     <td>
        nodeTd = document.createElement('td');
        //       <input type="radio" name="eipMediaRadioButtons"  class="eipMediaFileUploadRadioButton" />
        if ( Prototype.Browser.IE  ) {
            nodeInput = document.createElement('<input type=\"radio\" name=\"eipMediaRadioButtons\"  id=\"eipMediaFileUploadRadioButton\">');
        }
        else {
            nodeInput = document.createElement('input');
            nodeInput.setAttribute('type', 'radio');
            nodeInput.setAttribute('name', 'eipMediaRadioButtons');
            nodeInput.setAttribute('id', 'eipMediaFileUploadRadioButton');
        }
        nodeTd.appendChild(nodeInput);
        m_vnodeRadioButtons['eipMediaFileUploadRadioButton'] = nodeInput;
        //     </td>
        nodeTr.appendChild(nodeTd);
        //     <td colspan="2">
        nodeTd = document.createElement('td');
        nodeTd.colSpan = '2'; // nodeTd.setAttribute('colspan', '2');

        nodeFileInputDiv = buildFileUploadForm(nodeTd);

        //     </td>
        nodeTr.appendChild(nodeTd);
        //   </tr>
        nodeTBody.appendChild(nodeTr);
        //   <tr>
        nodeTr = document.createElement('tr');
        //     <td colspan="3" class="eipMediaModuleFileSelectLabel">
        nodeTd = document.createElement('td');
        nodeTd.colSpan = '3'; // nodeTd.setAttribute('colspan', '3');
        nodeTd.className = 'eipMediaModuleFileSelectLabel';
        //       <label for="eipMediaModuleFileSelect">Or choose an already uploaded file</label>
        nodeLabel = document.createElement('label');
        nodeLabel.setAttribute('for', 'eipMediaModuleFileSelect');
        nodeText = document.createTextNode('Or choose an already uploaded file');
        nodeLabel.appendChild(nodeText);
        nodeTd.appendChild(nodeLabel);
        //     </td>
        nodeTr.appendChild(nodeTd);
        //   </tr>
        nodeTBody.appendChild(nodeTr);
        //   <tr class="eipMediaRadioGroup">
        nodeTr = document.createElement('tr');
        nodeTr.className = 'eipMediaRadioGroup';
        //     <td valign="top">
        nodeTd = document.createElement('td');
        nodeTd.vAlign = 'top'; // nodeTd.setAttribute('valign', 'top');
        //       <input type="radio" name="eipMediaRadioButtons" class="eipMediaModuleFileRadioButton" />
        if ( Prototype.Browser.IE  ) {
            nodeInput = document.createElement('<input type=\"radio\" name=\"eipMediaRadioButtons\"  id=\"eipMediaModuleFileRadioButton\">');
        }
        else {
            nodeInput = document.createElement('input');
            nodeInput.setAttribute('type', 'radio');
            nodeInput.setAttribute('name', 'eipMediaRadioButtons');
            nodeInput.setAttribute('id', 'eipMediaModuleFileRadioButton');
        }
        nodeTd.appendChild(nodeInput);
        m_vnodeRadioButtons['eipMediaModuleFileRadioButton'] = nodeInput;
        //     </td>
        nodeTr.appendChild(nodeTd);
        //     <td valign="top">
        nodeTd = document.createElement('td');
        nodeTd.vAlign = 'top'; // nodeTd.setAttribute('valign', 'top');

        // populate m_vModuleFiles and m_vWorkareaFiles before call to createSelect()
        if ( m_vModuleFiles == null ) {
            m_vModuleFiles = downloadModuleFiles();
        }
        if ( m_vWorkareaFiles == null ) {
            m_vWorkareaFiles = downloadWorkareaFiles();
        }

        //       <select onchange='g_oWorkFlowStep.onPreviewMedia(value)' size="7" class="eipMediaModuleFileSelect"> ... </select>
        nodeFigureSelectDiv = document.createElement('div');
        nodeFigureSelectDiv.className = 'eipFigureSelectDiv';
        m_nodeSelect = this.createSelect(nodeFigureSelectDiv);
        nodeTd.appendChild(nodeFigureSelectDiv);
        //     </td>
        nodeTr.appendChild(nodeTd);
        //     <td valign="top">
        nodeTd = document.createElement('td');
        nodeTd.vAlign = 'top'; // nodeTd.setAttribute('valign', 'top');
        //       <div class="eipFigurePreview"> </div>
        m_nodeMediaPreviewDiv = document.createElement('div');
        m_nodeMediaPreviewDiv.className = 'eipFigurePreview';
        //         Select an media file at left to preview here
        nodeText = document.createTextNode('Select a media file at left to preview here');
        m_nodeMediaPreviewDiv.appendChild(nodeText);
        nodeTd.appendChild(m_nodeMediaPreviewDiv);
        //     </td>
        nodeTr.appendChild(nodeTd);
        //   </tr>
        nodeTBody.appendChild(nodeTr);
        //   </tr>
        nodeTBody.appendChild(nodeTr);
        //   <tr>
        nodeTr = document.createElement('tr');
        //     <td colspan="3" class="eipMediaUriLabel">
        nodeTd = document.createElement('td');
        nodeTd.colSpan = '3'; // nodeTd.setAttribute('colspan', '3');
        nodeTd.className = 'eipMediaUriLabel';
        //       <label for="eipMediaUriInput">Or provide the URI of a media file located elsewhere</label>
        nodeLabel = document.createElement('label');
        nodeLabel.setAttribute('for', 'eipMediaUriInput');
        nodeText = document.createTextNode('Or provide the URL of a media file located elsewhere');
        nodeLabel.appendChild(nodeText);
        nodeTd.appendChild(nodeLabel);
        //     </td>
        nodeTr.appendChild(nodeTd);
        //   </tr>
        nodeTBody.appendChild(nodeTr);
        //   <tr class=\"eipMediaRadioGroup\">
        nodeTr = document.createElement('tr');
        nodeTr.className = 'eipMediaRadioGroup';
        //     <td>
        nodeTd = document.createElement('td');
        //       <input type="radio" name="eipMediaRadioButtons" class="eipMediaUriRadioButton" />
        if ( Prototype.Browser.IE  ) {
            nodeInput = document.createElement('<input type=\"radio\" name=\"eipMediaRadioButtons\"  id=\"eipMediaUriRadioButton\">');
        }
        else {
            nodeInput = document.createElement('input');
            nodeInput.setAttribute('type', 'radio');
            nodeInput.setAttribute('name', 'eipMediaRadioButtons');
            nodeInput.setAttribute('id', 'eipMediaUriRadioButton');
        }
        nodeTd.appendChild(nodeInput);
        m_vnodeRadioButtons['eipMediaUriRadioButton'] = nodeInput;
        //     </td>
        nodeTr.appendChild(nodeTd);
        //     <td colspan="2">
        nodeTd = document.createElement('td');
        nodeTd.colSpan = '2'; // nodeTd.setAttribute('colspan', '2');
        //       <input type="text" class="eipMediaUriInput" size="60" />
        nodeTd.innerHTML = '<input type=\"text\" id=\"eipMediaUriInput\" onclick=\"javascript:g_oWorkFlowStep.followFocus(\'eipMediaUriRadioButton\');\" size=\"60\" />';
        m_nodeFileUriInput = nodeTd.firstChild;
        //     </td>
        nodeTr.appendChild(nodeTd);
        //   </tr>
        nodeTBody.appendChild(nodeTr);

        // </tbody>
        nodeTable.appendChild(nodeTBody);

        // </table>
        this.getHtmlEditContainerDiv().appendChild(nodeTable);

        // <div class="eipShowHideParameterContainer">
        nodeParameterDiv = document.createElement('div');
        nodeParameterDiv.className = 'eipShowHideParameterContainer';
        //   <a href="#" onclick="toggleShowHideParams()">Edit optional media parameters</a>
        nodeAnchor = document.createElement('a');
        //nodeAnchor.setAttribute('href', '#');
        nodeAnchor.onclick = toggleShowHideParams;
        nodeText = document.createTextNode('Edit optional media parameters');
        nodeAnchor.appendChild(nodeText);
        m_nodeHideShowtext = nodeText;
        //   </a>
        nodeParameterDiv.appendChild(nodeAnchor);
        //   <div class="eipParameterEdit" style="display: none/block;">
        m_nodeParameterEditDiv = document.createElement('div');
        m_nodeParameterEditDiv.className = 'eipParameterEdit';
        m_nodeParameterEditDiv.style.display = 'none';
        //     <div class="eipPopUps">
        var nodePopups = document.createElement('div');
        nodePopups.className = 'eipPopUps';
        //       <div class="eipHelpMessage">
        nodeHelpMessage = document.createElement('div');
        nodeHelpMessage.className = 'eipHelpMessage';
        nodeHelpLink = document.createElement('a');
        nodeHelpLink.onclick = function(event){openHelp('param');};
        nodeHelpText = document.createTextNode('Help editing <param>');
        nodeHelpLink.appendChild(nodeHelpText);
        nodeHelpMessage.appendChild(nodeHelpLink);
        //       </div>
        nodePopups.appendChild(nodeHelpMessage);
        // Add launch button for MathEditor
        MathEditor.addLaunchButton(nodePopups);
        //     </div>
        m_nodeParameterEditDiv.appendChild(nodePopups);
        //     <textarea class="eipParameterTextArea" rows="3">
        m_nodeParameterTextArea = document.createElement('textarea');
        m_nodeParameterTextArea.className = 'eipParameterTextArea';
        m_nodeParameterTextArea.setAttribute('rows', '3');
        m_nodeParameterTextArea.value = m_strMediaParameters;
        //     </textarea>
        m_nodeParameterEditDiv.appendChild(m_nodeParameterTextArea);
        //   </div>
        nodeParameterDiv.appendChild(m_nodeParameterEditDiv);

        if ( m_strMediaParameters && m_strMediaParameters.length > 0 ) {
            // if we have params we start out with them visible.
            toggleShowHideParams();
        }

        // </div>
        this.getHtmlEditContainerDiv().appendChild(nodeParameterDiv);

        bIsParentAFigure = ( this.getEditedXmlNode() &&
                             this.getEditedXmlNode().parentNode &&
                             this.getEditedXmlNode().parentNode.nodeName &&
                             this.getEditedXmlNode().parentNode.nodeName.toLowerCase() == "figure" );
        bIsParentASubfigure = ( this.getEditedXmlNode() &&
                                this.getEditedXmlNode().parentNode &&
                                this.getEditedXmlNode().parentNode.nodeName &&
                                this.getEditedXmlNode().parentNode.nodeName.toLowerCase() == "subfigure" );
        if ( bIsParentASubfigure ) {
            m_nodeEncloseWithFigureCheckbox = null;
        }
        else {
            // <div class="eipEncloseWithFigure">
            nodeCheckboxDiv = document.createElement('div');
            nodeCheckboxDiv.className = 'eipEncloseWithFigure';
            // <input type="checkbox" /> or <input type="checkbox" checked="=checked" />
            if ( bIsParentAFigure ) {
                nodeCheckboxDiv.innerHTML = '<input type="checkbox" checked="checked" />';
            }
            else {
                nodeCheckboxDiv.innerHTML = '<input type="checkbox" />';
            }
            m_nodeEncloseWithFigureCheckbox = nodeCheckboxDiv.firstChild;
            // checkbox text
            nodeTextSpan = document.createElement('span');
            nodeText = document.createTextNode('Enclose within a <figure>. Allows optional name, caption, auto-numbering and inclusion in list of figures for printing.');
            nodeTextSpan.appendChild(nodeText);
            // click on text => click in box
            nodeTextSpan.onclick =
              function(event){nodeCheckboxDiv.firstChild.checked = !nodeCheckboxDiv.firstChild.checked;};
            nodeCheckboxDiv.appendChild(nodeTextSpan);

            // </div>
            this.getHtmlEditContainerDiv().appendChild(nodeCheckboxDiv);
        }

        // <BUTTON class="eipSaveButton" alt="Save">Save  </BUTTON>
        this.setSaveButton(document.createElement('button'));
        this.getSaveButton().className = 'eipSaveButton';
        nodeLabelText = document.createTextNode('Save');
        this.getSaveButton().setAttribute('alt', 'Save');
        this.getSaveButton().onclick = onSave;
        this.getSaveButton().appendChild(nodeLabelText);
        this.getSaveButton().disabled = false;
        this.getHtmlEditContainerDiv().appendChild(this.getSaveButton());

        // <BUTTON alt="Cancel" class="eipCancelButton">Cancel  </BUTTON>
        var nodeCancelButton = document.createElement('button');
        nodeCancelButton.className = 'eipCancelButton';
        nodeCancelButton.setAttribute('alt', "Cancel");
        nodeLabelText = document.createTextNode('Cancel');
        nodeCancelButton.appendChild(nodeLabelText);
        nodeCancelButton.onclick = onCancel;
        this.getHtmlEditContainerDiv().appendChild(nodeCancelButton);

        // <BUTTON alt="Delete" class="eipDeleteButton">Delete  </BUTTON>
        var bIsNodeDeletable;
        bIsNodeDeletable = isNodeDeletable(this.getEditedHtmlNode());
        var bEditingExistingNode = this.getEditingExistingNode();

        if ( bEditingExistingNode && bIsNodeDeletable ) {
            this.setNodeDeleteButton(document.createElement('button'));
            this.getNodeDeleteButton().className = 'eipDeleteButton';
            this.getNodeDeleteButton().setAttribute('alt', 'Delete');
            nodeLabelText = document.createTextNode('Delete');
            this.getNodeDeleteButton().appendChild(nodeLabelText);
            this.getNodeDeleteButton().onclick = onDelete;
            this.getNodeDeleteButton().disabled = false;
            this.getHtmlEditContainerDiv().appendChild(this.getNodeDeleteButton());
        }

        // before we clone the node, we must first remove the event callbacks
        // recursively from the HTML tree rooted by the edited html node.
        stopObserving(this.getEditedHtmlNode());

        // clone the edited html node.
        nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
        this.setEditedHtmlNodeClone(nodeHtmlClone);
    };

    function toggleShowHideParams() {
        // FIXME
        // need to remember m_nodeParameterEditDiv and m_nodeHideShowtext
        // for both $('eipMasterEditContainerDiv') and $('eipGhostEditContainerDiv')

        var bTextAreaHidden;

        //alert('toggleShowHideParams');
        bTextAreaHidden = ( m_nodeParameterEditDiv.style.display == 'none' );
        if ( bTextAreaHidden ) {
            m_nodeParameterEditDiv.style.display = 'block';
            m_nodeHideShowtext.nodeValue = 'Hide optional media parameters';
        }
        else {
            m_nodeParameterEditDiv.style.display = 'none';
            m_nodeHideShowtext.nodeValue = 'Edit optional media parameters';
        }
    };

    function displayEditForm() {
        // derived to support a post display operation and fix an IE 6.0 bug
        var isIE6; // or less actually

        isIE6 = false;
        if ( Prototype.Browser.IE ) {
            var isIE7 = ( typeof document.body.style.maxHeight != "undefined" );
            isIE6 = !isIE7;
        }

        if ( isIE6 ) {
            // IE6 workaround ...
            // select HTML widgits do not like to be absolutely positioned over.
            var strOriginalVisibility;
            strOriginalVisibility = m_nodeSelect.style.visibility;
            m_nodeSelect.style.visibility = 'hidden';

            Media_WorkFlowStep.prototype.displayEditForm();

            m_nodeSelect.style.visibility = strOriginalVisibility;
        }
        else {
            Media_WorkFlowStep.prototype.displayEditForm();
        }

        // want to select a radio button and possibly a select entry (=> module/workspace file)
        // will cause a screen flicker.  if we choose the selection before adding the edit tree
        // to the HTML DOM, we could not size the picture based on the real estate taken up by
        // the SELECT widgit.
        chooseSelection(this.getEditedXmlNode());
    };

    function onFileUpload(e) {
        // this callback is fired when the IFRAME is loaded.  we expected it to get loaded once
        // everytime the media edit UI is drawn.  we also expect it to get loaded to catch the
        // CNX server response to a file upload operation.
        // determine if this the initial call and early exit if so ...
        if ( m_nodeFileImportInput == null )                     return false;
        if ( m_nodeFileImportInput.value == null )               return false;
        if ( m_nodeFileImportInput.value.length == 0 )           return false;
        if ( g_oWorkFlowStep.getSaveButton().disabled == false ) return false;

        // like every other callback, 'this' is not a WorkFlow Object

        var nodeIFrameHtml;
        nodeIFrameHtml = this;

        return g_oWorkFlowStep.onSavePart2(m_nodeHiddenIFrame);
    };

    function determineFileUploadSuccess(nodeIFrameHtml) {
        // Plan A: the CNX server returns XML list of media files in the module.  FF incorrectly
        // parses the XML.  IE appears to not parse it at all.

        // Plan B: download the list of media files in the module and make sure that there is
        // more than what we started with. set private member m_vModuleFilesPostUpload as a side effect.

        var bFileUploadSuccessful;

        bFileUploadSuccessful = false;

        m_vModuleFilesPostUpload = downloadModuleFiles(); //alert('determineFileUploadSuccess() ' + m_vModuleFilesPostUpload.length + ' files were uploaded.');
        if ( m_vModuleFilesPostUpload && m_vModuleFilesPostUpload.length > 0 ) {
            if ( m_vModuleFilesPostUpload.length > m_vModuleFiles.length ) {
                bFileUploadSuccessful = true;
            }
        }

        return bFileUploadSuccessful;
    };

    function onSave(e) {
        return g_oWorkFlowStep.handleSave(e);
    };

    function onSavePart2(nodeIFrameHtml) {
        return g_oWorkFlowStep.handleSavePart2(nodeIFrameHtml);
    };

    function onCancel(e) {
        return g_oWorkFlowStep.handleCancel(e);
    };

    function onDelete(e) {
         return g_oWorkFlowStep.handleDelete(e);
   };

    function handleSave(e) {
        var bSelectModuleWorkAreaFile;
        var bSelectFileUri;
        var bUploadFileToModule;
        var strXml;

        if (!e) e = window.event;
        var nodeHtmlButton = e.target || e.srcElement;

        if (gEditNodeInfo.state == STATE_VALIDATING) {
            try {
                gRequest.xhr.abort();
            }
            catch(e) {
            }
        }

        bSelectModuleWorkAreaFile = ( m_vnodeRadioButtons['eipMediaModuleFileRadioButton'] != null &&
                                      m_vnodeRadioButtons['eipMediaModuleFileRadioButton'].checked != null &&
                                      m_vnodeRadioButtons['eipMediaModuleFileRadioButton'].checked == true );
        bSelectFileUri            = ( m_vnodeRadioButtons['eipMediaUriRadioButton'] &&
                                      m_vnodeRadioButtons['eipMediaUriRadioButton'].checked &&
                                      m_vnodeRadioButtons['eipMediaUriRadioButton'].checked == true );
        bUploadFileToModule       = ( m_vnodeRadioButtons['eipMediaFileUploadRadioButton'] &&
                                      m_vnodeRadioButtons['eipMediaFileUploadRadioButton'].checked &&
                                      m_vnodeRadioButtons['eipMediaFileUploadRadioButton'].checked == true );

        if ( bSelectModuleWorkAreaFile || bSelectFileUri ) {
            // virtual method getEditedXml() is required to build the Media Xml string correctly.
            strXml = this.getEditedXml();
            this.handleSaveCommon(strXml);
            return;
        }
        else if ( bUploadFileToModule ) {
            // this needs to be done in two steps
            // 1. upload the file to the module, async
            // 2. save the media tag with the CNX server (normal handleSave() functionality)
            // here we will start step #1. onFileUpload() will fire when the upload
            // is complete and will call onSavePart2() to finish the onSave functionality

            var strParams;
            var bHasParseError;

            // need to throw an alert if no file is spec-ed for upload
            if ( m_nodeFileImportInput == null ||
                 m_nodeFileImportInput.value == null ||
                 m_nodeFileImportInput.value.length == 0 ) {
                alert('Please specify a file to upload.');
                return false;
            }

            // before we upload the file make sure that xml in the params field is well formatted.
            strParams = m_nodeParameterTextArea.nodeValue;
            if ( strParams != null && strParams.length > 0 ) {
                try {
                    var docNewXml = parseXmlTextToDOMDocument('<motherofall>' + strParams + '</motherofall>');

                    // Mozilla browswers don't actually throw an error upon error.
                    bHasParseError = ( docNewXml.documentElement.tagName == 'parsererror' );
                }
                catch(e) {
                    // IE browser throws an error on parse ...
                    bHasParseError = true;
                }
                if ( bHasParseError ) {
                    alert('Option media parameters are not valid XML.');
                    return false;
                }
            }

            this.getSaveButton().disabled = true;
            m_nodeHiddenSubmitButton.click(); // initiates the async file upload ...
        }
        else {
            // at least one of the radio button should be checked.  should not get here but ...
            alert('Please choose one of the three options before hitting Save.');
            return false;
        }
    };

    function handleSavePart2(nodeIFrameHtml) {
        var bFileUploadSuccessful;
        var strWindowsDrive;
        var strInputFile;
        var bWindowsFilePath;
        var strFilePathSeparator;
        var strModuleFileName;
        var strFileExtension;
        var strMimeType;
        var strOpenTag;
        var strXml;

        // parse the server result as seen in the children of nodeIFrameHtmld
        bFileUploadSuccessful = this.determineFileUploadSuccess(nodeIFrameHtml);
        if ( !bFileUploadSuccessful ) {
            alert('File upload was unsuccessful.');
            //g_oWorkFlowStep.getSaveButton().disabled = false;
            this.getSaveButton().disabled = false;
            return false;
        }

        // we need to determine the name of the file in the module.
        // m_nodeFileImportInput has the name of the file we submitted to the server.
        // m_nodeFileImportInput.value must be valid or we will never get here.

        strWindowsDrive = null;
        strInputFile = m_nodeFileImportInput.value;
        strInputFile.replace(/^([\w\W]*?)(:)([\w\W]*?)/,
                             function(wholeMatch, windowsDrive, semiColon, pathWithinDrive) {
                                 strWindowsDrive = windowsDrive;
                                 return wholeMatch;
                             });

        bWindowsFilePath = ( strWindowsDrive != null && strWindowsDrive.length > 0 );
        if (bWindowsFilePath ) strFilePathSeparator = '\\';
        else                   strFilePathSeparator = '/';

        vFileParts = strInputFile.split(strFilePathSeparator);
        iLastFilePart = vFileParts.length-1;
        strModuleFileName = vFileParts[iLastFilePart];

        vFileParts = strModuleFileName.split('.');
        iLastFilePart = vFileParts.length-1;
        strFileExtension = vFileParts[iLastFilePart];

        strMimeType = findMimeType(strFileExtension);

        // <media type="image/jpg" src="image1.jpg"/>
        strOpenTag = '<media type=\"' + strMimeType + '\" src=\"' + strModuleFileName + '\">';
        strXml = addNamespacesToTagText(strOpenTag);
        if ( m_nodeParameterTextArea.value && m_nodeParameterTextArea.value.length > 0 ) {
            strXml += m_nodeParameterTextArea.value;
        }
        strXml += '</media>';

        this.handleSaveCommon(strXml);
    };

    function handleSaveCommon(strXml) {
        var bWellFormed;
        var bAddingNewNode;
        var nodeXml;
        var oChecked;
        var bIsParentAFigure;
        var bIsParentASubfigure;
        var bEncloseWithFigure;
        var strId;
        var strChangedXmlTag;
        var nodeChangedHtml;
        var nodeChangedXml;
        var strXPathToChangedXmlNode;
        var strChangedXml;
        var strOpenTag;

        // strXml == '<media type="image/jpg" src="image1.jpg"> ... </media>'

        // might need to add or remove an enclosing figure ...

        nodeXml = this.getEditedXmlNode();
        bIsParentAFigure = ( nodeXml &&
                             nodeXml.parentNode &&
                             nodeXml.parentNode.nodeName &&
                             nodeXml.parentNode.nodeName.toLowerCase() == "figure" );
        bIsParentASubfigure = ( nodeXml &&
                                nodeXml.parentNode &&
                                nodeXml.parentNode.nodeName &&
                                nodeXml.parentNode.nodeName.toLowerCase() == "subfigure" );

        if ( bIsParentASubfigure ) {
            bIsParentAFigure = false; // embrace redundancy
            bEncloseWithFigure = false;
        }
        else {
            // bIsParentAFigure can be true or false
            oChecked = m_nodeEncloseWithFigureCheckbox.getAttribute("checked"); // for debug
            bEncloseWithFigure = m_nodeEncloseWithFigureCheckbox.checked;
        }

        if      ( bIsParentAFigure == false && bEncloseWithFigure == false ) {
            // status quo is good (don't have and don't want a enclosing figure)
            strChangedXml            = strXml;
            strChangedXmlTag         = this.getEditedXmlTag();
            nodeChangedHtml          = $('eipGhostEditContainerDiv');
            nodeChangedXml           = this.getEditedXmlNode();
            strXPathToChangedXmlNode = this.getXPathToEditedXmlNode();
        }
        else if ( bIsParentAFigure == false && bEncloseWithFigure == true ) {
            // need to add a <figure> container.
            strId = createUniqueId();
            strOpenTag = '<figure id="' + strId + '">';
            strChangedXml = addNamespacesToTagText(strOpenTag);
            strChangedXml += removeNamespaceAttributesFromText(strXml) + '</figure>';

            strChangedXmlTag         = 'figure';
            nodeChangedHtml          = $('eipGhostEditContainerDiv');
            nodeChangedXml           = this.getEditedXmlNode();
            strXPathToChangedXmlNode = this.getXPathToEditedXmlNode();
       }
        else if ( bIsParentAFigure == true && bEncloseWithFigure == false ) {
            // need to remove a <figure> container.
            strChangedXml = strXml;
            strChangedXmlTag = this.getEditedXmlTag();

            // need to have XPath point to figure, parent of the media
            var strXPath;
            var strNewXPath;
            var vFileParts;
            var i;
            strXPath = this.getXPathToEditedXmlNode(); // should look like .../figure[i]/media[1]
            vFileParts = strXPath.split('/');
            strXPathToChangedXmlNode = '';
            for (i=0; i<vFileParts.length-1; i++) {
                strXPathToChangedXmlNode += '/' + vFileParts[i];
            }

            nodeChangedXml = getNodeByXPath(strXPathToChangedXmlNode, gSource.doc);

            // need to find the figure HTML node starting from media Edit UI node
            var nodeCurrentHtml;
            var strClassName;
            nodeCurrentHtml = $('eipGhostEditContainerDiv');
            while ( nodeCurrentHtml.id != 'cnx_main' ) {
                if ( nodeCurrentHtml.className != null ) {
                    strClassName = nodeCurrentHtml.className.split(" ")[0];
                    if ( strClassName == 'figure' ) {
                        break;
                    }
                }
                nodeCurrentHtml = nodeCurrentHtml.parentNode;
            }
            nodeChangedHtml = nodeCurrentHtml;
        }
        else if ( bIsParentAFigure == true && bEncloseWithFigure == true ) {
            // status quo is good (have and want a enclosing figure)
            strChangedXmlTag         = this.getEditedXmlTag();
            nodeChangedHtml          = $('eipGhostEditContainerDiv');
            nodeChangedXml           = this.getEditedXmlNode();
            strXPathToChangedXmlNode = this.getXPathToEditedXmlNode();
            strChangedXml            = strXml;
        }

        try {
            checkWellFormed(strChangedXml, nodeChangedXml);
            bWellFormed = true;
        }
        catch (e) {
            var strErrorMsg = "<p>Unable to parse the CNXML text.</p>" +
                              "<p>Please fix the changes you have made.</p>" +
                              "<p>Error information:</p>" +
                              "<textarea rows='5' readonly='yes'>" +
                              e.toString() + '\n' +
                              "</textarea>";
            Ext.MessageBox.show({
                title: 'Error',
                msg: strErrorMsg,
                buttons: Ext.MessageBox.OK,
                width: 600
            });
            bWellFormed = false;
        }
        if ( !bWellFormed ) {
            // FIXME
            // below does not cut it. we may have already added a file to the module.
            // we need to start over but how?
            // => we could fail to add a media node but succeed in adding a file to the module.
            this.getSaveButton().disabled = false;
            return false;
        }

        bAddingNewNode = ( ! this.getEditingExistingNode() );
        if ( bAddingNewNode ) {
            var strServerRequestUrl = gURLs.update;
            var strXPathInsertionNode = this.getXPathToInsertionXmlNode();
            var strInsertionPosition = this.getInsertionPosition();
            var funcServerReturnCalback = this.onServerAddRequestReturn.bind(this);

            this.setChangeNodeState(strChangedXmlTag, nodeChangedHtml, nodeChangedXml, null, strChangedXml);

            sendAdd(strServerRequestUrl, strChangedXmlTag, strChangedXml, strXPathInsertionNode, strInsertionPosition,
                    funcServerReturnCalback);
        }
        else {
            var strServerRequestUrl = gURLs.update;
            var funcServerReturnCalback = this.onServerEditRequestReturn.bind(this);

            this.setChangeNodeState(strChangedXmlTag, nodeChangedHtml, nodeChangedXml, strXPathToChangedXmlNode, strChangedXml);

            sendSource(strServerRequestUrl, strChangedXmlTag, strChangedXml, strXPathToChangedXmlNode, funcServerReturnCalback);
        }

        //alert('onFileUpload() : file input value is \n' + g_oWorkFlowStep.m_nodeFileImportInput.value);

        return;
    };

    function onServerEditRequestReturn() {
        g_oWorkFlowStep.handleServerEditRequestReturn();
    };

    function onServerAddRequestReturn() {
        g_oWorkFlowStep.handleServerAddRequestReturn();
    };

    function getEditedXml() {
        var strXml;
        var strTagContents;
        var strTagContents;
        var iOptionIndex;
        var vFileParts;
        var iLastFilePart;
        var strFileExtension;
        var strMimeType;
        var strDefaultMimeType;
        var bNothingSelected;
        var bSelectContainsFileFromTheWild;
        var strValue;
        var vValueParts;
        var strMediaFile;
        var iImageWidth;
        var iImageHeight;
        var strOpenTag;

        strMediaFile = null;
        if      ( m_vnodeRadioButtons['eipMediaFileUploadRadioButton'] &&
                  m_vnodeRadioButtons['eipMediaFileUploadRadioButton'].checked &&
                  m_vnodeRadioButtons['eipMediaFileUploadRadioButton'].checked == true ) {
            // upload the file selected to the module & select that file for the media tag
            // handleSave won't call getEditedXml()
        }
        else if ( m_vnodeRadioButtons['eipMediaModuleFileRadioButton'] != null &&
                  m_vnodeRadioButtons['eipMediaModuleFileRadioButton'].checked != null &&
                  m_vnodeRadioButtons['eipMediaModuleFileRadioButton'].checked == true ) {
            // select the module or work area file for the media tag
            iOptionIndex = m_nodeSelect.selectedIndex;
            if ( iOptionIndex >= 0 ) {
                //strMediaFile = m_nodeSelect.options[iOptionIndex].value;
                strMediaFile = m_nodeSelect.options[iOptionIndex].text;
            }
        }
        else if ( m_vnodeRadioButtons['eipMediaUriRadioButton'] &&
                  m_vnodeRadioButtons['eipMediaUriRadioButton'].checked &&
                  m_vnodeRadioButtons['eipMediaUriRadioButton'].checked == true ) {
            // select the Uri for the media tag
            if ( m_nodeFileUriInput.value && m_nodeFileUriInput.value.length > 0 ) {
                strMediaFile =  m_nodeFileUriInput.value;
            }
        }
        else {
            //return null;
        }

        bNothingSelected = ( strMediaFile == null || strMediaFile.length == 0 );
        if ( bNothingSelected ) {
            alert('Please select a file before saving.');
            return null;
        }

        vFileParts = strMediaFile.split('.');
        iLastFilePart = vFileParts.length-1;
        strFileExtension = ( vFileParts[iLastFilePart] != null ? vFileParts[iLastFilePart] : '' );

        // note that findMimeType() always returns a nonempty string.
        strMimeType = findMimeType(strFileExtension);
        strDefaultMimeType = findMimeType('');

        // Mime Type tap dancing
        if ( strMimeType == strDefaultMimeType ) {
            // a file is now being added to the media tag
            // whose file extension can not be mapped to a mime type.
            if ( m_strInitialMimeType == strMimeType ) {
                // adding a new media node: 
                //   we start by adding an empty media tag with the default mime type
                //   and editing it.  action: maintain the default mime type
                // editing an existing media node:
                //   initial mime type in the media node is the default.  action: maintain
                //   the default mime type
            }
            else {
                // editing an existing media node:
                //   initial mime type is not the default. thus, initial mime type is either valid
                //   or 'user assigned'.  if the file type does not change across the edit, the
                //   'user assign' mime type should persist.
                if ( m_strInitialFileExtension == strFileExtension ) {
                    strMimeType = m_strInitialMimeType;
                }
                else {
                    // a motivating case (not handled my our mime tap dancing)
                    //   foo.jpg with default mime type or the wrong mime type
                    // across an edit goes to
                    //   foo.jpg with mime type = 'image/jpeg'
                    // here we force the correct mime type.  users who do not believe in the
                    // standard mime typing system will be disappointed.

                    // for the current case, file type changed across the edit. new file type
                    // is not a valid mime file type. what to do? there are two possibilities:
                    //   i) foo.jpg -> foo.bar   // valid to invalid mime type
                    //   ii) foo.baz -> foo.bar  // invalid to invalid mime type
                    // forcing the correct mime type would mean making the mime type the default.
                    // this is what we do
                }
            }
        }

        strOpenTag = '<media type=\"' + strMimeType + '\" src=\"' + strMediaFile + '\">';
        strXml = addNamespacesToTagText(strOpenTag);
        if ( m_nodeParameterTextArea.value && m_nodeParameterTextArea.value.length > 0 ) {
            strXml += m_nodeParameterTextArea.value;
        }
        strXml += '</media>';

        return strXml;
    };

    function onPreviewMedia(strValue) {
        g_oWorkFlowStep.handlePreviewMedia(strValue);
    };

    function handlePreviewMedia(strValue) {
        // IE has some funkiness  via up & down arrow navigation across <OPTGROUP>,
        // labels in SELECT which can be selected :
        // "In this module:" and "In this work area:"
//alert('onPreviewMedia(' + strValue + ') called.');

        var vValueParts;
        var strMediaFile;
        var iImageWidth;
        var iImageHeight;
        var vFileParts;
        var iLastFilePart;
        var strFileExtension;
        var nodeNewFigurePreviewDiv;
        var bIsThisAFileWeCanDisplay;
        var nodeImage;
        var nodeText;

        // strValue is formatted string: 'file-url;width;size'
        vValueParts = strValue.split(';');
        strMediaFile = vValueParts[0];
        iImageWidth  = ( vValueParts[1] == null ? 0 : parseInt(vValueParts[1]) );
        iImageHeight = ( vValueParts[2] == null ? 0 : parseInt(vValueParts[2]) );

        vFileParts = strMediaFile.split('.');
        iLastFilePart = vFileParts.length-1;
        strFileExtension = vFileParts[iLastFilePart].toLowerCase();

        nodeNewFigurePreviewDiv = document.createElement('div');
        nodeNewFigurePreviewDiv.className = 'eipFigurePreview';

        bIsThisAFileWeCanDisplay = ( strFileExtension == 'jpg' ||
                                     strFileExtension == 'jpeg' ||
                                     strFileExtension == 'jpe' ||
                                     strFileExtension == 'gif' ||
                                     strFileExtension == 'png' );

        if ( bIsThisAFileWeCanDisplay ) {
            // determine from the browser window the available display bounding box
            //m_nodeMediaPreviewDiv.offsetWidth
            var iEditContainerWidth;
            var iCnxMainWidth;
            var iSelectWidth;
            var iSelectHeight;
            var iFigureSelectWidth;
            var iFigureSelectHeight;
            var iBoundingWidth = 512;
            var iBoundingHeight = 512;

            iEditContainerWidth = this.getHtmlEditContainerDiv().clientWidth;
            iCnxMainWidth = document.getElementById("cnx_main").offsetWidth;
            iSelectWidth = m_nodeSelect.clientWidth;
            iSelectHeight = m_nodeSelect.clientHeight;
            iFigureSelectWidth = m_nodeMediaPreviewDiv.offsetWidth;
            iFigureSelectHeight = m_nodeMediaPreviewDiv.offsetHeight;

            if ( iCnxMainWidth && iCnxMainWidth > 0 ) {
                iBoundingWidth = iCnxMainWidth - iSelectWidth - 150;
            }
            else {
                iBoundingWidth = iEditContainerWidth - iSelectWidth - 70;
            }
            iBoundingHeight = iSelectHeight;

            // if image is both taller and wider than bounding box, work out something with good proportions ...
            if ( iImageWidth > iBoundingWidth && iImageHeight > iBoundingHeight ) { 
                var iBoundingRatio = iBoundingWidth / iBoundingHeight;
                var iImageRatio = iImageWidth / iImageHeight;
                if ( iImageRatio > iBoundingRatio ) { // if it's essentially wide and short ...
                    // make it as wide as possible
                    var iImageResetWidth  = iBoundingWidth;
                    // and make the height proportional to its new width
                var iImageResetHeight = parseInt(iBoundingWidth  / iImageWidth  * iImageHeight); // no non-integers, please
                } else { // if it's essentially tall and skinny ...
                    // make it as tall as possible
                    var iImageResetHeight = iBoundingHeight;
                    // and make the width proportional to its new height
                    var iImageResetWidth  = parseInt(iBoundingHeight / iImageHeight * iImageWidth);  // no non-integers, please
                }
            // if image is just taller but not wider than bounding box ...
            } else if ( iImageHeight > iBoundingHeight ) { 
                var iImageResetHeight = iBoundingHeight; // squish it down and let the browser figure out the rest
            // if image is just wider but not taller than bounding box ...
            } else if ( iImageWidth  > iBoundingWidth  ) {  
                var iImageResetWidth  = iBoundingWidth;  // squish it in and let the browser figure out the rest
            }

            if ( Prototype.Browser.IE  ) {
                var strImageTag;
                strImageTag = '<img ';
                if ( iImageResetWidth ) {
                    strImageTag += 'width=\"' + iImageResetWidth + '\" ';
                }
                if ( iImageResetHeight ) {
                    strImageTag += 'height=\"' + iImageResetHeight + '\" ';
                }
                strImageTag += 'src=\"' + strMediaFile + '\">';
                nodeImage = document.createElement(strImageTag);
            }
            else {
                nodeImage = document.createElement('img');
                if ( iImageResetWidth ) {
                    nodeImage.setAttribute('width', '' + iImageResetWidth);
                }
                if ( iImageResetHeight ) {
                    nodeImage.setAttribute('height', '' + iImageResetHeight);
                }
                nodeImage.setAttribute('src', strMediaFile);
            }
            nodeNewFigurePreviewDiv.appendChild(nodeImage);
        }
        else {
            nodeText = document.createTextNode('File type cannot be previewed.');
            nodeNewFigurePreviewDiv.appendChild(nodeText);
        }

        replaceHtmlNode(nodeNewFigurePreviewDiv, this.getNodeMediaPreviewDiv());
        this.setNodeMediaPreviewDiv(nodeNewFigurePreviewDiv);
    };

    function downloadFiles(strUrl) {
        var docXml;
        var strFilesXml;
        var nodeRootXml;
        var vFiles;
        var oDate;
        var strTimeStamp; // in milli-seconds

        // add timestamp to our URL to defeat IE browser caching
        oDate = new Date();
        strTimeStamp = oDate.valueOf().toString();

        // make sync request for the list of module files
        gXMLHttpRequest.abort();
        gXMLHttpRequest.open("GET", strUrl + '?' + strTimeStamp, false);
        gXMLHttpRequest.send(undefined);
//alert('downloadFiles(' + strUrl + ') : server returns:\n' + gXMLHttpRequest.status);
//alert('downloadFiles(' + strUrl + ') : server returns:\n' + gXMLHttpRequest.responseText);

        if ( gXMLHttpRequest.status != 200 ) return ( vFile = new Array );

        strFilesXml = gXMLHttpRequest.responseText;
        docXml = parseXmlTextToDOMDocument(strFilesXml);
        nodeRootXml = docXml.documentElement;

        vFiles = parseFileList(nodeRootXml);

        return vFiles;
    };

    function downloadModuleFiles() {
        var strUrl;
        strUrl = './media_listing';
        return downloadFiles(strUrl);
    };

    function downloadWorkareaFiles() {
        var strUrl;
        strUrl = '../media_listing';
        return downloadFiles(strUrl);
    };

    function parseFileList(nodeXmlList) {
        if ( nodeXmlList ==  null ) return null;

        var i;
        var nodeListChild;
        var nodeMedia;
        var iMediaCount;
        var strFileUrl;
        var strFileName;
        var strFigureWidth;
        var strFigureHeight;
        var iFigureWidth;
        var iFigureHeight;
        var oFile;
        var vFiles;

        // never return null.  return an array with zero or more elements.
        vFiles = new Array;

        if ( nodeXmlList.nodeName == 'list' ) {
            iMediaCount = 0;
            for (i=0; i<nodeXmlList.childNodes.length; i++) {
                nodeListChild = nodeXmlList.childNodes[i];
                if ( nodeListChild.nodeName == 'media' ) {
                    nodeMedia = nodeListChild;

/*
Note this is the nonCNXML XML returned by the CNX server ...
<list>
  <media src="http://stevens.cnx.rice.edu:8080/Members/bnwest/WallaceAndGrommet.jpg"
         width="375" id="WallaceAndGrommet.jpg" height="275" />
*/
                    strFileUrl = nodeMedia.getAttribute('src');
                    strFileName = nodeMedia.getAttribute('id');
                    strFigureWidth = nodeMedia.getAttribute('width');
                    strFigureHeight = nodeMedia.getAttribute('height');
                    iFigureWidth = ( strFigureWidth && strFigureWidth.length > 0
                                       ? parseInt(strFigureWidth)
                                       : 0 );
                    iFigureHeight = ( strFigureHeight && strFigureHeight.length > 0
                                       ? parseInt(strFigureHeight)
                                       : 0 );

                    oFile = new Object;
                    oFile.strFileUrl    = strFileUrl;
                    oFile.strFileName   = strFileName;
                    oFile.iFigureWidth  = iFigureWidth;
                    oFile.iFigureHeight = iFigureHeight;

                    vFiles.push(oFile); oFile = null;
                    iMediaCount++;
                }
            }
            return vFiles;
        } else {
            return vFiles;  // array with zero elements
        }
    };
}
Media_WorkFlowStep.prototype = new WorkFlowStep();


function Figure_WorkFlowStep() {
    var m_nodeMediaRadioButton;
    var m_nodeTableRadioButton;
    var m_nodeCodeRadioButton;
    var m_nodeClosingTag;

    this.init = init;
    this.gotTitle = gotTitle;
    this.gotCaption = gotCaption;
    this.initializeXmlNode = initializeXmlNode;
    this.setupEditForm = setupEditForm;
    this.getEditedXml = getEditedXml;
    this.editNewChild = editNewChild;

    this.onServerEditRequestReturn     = onServerEditRequestReturn;
    this.onServerAddRequestReturn      = onServerAddRequestReturn;
    this.handleServerEditRequestReturn = handleServerEditRequestReturn;
    this.handleServerAddRequestReturn  = handleServerAddRequestReturn;

    init();

    return this;

    function init() {
        Figure_WorkFlowStep.prototype.init();

        m_nodeMediaRadioButton = null;
        m_nodeTableRadioButton = null;
        m_nodeCodeRadioButton = null;
        m_nodeClosingTag = null;
    };

    function gotTitle() {
        return true;
    };

    function gotCaption() {
        return true;
    };

    function initializeXmlNode(nodeXml) {
        // this function call may not need to be made since we are not going
        // to completely stub the <figure> tag out with either a media, code or table child.

        var strNewXml;
        var docXml;
        var nodeRootXml;

        strNewXml = '<motherofallnodes>' +
                    '  <title></title>\n' +
                    '  <caption></caption>\n' +
                    '</motherofallnodes>';

        // parse the new XMl with bogus tag
        docXml = parseXmlTextToDOMDocument(strNewXml);
        nodeRootXml = docXml.documentElement;

        // harvest the child of the parse via copying them destructively into nodeXml
        var bPreserveExisting = false;
        Sarissa.copyChildNodes(nodeRootXml, nodeXml, bPreserveExisting);

        strNewXml = serializeAndMassageXmlNode(nodeXml);

        return strNewXml;
    };

    function crackFigureXml(nodeFigure) {
        var oFigureParts;
        var i;

        if ( nodeFigure.nodeName.toLowerCase() == 'figure' ) {
            oFigureParts = new Object();

            for (i=0; i<nodeFigure.childNodes.length; i++) {
               nodeFigureChild = nodeFigure.childNodes[i];
               if ( nodeFigureChild.nodeName.toLowerCase() == 'label' ) {
                   oFigureParts.nodeLabel = nodeFigureChild;
               }
               else if ( nodeFigureChild.nodeName.toLowerCase() == 'title' ) {
                   oFigureParts.nodeTitle = nodeFigureChild;
               }
               else if ( nodeFigureChild.nodeName.toLowerCase() == 'media' ) {
                   oFigureParts.nodeMedia = nodeFigureChild;
               }
               else if ( nodeFigureChild.nodeName.toLowerCase() == 'table' ) {
                   oFigureParts.nodeTable = nodeFigureChild;
               }
               else if ( nodeFigureChild.nodeName.toLowerCase() == 'code' ) {
                   oFigureParts.nodeCode = nodeFigureChild;
               }
               else if ( nodeFigureChild.nodeName.toLowerCase() == 'caption' ) {
                   oFigureParts.nodeCaption = nodeFigureChild;
               }
               else if ( nodeFigureChild.nodeName.toLowerCase() == 'subfigure' ) {
                   if ( oFigureParts.vnodesSubfigure == null ) {
                       oFigureParts.vnodesSubfigure =  new Array;
                   }
                   oFigureParts.vnodesSubfigure.push(nodeFigureChild);
               }
            }
        }

        return oFigureParts;
    };

    function setupEditForm(strXml) {
        var oFigureParts;
        var oXmlCaptionParts;
        var oXmlParts;
        var oTitleXmlParts;
        var oCaptionXmlParts;
        var bEditingExistingNode;
        var strContents;
        var nodeWarningMessage;
        var nodeWarningText;
        var nodeHelpMessage;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeOpeningTag;
        var nodeTitleEdit;
        var strEditableText;
        var nodeText;
        var strTitle;
        var nodeFigureTypeRadioButtonsDiv;
        var nodeSelectTypeText;
        var nodeRadioButtonText;
        var nodeCaptionEditDiv;
        var strCaption;
        var nodeClosingTagText;
        var nodeLabelText;
        var nodeCancelButton;
        var nodeDeleteButton;
        var strHtmlRadioButtons;
        var i;
        var nodeChild;
        var nodeXmlSubfigure;
        var nodeHtmlClone;

        oFigureParts = crackFigureXml(this.getEditedXmlNode());
        oXmlParts = this.crackXml(strXml, this.getEditedXmlNode());

        bEditingExistingNode = this.getEditingExistingNode();

        this.setOpenTag(oXmlParts.strOpenTag);
        strContents = oXmlParts.strContents;
        this.setCloseTag(oXmlParts.strCloseTag);
        oTitleXmlParts = oXmlParts.oTitleXmlParts;
        if ( oTitleXmlParts && oTitleXmlParts.strOpenTag ) {
            this.setTitleOpenTag(oTitleXmlParts.strOpenTag);
        }
        oCaptionXmlParts = oXmlParts.oCaptionXmlParts;
        if ( oCaptionXmlParts && oCaptionXmlParts.strOpenTag ) {
            this.setCaptionOpenTag(oCaptionXmlParts.strOpenTag);
        }

        // <DIV id='eipEditContainer'>
        this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
        $('eipMasterEditContainerDiv').innerHTML = ' ';

        //    <div class="eipPopUps">
        var nodePopups = document.createElement('div');
        nodePopups.className = 'eipPopUps';
        //   <DIV class="eipHelpMessage"><A></A></DIV>
        nodeHelpMessage = document.createElement('div');
        nodeHelpMessage.className = 'eipHelpMessage';
        nodeHelpLink = document.createElement('a');
        nodeHelpLink.onclick = function(event){openHelp(g_oWorkFlowStep.getEditedXmlTag());};
        nodeHelpText = document.createTextNode('Help editing <' + 'figure' + '>');
        nodeHelpLink.appendChild(nodeHelpText);
        nodeHelpMessage.appendChild(nodeHelpLink);
        nodePopups.appendChild(nodeHelpMessage);
        // Add launch button for MathEditor
        MathEditor.addLaunchButton(nodePopups);
        //     </div>
        this.getHtmlEditContainerDiv().appendChild(nodePopups);
        


        // <DIV class="eipOpeningTagLabel"> opening tag </DIV>
        nodeOpeningTag = document.createElement('div');
        nodeOpeningTag.className = 'eipOpeningTagLabel';
        nodeOpeningTagText = document.createTextNode(this.getOpenTag());
        nodeOpeningTag.appendChild(nodeOpeningTagText);
        this.getHtmlEditContainerDiv().appendChild(nodeOpeningTag);

        // <DIV class='eipTitleDiv'>Title (optional): <INPUT type="text" size="40" /></DIV>
        if ( oTitleXmlParts ) {
            strTitle = ( oTitleXmlParts.strContents ? oTitleXmlParts.strContents : '' );
        }
        else {
            strTitle = '';
        }
        nodeTitleEdit = document.createElement('div');
        nodeTitleEdit.className = 'eipTitleDiv';
        nodeText = document.createTextNode('Title (optional):');
        nodeTitleEdit.appendChild(nodeText);
        this.setTitleInput(document.createElement('input'));
        this.getTitleInput().setAttribute('type', 'text');
        this.getTitleInput().setAttribute('size', '40');
        this.getTitleInput().value = strTitle.replace(/\n/g, " ");
        nodeTitleEdit.appendChild(this.getTitleInput());
        this.getHtmlEditContainerDiv().appendChild(nodeTitleEdit);

        if ( bEditingExistingNode ) {
            // <TEXTAREA class="eipXMLEditor" rows="7"/> stuff to edit </TEXTAREA>
            this.setTextArea(document.createElement('textarea'));
            this.getTextArea().className = 'eipXMLEditor';
            this.getTextArea().setAttribute('rows', g_strFigureTextEditBoxSize);
            if ( strContents ) {
                this.getTextArea().value = strContents;
            }
            this.getHtmlEditContainerDiv().appendChild(this.getTextArea());
        }
        else {
            // DEAD CODE
            // radio buttons for media, table, and code.
            if ( Prototype.Browser.IE ) {
                nodeFigureTypeRadioButtonsDiv = document.createElement('div');
                nodeFigureTypeRadioButtonsDiv.className = 'eipFigureTypeRadioButtons';

                strHtmlRadioButtons = 'Select the figure type:';
                strHtmlRadioButtons += '<input type=\'radio\' name=\'FigureTypeRadioButtons\' value=\'media\' checked=\'checked\'/>media';
                strHtmlRadioButtons += '<input type=\'radio\' name=\'FigureTypeRadioButtons\' value=\'table\' />table';
                strHtmlRadioButtons += '<input type=\'radio\' name=\'FigureTypeRadioButtons\' value=\'code\' />code';
                nodeFigureTypeRadioButtonsDiv.innerHTML = strHtmlRadioButtons;

                for (i=0; i<nodeFigureTypeRadioButtonsDiv.childNodes.length; i++) {
                    nodeChild = nodeFigureTypeRadioButtonsDiv.childNodes[i];
                    if ( nodeChild.nodeName.toLowerCase() == 'input' ) {
                        if      ( nodeChild.value.toLowerCase() == 'media' ) m_nodeMediaRadioButton = nodeChild;
                        else if ( nodeChild.value.toLowerCase() == 'table' ) m_nodeTableRadioButton = nodeChild;
                        else if ( nodeChild.value.toLowerCase() == 'code'  ) m_nodeCodeRadioButton  = nodeChild;
                    }
                }

                this.getHtmlEditContainerDiv().appendChild(nodeFigureTypeRadioButtonsDiv);
            }
            else {
                // FIXME???
                //   dead code for now, but maybe not later.
                //   figures can not be added from the add drop down. figures are
                //   containers for media, table, and code nodes, each of which
                //   can add or remove an enclosing figure from their edit UI.

                // to be precise, the above code did not work in FF Preview mode

                nodeFigureTypeRadioButtonsDiv = document.createElement('div');
                nodeFigureTypeRadioButtonsDiv.className = 'eipFigureTypeRadioButtons';
                nodeSelectTypeText = document.createTextNode('Select the figure type:');
                nodeFigureTypeRadioButtonsDiv.appendChild(nodeSelectTypeText);

                // <input type='radio' name='FigureTypeRadioButtons' value='media'><media>
                m_nodeMediaRadioButton = document.createElement('input');
                m_nodeMediaRadioButton.setAttribute('type', 'radio');
                m_nodeMediaRadioButton.setAttribute('name', 'FigureTypeRadioButtons');
                m_nodeMediaRadioButton.setAttribute('value', 'media');
                m_nodeMediaRadioButton.setAttribute('checked', 'checked');  // making the media type the default
                nodeFigureTypeRadioButtonsDiv.appendChild(m_nodeMediaRadioButton);
                nodeRadioButtonText = document.createTextNode('<media>');
                nodeFigureTypeRadioButtonsDiv.appendChild(nodeRadioButtonText);

                // <input type='radio' name='FigureTypeRadioButtons' value='table'><table>
                m_nodeTableRadioButton = document.createElement('input');
                m_nodeTableRadioButton.setAttribute('type', 'radio');
                m_nodeTableRadioButton.setAttribute('name', 'FigureTypeRadioButtons');
                m_nodeTableRadioButton.setAttribute('value', 'table');
                nodeFigureTypeRadioButtonsDiv.appendChild(m_nodeTableRadioButton);
                nodeRadioButtonText = document.createTextNode('<table>');
                nodeFigureTypeRadioButtonsDiv.appendChild(nodeRadioButtonText);

                // <input type='radio' name='FigureTypeRadioButtons' value='code'><code>
                m_nodeCodeRadioButton = document.createElement('input');
                m_nodeCodeRadioButton.setAttribute('type', 'radio');
                m_nodeCodeRadioButton.setAttribute('name', 'FigureTypeRadioButtons');
                m_nodeCodeRadioButton.setAttribute('value', 'code');
                nodeFigureTypeRadioButtonsDiv.appendChild(m_nodeCodeRadioButton);
                nodeRadioButtonText = document.createTextNode('<code>');
                nodeFigureTypeRadioButtonsDiv.appendChild(nodeRadioButtonText);

                this.getHtmlEditContainerDiv().appendChild(nodeFigureTypeRadioButtonsDiv);
            }
        }

        // <DIV class="eipCaptionDiv"> <caption> <TEXTAREA rows="2"></TEXTAREA> </caption> (optional) </DIV>
        if ( oCaptionXmlParts ) {
            strCaption = ( oCaptionXmlParts.strContents ? oCaptionXmlParts.strContents : '' );
        }
        else {
            strCaption = '';
        }
        nodeCaptionEditDiv = document.createElement('div');
        nodeCaptionEditDiv.className = 'eipCaptionDiv';
        nodeText = document.createTextNode('Caption (optional):');
        nodeCaptionEditDiv.appendChild(nodeText);
        this.setCaptionInput(document.createElement('textarea'));
        if ( Prototype.Browser.Gecko ) this.getCaptionInput().setAttribute('rows', '1');
        else                           this.getCaptionInput().setAttribute('rows', '2');
        this.getCaptionInput().value = strCaption;
        nodeCaptionEditDiv.appendChild(this.getCaptionInput());
        this.getHtmlEditContainerDiv().appendChild(nodeCaptionEditDiv);

        // <DIV class="eipClosingTagLabel"> closing tag </DIV>
        m_nodeClosingTag = document.createElement('div');
        m_nodeClosingTag.className = 'eipClosingTagLabel';
        nodeClosingTagText = document.createTextNode(this.getCloseTag());
        m_nodeClosingTag.appendChild(nodeClosingTagText);
        this.getHtmlEditContainerDiv().appendChild(m_nodeClosingTag);

        // <BUTTON class="eipSaveButton" alt="Save">Save  </BUTTON>
        this.setSaveButton(document.createElement('button'));
        this.getSaveButton().className = 'eipSaveButton';
        nodeLabelText = document.createTextNode('Save');
        this.getSaveButton().setAttribute('alt', 'Save');
        Event.observe(this.getSaveButton(), 'click',
                      this.onSave.bindAsEventListener(this));
        this.getSaveButton().appendChild(nodeLabelText);
        this.getSaveButton().disabled = false;
        this.getHtmlEditContainerDiv().appendChild(this.getSaveButton());

        // <BUTTON alt="Cancel" class="eipCancelButton">Cancel  </BUTTON>
        nodeCancelButton = document.createElement('button');
        nodeCancelButton.className = 'eipCancelButton';
        nodeCancelButton.setAttribute('alt', "Cancel");
        nodeLabelText = document.createTextNode('Cancel');
        nodeCancelButton.appendChild(nodeLabelText);
        Event.observe(nodeCancelButton, 'click',
                      this.onCancel.bindAsEventListener(this));
        this.getHtmlEditContainerDiv().appendChild(nodeCancelButton);

        // <BUTTON alt="Delete" class="eipDeleteButton">Delete  </BUTTON>
        var bIsNodeDeletable;
        bIsNodeDeletable = isNodeDeletable(this.getEditedHtmlNode());

        if ( bEditingExistingNode && bIsNodeDeletable ) {
            nodeDeleteButton = document.createElement('button');
            nodeDeleteButton.className = 'eipDeleteButton';
            nodeDeleteButton.setAttribute('alt', 'Delete');
            nodeLabelText = document.createTextNode('Delete');
            nodeDeleteButton.appendChild(nodeLabelText);
            Event.observe(nodeDeleteButton, 'click',
                          this.onDelete.bindAsEventListener(this));
            nodeDeleteButton.disabled = false;
            this.getHtmlEditContainerDiv().appendChild(nodeDeleteButton);
        }

        // </div>

        // before we clone the node, we must first remove the event callbacks
        // recursively from the HTML tree rooted by the edited html node.
        stopObserving(this.getEditedHtmlNode());

        // clone the edited html node.
        nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
        this.setEditedHtmlNodeClone(nodeHtmlClone);
    };

    function getEditedXml() {
        var strXml;
        var strTagContents;
        var nodeTitleInput;
        var strTitle;
        var strTitleXml;
        var strLabelCnxml;
        var strCaption;
        var strCaptionXml;
        var bEditingExistingNode;
        var nodeTableXml;
        var strTableXml;
        var strLabelCnxml;
        var reLabelCnxml;

        bEditingExistingNode = this.getEditingExistingNode();

        if ( bEditingExistingNode ) {
            strTagContents = this.getTextArea().value.replace(/^\s+/,'');

            nodeTitleInput = this.getTitleInput();
            if ( nodeTitleInput ) {
                strTitle = nodeTitleInput.value;
                strTitleXml = '';
                if ( strTitle && strTitle.length > 0 ) {
                    strTitleXml = ( this.getTitleOpenTag() ? this.getTitleOpenTag() : '<title>' );
                    strTitleXml += strTitle;
                    strTitleXml += '</title>';
                }
                if ( strTitleXml.length > 0 ) {
                    // must come after label (which may or may not be hiding out in strTagContents),
                    // else must be first thing
                    strXml = addNamespacesToTagText(this.getOpenTag());
                    strXml += strTagContents;
                    strXml += this.getCloseTag();
                    strLabelCnxml = this.getEditedLabel(strXml);
                    if ( strLabelCnxml && strLabelCnxml.length > 0 ) {
                        reLabelCnxml = escapeRegularExpression(strLabelCnxml);
                        strTagContents = strTagContents.replace(reLabelCnxml, strLabelCnxml + strTitleXml);
                    }
                    else {
                        strTagContents = strTitleXml + strTagContents;
                    }
                }
            }

            nodeCaptionInput = this.getCaptionInput();
            if ( nodeCaptionInput ) {
                strCaption  = nodeCaptionInput.value;
                strCaptionXml = '';
                if ( strCaption && strCaption.length > 0 ) {
                    strCaptionXml = ( this.getCaptionOpenTag() ? this.getCaptionOpenTag() : '<caption>' );
                    strCaptionXml += strCaption;
                    strCaptionXml += '</caption>';
                }
                if ( strCaptionXml.length > 0 ) {
                    strTagContents = strTagContents + strCaptionXml;
                }
            }

            strXml = addNamespacesToTagText(this.getOpenTag());
            strXml += strTagContents;
            strXml += this.getCloseTag();
        }
        else {
            // DEAD CODE
            strXml = addNamespacesToTagText(this.getOpenTag());

            if ( this.getTitleInput() && this.getTitleInput().value && this.getTitleInput().value.length > 0 ) {
                strXml += '<title>' + this.getTitleInput().value + '</title>';
            }

            // nodeRadioButton.setAttribute('name', 'FigureTypeRadioButtons');
            // nodeRadioButton.setAttribute('value', 'code' or 'table' or 'media');
            // radio_button.checked returns true or false

            if ( m_nodeMediaRadioButton.checked ) {
                //  IE tom foolery abounds.  IE ate HTML <object> nodes to which what the
                //  CNXML <media> gets translated.  No <object> with class = "media" => EiP
                //  XPath magic fails.  The workaround is to translate to a HTML <div> container
                //  with class = "media" for the <object> node.
                strXml += '<media type=\"\" src=\"\"></media>';
            }
            else if ( m_nodeTableRadioButton.checked ) {
                nodeTableXml = createElementNS(gSource.doc, 'table');
                addIdToXmlNode(nodeTableXml, createUniqueId());

                var oTable_WorkFlow;
                oTable_WorkFlow = new Table_WorkFlowStep();
                strTableXml = oTable_WorkFlow.initializeXmlNode(nodeTableXml);
                oTable_WorkFlow = null;

                strXml += strTableXml;
            }
            else if ( m_nodeCodeRadioButton.checked ) {
                strXml += '<code type=\'block\'></code>';
            }

            if ( this.getCaptionInput() &&
                 this.getCaptionInput().value &&
                 this.getCaptionInput().value.length > 0 ) {
                strXml += '<caption>' + this.getCaptionInput().value + '</caption>';
            }

            strXml += this.getCloseTag();
        }

        return strXml;
    };

    function onServerEditRequestReturn() {
        g_oWorkFlowStep.handleServerEditRequestReturn();
    };

    function onServerAddRequestReturn() {
        g_oWorkFlowStep.onServerAddRequestReturn();
    };

    function handleServerEditRequestReturn() {
        if (gEditNodeInfo.state != STATE_VALIDATING ||
            gRequest.xhr.readyState != XHR_COMPLETED)
            return;

        Figure_WorkFlowStep.prototype.handleServerEditRequestReturn();

        var bAddingNewNode;

        bAddingNewNode = ( this.getEditingExistingNode() == false );
        if ( bAddingNewNode ) {
            editNewChild();
        }
    };

    function handleServerAddRequestReturn() {
        if (gEditNodeInfo.state != STATE_VALIDATING ||
            gRequest.xhr.readyState != XHR_COMPLETED)
            return;

        Figure_WorkFlowStep.prototype.handleServerAddRequestReturn();

        // post add functionality. trigger editing the newly add figure child: media, table, or code ...
        // FIXME
        // dead code.  we do not allow figures to be inserted.  edited yes.  inserted no.

        var bAddingNewNode;

        bAddingNewNode = ( this.getEditingExistingNode() == false );
        if ( bAddingNewNode ) {
            this.editNewChild();
        }
    };

    function editNewChild() {
        //  FIXME
        //   dead code???

        // we get here when we have added a new figure.  we have created a empty
        // {media, table, code} Xml node.  we want to go ahead and simulate the user
        // clicking the new empty node.

        var nodeFigure;
        var nodeEditableFigureChild;
        var strXmlNodeName;
        var oWorkFlowStep;
        var bEditingExistingNode;

        nodeFigure = this.getEditedHtmlNode();
        if ( nodeFigure == null ) return;  // and pretend this never happened ;)

        // 'this' should be the figure node; we need to find the child that is
        // either media, table, or code.
        nodeEditableFigureChild = findEditableChild(nodeFigure);
        if ( nodeEditableFigureChild == null ) return;  // and pretend this never happened ;)

        strXmlNodeName = nodeEditableFigureChild.className.split(" ")[0];

        bEditingExistingNode = true;

        oWorkFlowStep = createWorkFlowStep(strXmlNodeName, bEditingExistingNode);
        // g_oWorkFlowStep is now reset.

        oWorkFlowStep.editNode(nodeEditableFigureChild);
    };

    function findEditableChild(nodeHtml) {
        var i;
        var nodeChildHtml;
        var strXmlNodeName;

        // recursicve search for an editable child of a figure.
        // we visit each child of a parent before visit its grandchildren.

        for (i=0; i<nodeHtml.childNodes.length; i++) {
            nodeChildHtml = nodeHtml.childNodes[i];
            if ( nodeChildHtml.className ) {
                strXmlNodeName = nodeChildHtml.className.split(" ")[0];
                if ( strXmlNodeName == 'media' || strXmlNodeName == 'table' || strXmlNodeName == 'code' ) {
                    return nodeChildHtml;
                }
            }
        }

        for (i=0; i<nodeHtml.childNodes.length; i++) {
            nodeChildHtml = nodeHtml.childNodes[i];
            if ( nodeChildHtml.childNodes ) {
                nodeEditableDescendent = findEditableChild(nodeChildHtml);
                if ( nodeEditableDescendent ) {
                    return nodeEditableDescendent;
                }
            }
        }

        return null;
    };
}
Figure_WorkFlowStep.prototype = new WorkFlowStep();


function Table_WorkFlowStep() {
    // private member variables
    // access private member directly and not via 'this'
    var m_iRows;
    var m_iColumns;
    var m_strTableTag;
    var m_vTGroups;
    var m_strTableLabelXml;
    var m_strTableTitle;
    var m_strTableCaption;
    var m_strTableAccess;
    var m_bSmartEdit;
    var m_nodeHeaderSpan;
    var m_nodeTable;
    var m_nodeTableBody;
    var m_nodeAccessInput;
    var c_ROW_ELEMENT_LIMIT = 1000; // used to throw a 'you're about to do something stupid' warning messages when passed

    m_iRows = 3;
    m_iColumns = 3;

    // public variables
    //   assignemnts make private methods public methods
    this.init = init;
    this.gotTitle = gotTitle;
    this.gotCaption = gotCaption;
    this.cleanup = cleanup;
    this.setupEditForm = setupEditForm;
    this.displayEditForm = displayEditForm;
    this.setRows = setRows;
    this.initializeXmlNode = initializeXmlNode;
    this.getEditedXml = getEditedXml;

    this.onResizeTable = onResizeTable;
    this.handleResizeTable = handleResizeTable;

    init();

    return this;

    function init() {
        Table_WorkFlowStep.prototype.init();

        m_iRows = 0;
        m_iColumns = 0;
        m_strTableTag = null;
        m_vTGroups =  null;
        m_strTableLabelXml = null;
        m_strTableTitle = null;
        m_strTableCaption = null;
        m_strTableAccess = null;
        m_bSmartEdit = null;
        m_nodeHeaderSpan = null;
        m_nodeTable = null;
        m_nodeTableBody = null;
        m_nodeAccessInput = null;
    };

    function gotTitle() {
        return true;
    };

    function gotCaption() {
        return true;
    };

    function initializeXmlNode(nodeXml) {
        // called only when Xml node is first added

        var i;
        var j;
        var strContents;
        var strRow;
        var strColumn;
        var docXml;
        var nodeRootXml;
        var strNewXml;

        m_iRows = 3;
        m_iColumns = 3;

        // add access.text attribute to xml node
        nodeXml.setAttribute('summary', '');

        strContents = '<motherofallnodes>';

        //  <tgroup cols="3">
        strContents += '<tgroup cols=\"3\">';

        // <tbody>
        strContents += '<tbody>';

        for (i=1; i<=m_iRows; i++) {
            // <row>
            strRow = '\n  <row>';
            for (j=1; j<=m_iColumns; j++) {
                // <entry>(i,j)</entry>
                strColumn = '\n    <entry>(' + i + ',' + j + ')</entry>';
                strRow += strColumn;
            }
            // </row>
            strRow += '\n  </row>';
            strContents += strRow;
        }

        // </tbody>
        strContents += '\n</tbody>';

        // </tgroup>
        strContents += '</tgroup>';

        strContents += '</motherofallnodes>';

        // parse strContents
        docXml = parseXmlTextToDOMDocument(strContents);

        // add as children to nodeXml
        nodeRootXml = docXml.documentElement;

        var bPreserveExisting = false;
        Sarissa.copyChildNodes(nodeRootXml, nodeXml, bPreserveExisting);

        strNewXml = serializeAndMassageXmlNode(nodeXml);
        if ( Prototype.Browser.IE ) {
            // IE inserts tabs we do not want.
            strNewXml = strNewXml.replace(/\t/g, "  ");
        }

        return strNewXml;
    };

    function cleanup() { m_iRows = 0; m_iColumns = 0; m_bSmartEdit = false; };

    function setRows(iRows) {
        m_iRows = iRows;
    };

    function setupEditForm(strXml) {
        var nodeTableChild;
        var nodeTGroup;
        var i;
        var oTGroup;
        var dimensions;
        var bTableContainsSpans;
        var nodeWarningMessage;
        var nodeWarningText;
        var nodeHelpMessage;
        var nodeHelpLink;
        var nodeHelpText;
        var nodeHeaderText;
        var nodeNameDiv;
        var nodeNameLabel;
        var nodeCaptionDiv;
        var nodeCaptionLabel;
        var nodeLabelText;
        var nodeInput;
        var nodeTextArea;
        var nodeOpenLabelDiv;
        var nodeOpenLabel;
        var nodeCloseLabelDiv;
        var nodeCloseLabel;
        var nodeCancelButton;
        var nodeDeleteButton;
        var nodeText;
        var nodeTextSpan;
        var nodeHtmlClone;
        var nodeTableLabel;
        var nodeTableTitle;
        var nodeTableCaption;
        var nodeAccessLabelTextDiv;
        var strLabelXml;
        var strTitleXml;
        var strCaptionXml;
        var strTitle;
        var strCaption;
        var oXmlParts;
        var strTableTagWithoutSummary;

        bTableContainsSpans = doesTableContainSpans(this.getEditedXmlNode());
        m_bSmartEdit =  ( bTableContainsSpans == false );

        if ( m_bSmartEdit ) {
            // only want to allow our 'smart' edit when when every row
            // has a single entry per column, ie no column or row spanning
            // and no rows with missing columns.  need this restriction
            // since smart table editing can grow and shrink table via resize.

            m_vTGroups = new Array;

            // set m_strTableTag
            strXml.replace(/^(<table[\w\W]*?>)/,
                           function(wholeMatch) { m_strTableTag = wholeMatch; });

            strTableTagWithoutSummary = removeTagSummary(m_strTableTag);

            for ( i = 0; i < this.getEditedXmlNode().childNodes.length; i++) {
                nodeTableChild = this.getEditedXmlNode().childNodes[i];
                if ( nodeTableChild.nodeName == 'tgroup' ) {
                    nodeTGroup = nodeTableChild;
                    oTGroup =  new Object;
                    oTGroup.m_str = serializeAndMassageXmlNode(nodeTGroup);

                    // determine table dimensions from the table subtree in the XML DOM.
                    dimensions = countRowsAndColumns(nodeTGroup);
                    var bSomethingWickedThisWayComes =
                        ( dimensions.m_iColumns != dimensions.m_iExpectedColumns );

                    oTGroup.m_iRows    = dimensions.m_iRows;
                    oTGroup.m_iColumns = dimensions.m_iColumns;
                    oTGroup.m_nodeEditedHtmlOpenLabelText = null;
                    oTGroup.m_nodeEditedHtmlTextArea = null;

                    m_vTGroups.push(oTGroup);
                } else if ( nodeTableChild.nodeName == 'label' ) {
                    nodeTableLabel = nodeTableChild;
                    strLabelXml = serializeAndMassageXmlNode(nodeTableLabel);
                    m_strTableLabelXml = strLabelXml;
                } else if ( nodeTableChild.nodeName == 'title' ) {
                    nodeTableTitle = nodeTableChild;
                    strTitleXml = serializeAndMassageXmlNode(nodeTableTitle);
                    oXmlParts = this.crackXml(strTitleXml, nodeTableTitle);
                    this.setTitleOpenTag(oXmlParts.strOpenTag); // m_strTableTitleOpenTag
                    m_strTableTitle = oXmlParts.strContents;
                } else if ( nodeTableChild.nodeName == 'caption' ) {
                    nodeTableCaption = nodeTableChild;
                    strCaptionXml = serializeAndMassageXmlNode(nodeTableCaption);
                    oXmlParts = this.crackXml(strCaptionXml, nodeTableCaption);
                    this.setCaptionOpenTag(oXmlParts.strOpenTag); // m_strTableCaptionOpenTag
                    m_strTableCaption = oXmlParts.strContents;
                }
            }
            if ( m_strTableCaption == null ) {
                m_strTableCaption = "";
            }
            if ( this.getEditedXmlNode().getAttribute('summary') != null ) {
                m_strTableAccess = this.getEditedXmlNode().getAttribute('summary');
            } else {
                m_strTableAccess = "";
            }

            // <DIV id='eipEditContainer'>
            this.setHtmlEditContainerDiv($('eipMasterEditContainerDiv'));
            $('eipMasterEditContainerDiv').innerHTML = ' ';

            //    <div class="eipPopUps">
            var nodePopups = document.createElement('div');
            nodePopups.className = 'eipPopUps';
            //   <DIV class="eipHelpMessage"><A></A></DIV>
            nodeHelpMessage = document.createElement('div');
            nodeHelpMessage.className = 'eipHelpMessage';
            nodeHelpLink = document.createElement('a');
            nodeHelpLink.onclick = function(event){openHelp(g_oWorkFlowStep.getEditedXmlTag());};
            nodeHelpText = document.createTextNode('Help editing <' + this.getEditedXmlTag() + '>');
            nodeHelpLink.appendChild(nodeHelpText);
            nodeHelpMessage.appendChild(nodeHelpLink);
            nodePopups.appendChild(nodeHelpMessage);
            // Add launch button for MathEditor
            MathEditor.addLaunchButton(nodePopups);
            //     </div>
            this.getHtmlEditContainerDiv().appendChild(nodePopups);

            // <DIV class="eipOpeningTagLabel"> opening tag </DIV>
            nodeOpeningTag = document.createElement('div');
            nodeOpeningTag.className = 'eipOpeningTagLabel';
            nodeOpeningTagText = document.createTextNode(strTableTagWithoutSummary);
            nodeOpeningTag.appendChild(nodeOpeningTagText);
            this.getHtmlEditContainerDiv().appendChild(nodeOpeningTag);

            //   <DIV class="eipTitleDiv">Title (optional): <INPUT type="text" size="40" /></DIV>
            nodeNameDiv = document.createElement('div');
            nodeNameDiv.className = 'eipTitleDiv';
            this.getHtmlEditContainerDiv().appendChild(nodeNameDiv);
            nodeLabelText = document.createTextNode('Title (optional): ');
            nodeNameDiv.appendChild(nodeLabelText);
            //     <input type="text" class="eipTitle" />
            this.setTitleInput(document.createElement('input'));
            this.getTitleInput().setAttribute('type', 'text');
            this.getTitleInput().setAttribute('size', '40');
            this.getTitleInput().className = 'eipTitle';
            if ( m_strTableTitle ) {
                this.getTitleInput().setAttribute('value', m_strTableTitle.replace(/\n/g, " "));
            }
            nodeNameDiv.appendChild(this.getTitleInput());
            //   </div>

            for (i=0; i<m_vTGroups.length; i++) {
                //   <div class="eipInputDiv">
                nodeNameDiv = document.createElement('div');
                nodeNameDiv.className = 'eipInputDiv';
                this.getHtmlEditContainerDiv().appendChild(nodeNameDiv);
                //     Rows:
                nodeLabelText = document.createTextNode('Rows: ');
                nodeNameDiv.appendChild(nodeLabelText);
                //     <input type="text" class="eipRowInput" value="3" />
                nodeInput = document.createElement('input');
                nodeInput.setAttribute('type', 'text');
                nodeInput.setAttribute('size', '3');
                nodeInput.className = 'eipRowInput';
                nodeInput.setAttribute('value', String(m_vTGroups[i].m_iRows));
                nodeNameDiv.appendChild(nodeInput);
                m_vTGroups[i].nodeRowsInput = nodeInput; nodeInput = null;
                //     Columns:
                nodeLabelText = document.createTextNode('Columns: ');
                nodeNameDiv.appendChild(nodeLabelText);
                //     <input type="text" class="eipColumnInput" value="3" />
                nodeInput = document.createElement('input');
                nodeInput.setAttribute('type', 'text');
                nodeInput.setAttribute('size', '3');
                nodeInput.className = 'eipColumnInput';
                nodeInput.setAttribute('value', String(m_vTGroups[i].m_iColumns));
                nodeNameDiv.appendChild(nodeInput);
                m_vTGroups[i].nodeColumnsInput = nodeInput; nodeInput = null;
                //     <input type="button" class="eipResizeTableButton" value="Resize table" />
                nodeInput = document.createElement('input');
                nodeInput.setAttribute('type', 'button');
                nodeInput.className = 'eipResizeTableButton';
                nodeInput.setAttribute('value', 'Resize table');
                Event.observe(nodeInput, 'click',
                              onResizeTable.bindAsEventListener(Table_WorkFlowStep));
                nodeNameDiv.appendChild(nodeInput);
                m_vTGroups[i].nodeResizeButton = nodeInput; nodeInput = null;

                // crack the <tgroup> string.
                var strOpenTgroup;
                var strCloseTgroup;
                var strEditableTGroupXml = m_vTGroups[i].m_str.replace(
                    /^(<tgroup[\w\W]*?>)([\w\W]*)(<\/tgroup[\w\W]*?>)/,
                    function(wholeMatch, openTag, contents, closeTag) {
                        strOpenTgroup = openTag;
                        strCloseTgroup = closeTag;
                        return contents;
                    });
                //m_vTGroups[i].m_strTGroupTag = strOpenTgroup;

                //     <div class="eipOpeningTagLabel" > '<tgroup cols="3">' </div>
                nodeOpenLabelDiv = document.createElement('div');
                nodeOpenLabelDiv.className = 'eipOpeningTagLabel';
                nodeOpenLabel = document.createTextNode(strOpenTgroup);
                nodeOpenLabelDiv.appendChild(nodeOpenLabel);
                nodeNameDiv.appendChild(nodeOpenLabelDiv);
                m_vTGroups[i].m_nodeEditedHtmlOpenLabelText = nodeOpenLabel;
                //     <textarea class="eipXMLEditor" rows="7">
                nodeTextArea = document.createElement('textarea');
                nodeTextArea.className = 'eipXMLEditor';
                nodeTextArea.setAttribute('rows', g_strTableTextEditBoxSize);
                nodeTextArea.value = strEditableTGroupXml;
                nodeNameDiv.appendChild(nodeTextArea);
                m_vTGroups[i].m_nodeEditedHtmlTextArea = nodeTextArea;
                //     </textarea>
                //     <div class="eipClosingingTagLabel" > '</tgroup>' </div>
                nodeCloseLabelDiv = document.createElement('div');
                nodeCloseLabelDiv.className = 'eipClosingTagLabel';
                nodeCloseLabel = document.createTextNode(strCloseTgroup);
                nodeCloseLabelDiv.appendChild(nodeCloseLabel);
                nodeNameDiv.appendChild(nodeCloseLabelDiv);
                //   </div>
            }

            //   <div class="eipTableCaption">Caption (optional):
            nodeCaptionDiv = document.createElement('div');
            nodeCaptionDiv.className = 'eipCaptionDiv';
            nodeLabelText = document.createTextNode('Caption (optional): ');
            nodeCaptionDiv.appendChild(nodeLabelText);
            //     <input type="text" class="eipCaption" />
            this.setCaptionInput(document.createElement('textarea'));
            if ( Prototype.Browser.Gecko ) this.getCaptionInput().setAttribute('rows', '1');
            else                           this.getCaptionInput().setAttribute('rows', '2');
            this.getCaptionInput().className = 'eipCaption';
            this.getCaptionInput().value = m_strTableCaption;
            nodeCaptionDiv.appendChild(this.getCaptionInput());
            nodeNameDiv.appendChild(nodeCaptionDiv);

            //   <div class="eipTableAccess">Description, for accessibility (required):
            nodeAccessDiv = document.createElement('div');
            nodeAccessDiv.className = 'eipTableAccess';
            //     <div class="eipHelpMessage">(<a>What's this?</a>)</div>
            nodeHelpMessage = document.createElement('div');
            nodeHelpMessage.className = 'eipPopUps';
            nodeLabelText = document.createTextNode('(');
            nodeHelpMessage.appendChild(nodeLabelText);
            nodeHelpLink = document.createElement('a');
            nodeHelpLink.onclick = function(event){openHelp('terminology#cnx_eip_help_define_table_summary_section');};
            nodeHelpText = document.createTextNode("What's this?");
            nodeHelpLink.appendChild(nodeHelpText);
            nodeHelpMessage.appendChild(nodeHelpLink);
            nodeLabelText = document.createTextNode(')');
            nodeHelpMessage.appendChild(nodeLabelText);
            nodeAccessDiv.appendChild(nodeHelpMessage);
            //     <div class="eipAccessTextLabel">Description, for accessibility (required): </div>
            nodeAccessLabelTextDiv = document.createElement('div');
            nodeAccessLabelTextDiv.className = 'eipAccessTextLabel';
            nodeLabelText = document.createTextNode('Description, for accessibility (required): ');
            nodeAccessLabelTextDiv.appendChild(nodeLabelText);
            nodeAccessDiv.appendChild(nodeAccessLabelTextDiv);
            //     <input type="text" class="eipAccess" />
            m_nodeAccessInput = document.createElement('textarea');
            if ( Prototype.Browser.Gecko ) m_nodeAccessInput.setAttribute('rows', '1');
            else                           m_nodeAccessInput.setAttribute('rows', '2');
            m_nodeAccessInput.className = 'eipAccess';
            m_nodeAccessInput.value = m_strTableAccess;
            nodeAccessDiv.appendChild(m_nodeAccessInput);
            nodeNameDiv.appendChild(nodeAccessDiv);

            // <DIV class="eipClosingTagLabel"> closing tag </DIV>
            m_nodeClosingTag = document.createElement('div');
            m_nodeClosingTag.className = 'eipOpeningTagLabel';
            nodeClosingTagText = document.createTextNode("</table>");
            m_nodeClosingTag.appendChild(nodeClosingTagText);
            nodeNameDiv.appendChild(m_nodeClosingTag);

            // <button class="eipSaveButton" />
            this.setSaveButton(document.createElement('button'));
            this.getSaveButton().className = 'eipSaveButton';
            nodeLabelText = document.createTextNode('Save');
            this.getSaveButton().setAttribute('alt', 'Save');
            Event.observe(this.getSaveButton(), 'click',
                          this.onSave.bindAsEventListener(this));
            this.getSaveButton().appendChild(nodeLabelText);
            this.getSaveButton().disabled = false;
            nodeNameDiv.appendChild(this.getSaveButton());

            nodeCancelButton = document.createElement('button');
            nodeCancelButton.className = 'eipCancelButton';
            nodeCancelButton.setAttribute('alt', 'Cancel');
            nodeLabelText = document.createTextNode('Cancel');
            nodeCancelButton.appendChild(nodeLabelText);
            Event.observe(nodeCancelButton, 'click',
                          this.onCancel.bindAsEventListener(this));
            nodeNameDiv.appendChild(nodeCancelButton);

            // before we remove the to-be-edited HTML node from its DOM
            // determine if the node can be deleted (i.e. it is not an only child)
            // conditionally disable delete button later
            var bIsNodeDeletable;
            bIsNodeDeletable = isNodeDeletable(this.getEditedHtmlNode());
            var bEditingExistingNode = this.getEditingExistingNode();

            if ( bEditingExistingNode && bIsNodeDeletable ) {
                nodeDeleteButton = document.createElement('button');
                nodeDeleteButton.className = 'eipDeleteButton';
                nodeDeleteButton.setAttribute('alt', 'Delete');
                nodeLabelText = document.createTextNode('Delete');
                nodeDeleteButton.appendChild(nodeLabelText);
                Event.observe(nodeDeleteButton, 'click',
                              this.onDelete.bindAsEventListener(this));
                nodeNameDiv.appendChild(nodeDeleteButton);
            }

            //   </div>

            // before we clone the node, we must first remove the event callbacks
            // recursively from the HTML tree rooted by the edited html node.
            stopObserving(this.getEditedHtmlNode());

            // clone the edited html node.
            nodeHtmlClone = this.getEditedHtmlNode().cloneNode(true);
            this.setEditedHtmlNodeClone(nodeHtmlClone);
        }
        else {
            // stupid edit
            //   do the default behavoir => located in prototype
            //@@FYI
            // changing object here. henceworth the new 'this' will not be a
            // Table_WorkFlowStep object. all polymorphic calls will not return here.
            // we are leaving the reservation.
            var oWorkFlowStep;
            oWorkFlowStep = new SimpleTable_WorkFlowStep();
            oWorkFlowStep.setEditedXmlTag(this.getEditedXmlTag());
            oWorkFlowStep.setEditingExistingNode(this.getEditingExistingNode());
            oWorkFlowStep.editNode(this.getEditedHtmlNode());
            g_oWorkFlowStep = oWorkFlowStep;
        }
    };

    function displayEditForm() {
        Table_WorkFlowStep.prototype.displayEditForm();

        if ( m_vTGroups && m_vTGroups[0] && m_vTGroups[0].m_nodeEditedHtmlTextArea ) {
            m_vTGroups[0].m_nodeEditedHtmlTextArea.focus();
        }
    };

    function doesTableContainSpans(nodeXml) {
        var nodeTable;
        var nodeTableChild;
        var nodeTGroup;
        var nodeTGroupChild;
        var nodeTableBoby;
        var nodeTableBobyChild;
        var nodeTableRow;
        var nodeTableRowChild;
        var strColumns;
        var iRows;
        var iColumns;
        var iColumnsInRow;
        var i;
        var j;
        var k;
        var l;
        var strStartColumn;
        var strEndColumn;
        var strMoreRows;

        if ( nodeXml.nodeName == 'table' ) {
            nodeTable = nodeXml;
            for (i = 0; i < nodeTable.childNodes.length; i++) {
                nodeTableChild = nodeTable.childNodes[i];

                if ( nodeTableChild.nodeName == 'tgroup' ) {
                    nodeTGroup = nodeTableChild;

                    strColumns = nodeTGroup.getAttribute('cols');
                    iColumns = parseInt(strColumns);

                    // <tbody> is a child of <tgroup>
                    //     <row> are children of <tbody>
                    for (j = 0; j < nodeTGroup.childNodes.length; j++) {
                        nodeTGroupChild = nodeTGroup.childNodes[j];

                        if ( nodeTGroupChild.nodeName == 'tbody' ) {
                            nodeTableBoby = nodeTGroupChild;

                            iRows = 0;
                            for (k = 0; k < nodeTableBoby.childNodes.length; k++) {
                                nodeTableBobyChild = nodeTableBoby.childNodes[k];

                                if ( nodeTableBobyChild.nodeName == 'row' ) {
                                    nodeTableRow = nodeTableBobyChild;
                                    iRows++;
                                    iColumnsInRow = 0;

                                    for (l = 0; l < nodeTableRow.childNodes.length; l++) {
                                        nodeTableRowChild = nodeTableRow.childNodes[l];

                                        if ( nodeTableRowChild.nodeName == 'entry' ) {
                                            iColumnsInRow++;

                                            // <entry namest="c1" nameend="c2">
                                            strStartColumn = nodeTableRowChild.getAttribute('namest');
                                            strEndColumn   = nodeTableRowChild.getAttribute('nameend');
                                            if ( strStartColumn && strEndColumn ) {
                                                if ( strStartColumn != strEndColumn ) {
                                                    // this entry spans more than one column
                                                    return true;
                                                }
                                            }

                                            // <entry morerows="1">3</entry>
                                            strMoreRows = nodeTableRowChild.getAttribute('morerows');
                                            iMoreRows = parseInt(strMoreRows);
                                            if ( strMoreRows && iMoreRows != 0 ) {
                                                // this entry spans more than one row
                                                return true;
                                            }
                                        }
                                    }

                                    if ( iColumnsInRow != iColumns ) {
                                        // got more or fewer columns than we expected
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return false;
    };
 
    function countRowsAndColumns(nodeXml) {
        var nodeTGroup;
        var nodeTGroupChild;
        var nodeColSpec;
        var nodeTableBoby;
        var nodeTableBobyChild;
        var nodeTableRow;
        var nodeTableRowChild;
        var nodeTableEntry;
        var dimensions;
        var strColumns;
        var iRows;
        var iCurrentRow;
        var iExpectedColumns;
        var i;
        var j;
        var k;
        var l;
        var m;
        var viColSpec; // an associative array which maps columns names to column indices.
        var vvbEntryFound;
        var strColumnNumber;
        var iColumnNumber;
        var strColumnName;
        var strMoreRows;
        var strColumnStartName;
        var strColumnEndName;
        var strColumnStart;
        var strColumnEnd;
        var iRowsPerEntry;
        var iColumnStart;
        var iColumnEnd;
        var viColumnsPerRow;
        var iMaxColumns;

        dimensions = new Object();
        dimensions.m_iRows = 0;
        dimensions.m_iColumns = 0;

        viColSpec = new Array;
        vvbEntryFound = new Array;

        iRows = 0;
        iMaxColumns = 0;
        iExpectedColumns = 0;

        // <tgroup> is a child of <table> which has a cols attribute
        if ( nodeXml.nodeName == 'tgroup' ) {
            nodeTGroup = nodeXml;

            strColumns = nodeTGroup.getAttribute('cols');
            iExpectedColumns = parseInt(strColumns);

            // <tbody> is a child of <tgroup>
            //     <row> are children of <tbody>
            for (i = 0; i < nodeTGroup.childNodes.length; i++) {
                nodeTGroupChild = nodeTGroup.childNodes[i];

                if ( nodeTGroupChild.nodeName == 'colspec' ) {
                    nodeColSpec = nodeTGroupChild;
                    strColumnNumber = nodeColSpec.getAttribute('colnum');
                    strColumnName = nodeColSpec.getAttribute('colname');
                    if ( strColumnNumber && strColumnName ) {
                        iColumnNumber = parseInt(strColumnNumber);
                        viColSpec[strColumnName] = iColumnNumber;
                    }
                }

                if ( nodeTGroupChild.nodeName == 'tbody' ) {
                    nodeTableBoby = nodeTGroupChild;

                    for (j = 0; j < nodeTableBoby.childNodes.length; j++) {
                        nodeTableBobyChild = nodeTableBoby.childNodes[j];

                        if ( nodeTableBobyChild.nodeName == 'row' ) {
                            nodeTableRow = nodeTableBobyChild;

                            // we have encountered a new row ...
                            iCurrentRow = iRows;
                            iRows++;
                            if ( vvbEntryFound[iCurrentRow] ==  null ) {
                                vvbEntryFound[iCurrentRow] = new Array;
                            }

                            for (k = 0; k < nodeTableRow.childNodes.length; k++) {
                                nodeTableRowChild = nodeTableRow.childNodes[k];
                                if ( nodeTableRowChild.nodeName == 'entry' ) {
                                    nodeTableEntry = nodeTableRowChild;

                                    strColumnStartName = nodeTableEntry.getAttribute('namest');
                                    strColumnEndName = nodeTableEntry.getAttribute('nameend');
                                    if ( strColumnStartName != null && strColumnEndName == null ) {
                                        // make implicit nameend value explicit ...
                                        strColumnEndName = strColumnStartName
                                    }

                                    strMoreRows = nodeTableEntry.getAttribute('morerows');
                                    iRowsPerEntry = 1 + ( strMoreRows ? parseInt(strMoreRows) : 0 );

                                    iColumnStart = null;
                                    iColumnEnd = null;
                                    if ( strColumnStartName && strColumnEndName ) {
                                        strColumnStart = viColSpec[strColumnStartName];
                                        strColumnEnd = viColSpec[strColumnEndName];
                                        if ( strColumnStart && strColumnEnd) {
                                            iColumnStart = parseInt(strColumnStart);
                                            iColumnEnd = parseInt(strColumnEnd);
                                        }
                                    }

                                    if ( iColumnStart && iColumnEnd ) {
                                        // translate from one based to zero based
                                        iColumnStart--;
                                        iColumnEnd--;
                                    }
                                    else {
                                        // need to find first available open entry in row.
                                        // note that vEntryFound[iCurrentRow][0] is unused.
                                        for (l = 1; l <= vvbEntryFound[iCurrentRow].length-1; l++) {
                                            if ( vvbEntryFound[iCurrentRow][l] == null ) {
                                                break;
                                            }
                                        }
                                        iColumnStart = l;
                                        iColumnEnd = iColumnStart;
                                    }

                                    // fill 2 dimensional array
                                    for ( l = iCurrentRow; l < iCurrentRow+iRowsPerEntry; l++ ) {
                                        for ( m = iColumnStart; m <= iColumnEnd; m++ ) {
                                            if ( vvbEntryFound[l] == null ) {
                                                // via morerows, we may get ahead of ourselves.
                                                vvbEntryFound[l] = new Array;
                                            }
                                            vvbEntryFound[l][m] = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // due to namest and nameend attributes in entry nodes, entry nodes
        // can span more than one column.  due to morerows attribute, entry nodes
        // can span more than one row.  thus, simply counting the entry nodes in
        // a row can not guarantee the number of columns in a row

        viColumnsPerRow = new Array;
        for ( i = 0; i<vvbEntryFound.length; i++ ) {
            viColumnsPerRow[i] = 0;
            for ( j = 0; j < vvbEntryFound[i].length; j++ ) {
                if ( vvbEntryFound[i][j] ) {
                    viColumnsPerRow[i]++;
                }
            }
            if ( i == 0 ) {
                iMaxColumns = viColumnsPerRow[0];
            }
            else {
                if ( viColumnsPerRow[i] != iMaxColumns ) {
                    alert(iMaxColumns + ' columns were expected in table row #' + (i+1) + '\n' +
                          viColumnsPerRow[i] + ' columns were found.');
                    return null;
                }
            }
        }

        dimensions.m_iRows = iRows;
        dimensions.m_iColumns = iMaxColumns;
        dimensions.m_iExpectedColumns = iExpectedColumns; // different if tgroup's colspec is out of date
//alert('table has ' + dimensions.m_iRows    + ' rows.\n' +
//      'table has ' + dimensions.m_iColumns + ' columns.\n' +
//      'table has ' + dimensions.m_iExpectedColumns + ' expected columns.');
        return dimensions;
    };

    function updateColsAttribute(strTGroupXml) {
        var strNewTGroupXml;
        var docNewXml;
        var nodeTGroup;
        var dimensions;

        docNewXml = parseXmlTextToDOMDocument(strTGroupXml);
        nodeTGroup = importNode(docNewXml);

        dimensions = countRowsAndColumns(nodeTGroup);
        if ( dimensions == null || dimensions.m_iColumns == 0 ) {
            // likely here if a row has a different number of columns than the other rows.
            // return the input i.e. do nothing
            return strTGroupXml;
        }
        if ( dimensions.m_iColumns == dimensions.m_iExpectedColumns ) {
            return strTGroupXml;
        }

        var strColsAttribute;
        var iColsAttribute;

        strColsAttribute = nodeTGroup.getAttribute('cols'); // old value
        iColsAttribute = dimensions.m_iColumns;             // new value
        strColsAttribute = iColsAttribute.toString();
        nodeTGroup.setAttribute('cols', strColsAttribute);
        strColsAttribute = nodeTGroup.getAttribute('cols'); // new value

        // serialize back to string
        strNewTGroupXml = serializeAndMassageXmlNode(nodeTGroup);

        return strNewTGroupXml;
    };

    function onResizeTable(e) {
        return handleResizeTable(e);
    };

    function handleResizeTable(e) {
        var nodeHtmlButton;
        var i;
        var j;
        var iTGroupIndex;
        var iRequestedRows;
        var iRequestedColumns;
        var strTableXml;
        var strTGroupTagXml;
        var strTGroupXml;
        var docNewXml;
        var nodeTGroup;
        var dimensions;
        var iActualRows;
        var iActualColumns;
        var bNoResizeNeeded;
        var nodeTable;
        var nodeTGroupChild;
        var nodeTableBoby;
        var nodeTableBobyChild;
        var nodeRow;
        var nodeWhiteSpace;
        var iRowCount;
        var iColumnCount;
        var iDeletionIndex;
        var nodeRow;
        var nodeRowChild;
        var nodeEntry;
        var docXml;
        var nodeRootXml;
        var bUserInformedOnClipping;
        var bDoResize;
        var bChangedColumnSize;

        if (!e) e = window.event;
        nodeHtmlButton = e.target || e.srcElement;

        for (i=0; i<m_vTGroups.length; i++) {
            var nodeResizeButton = m_vTGroups[i].nodeResizeButton;
            if ( nodeHtmlButton == nodeResizeButton ) break;
        }

        if ( i == m_vTGroups.length ) {
            alert('handleResizeTable(): the clicked resize button is not recognized.');
            return;
        }

        bUserInformedOnClipping = false;
        bChangedColumnSize = false;

        iTGroupIndex = i;

        iRequestedRows    = parseInt(m_vTGroups[iTGroupIndex].nodeRowsInput.value);
        iRequestedColumns = parseInt(m_vTGroups[iTGroupIndex].nodeColumnsInput.value);
        if ( iRequestedRows < 1 || iRequestedColumns < 1 ) {
            alert('Please enter positive, nonzero numbers for the columns and rows.');
            return;
        }

        // namespaces are an issue here. table may have a MathML namespace declaration
        // while its children will likely not.  this is important since below we convert the user's text
        // to DOM, modify DOM to reflect resize op, serialize DOM back to text, and redisplay.
        // the string-to-DOM-to-string roundtrip needs namespaces to be successful.

        strTGroupTagXml = addNamespacesToTagText(m_vTGroups[iTGroupIndex].m_nodeEditedHtmlOpenLabelText.nodeValue);
        strTGroupXml = strTGroupTagXml +
                       m_vTGroups[iTGroupIndex].m_nodeEditedHtmlTextArea.value +
                       '</tgroup>';
        strTGroupXml = updateColsAttribute(strTGroupXml);

        docNewXml = parseXmlTextToDOMDocument(strTGroupXml);
        nodeTGroup = importNode(docNewXml);

        dimensions = countRowsAndColumns(nodeTGroup);
        iActualRows = dimensions.m_iRows;
        iActualColumns = dimensions.m_iColumns;

        bNoResizeNeeded = ( dimensions.m_iColumns ==  iRequestedColumns && dimensions.m_iRows == iRequestedRows );
        if ( bNoResizeNeeded ) {
            alert('No resize needed.');
            return;
        }

        // let user know that they are likely doing something foolish ...
        if ( iActualRows * iActualColumns < c_ROW_ELEMENT_LIMIT ) {
            if ( iRequestedRows * iRequestedColumns > c_ROW_ELEMENT_LIMIT ) {
                var bDoResize = window.confirm('A table this large may cause problems with browser-based editing.\n\n' +
                                               'Continue with resize?');
                if ( !bDoResize ) {
                    return;
                }
            }
        }

        for (i = 0; i < nodeTGroup.childNodes.length; i++) {
            nodeTGroupChild = nodeTGroup.childNodes[i];
            if ( nodeTGroupChild.nodeName == 'tbody' ) {
                nodeTableBoby = nodeTGroupChild;
            }
        }

        if ( nodeTableBoby == null ) {
            alert('The table XML is incorrect. Resize failed.');
            return;
        }

        // resize the number of rows

        if ( iRequestedRows > iActualRows ) {
            // add rows
            //nodeNewXML = createElementNS(gSource.doc, 'list');
            for (i=0; i<iRequestedRows-iActualRows; i++) {
                //  had trouble creating a whitespace text node in Xml ...

                docXml = parseXmlTextToDOMDocument('<motherofallnodes>  <row>\n  </row>\n</motherofallnodes>');
                nodeRootXml = docXml.documentElement;

                // harvest the child of the parse via copying them destructively into nodeXml
                var bPreserveExisting = true;
                Sarissa.copyChildNodes(nodeRootXml, nodeTableBoby, bPreserveExisting);
            }
        }
        else if ( iRequestedRows < iActualRows ) {
            if ( !bUserInformedOnClipping ) {
                bDoResize = window.confirm('This resize will make the table smaller.\n\n' +
                                           'Some elements of the table will be deleted.  As soon as you hit Save' + ',\n' +
                                           'they will be permanently lost.\n\n' +
                                           'Until then, you may still hit Cancel to restore the previous state of the table.\n\n' +
                                           'Do you still want to resize?');
                bUserInformedOnClipping = true;
                if ( !bDoResize ) {
                    return;
                }
            }

            // remove rows
            iRowCount = 0;
            for (i=0; i<nodeTableBoby.childNodes.length; i++) {
                nodeTableBobyChild = nodeTableBoby.childNodes[i];
                if ( nodeTableBobyChild.nodeName == 'row' ) {
                    iRowCount++;
                }
                if ( iRowCount > iRequestedRows ) {
                    iDeletionIndex = i;
                    break;
                }
            }
            for (i=nodeTableBoby.childNodes.length-1; i>=iDeletionIndex; i--) {
                nodeTableBobyChild = nodeTableBoby.childNodes[i];
                nodeTableBoby.removeChild(nodeTableBobyChild);
            }
            if ( i>0 && nodeTableBoby.childNodes[i].nodeType == Node.TEXT_NODE ) {
                // replace trailing white space text with the correct white space text
                nodeTableBobyChild = nodeTableBoby.childNodes[i];
                nodeTableBobyChild.nodeValue = '\n';
            }
       }

        // resize the number of columns.
        iRowCount = 0;
        for (i=0; i<nodeTableBoby.childNodes.length; i++) {
            nodeTableBobyChild = nodeTableBoby.childNodes[i];
            if ( nodeTableBobyChild.nodeName == 'row' ) {
                iRowCount++;

                nodeRow = nodeTableBobyChild;
                iColumnCount = 0;
                for (j=0; j<nodeRow.childNodes.length; j++) {
                    nodeRowChild = nodeRow.childNodes[j];
                    if ( nodeRowChild.nodeName == 'entry' ) {
                        iColumnCount++;
                    }
                }
                if ( iRequestedColumns != iColumnCount ) {
                    bChangedColumnSize = true;
                }
                // iColumnCount may be different than iActualColumns since
                // empty rows may have been added above
                if ( iRequestedColumns > iColumnCount ) {
                    for (j=1; j<=iRequestedColumns-iColumnCount; j++) {
                        //  had trouble creating a whitespace text node in Xml ...
                        docXml = parseXmlTextToDOMDocument(
                          '<motherofallnodes>  <entry>(' + iRowCount + ',' + (iColumnCount+j) + ')</entry>\n  </motherofallnodes>');
                        nodeRootXml = docXml.documentElement;
                        var bPreserveExisting = true;
                        Sarissa.copyChildNodes(nodeRootXml, nodeRow, bPreserveExisting);
                    }
                }
                else if ( iRequestedColumns < iColumnCount ) {
                    if ( !bUserInformedOnClipping ) {
                        bDoResize = window.confirm('Resize will remove table elements.\n\n' +
                                                   'These elements will be permanently lost when the Save button is clicked.\n' +
                                                   'If the table is resized, hitting the Cancel button will revert the table back\n' + 
                                                   'to its original size\n\n' +
                                                   'Do you still want to resize?');
                        bUserInformedOnClipping = true;
                        if ( !bDoResize ) {
                            return;
                        }
                    }

                    iColumnCount = 0;
                    for (j=0; nodeRow.childNodes.length; j++) {
                        nodeRowChild = nodeRow.childNodes[j];
                        if ( nodeRowChild.nodeName == 'entry' ) {
                            iColumnCount++;
                        }
                        if ( iColumnCount > iRequestedColumns ) {
                            iDeletionIndex = j;
                            break;
                        }
                    }
                    for (j=nodeRow.childNodes.length-1; j>=iDeletionIndex; j--) {
                         nodeRowChild = nodeRow.childNodes[j];
                         nodeRow.removeChild(nodeRowChild);
                    }
                    if ( j>0 && nodeRow.childNodes[j].nodeType == Node.TEXT_NODE ) {
                        // replsce trailing white space text with the correct white space text
                        nodeRowChild = nodeRow.childNodes[j];
                        nodeRowChild.nodeValue = '\n  ';
                    }
                }
            }
        }

        // update the tgroup's cols attribute

        if ( bChangedColumnSize ) {
            nodeTGroup.setAttribute('cols', iRequestedColumns);
        }

        // repopulated the text area widgit.

        m_vTGroups[iTGroupIndex].m_iRows    = iRequestedRows;
        m_vTGroups[iTGroupIndex].m_iColumns = iRequestedColumns;
        m_vTGroups[iTGroupIndex].m_str = serializeAndMassageXmlNode(nodeTGroup);

        var strOpenTgroup;
        var strCloseTgroup;
        var contents;
        var strEditableTGroupXml = m_vTGroups[iTGroupIndex].m_str.replace(
            /^(<tgroup[\w\W]*?>)([\w\W]*)(<\/tgroup[\w\W]*?>)/,
            function(wholeMatch, openTag, contents, closeTag) {
                strOpenTgroup = openTag;
                strCloseTgroup = closeTag;
                return contents;
            });
        if ( bChangedColumnSize ) {
            m_vTGroups[iTGroupIndex].m_nodeEditedHtmlOpenLabelText.nodeValue = strOpenTgroup;
        }
        m_vTGroups[iTGroupIndex].m_nodeEditedHtmlTextArea.value = strEditableTGroupXml;
    };

    function replaceTagSummary(strTableXml, strNewSummary) {
        var strNewTableXml;

        if ( strTableXml.search("summary='") != -1 ) {
            strNewTableXml = strTableXml.replace(/(\s*)(summary='.*?')(\s*\w*=|\s*>)/,
                                                 "$1summary='" + strNewSummary + "'$3");
        }
        else if ( strTableXml.search("summary=\"") != -1 ) {
            strNewTableXml = strTableXml.replace(/(\s*)(summary=".*?")(\s*\w*=|\s*>)/,
                                                 "$1summary=\"" + strNewSummary + "\"$3");
        }
//alert(strTableXml + '\n' + strNewTableXml);

        if ( strNewTableXml == null ) {
            strNewTableXml = strTableXml;
        }

        return strNewTableXml;
    }

    function removeTagSummary(strTableXml) {
        var strNewTableXml;

        if ( strTableXml.search("summary='") != -1 ) {
            strNewTableXml = strTableXml.replace(/(\s*)(summary='.*?')(\s*\w*=|\s*>)/,
                                                 "$3");
        }
        else if ( strTableXml.search("summary=\"") != -1 ) {
            strNewTableXml = strTableXml.replace(/(\s*)(summary=".*?")(\s*\w*=|\s*>)/,
                                                 "$3");
        }
//alert(strTableXml + '\n' + strNewTableXml);

        return strNewTableXml;
    }

    function getEditedXml() {
        var strTableXml;
        var nodeTitleInput;
        var strAccessText;
        var strTableXmlWithAccessText;
        var strTGroupTagXml;
        var strTGroupXml;
        var i;

        if ( m_bSmartEdit ) {
            // pre-emptively strip leading/traiing whitespace and
            // change all remaining white space characters to a single space per
            // addNamespacesToTagText() fails if attribute values have newlines in them
            strAccessText = m_nodeAccessInput.value.strip().replace(/\s+/g, ' ');
            if ( strAccessText.length == 0 ) {
                Ext.MessageBox.show({
                  title: 'Error: Missing Required Entry',
                  msg: "The 'Description, for accessibility' entry (which will be saved as the table node's summary attribute) is required  and should describe the main purpose of the table and explain its overall structure. The contents of the summary will not show on the screen, but can be used to help visually impaired readers, who are listening to the content, understand the table.",
                  buttons: Ext.MessageBox.OK,
                  width: 600
                });
                return null;
            }

            strTableXmlWithAccessText = replaceTagSummary(m_strTableTag, strAccessText);

            strTableXml = addNamespacesToTagText(strTableXmlWithAccessText);

            if ( m_strTableLabelXml ) {
                // not exposed in the edit UI
                strTableXml += m_strTableLabelXml;
            }

            nodeTitleInput = this.getTitleInput();
            if ( nodeTitleInput ) {
                m_strTableTitle = nodeTitleInput.value;
                if ( m_strTableTitle && m_strTableTitle.length > 0 ) {
                    strTableXml += ( this.getTitleOpenTag() ? this.getTitleOpenTag() : '<title>' );
                    strTableXml += m_strTableTitle;
                    strTableXml += '</title>';
                }
            }

            for (i=0; i<m_vTGroups.length; i++) {
                var nodeTGroup = m_vTGroups[i];
                // strTGroupTagXml = addNamespacesToTagText(m_vTGroups[i].m_nodeHtmlOpenLabelText.nodeValue);
                strTGroupTagXml = m_vTGroups[i].m_nodeEditedHtmlOpenLabelText.nodeValue;
                strTGroupXml = strTGroupTagXml;
                strTGroupXml += (i==0 ? '' : '\n') +
                                m_vTGroups[i].m_nodeEditedHtmlTextArea.value.replace(/^\s+/,'');  // lose the leading whitespace
                strTGroupXml += '\n</tgroup>';

                // each tgroup may have been modified => the tgroup cols attribute may not be correct
                strTGroupXml = updateColsAttribute(strTGroupXml);

                strTableXml += '\n' + strTGroupXml;
            }

            if ( this.getCaptionInput() ) {
                m_strTableCaption = this.getCaptionInput().value;
                if ( m_strTableCaption && m_strTableCaption.length > 0 ) {
                    strTableXml += ( this.getCaptionOpenTag() ? this.getCaptionOpenTag() : '<caption>' );
                    strTableXml += m_strTableCaption;
                    strTableXml += '</caption>';
                }
            }

            strTableXml += '\n</table>';

            return strTableXml;
        }
        else {
            return Table_WorkFlowStep.prototype.getEditedXml();
        }
    };
};
Table_WorkFlowStep.prototype = new WorkFlowStep();


function SimpleTable_WorkFlowStep() {
    this.init = init;
    this.gotTitle = gotTitle;
    this.gotCaption = gotCaption;

    init();

    return this;

    function init() {
        SimpleTable_WorkFlowStep.prototype.init();
    };

    function gotTitle() {
        return true;
    };

    function gotCaption() {
        return true;
    };
};
SimpleTable_WorkFlowStep.prototype = new WorkFlowStep();


function areViewing() {
    return ( gEditNodeInfo.state == STATE_VIEWING );
}

function areEditing() {
    return ( gEditNodeInfo.state != STATE_VIEWING );
}

/**
 * Handles a user click on the displayed
 * document.
 *
 * @param e Event
 */
function generalOnClickHandler(e) {
    var nodeClicked;

    // if we're still downloading source, inform the user
    // FIXME
    // source is downloded synchronously, so this code is not needed.
    if (gEditNodeInfo.state == STATE_DOWNLOADING_SOURCE) {
        window.alert("Edit-in-place is still downloading the source text of the document in the background. " +
                     "Please wait a few seconds and try again.");
        return;
    }

    // if we're editing or don't have sufficient support, return
    if ( areEditing() ||
         (! document.getElementById) ||
         (! document.createElement) ||
         (! gSource.doc) ) {
        return;
    }

    // get the node that was clicked
    if (window.event && window.event.srcElement) {
        // prototype.js change
        // nodeClicked = e.target;
        nodeClicked = window.event.srcElement;
    }
    else if (e.target) {
        nodeClicked = e.target;
    }
    else {
        nodeClicked = window.event.srcElement;
    }

    var bIsInsertPopupMenu;
    bIsInsertPopupMenu = isInsertPopupMenu(nodeClicked);
    if ( bIsInsertPopupMenu ) return false;

    // find an editable node from the clicked node
    var nodeEditHtml = findEditableNode(nodeClicked);
    if ( nodeEditHtml ) {
        var bEditingExistingNode = true;

        // strXmlNodeName is the first part of classname; ' edited' could be tagged onto the classname
        var strXmlNodeName = nodeEditHtml.className.split(" ")[0];

        var oWorkFlowStep = createWorkFlowStep(strXmlNodeName, bEditingExistingNode);
        if ( oWorkFlowStep != null ) {
            oWorkFlowStep.editNode(nodeEditHtml);
        }
    }

    // Return false so that the click event does not bubble up.  We
    // don't want links to be followed if they're clicked in EIP.
    return false;
}

function isInsertPopupMenu(nodeHtml) {
    var bIsInsertPopupMenu;
    var bIsInsertPopupMenuSelection;
    var nodeDiv;

    bIsInsertPopupMenu = ( nodeHtml.className == 'eipInsertElementLink' );
    if ( bIsInsertPopupMenu ) {
        return true;
    }
    else {
        // now check to see if we a popup menu selection
        nodeDiv = findContainingDiv(nodeHtml);
        bIsInsertPopupMenuSelection = ( nodeDiv && nodeDiv.className && nodeDiv.className == 'eipInsertElementList' );
        if ( bIsInsertPopupMenuSelection ) {
            return true;
        }
    }
    return false;
}

function findContainingDiv(nodeHtml) {
    var nodeCurrentHtml;
    var bIsTextNode;

    nodeCurrentHtml = nodeHtml;
    while ( nodeCurrentHtml ) {
        bIsTextNode = ( nodeCurrentHtml.nodeType == Node.TEXT_NODE );
        if ( !bIsTextNode ) {
            if ( nodeCurrentHtml.nodeName && nodeCurrentHtml.nodeName.toLowerCase() == 'div' ) {
                return nodeCurrentHtml;
            }
        }
        nodeCurrentHtml = nodeCurrentHtml.parentNode;
    }
    return null;
}

/**
 * Called upon clicking the Cancel
 * button during editing.  Replaces
 * the editing machinery (buttons, textboxes)
 * with the clone we made of the
 * node before editing.
 */
function doCancel() {
    alert('doCancel() deprecated.');
}


/**
 * Cancels editing of this document after
 * soliciting user confirmation.
 */
function doDiscard() {
    alert('doDiscard() deprecated.');
}

/**
 * Commits changes to the document, unless the
 * user is still in an unfinished editing state.
 */
function doCommit() {
    alert('doCommit() deprecated.');
}

function addMultipartValue(boundary,name,value,list)
{
    return list.concat('--'+boundary,'Content-Disposition: form-data; name="' + name + '"','',value);
}

/**
 * Sends the
 * edited text to the preview url
 * for validation and styling.
 */
function sendSource(strServerRequestUrl, strTag, strSendXml, strXPath, funcServerReturnCalback)
{
    // Post with the server
    gRequest.xhr = gXMLHttpRequest;
    gRequest.xhr.open("POST", strServerRequestUrl);

    gRequest.xhr.onreadystatechange = funcServerReturnCalback;

    // Odin awakes from his drunken stupor and mumbles '20232769535103786141388480521'.  And it was good.
    boundary ='-----------------------------20232769535103786141388480521';
    gRequest.xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);

    // store this as the eventual text of the new cnxml node
    // FIXME
    //    kludgy.  makes it look like the server sends XML back when handling the request return.
    gRequest.nodeReplacementXML = strSendXml;

    var L = [''];
    L = addMultipartValue(boundary, 'action', 'update', L);
    L = addMultipartValue(boundary, 'xpath', strXPath, L);
    L = addMultipartValue(boundary, 'content', strSendXml, L);
    L = L.concat('--'+boundary+'--');
    var strRequest = L.join('\r\n');

    // set state to validating
    gEditNodeInfo.state = STATE_VALIDATING;

    // send the POST
    gRequest.xhr.send(strRequest);
}

function sendDelete(strServerRequestUrl, nodeXml, strXPath, funcServerReturnCalback)
{
    // Post with the server
    gRequest.xhr = gXMLHttpRequest;
    gRequest.xhr.open("POST", strServerRequestUrl);
    gRequest.xhr.onreadystatechange = funcServerReturnCalback;
    gRequest.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    var strAction = 'delete';

    var strRequest = "action=" + strAction + "&xpath=" + strXPath;
    // set state to validating
    gEditNodeInfo.state = STATE_VALIDATING;

    gRequest.sourceNode = nodeXml;

    // send the POST
    gRequest.xhr.send(strRequest);
}

/**
 * Given a html node, finds the nearest enclosing
 * editable node (possibly the node itself) and return
 * its associated xpath into the XML DOM.
 *
 * @param node - HTML Node that maps to a CNX XML node
 */
function findSiblingCount(oInputSiblingCount) {
    var oOutputSiblingCount;
    var i;
    var iCurrentSiblingCount;
    var nodeChildHtml;
    var strClassName;
    var bComplete;
    var bFoundCnxmlTag;

    oOutputSiblingCount = oInputSiblingCount;

    iCurrentSiblingCount = oInputSiblingCount.iSiblingCount;
    bComplete = false;

    for (i=0; i<oInputSiblingCount.nodeParentHtml.childNodes.length; i++) {
        nodeChildHtml = oInputSiblingCount.nodeParentHtml.childNodes[i];
        bFoundCnxmlTag = false;
        if ( nodeChildHtml != null && nodeChildHtml.className != null && nodeChildHtml.className.length > 0 ) {
            strClassName = nodeChildHtml.className.split(" ")[0];
            if ( strClassName == 'codeline' ) {
                strClassName = 'code';
            }
            if ( strClassName in gValidCnxmlTags ) {
                // recursion stops when another CNXML tag is found
                bFoundCnxmlTag = true;
                if ( strClassName == oInputSiblingCount.strCnxmlTagName ) {
                    iCurrentSiblingCount++;
                    if ( nodeChildHtml == oInputSiblingCount.nodeHtml ) {
                        bComplete = true;
                    }
                }
            }
        }
        if ( !bFoundCnxmlTag && nodeChildHtml.childNodes.length > 0 ) {
            oSiblingCount = new Object();
            oSiblingCount.nodeParentHtml  = nodeChildHtml;
            oSiblingCount.strCnxmlTagName = oInputSiblingCount.strCnxmlTagName;
            oSiblingCount.nodeHtml        = oInputSiblingCount.nodeHtml;
            oSiblingCount.iSiblingCount   = iCurrentSiblingCount;
            oSiblingCount.bComplete       = false;
            oSiblingCount = findSiblingCount(oSiblingCount);

            iCurrentSiblingCount = oSiblingCount.iSiblingCount;
            bComplete = oSiblingCount.bComplete;
        }
        if ( bComplete ) {
            break;
        }
    }

    oOutputSiblingCount.iSiblingCount = iCurrentSiblingCount;
    if ( bComplete ) {
        oOutputSiblingCount.bComplete = true;
    }

    return oOutputSiblingCount;
}

// a better buildXPathFromHtml() with less assumptions ...
// dead code
function buildXPathFromHtml2(nodeHtml) {
    var nodeCurrentHtml;
    var nodeParentHtml;
    var strClassName;
    var strCnxmlTagName;
    var iSiblingCount;
    var oInputSiblingCount;
    var oOutputSiblingCount;
    var strXpath;
    var strParentXPath;

    nodeCurrentHtml = nodeHtml;
    if ( nodeCurrentHtml.id != 'cnx_main' ) {
        // 1. find the editable parent Html node if it exists
        nodeCurrentHtml = nodeCurrentHtml.parentNode;

        while ( nodeCurrentHtml.id != 'cnx_main' ) {
            if ( nodeCurrentHtml.className != null ) {
                strClassName = nodeCurrentHtml.className.split(" ")[0];
                if ( strClassName == 'codeline' ) {
                    strClassName = 'code';
                }
                if ( strClassName in gValidCnxmlTags ) {
                    nodeParentHtml = nodeCurrentHtml;
                    break;
                }
            }

            nodeCurrentHtml = nodeCurrentHtml.parentNode;
        }

        // 2. build xpath for editable parent
        nodeParentHtml = nodeCurrentHtml;
        if ( nodeCurrentHtml.id != 'cnx_main' ) {
            strParentXPath = buildXPathFromHtml2(nodeParentHtml);
        }
        else {
            strParentXPath = '/cnx:document[1]/cnx:content[1]';
        }


        // 3. find the ordinal count of the node within its likenamed sibling
        strCnxmlTagName = nodeHtml.className.split(" ")[0];
        if ( strCnxmlTagName == 'codeline' ) {
            strCnxmlTagName = 'code';
        }
        oInputSiblingCount = new Object();
        oInputSiblingCount.nodeParentHtml  = nodeParentHtml;
        oInputSiblingCount.strCnxmlTagName = strCnxmlTagName;
        oInputSiblingCount.nodeHtml        = nodeHtml;
        oInputSiblingCount.iSiblingCount   = 0;
        oInputSiblingCount.bComplete       = false;
        oOutputSiblingCount = findSiblingCount(oInputSiblingCount);

        iSiblingCount = oOutputSiblingCount.iSiblingCount;

        // 4. built the XPath
        strXpath = strParentXPath + '/cnx:' + strCnxmlTagName + '[' + iSiblingCount + ']';
        return strXpath;
    }
    else {
        nodeParentHtml = null;
        return '/cnx:document[1]/cnx:content[1]';
    }
}

function buildXPathFromHtml(nodeHtml) {
    var strClassName;
    var strId;
    var nodeXml;
    var nodeHTMLCurr;
    var nodeHTMLEditable;
    var strXPath;
    var bHtmlClassNameMapsToValidCnxmlTag; // class attribute value actually

    // let's try a short cut first ...
    if ( nodeHtml != null && nodeHtml.className != null && nodeHtml.className.length > 0 ) {
        strClassName = nodeHtml.className.split(" ")[0];
        if ( strClassName in gValidCnxmlTags ) {
            strId = nodeHtml.getAttribute('id');
            if ( strId != null ) {
                nodeXml = getNodeById(strId, gSource.doc);
                if ( nodeXml != null ) {
                    strXPath = buildXPathFromXml(nodeXml, null);
                    if ( strXPath != null ) {
                        return strXPath;
                    }
                }
            }
        }
    }

    nodeHTMLCurr = nodeHtml;
    nodeHTMLEditable = nodeHTMLCurr;
    strXPath = "";
    strClassName = "";

    if ( nodeHTMLCurr.id != 'cnx_main' ) {

        while ( nodeHTMLCurr.id == null || nodeHTMLCurr.id != 'cnx_main' ) {
            // once a node gets edited in preview mode,
            // " edited" is appended to its classname
            if ( nodeHTMLCurr.className ) {
                strClassName = nodeHTMLCurr.className.split(" ")[0];
            }
            else {
                strClassName = "";
            }

            // HTML nodes of class 'code' and "codeline" map to the same
            // XML 'code' node => special case!!!  we need to use 'code'
            // to build the XPath
            if ( strClassName == 'codeline' ) {
                strClassName = 'code';
            }

            bHtmlClassNameMapsToValidCnxmlTag = ( gValidCnxmlTags[strClassName] != null );

            if ( bHtmlClassNameMapsToValidCnxmlTag ) {
                var nodeHTMLParent = nodeHTMLCurr.parentNode;
                if ( nodeHTMLParent )
                {
                    var iCount = 1;

                    for (i = 0; i < nodeHTMLParent.childNodes.length; i++) {
                        if ( nodeHTMLParent.childNodes[i].className ) {
                            if ( strClassName == 'code' ) {
                                if ( nodeHTMLParent.childNodes[i].className.split(" ")[0] == 'code' ||
                                    nodeHTMLParent.childNodes[i].className.split(" ")[0] == 'codeline' ) {
                                    if ( nodeHTMLParent.childNodes[i] == nodeHTMLCurr ) {
                                        break;
                                    }
                                    iCount++;
                                }
                            } else if ( nodeHTMLParent.childNodes[i].className.split(" ")[0] == strClassName ) {
                                if ( nodeHTMLParent.childNodes[i] == nodeHTMLCurr ) {
                                    break;
                                }
                                iCount++;
                            }
                        }
                    }

                    iCount = 0;
                    var nodeHTMLChild = nodeHTMLParent.firstChild;
                    while ( nodeHTMLChild != null )
                    {
                        var strChildClassName = null;

                        if ( nodeHTMLChild.className ) {
                            strChildClassName = nodeHTMLChild.className.toLowerCase().split(" ")[0];

                            if ( strClassName == 'code' ) {
                                if ( strChildClassName == 'code' || strChildClassName == 'codeline' ) {
                                    iCount++;
                                    if ( nodeHTMLChild == nodeHTMLCurr ) {
                                            break;
                                    }
                                }
                            } else if ( strChildClassName == strClassName ) {
                                iCount++;
                                if ( nodeHTMLChild == nodeHTMLCurr ) {
                                    break;
                                }
                            }
                        }

                        nodeHTMLChild = nodeHTMLChild.nextSibling;
                    }

                    if ( strXPath ) {
                        strXPath = 'cnx:' + strClassName.toLowerCase().split(" ")[0]
                                   + '[' + iCount + ']'
                                   + '/' + strXPath;
                    } else {
                        strXPath = 'cnx:' + strClassName.toLowerCase().split(" ")[0]
                                   + '[' + iCount + ']';
                    }
                } else {
                    alert('buildXPathFromHtml(): that which can not happen has.');
                }
            }
            else {
                // found a HTML class attribute that does not map a CNXML tag.
                // styling is the likely culprit.  in order to make the transformed
                // CNXML presentable in HTML additional HTML nodes were added.  these
                // nodes will be ignored while contructing an XPATH into the CNXML DOM
                // from the HTML DOM (a suspect task at best but here we are).
            }

            nodeHTMLCurr = nodeHTMLCurr.parentNode;
        }

        if ( strXPath ) {
            strXPath = '/cnx:document[1]/cnx:content[1]/' + strXPath;
        } else {
            strXPath = '/cnx:document[1]/cnx:content[1]';
        }

        //alert('buildXPathFromHtml(): done walking back to HTML CNXML root. XPath is:\n\t' +
        //      strXPath);
    } else {
        strXPath = '/cnx:document[1]/cnx:content[1]';
    }
/*
    var strXpath2 = buildXPathFromHtml2(nodeHtml);
    if ( strXPath != strXpath2 ) {
        alert('buildXPathFromHtml(): xpath is incorrect: ' + strXPath + '\n' +
              'correct xpath is : ' + strXpath2);
        return strXpath2;
    }
*/
    return strXPath;
}

/**
 * Given an XML node, finds the nearest enclosing
 * editable node (possibly the node itself) and return
 * its associated xpath.
 *
 * @param node Node
 */
function buildXPathFromXml(nodeXML, nodeXMLIgnore) {
    var nodeXMLCurr;
    var nodeXMLParent = null;
    var nodeXMLChild = null;
    var strXPath = "";
    var strClassName = "";
    var iCount;

    nodeXMLCurr = nodeXML;

    while ( nodeXMLCurr.nodeName != 'document' ) {
        nodeXMLParent = nodeXMLCurr.parentNode;
        if ( nodeXMLParent )
        {
            iCount = 0;
            nodeXMLChild = nodeXMLParent.firstChild;

            while ( nodeXMLChild != null ) {
                var strChildNodeName = nodeXMLChild.nodeName;
                if ( nodeXMLChild.nodeName == nodeXMLCurr.nodeName ) {
                    if ( nodeXMLChild != nodeXMLIgnore ) {
                        iCount++;
                    }
                    if ( nodeXMLChild == nodeXMLCurr ) {
                        break;
                    }
                }
                nodeXMLChild = nodeXMLChild.nextSibling;
            }
            if ( strXPath ) {
                strXPath = 'cnx:' + nodeXMLCurr.nodeName + '[' + iCount + ']' + '/' + strXPath;
            } else {
                strXPath = 'cnx:' + nodeXMLCurr.nodeName + '[' + iCount + ']';
            }
        }

        nodeXMLCurr = nodeXMLCurr.parentNode;
        if ( nodeXMLCurr == null ) break;
    }

    strXPath = '/cnx:document[1]/' + strXPath;

    return strXPath;
}

/**
 * Given a node, finds the nearest enclosing editable node (possibly
 * the node itself)
 *
 * @param node Node
 */
function findEditableNode(nodeStartHtml) {
    var nodeHtml = nodeStartHtml;
    // Move outward until we reach a known tag
    while ( nodeHtml.id != 'cnx_main' ) {
        if ( isEditable(nodeHtml) ) {
            // test for the QML exception, nothing contained by a QML node can be editted directly
            if ( !hasQmlParent(nodeHtml) ) {
                // also do not edit anything within a gloassary
                // future: combine hasQmlParent() and hasGlossaryParent() into inNoEditZone()
                if ( !hasGlossaryParent(nodeHtml) ) {
                    break;
                }
            }
        }
        nodeHtml = nodeHtml.parentNode;
    }
/*
if ( nodeHtml.id == 'cnx_main' ) {
    var strPath = '';
    var strNode;
    nodeHtml = nodeStartHtml;
    while ( nodeHtml.id != 'cnx_main' ) {
        strNode = nodeHtml.nodeName;
        if ( nodeHtml.className ) {
            strNode += ('['+ nodeHtml.className + ']');
        }
        strPath = strNode + '/' + strPath;
        nodeHtml = nodeHtml.parentNode;
    }
    alert("findEditableNode() reached 'cnx_main' with path: " + strPath);
}
*/
    // if we reach top-level tag, we found nothing to edit
    if (nodeHtml.id == 'cnx_main') return null;
    // otherwise we found an editable node
    else                           return nodeHtml;
}

function hasQmlParent(nodeStartHtml) {
    var nodeHtml = nodeStartHtml;
    while ( nodeHtml.id != 'cnx_main' ) {
        if ( nodeHtml.className && nodeHtml.className.toLowerCase()== 'qmlitem' ) {
            return true;
        }
        nodeHtml = nodeHtml.parentNode;
    }
    return false;
}

function hasGlossaryParent(nodeStartHtml) {
    var nodeHtml = nodeStartHtml;
    while ( nodeHtml.id != 'cnx_main' ) {
        if ( nodeHtml.className && nodeHtml.className.toLowerCase()== 'glossary-container' ) {
            return true;
        }
        nodeHtml = nodeHtml.parentNode;
    }
    return false;
}

/**
 * Returns whether or not a node is editable. true or false if it's editable
 *
 * @param node DOM Node to edit
 *
 */

function isEditable(nodeHtml)
{
    var strCnxmlTag;

    // className is not guaranteed to be an attribute
    try {
        if ( nodeHtml && typeof nodeHtml.className != "undefined" ) {
            strCnxmlTag = nodeHtml.className.toLowerCase().split(" ")[0];

            // workaround hacks
            if ( nodeHtml.nodeName.toLowerCase() == 'table' && strCnxmlTag == 'table' )
                strCnxmlTag = "not-an-editable-tag";
            if ( nodeHtml.className.toLowerCase().split(" ").length >= 2 &&
                 nodeHtml.className.toLowerCase().split(" ")[1] == 'inline' )
                strCnxmlTag = "not-an-editable-tag";
        }
    }
    catch (e) {
        // If we couldn't find the source tag name, then it must not be editable
        return false;
    }

    return strCnxmlTag in gEditableTags;
}

function isInlineEditable(nodeHtml)
{
    var strClassNode;
    strClassNode = ( nodeHtml && nodeHtml.className ? nodeHtml.className.toLowerCase() : '' );
    return ( strClassNode == 'title' );
}

/**
 * Edits a node.
 *
 * @param nodeHtml DOM Node to edit (from the DOM Tree being displayed to
 *                        the user, not the source DOM tree)
 */
function editNode(nodeHtml, bPreviewMode, bEditingExistingNode, strInsertionPosition, strXPathInsertionNode)
{
    alert('editNode() deprecated.');
}

/**
 * Remove the namespace attributes from serialized
 * xmlText that were added with addNamespaceAttributesToNode
 * to the node before serialization.
 *
 * @param xmlText String text of node to be edited
 * @return xmlText, stripped of previously added namespaces
 */
function removeNamespaceAttributesFromText(strXml) {
    var strNewXml;
    strNewXml = strXml;
    //strNewXml = strNewXml.replace(gRegExps.cnxml,    "$1$2"); // currently a no-op.  no idea why?
    strNewXml = strNewXml.replace(gRegExps.mathml,   "$1$2");
    strNewXml = strNewXml.replace(gRegExps.qml,      "$1$2");
    strNewXml = strNewXml.replace(gRegExps.mdml,     "$1$2");
    strNewXml = strNewXml.replace(gRegExps.bibtexml, "$1$2");
    //FIXME: a hack, this be.
    strNewXml = strNewXml.replace(gRegExps.mathml2,  "");
    return strNewXml;
}

/**
 * Adds the necessary namespaces to the text of a tag.
 *
 * @param tag String xmlText of the tag
 * @return the tag text augmented with namespaces
 */
function addNamespacesToTagText(tag) {
    var strNewXml;
    var bNeedsExtraSpace;

    // need to convert "<tag/>" into "<tag />"
    bNeedsExtraSpace =  ( tag.replace(/(<\S+)(\/>)/, "$1 $2") != tag );
    if ( bNeedsExtraSpace ) {
        tag = tag.replace(/(<\S+)(\/>)/, "$1 $2");
    }

    strNewXml = tag.replace(/(<\S+\s*?)(.*?>.*)/, "$1 " + gNameSpaces + " $2");

    return strNewXml;
}

function addNamespaces(strXml) {
    var strOpenTag;
    var strContents;
    var strCloseTag;
    var strNewXml;

    strXml.replace(/^(<[\w\W]*?>)([\w\W]*)(<\/[\w\W]*?>)/,
                    function(wholeMatch, openTag, contents, closeTag) {
                        strOpenTag = openTag;
                        strContents = contents;
                        strCloseTag = closeTag;
                        return contents;
                    });

    if ( strOpenTag ) {
        strNewXml = addNamespacesToTagText(strOpenTag) + strContents + strCloseTag;
    } else {
        // plan b : look for '<para id="eip-994"/>' instead
        var tmp = strXml.replace(/^(<[\w\W]*?\/>)/,
                        function(wholeMatch, openTag) {
                            strOpenTag = openTag;
                            return wholeMatch;
                        });
        if ( strOpenTag ) {
            strNewXml = addNamespacesToTagText(strOpenTag);
        }
        else {
            // no plan c
        }
    }

    return strNewXml;
}

/**
 * Replaces the node passed in
 * with the editing machinery, setting
 * the editing textarea to the value of parameter
 * xmlText.
 *
 * @param nodeHtmlToReplace nsIDOMNode to replace
 * @param strOpenTag String text of the opening tag
 * @param strXml String text for the editing textarea
 * @param strCloseTag String text for the closing tag
 */
function setupEditingArea(nodeHtmlToReplace, strOpenTag, strXml, strCloseTag) {
    alert('setupEditingArea() deprecated.');
}

function createTableElementText(columns, rows){
    alert('createTableElementText() deprecated.');
}


/**
 * Tear down the editing area, replacing it
 * with the supplied node.
 */
function replaceHtmlNode(newHtmlNode, nodeExistingHtml) {
    var nodeParentHtml;

    nodeParentHtml = nodeExistingHtml.parentNode;
    nodeParentHtml.insertBefore(newHtmlNode, nodeExistingHtml);
    nodeParentHtml.removeChild(nodeExistingHtml);
}


/**
 * Called when the ready state of our XMLHttpRequest
 * changes.  We watch this for when the request is complete.
 */
function handlePreviewRequest() {
    alert('handlePreviewRequest() deprecated.');
}


function handleDeleteRequest() {
    alert('handleDeleteRequest() deprecated.');
}


function replaceHtml(strHtml, nodeExistingHtml) {
    var nodeNewHtml;
    var nodeParsedHtml;
    var docNewHtml;

    try {
        //docNewHtml = parseHtmlTextToDOMDocument(strHtml);
        nodeParsedHtml = parseHtmlTextToDOMDocument(strHtml);
    }
    catch (e) {
        return null;
    }
    // sarissa supplies the IE version of importNode().
    //var nodeHtmlRoot = docNewHtml.documentElement;
    //nodeNewHtml = window.document.importNode(nodeHtmlRoot, true);
    if ( nodeParsedHtml != null ) {
        nodeNewHtml = window.document.importNode(nodeParsedHtml, true);
    }

    if ( Prototype.Browser.IE  ) {

        if ( nodeNewHtml == null || nodeNewHtml == undefined ) {
//alert('replaceHtml() : window.document.importNode() does not work.\nIt is a Preview Mode on IE thing.\nProceed with Plan B.');
            // Workaround #1:
            // Failing in IE on Preview mode.  Refreshing the page makes the problem go away.
            // Following code is a wordaround.  Unsure if this a sarissa problem or not.
            // mathplayer plugin might be responsible?  it appears that the internal state
            // of the window.document engine went south

            importNodeWorkAround = function(oNode, bChildren){
                var importNode = document.createElement("div");
                if(bChildren)
                    importNode.innerHTML = new XMLSerializer().serializeToString(oNode);
                else
                    importNode.innerHTML = new XMLSerializer().serializeToString(oNode.cloneNode(false));
                return importNode.firstChild;
            };

            //nodeNewHtml = importNodeWorkAround(nodeHtmlRoot, true);
            if ( nodeParsedHtml != null ) {
                nodeNewHtml = importNodeWorkAround(nodeParsedHtml, true);
            }
        }

        if ( nodeNewHtml == null || nodeNewHtml.nodeType != Node.ELEMENT_NODE ) {
//alert('Proceed with Plan C.');
            // Workaround #2:
            // Sometimes CNX server serves HTML instead of XHTML.  This occurs when
            // the mathplayer is not installed on IE.  We use the XML parser to parse
            // the XHTML. The XML parser coughs up an error in the case of HTML.
            // happens in both Save and Preview mode.

            var reg = new RegExp("<\!DOCTYPE[^>]*>\n?");
            var reg2 = new RegExp("<\\?xml[^>]*>\n?");
            var strMassagedHtml = strHtml;

            strMassagedHtml = strMassagedHtml.replace(reg, "");
            strMassagedHtml = strMassagedHtml.replace(reg2, "");

            var importNode = document.createElement("div");
            importNode.innerHTML = strMassagedHtml;
            nodeNewHtml = importNode.firstChild;
        }
    }

    nodeNewHtml.className = nodeNewHtml.className + ' edited';

    // replace the editing textarea and buttons with the new DOM Node
    replaceHtmlNode(nodeNewHtml, nodeExistingHtml);

    return nodeNewHtml;
}


function importNode(docXml){
    var nodeNewXml;
    // FF had: nodeNewXml = gSource.doc.importNode(docXml.documentElement, true);
    // which does not work on IE.  The IE equivalent does work on FF:
    nodeNewXml = docXml.documentElement.cloneNode(true);

    return nodeNewXml;
}

function replaceXml(strNewXml, nodeOldXml) {
    var docNewXml;
    var nodeNewXml;

    try {
        docNewXml = parseXmlTextToDOMDocument(strNewXml);
    }
    catch(e) {
        openErrorWindow("Unable to parse the newly edited CNXML text. " +
                        "We will revert the node you were editing back to its previous state. " +
                        "Please file a bug at http://cnx.org/bug_submit_form" +
                        " and provide the following information:\n" + e.toString());
        return null;
    }

    nodeNewXml = importNode(docNewXml);

    // replace the old cnxml node with the new one
    replaceXmlNode(nodeNewXml, nodeOldXml);

    // remove the namespaces we added to the new cnxml node
    nodeNewXml.removeAttribute("xmlns:m");
    nodeNewXml.removeAttribute("xmlns:q");
    nodeNewXml.removeAttribute("xmlns:bib");
    nodeNewXml.removeAttribute("xmlns:md");
    nodeNewXml.removeAttribute("xmlns");

    return nodeNewXml;
}

/**
 * Parses a String of xml text into
 * a DOM Node representation of it.
 *
 * @param strXml String xml text to parse
 * @throws Error if parsing fails
 * @return nsIDOMNode created from strXml
 */
function parseXmlTextToDOMDocument(strXml) {
    var docXml;
    var strMassagedXml = strXml;

    if ( gDOMParser ) {
        if (  Prototype.Browser.IE ) {
            // strip out doctype so that IE doesn't try to load it
            var reg = new RegExp("<\!DOCTYPE[^>]*>\n?");
            var reg2 = new RegExp("<\\?xml[^>]*>\n?");

            strMassagedXml = strMassagedXml.replace(reg, "");
            strMassagedXml = strMassagedXml.replace(reg2, "");
        }

        //var doc = Sarissa.getDomDocument();
        //doc.loadXML(strXml);

        //alert('parseXmlTextToDOMDocument(' + strMassagedXml + ')');
        var docXml = gDOMParser.parseFromString(strMassagedXml, "text/xml");
        //alert('Parsed XML doc is:\n' + serializeXmlNode(docXml));
    }

    return docXml;
}

function parseHtmlTextToDOMDocument(strHtml) {
    var docHtml;

    // use the Xml parser to parse the XHtml string.
    // CNX server mostly serves XHtml.
    docHtml = parseXmlTextToDOMDocument(strHtml);

/*
    if ( Prototype.Browser.IE  ) {
        if ( docHtml == null || docHtml.documentElement == null ) {
            // failed to parse the Html with the Xml parser
            // there are some instances for IE where the CNX server serves Html not XHtml
            // when Math Player is not installed => fake MathML rendering is Html.
alert('parseHtmlTextToDOMDocument(): failed to parse the Html with the Xml parser. strHtml is\n' + strHtml);

            var reg = new RegExp("<\!DOCTYPE[^>]*>\n?");
            var reg2 = new RegExp("<\\?xml[^>]*>\n?");
            var strMassagedHtml = strHtml;

            strMassagedHtml = strMassagedHtml.replace(reg, "");
            strMassagedHtml = strMassagedHtml.replace(reg2, "");

           var nodeHtml;

           nodeHtml = document.createElement('div');
           nodeHtml.innerHTML = strMassagedHtml;

            // window.document.importNode() does not like nodeHtml.firstChild.
            // forces the workaround into replaceHtml(). leaving this code here
            // as a reminder, since this is where the workaround should be.
           return nodeHtml.firstChild;
        }
    }
*/

    return docHtml.documentElement;
}

/**
 * Serialize an XML Node into XML text.
 *
 * @param node to serialize
 * @return xml text
 */
function serializeXmlNode(nodeXml) {
    var strSerializedXml;
    strSerializedXml = new XMLSerializer().serializeToString(nodeXml);
    return strSerializedXml;
}

function serializeAndMassageXmlNode(nodeXml) {
    var strSerializedXml;
    var strXml;

    strSerializedXml = serializeXmlNode(nodeXml);

    // FIXME
    // removing namespaces could now be a big issue in CNXML 0.6

    strXml = removeSerializerNamespacesFromText(strSerializedXml);

    // remove the namespaces that we added from what the user sees in xmlText
    strXml = removeNamespaceAttributesFromText(strXml);

    // extra spaces can get added above.  need to normalize.
    // remove the space(s) just before the first '>'
    strXml = strXml.replace(/^(<[\w\W]*?)\s*(>)([\w\W]*)(<\/[\w\W]*?>)/, "$1$2$3$4");
    // remove an extra space follwing the opening tag
    strXml = strXml.replace(/^(<[A-Za-z]+?)\s+(.*>)/, "$1 $2");

    return strXml;
}


function removeAndStoreOuterTagFromText(xmlText) {
    alert('removeAndStoreOuterTagFromText() deprecated.');
}

/**
 * Removes the a0: style namespaces
 * that the serializer adds
 * from a String of xml text.
 *
 * @param xmlText String of xml text
 * @return String of xml text purged of namespaces like a0
 */

function removeSerializerNamespacesFromText(xmlText) {

    // remove the a0: style stuff from opening tags with xmlns
    // be careful not to remove the mathml namespaces

    xmlText = xmlText.replace(/<[a-z]+[0-9]+:/g, "<");
    xmlText = xmlText.replace(/<\/[a-z]+[0-9]+:/g, "</");
    xmlText = xmlText.replace(/ xmlns[:]*[a-z]*[0-9]+=['"][^'"]*?['"]/g, "");
    xmlText = xmlText.replace(/ xmlns=['"][^'"]*?['"]/g, "");
    return xmlText;

}

/**
 * Extract the link tags
 * from the document and store
 * their information in the gURLs object.
 *
 * @throw Exception if unable to obtain
 *    necessary links
 */
function extractLinks() {

    var links;
    var i;
    var rel;
    var lURLs = gURLs;  // for debug

    // find the source link
    links = document.getElementsByTagName("link");

    // looking for submit, source, authorized
    for (i = 0; i < links.length; i++) {
        rel = links.item(i).getAttribute("rel");
        if (rel == "source" || rel == "module" || rel == "content" || rel =="update" || rel=="source_fragment") {
            // XXX could we use a more robust mozilla
            //   method of transforming relative to absolute URL?
            gURLs[rel] = links.item(i).getAttribute("href");
        }
    }
}


/**
 * Creates the global DOM Nodes that appear
 * when the user chooses to edit a particular
 * area of text.
 */
function createEditNodes() {
    var nodeHtmlMasterEditForm;
    var nodeHtmlMainCnxContentDiv;
    var nodeHtmlParent;

    nodeHtmlMasterEditForm = $('eipMasterEditContainerDiv');

    if ( nodeHtmlMasterEditForm == null ) {
        // expected case
        nodeHtmlMainCnxContentDiv = document.getElementById('cnx_main');
        nodeHtmlParent = nodeHtmlMainCnxContentDiv.parentNode;
        nodeHtmlMasterEditForm = document.createElement('div');

        nodeHtmlMasterEditForm.className = 'eipEditContainer';

        nodeHtmlMasterEditForm.setAttribute('id', 'eipMasterEditContainerDiv');
        nodeHtmlMasterEditForm.innerHTML = 'Never send to know for whom the bell tolls. It tolls for thee.';
        nodeHtmlParent.appendChild(nodeHtmlMasterEditForm);
        $('eipMasterEditContainerDiv').hide();
    }

    return;
}

/**
 * Download the rendered HTML content from server.
 */
function downloadContent(url) {

    gXMLHttpRequest.abort();

    // open a synchronous request for the xml source of the module
    gXMLHttpRequest.open("GET", url, false);

    // get the source
    gXMLHttpRequest.send(undefined);

    if (gXMLHttpRequest.status != 200) {
        if (gXMLHttpRequest.responseText) {
            throw new Error("Unable to download the render HTML content for the module. Received the following error message " +
                            "from the server: " + gXMLHttpRequest.responseText);
        }
        else {
            throw new Error("Unable to download the render HTML content for the module.  The server responded with status: " + gXMLHttpRequest.status);
        }
    }

    return gXMLHttpRequest.responseText;
}


/**
 * Download the rendered HTML content from server.
 */
function downloadSourceFragment(strUrl,strXpath) {

    var strFullUrl;
    var strCnxml;
    var strCnxmlWithNamespaces;

    strFullUrl = strUrl + "?xpath=" + strXpath + "";

    gXMLHttpRequest.abort();
    gXMLHttpRequest.onreadystatechange = function(event){return;};

    // open a synchronous request for the xml source of the module
    gXMLHttpRequest.open("GET", strFullUrl, false);

    // prevent IE from caching the result; none of which actually worked; solution is server side
    //gXMLHttpRequest.setRequestHeader("Cache-Control", "no-cache");
    //gXMLHttpRequest.setRequestHeader("Cache-Control", "no-store");
    //gXMLHttpRequest.setRequestHeader("Pragma",        "no-cache");
    //gXMLHttpRequest.setRequestHeader("Expires",       "0");

    // get the source
    gXMLHttpRequest.send(undefined);

    if (gXMLHttpRequest.status != 200) {
        if (gXMLHttpRequest.responseText) {
            throw new Error("Unable to download the CNXML source fragment for the module. Received the following error message " +
                            "from the server: " + gXMLHttpRequest.responseText);
        }
        else {
            throw new Error("Unable to download the CNXML source fragment for the module.  The server responded with status: " + gXMLHttpRequest.status);
        }
    }

    strCnxml = gXMLHttpRequest.responseText;
    strCnxmlWithNamespaces = addNamespaces(strCnxml);

    return strCnxmlWithNamespaces;
}


/**
 * A simple, dirty tree iterator because
 * the DOM one is frustrating.
 */
function iterate(root, nodeTypeFilter) {
    var nodeArray = [];

    return iterateHelper(root, nodeArray, nodeTypeFilter);
}

function iterateHelper(node, nodeArray, nodeTypeFilter) {
    if (node.nodeType == nodeTypeFilter) {
        nodeArray.push(node);
    }

    if (node.childNodes) {
        for (var i = 0; i < node.childNodes.length; i++) {
            iterateHelper(node.childNodes.item(i), nodeArray, nodeTypeFilter);
        }
    }

    return nodeArray;
}

/**
 * Enumerate the nodes of type nodeTypeToDisplay
 * underneath the given node.
 *
 * @param node nsIDOMNode to enumerate children
 * @param nodeTypeToDisplay display nodes of this type
 *                          - only supports Node.ELEMENT_NODE and
 *                            Node.TEXT_NODE
 */
function enumerate(node, nodeTypeToDisplay) {
    var iteration = iterate(node, nodeTypeToDisplay);
    dump("*****************************\n ITERATION of Node\n");
    for (var i = 0; i < iteration.length; i++) {
        switch(iteration[i].nodeType) {
        case Node.TEXT_NODE:
            dump(iteration[i].nodeValue);
            break;
        case Node.ELEMENT_NODE:
            dump(" " + iteration[i].localName + "--> nodeName==" + iteration[i].nodeName + " ");

            // FIXME
            //   looks suspicious
            if (iteration[i].getAttribute('id')) {
                dump("id == " + iteration[i].getAttribute('id'));
            }

            dump("\n");
            break;
        default:
            break;
        }
    }
}


/**
 * Locate the node in the XML DOM
 * given its id attribute.
 *
 * @param id tring id attribute
 * @param doc nsIDOMDocument to find node in
 */
function getNodeById(id, doc) {
    var nodeXML =  null;

    var xpath = "//*[@id='" + id + "']";

    nodeXML = getNodeByXPath(xpath, doc);

    return nodeXML;
}

/**
 * Locate the node in the XML DOM
 * given its XPath.
 *
 * @param xpath xpath string to locate single node
 * @param doc nsIDOMDocument to find node in
 */
function getNodeByXPath(xpath, doc) {
    var nodeXml;

    try {
        // sarissa!!!
        var strXPath = xpath;
        var docXml = doc;
        docXml.setProperty("SelectionLanguage", "XPath");

        // FIXME
        // at some point we need to be concerned with the QML namespace ...
        docXml.setProperty('SelectionNamespaces', 'xmlns:cnx="' + CNXML_NS + '"');
        Sarissa.setXpathNamespaces(docXml, 'xmlns:cnx="' + CNXML_NS + '"');

        nodeXml = docXml.selectSingleNode(strXPath);
        //var str =  serializeAndMassageXmlNode(docXml.documentElement);
        //str = str;
    }
    catch (e) {
        alert('getNodeByXPath(): sarissa failed to deliver on its promises.');
    }

    return nodeXml;
}

/**
 * Sets an attribute of a node
 * using an Internet-explorer 6 and
 * mozilla compatible method.
 *
 * @param node nsIDOMNode to set attribute for
 * @param name String name of attribute to set
 * @param value String value of attribute
 * @param doc nsIDOMDocument for this node
 */

function setNodeAttribute(node, name, value, deep) {
    if (deep) {
        setNodeAttributeHelp(node, name, value);
    }
    else {
        if (node.nodeType == Node.ELEMENT_NODE) {
            node.setAttribute(name, value);
        }
    }
}

function setNodeAttributeHelp(node, name, value) {
    if (node.nodeType == Node.ELEMENT_NODE) {
        node.setAttribute(name, value);
    }

    var children = node.childNodes;
    for (var i = 0; i < children.length; i++) {
        setNodeAttributeHelp(children.item(i), name, value);
    }
}


/**
 * Replaces a DOM Node with another DOM Node.
 * There is a DOM method for this, but it
 * appaers not to work.
 *
 * @param newNode nsIDOMNode replacement node
 * @param oldNode nsIDOMNode to replace
 */

function replaceXmlNode(nodeNewXml, nodeOldXml) {
    var nodeParent;

    nodeParent = nodeOldXml.parentNode;
    if (nodeParent == undefined) return;
    nodeParent.insertBefore(nodeNewXml, nodeOldXml);
    nodeParent.removeChild(nodeOldXml);
}

function openErrorWindow(text) {
    if (window.open) {
        // for window name, convert random number to string, then cut off first two characters, since the second is not alphanumeric
        var randomNum = Math.random() + "";
        var windowName = "error" + randomNum.substring(2);
        var errorWindow = window.open("about:blank", windowName, "height=300,width=500,scrollbars");
        errorWindow.document.write(text);
        return errorWindow;
    }
    else {
        window.alert(text);
        return null;
    }
}

function onDeleteButton(e){
    alert('onDeleteButton() deprecated.');
}

function doDelete()
{
    alert('onDelete() deprecated.');
}

function deleteHtmlAndXml(nodeHtmlToBeDeleted, nodeXmlToBeDeleted) {
    // find the previous node. it may be a Add form that also has to be deleted.
    if (nodeHtmlToBeDeleted.previousSibling){
        previous = nodeHtmlToBeDeleted.previousSibling;
        while (previous.nodeType!=Node.ELEMENT_NODE  && previous.previousSibling!=null){
            previous = previous.previousSibling;
        }
        // remove the previous add button ...
        if (previous.className == 'eipInsertElement'){
            nodeHtmlToBeDeleted.parentNode.removeChild(previous);
        }
    }

    nodeHtmlToBeDeleted.parentNode.removeChild(nodeHtmlToBeDeleted);

    var nodeXmlParent = nodeXmlToBeDeleted.parentNode;

    nodeXmlParent.removeChild(nodeXmlToBeDeleted);

    // change back to viewing state
    gEditNodeInfo.state = STATE_VIEWING;

    gEdited = true;
}

function onBeforeUnload()
{
    if (gEdited)
        return "If you leave, the changes you have made will be lost.\nPlease publish them first.";
}

/* Adds a button under each element in the list
 *  whose parent isn't a paragraph
 *
 */
function insertButtonsAfterNodes(list)
{
    // FIXME
    //    DEAD CODE!!!
    var i;

    for (i = 0; i < list.length; i++) {
        var node = list.item(i);
        if (isEditable(node)) {
            var parentNode = node.parentNode;
            // This is a constraint to not allow add buttons in
            // paragraphs, which should really be handled by some type
            // of schema
            if ( !(parentNode.nodeName.toLowerCase()=='div' && parentNode.className.split(" ")[0]=='para') ) {
                insertElementList(node,'after');
            }
        }
    }
}

/*
 * We add "Insert..." nodes mainly after editable CNXML nodes in the HTML.
 * The node is editable => we can build an XPATH to it, required to make an add request tothe server.
 * In CNXML 0.6, we add new blockish nodes but did not provide even basic EIP editability
 * which we want to be able to insert around.
 */
function isInsertable(nodeHtml) {
    var vInsertableTags;
    vInsertableTags = Object.clone(gEditableTags);
    vInsertableTags['quote'] = true;
    vInsertableTags['preformat'] = true;
    vInsertableTags['media'] = true;
    vInsertableTags['div'] = true;
    vInsertableTags['title'] = false;
    var strCnxmlTag;

    // className is not guaranteed to be an attribute
    try {
        if ( nodeHtml && typeof nodeHtml.className != "undefined" ) {
            strCnxmlTag = nodeHtml.className.toLowerCase().split(" ")[0];

            // workaround hacks
            if ( nodeHtml.nodeName.toLowerCase() == 'table' && strCnxmlTag == 'table' )
                strCnxmlTag = "not-an-editable-tag";
            if ( nodeHtml.className.toLowerCase().split(" ").length >= 2 &&
                 nodeHtml.className.toLowerCase().split(" ")[1] == 'inline' )
                strCnxmlTag = "not-an-editable-tag";
            if ( strCnxmlTag == 'title' )
                strCnxmlTag = "not-an-editable-tag";
        }
    }
    catch (e) {
        // If we couldn't find the source tag name, then it must not be editable
        return false;
    }

    return strCnxmlTag in vInsertableTags && vInsertableTags[strCnxmlTag];
}

/*
 * Insert text into the node if the node is EMPTY
 * so that users will know that they can click and edit it
 */
function insertClickText(nodeHtml){
    // FIXME
    //    DEAD CODE!!!
    var nodeHtmlSpan;
    var nodeHtmlText;
    var reg;
    var strXPath;
    var nodeXml;
    var strXml;
    var vstrResult;
    var strClassName;
    var bPuntMediaNode;

    nodeHtmlSpan = document.createElement('span');
    nodeHtmlSpan.className = 'clickText';
    nodeHtmlText = document.createTextNode('Click To Insert Text');
    nodeHtmlSpan.appendChild(nodeHtmlText);
    reg = new RegExp(/<[^>]+>([\w\W]*)<\/[^>]+>/);

    if ( isEditable(nodeHtml) ) {
        // now take the html node, build an xpath, and find the XML node.
        strXPath = buildXPathFromHtml(nodeHtml);
        if ( strXPath ) {
            // special case: media node with mime types that we do not style
            // will get here looking like an empty para. we do not want to
            // insert text into those.
            strClassName = nodeHtml.className.split(" ")[0];
            bPuntMediaNode = ( strClassName && strClassName == 'media' );
            if (bPuntMediaNode ) return;

            nodeXml = getNodeByXPath(strXPath, gSource.doc);
            if ( nodeXml ) {
                strXml = serializeXmlNode(nodeXml);
                if ( strXml ) {
                    vstrResult = strXml.match(reg);
                    if ( vstrResult == null ||
                         vstrResult[1] != null &&
                           (vstrResult[1].length == 0 ||
                            vstrResult[1].match(/\S/) == null ||
                            vstrResult[1].match(/^\s*<!-- Insert module text here -->\s*$/) != null ||
                            vstrResult[1].match(/^\s*<!--[\w\W]*-->\s*$/) != null) )
                    {
                        nodeHtml.appendChild(nodeHtmlSpan);
                    }
                }
                else {
                    // real error, maybe.
                }
            }
            else {
                // real error, maybe.
            }
        }
        else {
            // nodeHtml does not map to a XML counterpart.  this happens when we are styling.
        }
    }
}

// dead code
function getAddableNodes(nodeHtml) {
    // nodeHtml is a sibling node of the form node
    // that will be created by the caller.  nodeHtml
    // will share the same parent as the new form node.
    // the parent type will decide the children types
    // which can be added.
/*
    var tags = { 'para':'Paragraph',
                 'enum_list':'Enumerated List',
                 'bull_list':'Bulleted List',
                 'equation':'Equation',
                 'exercise':'Exercise',
                 'figure':'Figure',
                 'code': 'Code',
                 'note': 'Note',
                 'example': 'Example'
    };
*/
    // really need three separate arrays.
    // one for the syntactically possible children. (machine generated?)
    // one for the addable nodes (ie the nodes we know how to add).
    // one for the intersection of the first two, that is sorted JIT.
    var vvPossibleChildren = {
        'content' : [/* structural tags */
                     /*'section',*/ 'example', 'exercise', /*'problem',*/
                     /*'solution',*/ /*'proof',*/ /*'statement',/*
                     /* not in CNXML 0.5 spec */
                     'para', 'enum_list', 'bull_list', 'note', 'code',
                     'figure']
      , 'section' : [/*'name',*/
                     /* structural tags */
                     /*'section',*/ 'example', 'exercise', /*'problem',*/
                     /*'solution',*/ /*'proof',*/ /*'statement',/*
                     /* not in CNXML 0.5 spec */
                     'para', 'enum_list', 'bull_list', 'note', 'code',
                     'figure']
      , 'example' : [/* structural tags */
                     /*'section',*/ 'example', 'exercise', /*'problem',*/
                     /*'solution',*/ /*'proof',*/ /*'statement',/*
                     /* not in CNXML 0.5 spec */
                     'para', 'enum_list', 'bull_list', 'note', 'code',
                     'figure']
      , 'problem' : [/* structural tags */
                     /*'section',*/ 'example', 'exercise', /*'problem',*/
                     /*'solution',*/ /*'proof',*/ /*'statement',/*
                     /* not in CNXML 0.5 spec */
                     'para', 'enum_list', 'bull_list', 'note', 'code',
                     'figure']
      , 'solution' : [/* structural tags */
                     /*'section',*/ 'example', 'exercise', /*'problem',*/
                     /*'solution',*/ /*'proof',*/ /*'statement',/*
                     /* not in CNXML 0.5 spec */
                     'para', 'enum_list', 'bull_list', 'note', 'code',
                     'figure']
    };
    var vAddableTags;

    var nodeParentHtml;
    var strParentClassName;
    var strId;
    var bIsStringEmpty;

    nodeParentHtml = nodeHtml.parentNode;
    if ( nodeParentHtml != null ) {
        strParentClassName = nodeParentHtml.className.split(" ")[0];

        bIsStringEmpty = ( strParentClassName == null ||
                           strParentClassName.length == 0 );
        if ( bIsStringEmpty ) {
            // all is not lost.  if id attribute is 'cnx_main',
            //  we found the 'content' node.
            strId = nodeParentHtml.getAttribute('id');
            if ( nodeParentHtml.id == 'cnx_main' ) {
                strParentClassName = 'content';
            }
        }

        if ( strParentClassName == 'content' || strParentClassName == 'section' ) {
        } else {
            vAddableTags = null;
        }

        if ( strParentClassName != null ) {
            vAddableTags = vvPossibleChildren[strParentClassName];
        }
    }

    return vAddableTags;
}

// entry point for adding new nodes.
function addNode(strElement, strHtmlId) {
    if ( strElement ==  null || strElement.length == 0 ) {
        // in IE selecting the option divider thingy will get you here
        alert('Please select a valid CNXML tag.');
        return false;
    }

    var bEditingExistingNode = false;

    var oWorkFlowStep = createWorkFlowStep(strElement, bEditingExistingNode);
    if ( oWorkFlowStep != null ) {
        // board the OO train at this point and don't look back ...
        var nodeReplaceHtml = $(strHtmlId);
        try {
            oWorkFlowStep.addNode(nodeReplaceHtml);
        }
        catch (e) {
            // way too many assumptions are made within WorkFlowStep.addNode()
            // which are true only 99.9% of the time
        }
        return false;
    }

    // Return false so that the click event does not bubble up.  We
    // don't want links to be followed if they're clicked in EIP.
    return false;
}

// FIXME
// sarissa-able???
function createElementNS(doc, strElement) {
    if ( typeof doc.createElementNS != 'undefined' ) {
        // mozilla
        return doc.createElementNS(CNXML_NS, strElement);

    } else if ( typeof doc.createElement != 'undefined' ) {
        // ie
        //nodeNewXML.setAttribute("xmlns", CNXML_NS);
        return doc.createNode("element", strElement, CNXML_NS);

    } else {
        return null;
    }
}

function addIdToXmlNode(nodeXml, strId) {

    var vCNXML0dot6TagsThatRequireIds = {
        'code': ''        // precisely it is code[@display='block']
      , 'definition': ''
      , 'div': ''
      , 'document': ''
      , 'equation': ''
      , 'example': ''
      , 'exercise': ''
      , 'figure': ''
      , 'footnote': ''
      , 'list': ''
      , 'meaning': ''
      , 'media': ''
      , 'note': ''
      , 'para': ''
      , 'preformat': ''   // precisely it is preformat[@display='block']
      , 'problem': ''
      , 'proof': ''
      , 'quote': ''       // precisely it is quote[@display='block']
      , 'rule': ''
      , 'section': ''
      , 'solution': ''
      , 'subfigure': ''
      , 'table': ''
    };

    var strXmlTag = nodeXml.nodeName;

    if ( strXmlTag != null && strXmlTag != '' ) {
        if ( strId != null && strId != '' ) {
            if ( strXmlTag in vCNXML0dot6TagsThatRequireIds ) {
                nodeXml.setAttribute('id', strId);
            }
        }
    }

}

function isWhitespaceTextNode(nodeHtml) {
    var strNodeValue;
    var bIsWhitespaceTextNode;

    if ( nodeHtml != null && nodeHtml.nodeType == Node.TEXT_NODE ) {
        strNodeValue = nodeHtml.nodeValue;
        if ( strNodeValue != null ) {
            bIsWhitespaceTextNode = ( strNodeValue.match(/^\s*$/) != null );
            return bIsWhitespaceTextNode;
        }
    }

    return false;
}

function addNewNodeToHtmlAndXml(nodeReplaceHtml, nodeNewHtml, nodeNewXml)
{
    var infoInsertion = new Object();
    var nodeParentHtml = null;
    var nodeNextHtml =  null;
    var nodePreviousHtml =  null;
    var strXPath = null;
    var nodeNextXml = null;
    var nodePreviousXml = null;
    var nodeParentXml = null;
    var bInsertionHappened = false;
    var bGoodNextHtmlNode;
    var bGoodPreviousHtmlNode;

    nodeParentHtml = nodeReplaceHtml.parentNode;

    // random whitespace nodes in HTML need to be accounted for ...

    nodeNextHtml     = nodeReplaceHtml.nextSibling;
    nodePreviousHtml = nodeReplaceHtml.previousSibling;

    // next and previous HTML nodes do not have to be HTML that maps to
    // CNX XML DOM nodes.  in particular, whitespace text nodes may pop
    // up from time to time. adding then deleting can cause multiple
    // whitespace text nodes to be in sibling chain.  we want to skip
    // all of the text nodes in the sibling chains.
    while ( nodeNextHtml != null && isWhitespaceTextNode(nodeNextHtml) ) {
            nodeNextHtml = nodeNextHtml.nextSibling;
    }
    while ( nodePreviousHtml != null && isWhitespaceTextNode(nodePreviousHtml) ) {
            nodePreviousHtml = nodePreviousHtml.previousSibling;
    }

    // the next and previous node links should point at HTML nodes
    // that can be mapped into the XML DOM via its classname.
    // defensive programming follows for the unexpected case
    // where the HTML gets pooched.
    bGoodNextHtmlNode = ( nodeNextHtml &&
                          nodeNextHtml.className &&
                          gValidCnxmlTags[ nodeNextHtml.className.split(" ")[0] ] );
    if ( !bGoodNextHtmlNode ) {
        nodeNextHtml = null;
    }

    bGoodPreviousHtmlNode = ( nodePreviousHtml &&
                              nodePreviousHtml.className &&
                              gValidCnxmlTags[ nodePreviousHtml.className.split(" ")[0] ] );
    if ( !bGoodPreviousHtmlNode ) {
        nodePreviousHtml = null;
    }

    if ( bGoodNextHtmlNode ) {
        strXPath = buildXPathFromHtml(nodeNextHtml);
        nodeNextXml = getNodeByXPath(strXPath, gSource.doc);
        nodeParentXml = nodeNextXml.parentNode;

        nodeParentXml.insertBefore(nodeNewXml, nodeNextXml);
        bInsertionHappened = true;

        infoInsertion.strXPathInsertionNode = strXPath;
        infoInsertion.strInsertionPosition = 'before';
    } else if ( bGoodPreviousHtmlNode ) {
        strXPath = buildXPathFromHtml(nodePreviousHtml);
        nodePreviousXml = getNodeByXPath(strXPath, gSource.doc);
        nodeParentXml = nodePreviousXml.parentNode;

        nodeNextXml = nodePreviousXml.nextSibling; // could be null
        nodeParentXml.insertBefore(nodeNewXml, nodeNextXml);
        bInsertionHappened = true;

        infoInsertion.strXPathInsertionNode = strXPath;
        infoInsertion.strInsertionPosition = 'after';
    } else {
        bInsertionHappened = false;
        alert('EIP: Next or previous siblings do not map to CNX XML nodes.');
    }

    if ( bInsertionHappened ) {
        nodeParentHtml.replaceChild(nodeNewHtml, nodeReplaceHtml);
    }

    return infoInsertion;
}

function onSave(e)
{
    alert('onSave() deprecated.');
}

function onPreview(e)
{
    alert('onPreview() deprecated.');
}

function sendAdd(strServerRequestUrl, strTag, strNewXml, strXPathInsertionNode, strInsertionPosition, funcServerReturnCalback)
{
    var strSendXml;

    // Post with the server
    gRequest.xhr = gXMLHttpRequest;
    gRequest.xhr.open("POST", strServerRequestUrl);
    gRequest.xhr.onreadystatechange = funcServerReturnCalback;

    // Zeus appeared on high and said '20232769535103786141388480521'.  And it was good.
    var boundary = '-----------------------------20232769535103786141388480521';
    gRequest.xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);

    // store this as the eventual text of the new cnxml node
    // FIXME
    // caller should do this instead ...
    gRequest.nodeReplacementXML = strNewXml;

    L = [''];
    L = addMultipartValue(boundary, 'action', 'add', L);
    L = addMultipartValue(boundary, 'xpath', strXPathInsertionNode, L);
    L = addMultipartValue(boundary, 'position', strInsertionPosition, L);
    L = addMultipartValue(boundary, 'content', strNewXml, L);
    L = L.concat('--'+boundary+'--');
    strSendXml = L.join('\r\n');

    // set state to validating
    gEditNodeInfo.state = STATE_VALIDATING;

    //gRequest.sourceNode = node;

    // send the POST
    gRequest.xhr.send(strSendXml);
}

function handleAddRequest() {
    alert('handleAddRequest() deprecated.');
}

function createElement(name)
{
    var newDiv = document.createElement('div');
    var classname = name +' new-' + name;
    newDiv.className = classname;
    var id = createUniqueId();
    newDiv.setAttribute('id', id);
    return newDiv;
}

function getXPath(node)
{
  var pNode = node.parentNode;
  if (pNode) {
    var myIndex = countTwins(node, node.nodeType,node.nodeName.toLowerCase());
    var totalIndex = countTwins(pNode.lastChild, node.nodeType,node.nodeName);
    var brackets = ( totalIndex > 1 ? "[" + myIndex + "]" : "" );
    return getXPath(pNode) + "/" + "cnx:" + node.nodeName + brackets;
  } else {
    return "";
  }
}

function countTwins(node,type,name)
{
    var count = 0;
    while (node) {
        if (node.nodeType == type && node.nodeName == name)
            count++;
        node = node.previousSibling;
    }
    return count;
}

/* Function to create unique id's for new CNXML paragraphs et al */

function createUniqueId()
{
    var bIsIdUnique;
    var strId;
    var iRandom;

    do {
        iRandom = Math.floor(Math.random()*1001);
        strId = "eip-" + iRandom;
        bIsIdUnique = ( getNodeById(strId, gSource.doc) == null );
    } while ( !bIsIdUnique );

    return strId;
}

/* Function to create unique id's for new HTML divs et al */

function createUniqueHtmlId()
{
    var bIsIdUnique;
    var strId;
    var iRandom;

    do {
        iRandom = Math.floor(Math.random()*1000001);
        strId = "html-element-" + iRandom;
        bIsIdUnique = ( $(strId) == undefined );
    } while ( !bIsIdUnique );

    return strId;
}

/**Finds a sibling node either
 * up or down the DOM tree
 * that is not text or a form element.
 */
function findSiblingNode(nodeHtml, strPosition)
{
    var sibling = nodeHtml;

    if (strPosition == 'previous') {
        do {
            sibling = sibling.previousSibling;
        } while(sibling && (sibling.nodeType!=Node.ELEMENT_NODE ||
                sibling.nodeName.toUpperCase() == 'FORM'));
    } else {
        do {
            sibling = sibling.nextSibling;
        } while(sibling && (sibling.nodeType!=Node.ELEMENT_NODE ||
                sibling.nodeName.toUpperCase() == 'FORM'));
    }

    return sibling;
}

function isNodeOnlyChild(nodeHtml)
{
    var strXPath;
    var nodeXml;
    var nodeParentXml;
    var bIsNodeOnlyChild;
    var iChildCount;

    strXPath = buildXPathFromHtml(nodeHtml);
    nodeXml = getNodeByXPath(strXPath, gSource.doc);

    if ( nodeXml != null ) {
        nodeParentXml = nodeXml.parentNode;
        iChildCount = 0;

        for (i = 0; i < nodeParentXml.childNodes.length; i++) {
            var nodeSiblingXml = nodeParentXml.childNodes[i];
            if ( nodeParentXml.childNodes[i].nodeType != Node.TEXT_NODE ) {
                iChildCount++;
                if ( iChildCount > 1 ) break; // our work here is done.
            }
        }

        bIsNodeOnlyChild = ( iChildCount == 1 );
    }
    else {
        bIsNodeOnlyChild = false;
    }

    return bIsNodeOnlyChild;
}

function isNodeDeletable(nodeHtml)
{
    var nodeParentHtml;
    var bIsNodeDeletable;
    var bIsNodeOnlyChild;

    nodeParentHtml = nodeHtml.parentNode;
    if ( nodeParentHtml != null ) {
        bIsNodeOnlyChild = isNodeOnlyChild(nodeHtml);
        bIsNodeDeletable = ( !bIsNodeOnlyChild  );
    }
    else {
        bIsNodeDeletable = false;
    }

    return bIsNodeDeletable;
}

function isNodeNew(node)
{
    if ( node == null ) return false;

    var temp = node.className.split(" ")[1];
    //If edited node is not new, temp is undefined
    if (temp){
        var test = temp.split("-")[0];
        if (test=='new'){
            return true;
        }
    }
    return false;
}


function parseSource(strXmlSource)
{
    var nodeRootXml;

    gSource.strXmlSource = strXmlSource;

    // parse XML source string into an XML DOM Tree
    gSource.doc = parseXmlTextToDOMDocument(strXmlSource);
    nodeRootXml = gSource.doc.documentElement;

    // hack for kef ...
    var strTextEditBoxSize = getUrlParameter('size');
    if ( strTextEditBoxSize && strTextEditBoxSize.length > 0 ) {
        g_strTextEditBoxSize = strTextEditBoxSize;
    }
}

//
// Our very own popup menu
//

var g_iTimerID = null;
var g_strOpenMenuId = null;

function stopPopupMenuTimer(event, strHtmlId) {
    var bTimerOn;
    var bWrongTimer;

    bTimerOn = ( g_iTimerID != null );
    if ( bTimerOn ) {
        bWrongTimer = ( strHtmlId != g_strOpenMenuId );
        if ( !bWrongTimer ) {
            clearTimeout(g_iTimerID);
            g_iTimerID = null;
        }
        else {
            //alert('Trouble In Town?\ncurrent id is ' + strHtmlId + '.\n global id is ' + g_strOpenMenuId + '.\n global timer id is ' + g_iTimerID);
        }
    }

    Event.stop(event);

    return false;
}

function showPopupMenu(strHtmlId) {
    var nodeDivInsertListContainer;
    var nodeDivInsertContainer;

    nodeDivInsertListContainer = $(strHtmlId);
    nodeDivInsertContainer = $(nodeDivInsertListContainer.parentNode);

    $(nodeDivInsertListContainer).show();

    g_strOpenMenuId = strHtmlId;
}

function hidePopupMenu(strHtmlId) {
    var nodeDivInsertListContainer;
    nodeDivInsertListContainer = $(strHtmlId);
    nodeDivInsertListContainer.style.position = '';
    $(nodeDivInsertListContainer).hide();
    g_strOpenMenuId = null;
    g_iTimerID = null;
}

function openPopupMenu(event, strHtmlId) {
    var bAlreadyGotOneOpen;
    var bGotThisMenuOpen;

    bAlreadyGotOneOpen = ( g_strOpenMenuId != null );
    bGotThisMenuOpen = ( bAlreadyGotOneOpen && strHtmlId == g_strOpenMenuId );

    if ( areEditing() ) {
        // user should not be allow to insert while editing
    }
    else if ( bAlreadyGotOneOpen && !bGotThisMenuOpen ) {
        // should never get here ...
        // we have a popup menu still open. we need to close it before we open the new one.
        hidePopupMenu(g_strOpenMenuId);
        if ( g_iTimerID ) {
            clearTimeout(g_iTimerID);
            g_iTimerID = null;
        }
        showPopupMenu(strHtmlId);
    }
    else if (bAlreadyGotOneOpen && bGotThisMenuOpen ) {
        // we have already opened this popupmenu.  a second click will close it.
        hidePopupMenu(strHtmlId);
    }
    else {
        showPopupMenu(strHtmlId);
    }

    Event.stop(event);

    return false;
}

function closePopupMenu(event, strHtmlId) {
    var bTimerOn;
    var bGotMenuOpen;
    var bGotThisMenuOpen;

    // get here on the mouseout event of the <div> containing the 'Insert...' link
    bTimerOn = ( g_iTimerID != null );
    bGotMenuOpen = ( g_strOpenMenuId != null );
    bGotThisMenuOpen = ( bGotMenuOpen && strHtmlId == g_strOpenMenuId );

    if ( bGotMenuOpen && !bGotThisMenuOpen ) {
        // got a mouseout event for the wrong node.  we could force the popup menu to be closed or
        // let the timer do its job.  choose the latter
        //alert('mousing out on another Insert...');
        //hidePopupMenu(g_strOpenMenuId); alert('mousing out on another Insert...');
        //g_strOpenMenuId = null;
        //if ( bTimerOn ) {
        //    clearTimeout(g_iTimerID);
        //    g_iTimerID = null;
        //}
    }

    else if ( bGotThisMenuOpen ) {
        g_iTimerID = setTimeout("hidePopupMenu('" + strHtmlId + "');", 200);
    }

    Event.stop(event);

    return false;
}

function insertNewNode(event, strListId, strTagName, strDivId) {
    hidePopupMenu(strListId);
    addNode(strTagName, strDivId);
    Event.stop(event);
    return false;
}

function openInsertHelp(event) {
    openHelp('help');
    Event.stop(event);
    return false;
}

function bindInsertEvents(nodeDivInsertContainer) {
    var nodeInsertLink;
    var nodeDivInsertListContainer;
    var nodeInsertListItem;
    var strDivId;
    var strListId;
    var strTagLongName;
    var strTagName;
    var i;
    var vTags = {
        'Paragraph':'para'
      , 'Section':'section'
      , 'Code':'code'
      , 'List':'list'
      , 'Equation':'equation'
      , 'Note':'note'
      , 'Exercise':'exercise'
      , 'Example':'example'
      , 'Table':'table'
      //, 'Media/Image':'media'
    };

    strDivId = nodeDivInsertContainer.id;
    nodeInsertLink             = nodeDivInsertContainer.childNodes[0];
    nodeDivInsertListContainer = nodeDivInsertContainer.childNodes[1];
    strListId = nodeDivInsertListContainer.id;

    Event.observe(nodeDivInsertContainer, 'mouseout',
                  closePopupMenu.bindAsEventListener(nodeDivInsertContainer, strListId));

    // did not remove "sleeping" event callback on IE
    //Event.stopObserving(nodeInsertLink, 'click',
    //                    openPopupMenu.bindAsEventListener(nodeInsertLink, strListId));
    Event.observe(nodeInsertLink, 'click',
                  openPopupMenu.bindAsEventListener(nodeInsertLink, strListId));
    Event.observe(nodeInsertLink, 'mouseover',
                  stopPopupMenuTimer.bindAsEventListener(nodeInsertLink, strListId));

    Event.observe(nodeDivInsertListContainer, 'mouseover',
                  stopPopupMenuTimer.bindAsEventListener(nodeDivInsertListContainer, strListId));

    for (i=0; i<nodeDivInsertListContainer.childNodes.length; i++) {
        nodeInsertListItem = nodeDivInsertListContainer.childNodes[i];
        if ( nodeInsertListItem.className == 'eipInsertElementHelp' ) {
            Event.observe(nodeInsertListItem, 'click',
                          openInsertHelp.bindAsEventListener(nodeInsertListItem));
        }
        else {
            strTagLongName = nodeInsertListItem.innerHTML;
            strTagName = vTags[strTagLongName];
            Event.observe(nodeInsertListItem, 'click',
                          insertNewNode.bindAsEventListener(nodeInsertListItem, strListId, strTagName, strDivId));
        }
    }
}

function createInserts(node) {
    // node is a sibling node for the form node
    // we create here, ignored
    var strDivId;
    var strListId;
    var strOnClick;
    var strOnMouseOut;
    var strOnMouseOver;
    var strTagName;
    var fnOnClick;
    var fnOnMouseOut;
    var fnOnMouseOver;
    var nodeDivInsertContainer;
    var nodeInsertLink;
    var nodeText;
    var nodeDivInsertListContainer;
    var nodeInsertListItem;
    var vTags = {
        'para':'Paragraph'
      , 'section':'Section'
      , 'code':'Code'
      , 'list':'List'
      , 'equation':'Equation'
      , 'note':'Note'
      , 'exercise':'Exercise'
      , 'example':'Example'
      , 'table':'Table'
      //, 'media':'Media/Image'
    };

    strDivId = createUniqueHtmlId();
    strListId = createUniqueHtmlId();

    nodeDivInsertContainer = document.createElement('div');
    nodeDivInsertContainer.className = 'eipInsertElement';
    nodeDivInsertContainer.id = strDivId;
    //Event.observe(nodeDivInsertContainer, 'mouseout',
    //              closePopupMenu.bindAsEventListener(nodeDivInsertContainer, strListId));

    // another way: <a href="javascript:openPopupMenu();">Insert...</a>???
    nodeInsertLink = document.createElement('a');
    nodeInsertLink.className = 'eipInsertElementLink';
    nodeInsertLink.href = 'javascript:';
    //Event.observe(nodeInsertLink, 'click',
    //              openPopupMenu.bindAsEventListener(nodeInsertLink, strListId));
    //Event.observe(nodeInsertLink, 'mouseover',
    //              stopPopupMenuTimer.bindAsEventListener(nodeInsertLink, strListId));
    nodeText = document.createTextNode('Insert...');
    nodeInsertLink.appendChild(nodeText);
    nodeDivInsertContainer.appendChild(nodeInsertLink);

    // hidden "popup menu"
    nodeDivInsertListContainer = $(document.createElement('div'));
    nodeDivInsertListContainer.className = 'eipInsertElementList';
    nodeDivInsertListContainer.id = strListId;
    $(nodeDivInsertListContainer).hide();
    //Event.observe(nodeDivInsertListContainer, 'mouseover',
    //              stopPopupMenuTimer.bindAsEventListener(nodeDivInsertListContainer, strListId));

    for ( strTagName in vTags ) {
        if ( strTagName.length > 0 && vTags[strTagName].length > 0 ) {
            nodeInsertListItem = document.createElement('span');

            //Event.observe(nodeInsertListItem, 'click',
            //              insertNewNode.bindAsEventListener(nodeInsertListItem, strListId, strTagName, strDivId));
            nodeText = document.createTextNode(vTags[strTagName]);
            nodeInsertListItem.appendChild(nodeText);

            nodeDivInsertListContainer.appendChild(nodeInsertListItem);
        }
    }

    // create the last list item "other elements ..." here
    nodeInsertListItem = document.createElement('span');

    nodeInsertListItem.className = 'eipInsertElementHelp';
    //fnOnClick = function(event){openHelp('help'); Event.stop(event); return false;};
    //Event.observe(nodeInsertListItem, 'click', fnOnClick);
    nodeText = document.createTextNode("Other elements...");
    nodeInsertListItem.appendChild(nodeText);

    nodeDivInsertListContainer.appendChild(nodeInsertListItem);

    nodeDivInsertContainer.appendChild(nodeDivInsertListContainer);
//var foo = new XMLSerializer().serializeToString(nodeDivInsertContainer);

    bindInsertEvents(nodeDivInsertContainer);

    return nodeDivInsertContainer;
}

function insertElementList(node, position) {
    var form;
    var parentNode;

    form = createInserts(node);
    parentNode = node.parentNode;

    if ( position == 'before' ) {
        parentNode.insertBefore(form, node);
    }
    if ( position == 'after' ) {
        parentNode.insertBefore(form, node.nextSibling);
    }
}

var gTagsThatDoNotContainInserts = {
    "para" : true
  , "exercise" : true
  , "rule" : true
  , "definition" : true
  , "figure" : true
  , "div" : true
}

function addInserts(nodeHtmlParent)
{
    // add the Insert... nodes for the nodeHtmlParent's children
    // caller will add forms for nodeHtmlParent.
    var nodeChild;
    var bFirstChildOfParent;
    var nodePreviousSibling;
    var bStopInserting;
    var strClassName;

    bFirstChildOfParent = true;
    for (nodeChild = nodeHtmlParent.firstChild;
         nodeChild != null;
         nodeChild = nodeChild.nextSibling)
    {
        if ( isInsertable(nodeChild) ) {
            if ( bFirstChildOfParent ) {
                insertElementList(nodeChild, 'before');
                bFirstChildOfParent = false;
            }
            insertElementList(nodeChild, 'after');
        }

        if ( nodeChild.className ) {
            strClassName = nodeChild.className.split(" ")[0];
            bStopInserting = ( strClassName in gTagsThatDoNotContainInserts ||
                               strClassName == 'qmlitem' ||
                               strClassName == 'glossary-container' ||
                               strClassName.startsWith('eipInsertElement') );
        }
        else {
            bStopInserting = false;
        }

        if ( !bStopInserting ) {
            // no "Insert..." nodes added BELOW a para/figure/etal in the DOM tree
            // restriction will be removed in CNXML 0.6
            addInserts(nodeChild);
        }
    }
}

function addInsertsForSectionNodes(nodeHtmlParent)
{
    var nodeChild;
    var nodePreviousSibling;
    var nodeNextSibling;
    var strClassName;

    if ( nodeHtmlParent.className ) {
        strClassName = nodeHtmlParent.className.split(" ")[0];
        if ( strClassName == 'qmlitem' ) {
            // sections contained within a QML node will not have "Insert..." nodes added
            return;
        }
    }

    for (nodeChild = nodeHtmlParent.firstChild;
         nodeChild != null;
         nodeChild = nodeChild.nextSibling)
    {
        if ( nodeChild.className ) {
            strClassName = nodeChild.className.split(" ")[0];
            if ( strClassName == 'section' ) {
                // find previous sibling that is a 'real' node. skips whitespace text nodes.
                nodePreviousSibling = nodeChild.previousSibling;
                while ( nodePreviousSibling &&
                        nodePreviousSibling.nodeType != Node.ELEMENT_NODE ) {
                    nodePreviousSibling = nodePreviousSibling.previousSibling;
                }
                if ( nodePreviousSibling &&
                     nodePreviousSibling.className &&
                     nodePreviousSibling.className == 'eipInsertElement' ) {
                     // the select form is already present, so do nothing.
                }
                else {
                    insertElementList(nodeChild, 'before');
                }

                nodeNextSibling = nodeChild.nextSibling;
                while ( nodeNextSibling &&
                        nodeNextSibling.nodeType != Node.ELEMENT_NODE ) {
                    nodeNextSibling = nodeNextSibling.nextSibling;
                }
                if ( nodeNextSibling &&
                     nodeNextSibling.className &&
                     nodeNextSibling.className == 'eipInsertElement' ) {
                     // the select form is already present, so do nothing.
                }
                else {
                    insertElementList(nodeChild, 'after');
                }
            }
        }

        addInsertsForSectionNodes(nodeChild);
    }
}

function setupFormsBySubtree(nodeHtmlSubtree)
{
    var strClassName;
    var bStopInserting;
    var bAddForms;

    // Add the select forms for the editable children of nodeHtmlSubtree

    strClassName = nodeHtmlSubtree.className.split(" ")[0];
    bStopInserting = ( strClassName in gTagsThatDoNotContainInserts ||
                       strClassName == 'qmlitem' ||
                       strClassName == 'glossary-container' ||
                       strClassName.startsWith('eipInsertElement') );

    bAddForms = ( !bStopInserting );
    if ( bAddForms ) {
        addInserts(nodeHtmlSubtree);
    }

    // <section> nodes are not editable but need select forms
    addInsertsForSectionNodes(nodeHtmlSubtree);
}

// called from initEip() in module_init_eip.js
function setupForms()
{
    var nodeCnxMain;

    nodeCnxMain = $('cnx_main');

    if ( nodeCnxMain != null ) {
        // adds our insert new node mechanism 
        setupFormsBySubtree(nodeCnxMain);

        // adds the hover edit hints and the edit section links
        addHoverText(nodeCnxMain);

        // get the top level tag, apply the onclick
        nodeCnxMain.onclick = generalOnClickHandler;
    }
}

function isSection(nodeHtml) {
    return ( nodeHtml.className && nodeHtml.className.toLowerCase().split(" ")[0] == 'section' );
}

function findSectionTitleHtmlNode(nodeHtmlSection) {
    var nodeHtmlSectionChild; 
    var nodeHtmlSectionHeader;
    var nodeHtmlSectionHeaderChild;
    var strNodeName;
    var bHeaderFound;
    var bFoundSectionHeader;
/*
Here is the HTML that we expect:

<div class="section" id="eip-732">
    <h2 class="section-header">
        <SPAN xmlns="" class="eipClickToEdit" id="html-element-449">
            <A href="javascript:" class="eipClickToEditSectionTitle">edit section title</A>
            <A href="javascript:" class="eipClickToEditEntireSection">edit entire section</A>
        </SPAN>
        <span class="cnx_label">Label: </span>     <!-- OPTIONAL -->
        <strong class="title">Heading 1</strong>   <!-- OPTIONAL -->
        &nbsp;
    </h2>
    <div class="section-contents">... contained section content here ...</div>
    <div class="section-end">End of section</div>
</div>
*/
    if ( isSection(nodeHtmlSection) ) {
        nodeHtmlSectionChild = nodeHtmlSection.firstChild;
        while ( nodeHtmlSectionChild ) {
            strNodeName = nodeHtmlSectionChild.nodeName.toLowerCase();
            bHeaderFound = ( strNodeName == 'h2' ||
                             strNodeName == 'h3' ||
                             strNodeName == 'h4' ||
                             strNodeName == 'h5' ||
                             strNodeName == 'h6' );
            if ( bHeaderFound &&
                 (nodeHtmlSectionChild.className.split(" ")[0] == 'section-header') ) {
                break;
            }
            nodeHtmlSectionChild = nodeHtmlSectionChild.nextSibling;
        }
        bFoundSectionHeader = ( nodeHtmlSectionChild != null )
        if ( bFoundSectionHeader ) {
            nodeHtmlSectionHeader = nodeHtmlSectionChild;
            nodeHtmlSectionHeaderChild = nodeHtmlSectionHeader.firstChild;
            while ( nodeHtmlSectionHeaderChild ) {
                if ( nodeHtmlSectionHeaderChild.nodeName.toLowerCase() == 'strong' &&
                     (nodeHtmlSectionHeaderChild.className.split(" ")[0] == 'title' ||
                      nodeHtmlSectionHeaderChild.className.split(" ")[0] == 'notitle') ) {
                    return nodeHtmlSectionHeaderChild;
                }
                nodeHtmlSectionHeaderChild = nodeHtmlSectionHeaderChild.nextSibling;
            }
        }
    }
    return null;
}

function findSectionHeaderHtmlNode(nodeHtmlSection) {
/*
Here is the HTML that we expect:

<div class="section" id="eip-732">
    <h2 class="section-header"></h2>
    <div class="section-contents">... contained section content here ...</div>
    <div class="section-end">End of section</div>
</div>
*/
    if ( isSection(nodeHtmlSection) ) {
        nodeHtmlSectionChild = nodeHtmlSection.firstChild;
        while ( nodeHtmlSectionChild ) {
            strNodeName = nodeHtmlSectionChild.nodeName.toLowerCase();
            bHeaderFound = ( strNodeName == 'h2' ||
                             strNodeName == 'h3' ||
                             strNodeName == 'h4' ||
                             strNodeName == 'h5' ||
                             strNodeName == 'h6' );
            if ( bHeaderFound &&
                 (nodeHtmlSectionChild.className.split(" ")[0] == 'section-header') ) {
                return nodeHtmlSectionChild;
            }
            nodeHtmlSectionChild = nodeHtmlSectionChild.nextSibling;
        }
    }
    return null;
}

function findSectionContentsHtmlNode(nodeHtmlSection) {
    var nodeHtmlSectionChild;
    var strNodeName;
    var bDivFound;
    var bFoundSectionContents;
    var nodeHtmlSectionContents;
/*
Here is the HTML that we expect:

<div class="section" id="eip-732">
    <h2 class="section-header">
        <strong class="title">
            <SPAN xmlns="" class="eipClickToEdit" id="html-element-449">
                <A href="javascript:" class="eipClickToEditSectionTitle">edit section title</A>
                <A href="javascript:" class="eipClickToEditEntireSection">edit entire section</A>
            </SPAN>
            <strong class="title">Heading 1</strong>
        </strong>
    </h2>
    <div class="section-contents">... contained section content here ...</div>
    <div class="section-end">End of section</div>
</div>
*/
    if ( isSection(nodeHtmlSection) ) {
        nodeHtmlSectionChild = nodeHtmlSection.firstChild;
        while ( nodeHtmlSectionChild ) {
            strNodeName = nodeHtmlSectionChild.nodeName.toLowerCase();
            bDivFound = ( strNodeName == 'div' );
            if ( bDivFound &&
                 (nodeHtmlSectionChild.className.split(" ")[0] == 'section-contents') ) {
                break;
            }
            nodeHtmlSectionChild = nodeHtmlSectionChild.nextSibling;
        }
        bFoundSectionContents = ( nodeHtmlSectionChild != null )
        if ( bFoundSectionContents ) {
            nodeHtmlSectionContents = nodeHtmlSectionChild;
            return nodeHtmlSectionContents;
        }
    }
    return null;
}

function findSectionNode(nodeHtml) {
    while ( !isSection(nodeHtml) && (nodeHtml.id != 'cnx_main') ) {
        nodeHtml = nodeHtml.parentNode;
    }
    return ( nodeHtml.id == 'cnx_main' ? null : nodeHtml );
}

function editSectionTitle(event, nodeHtmlSection) {
    var nodeHtmlClicked;
    var strId;
    var nodeHtmlSectionHeader;
    var nodeSectionXml;
    var nodeSectionLabelXml;
    var nodeSectionTitleXml;
    var i;
    var strChildNodeName;
    var bCnxmlHasSectionTitle;
    var strXmlNodeName;
    var bEditingExistingNode;
    var oWorkFlowStep;

    nodeHtmlClicked = this;

    if ( areEditing() ) {
        // already editing something else, so ignore.
    }
    else {
        if ( nodeHtmlSection ) {
            strId = nodeHtmlSection.getAttribute('id');
            if ( strId ) {
                nodeHtmlSectionHeader = findSectionHeaderHtmlNode(nodeHtmlSection);

                nodeSectionXml = getNodeById(strId, gSource.doc);
                nodeSectionLabelXml = null;
                nodeSectionTitleXml = null;
                for (i = 0; i < nodeSectionXml.childNodes.length; i++) {
                    strChildNodeName = nodeSectionXml.childNodes[i].nodeName;
                    if ( strChildNodeName == 'label' ) {
                        nodeSectionLabelXml = nodeSectionXml.childNodes[i];
                    }
                    else if ( strChildNodeName == 'title' ) {
                        nodeSectionTitleXml = nodeSectionXml.childNodes[i];
                        // label if it exists must preceed title
                        break;
                    }
                }

                bCnxmlHasSectionTitle = ( nodeSectionTitleXml != null );
                if ( bCnxmlHasSectionTitle ) {
                    // edit existing section <title>
                    strXmlNodeName = 'title';
                    bEditingExistingNode = true;
                    oWorkFlowStep = createWorkFlowStep(strXmlNodeName, bEditingExistingNode);
                    if ( oWorkFlowStep != null ) {
                        oWorkFlowStep.editNode(nodeHtmlSectionHeader);
                    }
                }
                else {
                    // no section <title> exists in CNXML, so add one!
                    strXmlNodeName = 'title';
                    bEditingExistingNode = false;
                    oWorkFlowStep = createWorkFlowStep(strXmlNodeName, bEditingExistingNode);
                    if ( oWorkFlowStep != null ) {
                        oWorkFlowStep.addNode(nodeHtmlSectionHeader);
                    }
                }
            }
        }
    }

    // Return false so that the click event does not bubble up.  We
    // don't want links to be followed if they're clicked in EIP.
    Event.stop(event);
    return false;
}

function editEntireSection(event, nodeSection) {
    var nodeClicked;
    var strXmlNodeName;
    var bEditingExistingNode;
    var oWorkFlowStep;

    nodeClicked = this;

    if ( areEditing() ) {
        // already editing something else, so ignore.
    }
    else {
        if ( nodeSection ) {
            strXmlNodeName = 'section';
            bEditingExistingNode = true;
            oWorkFlowStep = createWorkFlowStep(strXmlNodeName, bEditingExistingNode);
            if ( oWorkFlowStep != null ) {
                oWorkFlowStep.editNode(nodeSection);
            }
        }
    }

    // Return false so that the click event does not bubble up.  We
    // don't want links to be followed if they're clicked.
    Event.stop(event);
    return false;
}

// really fast mouse movement confuses both IE and FF and mouse events get dropped.
// in particular, it appears that mouseout events are lost which has the implication
// that we can have two nodes showing a hover text. this is a problem.  the fix is to,
// before adding a hover text, make sure that if there is a current hover text explicit
// hide it.
var g_nodeHover = null;

function hideHover(event) {
    this.style.visibility = 'hidden';
    g_nodeHover = null;
    Event.stop(event);
    return false;
}

function showHover(event) {
    if ( areEditing() ) {
        // user has no need for the "click to edit" hover text while editing (another tag)
    }
    else {
        if ( g_nodeHover != null && this != g_nodeHover ) {
            // force the issue ...
            g_nodeHover.style.visibility = 'hidden';
        }
        this.style.visibility = '';
        g_nodeHover = this;
    }
    Event.stop(event);
    return false;
}

// dead code
function toggleHover(event) {
    this.style.visibility = ( this.style.visibility == 'hidden' ? '' : 'hidden' );
    Event.stop(event);
    return false;
}

function addHoverSectionText(nodeHtmlSection) {
    // current implentation does not actually hover (but it could)
    var strSpanId;
    var nodeSpan;
    var nodeLink;
    var nodeText;
    var nodeSectionHeader;

    strSpanId = 'html-' + createUniqueId();

    nodeSectionHeader = findSectionHeaderHtmlNode(nodeHtmlSection);
    if ( nodeSectionHeader ) {
        //add a new first child for the section name
        nodeSpan = document.createElement('span');
        nodeSpan.className = 'eipClickToEdit';
        nodeSpan.id = strSpanId;

        nodeLink = document.createElement('a');
        nodeLink.href = 'javascript:';
        nodeLink.className = 'eipClickToEditSectionTitle';
        //nodeLink.onclick = editSectionTitle;
        Event.observe(nodeLink, 'click',
                      editSectionTitle.bindAsEventListener(nodeLink, nodeHtmlSection));
        nodeText = document.createTextNode('edit section title');
        nodeLink.appendChild(nodeText);
        nodeSpan.appendChild(nodeLink);

        nodeLink = document.createElement('a');
        nodeLink.href = 'javascript:';
        nodeLink.className = 'eipClickToEditEntireSection';
        //nodeLink.onclick = editEntireSection;
        Event.observe(nodeLink, 'click',
                      editEntireSection.bindAsEventListener(nodeLink, nodeHtmlSection));
        nodeText = document.createTextNode('edit entire section');
        nodeLink.appendChild(nodeText);
        nodeSpan.appendChild(nodeLink);
        //nodeSpan.hide();

        nodeSectionHeader.insertBefore(nodeSpan, nodeSectionHeader.firstChild);

        // add onmouseover and onmouseout event handlers
    }
}

function createHoverTextHtml(strCnxmlTag) {
    var strSpanId;
    var nodeSpan;
    var nodeText;
    var vTags = {
      'para':       'paragraph'
    , 'equation':   'equation'
    , 'rule':       'rule'
    , 'definition': 'definition'
    , 'exercise':   'exercise'
    , 'list':       'list'
    , 'figure':     'figure'
    , 'note':       'note'
    , 'code':       'code'
    , 'example':    'example'
    , 'table' :     'table'
    , 'media' :     'media'
    , 'section' :   'section'
    };

    strSpanId = 'html-' + createUniqueId();

    nodeSpan = document.createElement('span');
    nodeSpan.className = 'eipClickToEdit';
    nodeSpan.id = strSpanId;

    nodeText = document.createTextNode('click to edit ' + vTags[strCnxmlTag]);
    nodeSpan.appendChild(nodeText);

    // note that $(nodeSpan).hide() would hide the "click to edit" AND
    // cause the containing bounding box to shrink. setting visibility to hidden
    // make the "click to edit" invisible AND take up the same screen real estate.
    nodeSpan.style.visibility = 'hidden';

    return nodeSpan;
}

function addHoverText(nodeHtml) {
    var nodeChild;
    var strClassName;
    var nodeSpan;
    var nodeLink;
    var nodeHtmlSection;

    if ( isEditable(nodeHtml) ) {
        // <img> don't have children so can not have hover text added as such.
        // FF is forgiving but IE crashes and burns if we try to add a child to <img>.
        // we really need a wrapper div for the <img> tag.  there I said it.
        if ( nodeHtml.nodeName.toLowerCase() != 'img' ) {
            strClassName = nodeHtml.className.split(" ")[0];

            nodeSpan = createHoverTextHtml(strClassName);

            //add as a new first child for nodeHtml
            nodeHtml.insertBefore(nodeSpan, nodeHtml.firstChild);

            // add onmouseover and onmouseout event handlers
            Event.observe(nodeHtml, 'mouseover',
                          showHover.bindAsEventListener($(nodeSpan)));
            Event.observe(nodeHtml, 'mouseout',
                          hideHover.bindAsEventListener($(nodeSpan)));
        }
    }
    else if ( nodeHtml.className && nodeHtml.className.split(" ")[0] == 'qmlitem' ) {
        // ignore all nodes contained by QML
        return;
    }
    else if ( nodeHtml.className && nodeHtml.className.split(" ")[0] == 'glossary-container' ) {
        // ignore all nodes contained by glossary
        return;
    }
    else if ( nodeHtml.className && nodeHtml.className.split(" ")[0] == 'section' ) {
        // sections are not directly editable
        nodeHtmlSection = nodeHtml;
        addHoverSectionText(nodeHtmlSection);
    }

    for (nodeChild = nodeHtml.firstChild;
         nodeChild != null;
         nodeChild = nodeChild.nextSibling)
    {
        addHoverText(nodeChild);
    }
}

function recreateInserts(nodeHtml) {
    // rebinding the event callbackups after the clone misbehaved on IE
    // before the rebind on IE, no callback was emperically active
    // after the rebind on IE, both the new and the old event callbacks were active
    // => rebind on IE causes the sleepy event callback to wake up
    var nodeOldInsertHtml;
    var nodeNewInsertHtml;
    var i;
    var nodeChild;

    if ( nodeHtml && nodeHtml.className && nodeHtml.className == 'eipInsertElement' ) {
        nodeOldInsertHtml = nodeHtml;
        nodeNewInsertHtml = createInserts();
        replaceHtmlNode(nodeNewInsertHtml, nodeOldInsertHtml);
    }

    if ( nodeHtml && nodeHtml.childNodes && nodeHtml.childNodes.length > 0 ) {
        for (i=0; i<nodeHtml.childNodes.length; i++) {
            nodeChild = nodeHtml.childNodes[i];
            recreateInserts(nodeChild);
        }
    }
}


function reestablishInsertCallbacks(nodeHtml) {
    // dead code
    var i;
    var nodeChild;
    // get here when we cancel an edit, take the previous html and reinsert back into the Html DOM.
    //  the reinserted html is actualy cloned from the oriignal.  cloning process does not replicate
    // any dynamic event callbacks.  thus, we have to manually reestablish them.
    if ( nodeHtml && nodeHtml.className && nodeHtml.className == 'eipInsertElement' ) {
         bindInsertEvents(nodeHtml);
    }
    if ( nodeHtml && nodeHtml.childNodes && nodeHtml.childNodes.length > 0 ) {
        for (i=0; i<nodeHtml.childNodes.length; i++) {
            nodeChild = nodeHtml.childNodes[i];
            reestablishInsertCallbacks(nodeChild);
        }
    }
}

function stopObserving(nodeHtml) {
    var nodeChild;

    if ( nodeHtml.nodeType != Node.ELEMENT_NODE ) return;
    if ( nodeHtml.nodeName == 'm:math' ) return;

    // prior to cloning we want to remove event callbacks
    nodeHtml = $(nodeHtml);
    if ( nodeHtml.stopObserving ) {
        nodeHtml.stopObserving(); // all events and all callbacks
    }

    for (nodeChild = nodeHtml.firstChild;
        nodeChild != null;
        nodeChild = nodeChild.nextSibling)
    {
        nodeChild = $(nodeChild);
        stopObserving(nodeChild);
    }
}

function recreateHtml(nodeHtmlCloned) {
    // IE has cloned HTML issues.  It appears that the event callbacks tied to
    // nodeHtmlCloned node itself are the problem.  Attempting to create a new
    // node and copy the guts of the input nodeHtmlCloned into it.  This fails
    // in IE in the presence of namespace, like for mathml.  We need to solve
    // this problem elsewhere, like stripping out the event callbacks prior
    // to cloning.
    return nodeHtmlCloned;
}

function reestablishCallbacks(nodeHtml) {
    // we make a clone of the edit html code. if the user hits the cancel button,
    // we used the clone html to get back to where we were before editing.
    // cloning drops the callbacks, so this function reestablishes the callbacks.
    var strInnerHtml;
    var nodeChild;
    var nodeOldSpan;
    var nodeNewSpan;
    var strClassName;
    var nodeHtmlSection;

    strInnerHtml = nodeHtml.innerHTML;
    if ( strInnerHtml === undefined ) return;

    for (nodeChild = nodeHtml.firstChild;
         nodeChild != null;
         nodeChild = nodeChild.nextSibling)
    {
        if ( nodeChild.nodeName.toLowerCase() == 'span' && nodeChild.className == 'eipClickToEdit' ) {
            // IE failed to bind the events below on the cloned input node,
            // like hover text "click to edit paragraph". we recreate the span nodes.
            nodeOldSpan = nodeChild;

            strClassName = nodeHtml.className.split(" ")[0];
            nodeNewSpan = $(createHoverTextHtml(strClassName));

            replaceHtmlNode(nodeNewSpan, nodeOldSpan);
            nodeChild = nodeNewSpan;

            Event.observe(nodeHtml, 'mouseover',
                          showHover.bindAsEventListener($(nodeNewSpan)));
            Event.observe(nodeHtml, 'mouseout',
                          hideHover.bindAsEventListener($(nodeNewSpan)));
        }
        else if ( isSection(nodeChild) ) {
            nodeHtmlSection = nodeChild;
            // restablish the "edit entire section" and "edit section name" links
            // and hover links of the section's children
            reestablishSectionCallbacks(nodeHtmlSection);
        }
        else {
            // recursively reestablish callbacks
            reestablishCallbacks(nodeChild);
        }
    }
}

function reestablishSectionCallbacks(nodeHtmlSection) {
    // when a html node gets cloned, the event callbacks for the cloned node are dropped
    var nodeSectionHeader;
    var nodeSectionHeaderChild;
    var nodeSpan;
    var nodeSpanChild;
    var nodeLink;
    var nodeSectionContents;
/*
Here is the HTML that we expect:

<div class="section" id="eip-732">
    <h2 class="section-header">
        <SPAN xmlns="" class="eipClickToEdit" id="html-element-449">
            <A href="javascript:" class="eipClickToEditSectionTitle">edit section title</A>
            <A href="javascript:" class="eipClickToEditEntireSection">edit entire section</A>
        </SPAN>
        <span class="cnx_label">Label: </span>     <!-- OPTIONAL -->
        <strong class="title">Heading 1</strong>   <!-- OPTIONAL -->
        &nbsp;
    </h2>
    <div class="section-contents">... contained section content here ...</div>
    <div class="section-end">End of section</div>
</div>
*/
    // take care of the callbacks in the section name

    nodeSectionHeader = findSectionHeaderHtmlNode(nodeHtmlSection);

    if ( nodeSectionHeader ) {
        nodeSectionHeaderChild = nodeSectionHeader.firstChild;
        if ( nodeSectionHeaderChild.nodeName.toLowerCase() == 'span' ) {
            nodeSpan = nodeSectionHeaderChild;
            nodeSpanChild = nodeSpan.firstChild;
            while ( nodeSpanChild ) {
                if ( nodeSpanChild.nodeName.toLowerCase() == 'a' ) {
                    nodeLink = nodeSpanChild;
                    if ( nodeLink.className == 'eipClickToEditSectionTitle' ) {
                        Event.observe(nodeLink, 'click',
                                      editSectionTitle.bindAsEventListener(nodeLink, nodeHtmlSection));
                    }
                    if ( nodeLink.className == 'eipClickToEditEntireSection' ) {
                        Event.observe(nodeLink, 'click',
                                      editEntireSection.bindAsEventListener(nodeLink, nodeHtmlSection));
                    }
                }
                nodeSpanChild = nodeSpanChild.nextSibling;
            }
        }
    }

    // take care of callbacks in section's non-title children
    nodeSectionContents = findSectionContentsHtmlNode(nodeHtmlSection);
    if ( nodeSectionContents &&
         nodeSectionContents.className &&
         nodeSectionContents.className == "section-contents" ) {
        reestablishCallbacks(nodeSectionContents);
    }

    return nodeHtmlSection;
}

// 'onchanged' event handler for add-form dropdown
function onAddDropDownChanged(e)
{
    if (!e) e = window.event;
    var dropdown = e.target || e.srcElement;
    var options = dropdown.options;

    // Last option is 'Other elements' that pops up help
    if (options.selectedIndex == (options.length -1)) {
        // Set options back to first one so user can't try to Add this bogus element
        options.selectedIndex = 0;
        openHelp('help');
    }

    return false;
}

function openHelp(name)
{
    var doOpen = window.open("/eip-help/" + name, "eip_help", 'scrollbars=yes,resizable=yes,height=400,width=600');
    doOpen.focus();
    return false;
}

function removeNamedCharacterEntityReferences(strXml) {
    var strMassgedXml;
    strMassgedXml = strXml.replace('&', '&amp;', 'g');
    return strMassgedXml;
}

// Check content for parsing errors before sending to the server
// also check fro duplicate Ids
function checkWellFormed(strNewXml, nodeOldXml) // content is string.
{
    var strNewMassagedXml;

    // Do a quick parse check before we send anything
    try {
        // parse checks for "well formedness" but does not validate
        // => besides the 5 special named character ERs, other name character ERs will cause a parse error.
        strNewMassagedXml = removeNamedCharacterEntityReferences(strNewXml);
        var docNewXml = parseXmlTextToDOMDocument(strNewMassagedXml);

        // Mozilla browswers don't actually throw an error upon error.
        // Why doesn't sarissa abstract this?
        var bHasParseError = ( docNewXml.getElementsByTagName("parsererror").length);
        if ( bHasParseError ) {
            throw new Error(docNewXml.documentElement.textContent);
        }
    }
    catch(e) {
        // IE browser throws an error on parse ...
        throw new Error("Unable to parse the CNXML text.\n" + e.message);
    }

    checkForDuplicateIds(docNewXml, nodeOldXml);
}

// Look at all of the id attribute nodes in this text content and
// check for duplicates in the original source document
function checkForDuplicateIds(docNewXml, nodeOldXml)
{
    var nodeNewXm;
    var strNewNodeId;
    var strOldXml;
    var docOldXml;

    // We need to check two places for a duplicate ID:
    //   i) new Xml subtree docNewXml
    //   ii) old Xml Dom sans the subtree we are looking to replace
    //
    // Duplicates IDs in the new and to-be-replaced Xml subtrees are
    // are expected case since this only indicates ID reuse across an edit.

    nodeNewXml = docNewXml.documentElement;
    strNewNodeId = nodeNewXml.getAttribute('id');

    // there is a special corner in hell for XML, namespaces, XPATHs, and crossbrowser JavaScript

    strOldXml = addNamespacesToTagText('<motherofallnodes id=\'TakeMeHomeMothership\'>') +
                serializeAndMassageXmlNode(nodeOldXml) +
                '</motherofallnodes>';
    docOldXml = parseXmlTextToDOMDocument(strOldXml);

    var nodesWithIdsinNewXml = getNodesByXPath('//@id', docNewXml);

    for (var i = 0; i < nodesWithIdsinNewXml.length; i++) {
        var node = nodesWithIdsinNewXml[i];
        var strNodeId = node.nodeValue;

        // i) search new, modified Xml snippet to verify that ids are not reused within itself.
        var nodesMatchingInNewXmlDomSubtree = getNodesByXPath("//*[@id='" + strNodeId + "']", docNewXml);
        if ( nodesMatchingInNewXmlDomSubtree.length != 1 ) {
            // user has reused an existing id.
            throw new Error("The ID '" + strNodeId + "' is used more than once.");
        }

        // ii) search the entire unmodified XML for the id found in the modified XML snippet.
        var nodesMatchingInXmlDom = getNodesByXPath("//*[@id='" + strNodeId + "']", gSource.doc);
        if ( nodesMatchingInXmlDom.length > 0 ) {
            // search to-be-replaced Xml to verify the id collision did not happen there
            var nodesWithIdsinOldXml = getNodesByXPath("//*[@id='" + strNodeId + "']", docOldXml);
            if ( nodesWithIdsinOldXml.length > 0 ) {
               // this Xml subtree is going to be replaced so duplicate ids are a nonissue
            }
            else {
                throw new Error("The ID '" + strNodeId + "' is already in use.");
            }
        }
    }
}

function getNodesByXPath(strXPath, nodeXml)
{
    var nodesXml;
    var docXml;

    if (nodeXml.nodeType == Node.DOCUMENT_NODE) {
        docXml = nodeXml;
    }
    else {
        docXml = nodeXml.ownerDocument;
    }

    try {
        docXml.setProperty("SelectionLanguage", "XPath");

        Sarissa.setXpathNamespaces(docXml, 'xmlns:cnx="' + CNXML_NS + '"');

        nodesXml = nodeXml.selectNodes(strXPath);
    }
    catch (e) {
        alert('getNodesByXPath(): sarissa failed to deliver on its promises.');
        throw e;
    }

    return nodesXml;
}


//
// Smooth Scroll Animation
//

//
//  code stolen (and modified) from
//    http://www.kryogenix.org/code/browser/smoothscroll/
//    http://www.kryogenix.org/code/browser/smoothscroll/smoothscroll.js
//    http://www.sitepoint.com/article/scroll-smoothly-javascript
//    http://www.doxdesk.com/personal/posts/evolt/20020422-pos.html - Andrew Clover

var ss = {
  smoothScroll: function(iDestX, iDestY) {
    // Stop any current scrolling
    clearInterval(ss.INTERVAL);

    var iCurrentY;
    var iDistanceToTravel;
    var nScrollAnimationTime;
    var nSteps;

    ss.DESTINATION_X         = iDestX;
    ss.DESTINATION_Y         = iDestY;
    ss.SCROLL_VELOCITY       = 1.0; // pixels / millisecond; could be negative

    ss.INTERVAL_MILLISECONDS = 10;

    iCurrentY = ss.getCurrentYPos();
    if ( ss.DESTINATION_Y < iCurrentY ) {
      // velocity value has direction info
      ss.SCROLL_VELOCITY = -ss.SCROLL_VELOCITY;
    }

    iDistanceToTravel = ss.DESTINATION_Y - iCurrentY;
    nScrollAnimationTime = iDistanceToTravel / ss.SCROLL_VELOCITY;
    ss.SCROLL_ANIMATION_TIME = Math.ceil(nScrollAnimationTime);

    ss.ANIMATION_TIME = ss.SCROLL_ANIMATION_TIME;

    nSteps = ss.ANIMATION_TIME / ss.INTERVAL_MILLISECONDS;
    ss.STEPS = Math.ceil(nSteps);
    ss.CURRENT_STEP = 1;

    var dateStart = new Date();
    ss.START_MILLISECONDS = dateStart.getTime();

    var strIntervalCallback = 'ss.scroll()';
    ss.INTERVAL = setInterval(strIntervalCallback, ss.INTERVAL_MILLISECONDS);
  },

  scroll: function() {
    var iCurrentY;
    var iNextY;

    iCurrentY = ss.getCurrentYPos();

    if ( iCurrentY != ss.DESTINATION_Y ) {
      iNextY = iCurrentY + Math.round(ss.SCROLL_VELOCITY * ss.INTERVAL_MILLISECONDS);
      // make sure we do not overshoot
      if ( ss.SCROLL_VELOCITY > 0 ) {
        if ( iNextY > ss.DESTINATION_Y ) {
          iNextY = ss.DESTINATION_Y;
        }
      }
      else {
        if ( iNextY < ss.DESTINATION_Y ) {
          iNextY = ss.DESTINATION_Y;
        }
      }

      window.scrollTo(0, iNextY);
    }

    ss.CURRENT_STEP++;
    if ( ss.CURRENT_STEP > ss.STEPS ) {
      clearInterval(ss.INTERVAL);
      var dateStop = new Date();
      ss.STOP_MILLISECONDS = dateStop.getTime();
      var iActualAnimationTime = ss.STOP_MILLISECONDS - ss.START_MILLISECONDS;
      iActualAnimationTime = iActualAnimationTime;
      /*alert('Actual animation time in milliseconds: ' + iActualAnimationTime + '.  \n'
          + 'Target animation time in milliseconds: ' + ss.ANIMATION_TIME + '.  \n'
          + 'Number of animation steps: ' + ss.STEPS + '.\n'
          + 'Specified interval length in milliseconds: ' + ss.INTERVAL_MILLISECONDS + '.\n'
          + 'Actual interval length in milliseconds: ' + Math.round(iActualAnimationTime/ss.STEPS));*/
    }
  },

/*
  scrollWindow: function() {
    wascypos = ss.getCurrentYPos();
    isAbove = (wascypos < dest);
    window.scrollTo(0,wascypos + scramount);
    iscypos = ss.getCurrentYPos();
    isAboveNow = (iscypos < dest);
    if ((isAbove != isAboveNow) || (wascypos == iscypos)) {
      // if we've just scrolled past the destination, or
      // we haven't moved from the last scroll (i.e., we're at the
      // bottom of the page) then scroll exactly to the link
      window.scrollTo(0,dest);
      // cancel the repeating timer
      clearInterval(ss.INTERVAL);
      // and jump to the link directly so the URL's right
      //location.hash = anchor;
    }
  },
*/
  /* prototype function call instead */
  getCurrentYPos: function() {
    // prototype code ...
    return ( window.pageYOffset
          || document.documentElement.scrollTop
          || document.body.scrollTop
          || 0 );
  }
}


function centerNode(nodeHtml) {
    // IE no likee ...
    // [destx,desty] = getCenterScrollDestinations(nodeHtml);
    var destinations = getCenterScrollDestinations(nodeHtml);
    destx = destinations[0];
    desty = destinations[1];
    ss.smoothScroll(destx, desty);
}

function getCenterScrollDestinations(nodeHtml) {
    var iDocumentHeight;
    var iNodeHeight;
    var iPadding;
    var iNodeYOffset;

    iDocumentHeight = document.documentElement.clientHeight || document.body.clientHeight || 0;
    iNodeHeight = nodeHtml.offsetHeight;

    // calculate padding that will center node
    if ( iDocumentHeight > iNodeHeight ) {
        iPadding = (iDocumentHeight - iNodeHeight) / 2;
        iPadding = parseInt((iDocumentHeight - iNodeHeight) / 2);
    }
    else {
        iPadding = 10;
    }

    iNodeYOffset = Position.cumulativeOffset(nodeHtml)[1];

    destx = 0;
    desty = iNodeYOffset - iPadding;

    return [destx, desty];
}


//
// Smooth Fade Animation
//

var sf = {
  smoothFadeOut: function(nodeHtml) {
    // Stop any current scrolling
    clearInterval(sf.INTERVAL);

    var nSteps;

    sf.HTML_NODE             = nodeHtml;
    sf.START_OPACITY         = nodeHtml.getOpacity();
    sf.TARGET_OPACITY        = 0.25;
    sf.OPACITY_VELCOTY       = 0.002; /// 0.00n opacity change / 1 millisecond
    // animation speed vary dramatically between IE and FF
    if ( Prototype.Browser.IE ) {
        sf.OPACITY_VELCOTY       = 0.005;
    }

    sf.INTERVAL_MILLISECONDS = 50;

    sf.ANIMATION_TIME = Math.ceil(Math.abs(sf.START_OPACITY-sf.TARGET_OPACITY) /  sf.OPACITY_VELCOTY); // millisecond

    nSteps = sf.ANIMATION_TIME / sf.INTERVAL_MILLISECONDS;
    sf.STEPS = Math.ceil(nSteps);
    sf.CURRENT_STEP = 1;

    var dateStart = new Date();
    sf.START_MILLISECONDS = dateStart.getTime();

    var strIntervalCallback = 'sf.fadeOut()';
    sf.INTERVAL = setInterval(strIntervalCallback, sf.INTERVAL_MILLISECONDS);
  },

  smoothFadeIn: function(nodeHtml) {
    // Stop any current scrolling
    clearInterval(sf.INTERVAL);

    var nSteps;

    sf.HTML_NODE             = nodeHtml;
    sf.START_OPACITY         = nodeHtml.getOpacity();
    sf.TARGET_OPACITY        = 1.0;
    sf.OPACITY_VELCOTY       = 0.002; /// 0.00n opacity change / 1 millisecond
    // animation speed vary dramatically between IE and FF
    if ( Prototype.Browser.IE ) {
        sf.OPACITY_VELCOTY       = 0.005;
    }

    sf.INTERVAL_MILLISECONDS = 50;

    sf.ANIMATION_TIME = Math.ceil(Math.abs(sf.START_OPACITY-sf.TARGET_OPACITY) /  sf.OPACITY_VELCOTY); // millisecond

    nSteps = sf.ANIMATION_TIME / sf.INTERVAL_MILLISECONDS;
    sf.STEPS = Math.ceil(nSteps);
    sf.CURRENT_STEP = 1;

    var dateStart = new Date();
    sf.START_MILLISECONDS = dateStart.getTime();

    var strIntervalCallback = 'sf.fadeIn()';
    sf.INTERVAL = setInterval(strIntervalCallback, sf.INTERVAL_MILLISECONDS);
  },

  fadeOut: function() {
    var nCurrentOpacity;
    var nNextOpacity;

    sf.CURRENT_STEP++;

    nCurrentOpacity = sf.HTML_NODE.getOpacity();
    if ( nCurrentOpacity > sf.TARGET_OPACITY ) {
      nNextOpacity = nCurrentOpacity - (sf.OPACITY_VELCOTY * sf.INTERVAL_MILLISECONDS);
      if ( nNextOpacity < sf.TARGET_OPACITY ) {
        nNextOpacity = sf.TARGET_OPACITY;
      }
      sf.HTML_NODE.setOpacity(nNextOpacity);
      nCurrentOpacity = nNextOpacity;
    }

    if ( nCurrentOpacity < sf.TARGET_OPACITY ) {
      // if we overshoot the opqueness, reset to the target
      sf.HTML_NODE.setOpacity(sf.TARGET_OPACITY);
      nCurrentOpacity = sf.TARGET_OPACITY;
    }

    if ( nCurrentOpacity == sf.TARGET_OPACITY ) {
      // we have reached our goal. stop interval timer.
      clearInterval(sf.INTERVAL);
      var dateStop = new Date();
      sf.STOP_MILLISECONDS = dateStop.getTime();
      var iActualAnimationTime = sf.STOP_MILLISECONDS - sf.START_MILLISECONDS;
      iActualAnimationTime = iActualAnimationTime;
      /*alert('Actual animation time in milliseconds: ' + iActualAnimationTime + '.  \n'
          + 'Target animation time in milliseconds: ' + sf.ANIMATION_TIME + '.  \n'
          + 'Number of animation steps: ' + sf.STEPS + '.\n'
          + 'Specified interval length in milliseconds: ' + sf.INTERVAL_MILLISECONDS + '.\n'
          + 'Actual interval length in milliseconds: ' + Math.round(iActualAnimationTime/sf.STEPS));*/
    }
  },

  fadeIn: function() {
    var nCurrentOpacity;
    var nNextOpacity;

    sf.CURRENT_STEP++;

    nCurrentOpacity = sf.HTML_NODE.getOpacity();
    if ( nCurrentOpacity < sf.TARGET_OPACITY ) {
      nNextOpacity = nCurrentOpacity + (sf.OPACITY_VELCOTY * sf.INTERVAL_MILLISECONDS);
      if ( nNextOpacity > sf.TARGET_OPACITY ) {
        nNextOpacity = sf.TARGET_OPACITY;
      }
      sf.HTML_NODE.setOpacity(nNextOpacity);
      nCurrentOpacity = nNextOpacity;
    }

    if ( nCurrentOpacity > sf.TARGET_OPACITY ) {
      // if we overshoot the opqueness, reset to the target
      sf.HTML_NODE.setOpacity(sf.TARGET_OPACITY);
      nCurrentOpacity = sf.TARGET_OPACITY;
    }

    if ( nCurrentOpacity == sf.TARGET_OPACITY ) {
      // we have reached our goal. stop interval timer.
      clearInterval(sf.INTERVAL);
      var dateStop = new Date();
      sf.STOP_MILLISECONDS = dateStop.getTime();
      var iActualAnimationTime = sf.STOP_MILLISECONDS - sf.START_MILLISECONDS;
      iActualAnimationTime = iActualAnimationTime;
      /*alert('Actual animation time in milliseconds: ' + iActualAnimationTime + '.  \n'
          + 'Target animation time in milliseconds: ' + sf.ANIMATION_TIME + '.  \n'
          + 'Number of animation steps: ' + sf.STEPS + '.\n'
          + 'Specified interval length in milliseconds: ' + sf.INTERVAL_MILLISECONDS + '.\n'
          + 'Actual interval length in milliseconds: ' + Math.round(iActualAnimationTime/sf.STEPS));*/
    }
  },

  stop: function() {
    clearInterval(sf.INTERVAL);
  }
}


//
// Smooth Scroll And Fade Animation - Two Animations, One Timer.
//

var ssf = {
  smoothScrollAndFadeOut: function(iDestX, iDestY, nodeFadeHtml) {
    // Stop any current scrolling
    clearInterval(ssf.INTERVAL);

    var iCurrentY;
    var iDistanceToTravel;
    var nScrollAnimationTime;
    var nSteps;
    var strIntervalCallback;

    // scroll params
    ssf.DESTINATION_X         = iDestX;
    ssf.DESTINATION_Y         = iDestY;
    ssf.SCROLL_VELOCITY       = 1.0; // pixels / millisecond; could be negative

    // fade params
    ssf.FADE_HTML_NODE        = nodeFadeHtml;
    ssf.START_OPACITY         = nodeFadeHtml.getOpacity();
    ssf.TARGET_OPACITY        = 0.25;
    ssf.OPACITY_VELCOTY       = 0.003; /// 0.00n opacity change / 1 millisecond
    if ( Prototype.Browser.IE ) {
        ssf.OPACITY_VELCOTY       = 0.010;
    }

    // scroll and fade parameter
    ssf.INTERVAL_MILLISECONDS = 20;

    // time for opacity change, e.g.
    // 0.750 opacity change / (0.001 opacity change / 1 millisecond) = 0.750 millisecond
    ssf.FADE_ANIMATION_TIME = Math.ceil((1.0 - ssf.TARGET_OPACITY) /  ssf.OPACITY_VELCOTY); // millisecond

    // time for scrolling change - varies on distance traveled
    iCurrentY = ssf.getCurrentYPos();
    if ( ssf.DESTINATION_Y < iCurrentY ) {
      // velocity value has direction info
      ssf.SCROLL_VELOCITY = -ssf.SCROLL_VELOCITY;
    }

    iDistanceToTravel = ssf.DESTINATION_Y - iCurrentY;
    nScrollAnimationTime = iDistanceToTravel / ssf.SCROLL_VELOCITY;
    ssf.SCROLL_ANIMATION_TIME = Math.ceil(nScrollAnimationTime);

    if ( ssf.SCROLL_ANIMATION_TIME > ssf.FADE_ANIMATION_TIME ) {
        ssf.ANIMATION_TIME = ssf.SCROLL_ANIMATION_TIME;
    }
    else {
        ssf.ANIMATION_TIME = ssf.FADE_ANIMATION_TIME;
    }

    nSteps = ssf.ANIMATION_TIME / ssf.INTERVAL_MILLISECONDS;
    ssf.STEPS = Math.ceil(nSteps);
    ssf.CURRENT_STEP = 1;

    var dateStart = new Date();
    ssf.START_MILLISECONDS = dateStart.getTime();

    strIntervalCallback = 'ssf.scrollAndFadeOut()';
    ssf.INTERVAL = setInterval(strIntervalCallback, ssf.INTERVAL_MILLISECONDS);
  },

  scrollAndFadeOut: function() {
    ssf.scroll();
    ssf.fade();
    ssf.CURRENT_STEP++;
    if ( ssf.CURRENT_STEP > ssf.STEPS ) {
      clearInterval(ssf.INTERVAL);
      var dateStop = new Date();
      ssf.STOP_MILLISECONDS = dateStop.getTime();
      var iActualAnimationTime = ssf.STOP_MILLISECONDS - ssf.START_MILLISECONDS;
      iActualAnimationTime = iActualAnimationTime;
      /*alert('Actual animation time in milliseconds: ' + iActualAnimationTime + '.  \n'
          + 'Target animation time in milliseconds: ' + ssf.ANIMATION_TIME + '.  \n'
          + 'Number of animation steps: ' + ssf.STEPS + '.\n'
          + 'Specified interval length in milliseconds: ' + ssf.INTERVAL_MILLISECONDS + '.\n'
          + 'Actual interval length in milliseconds: ' + Math.round(iActualAnimationTime/ssf.STEPS));*/
    }
  },

  scroll: function() {
    var iCurrentY;
    var iNextY;

    iCurrentY = ssf.getCurrentYPos();

    if ( iCurrentY != ssf.DESTINATION_Y ) {
      iNextY = iCurrentY + Math.round(ssf.SCROLL_VELOCITY * ssf.INTERVAL_MILLISECONDS);
      // make sure we do not overshoot
      if ( ssf.SCROLL_VELOCITY > 0 ) {
        if ( iNextY > ssf.DESTINATION_Y ) {
          iNextY = ssf.DESTINATION_Y;
        }
      }
      else {
        if ( iNextY < ssf.DESTINATION_Y ) {
          iNextY = ssf.DESTINATION_Y;
        }
      }

      window.scrollTo(0, iNextY);
    }
  },

  fade: function() {
    var nCurrentOpacity;
    var nNextOpacity;

    nCurrentOpacity = ssf.FADE_HTML_NODE.getOpacity();

    if ( nCurrentOpacity > ssf.TARGET_OPACITY ) {
      nNextOpacity = nCurrentOpacity - (ssf.OPACITY_VELCOTY * ssf.INTERVAL_MILLISECONDS);
      if ( nNextOpacity < ssf.TARGET_OPACITY ) {
        nNextOpacity = ssf.TARGET_OPACITY;
      }
      ssf.FADE_HTML_NODE.setOpacity(nNextOpacity);
      nCurrentOpacity = nNextOpacity;
    }

    if ( nCurrentOpacity < ssf.TARGET_OPACITY ) {
      // if we overshoot the opqueness, reset to the target
      ssf.FADE_HTML_NODE.setOpacity(sf.TARGET_OPACITY);
      nCurrentOpacity = sf.TARGET_OPACITY;
    }
  },

  getCurrentYPos: function() {
    // prototype code ...
    return ( window.pageYOffset
          || document.documentElement.scrollTop
          || document.body.scrollTop
          || 0 );
  }
}

//http://forums.mozillazine.org/viewtopic.php?t=404527
// specious: definition and usage can be deleted

function getTopLeft(sID){
   var o=document.getElementById(sID);
   if(o==null){return [0,0];}
   var top=o.offsetTop,left=o.offsetLeft;
   o=o.offsetParent;
   while(o){
      if(document.all){
         if(o.offsetParent){
            if(o.scrollTop)top-=o.scrollTop;
            if(o.scrollLeft)left-=o.scrollLeft;
         }
      }else{ 
         if(o.scrollTop)top-=o.scrollTop;
         if(o.scrollLeft)left-=o.scrollLeft;
         // Mozilla bug
         if((o.tagName=='DIV')||(o.tagName=='TABLE'&&navigator.vendor=='Netscape'))
            top+=getAttrPixValue(o,'border-top-width')|0,left+=getAttrPixValue(o,'border-left-width')|0;
      }
      top+=o.offsetTop;
      left+=o.offsetLeft;
      o=o.offsetParent;
   }
   if(navigator.userAgent.indexOf('Mac')!=-1 && typeof(document.body.leftMargin)!='undefined'){
      left+=document.body.leftMargin,top+=document.body.topMargin;   // working?
   }
   return [top,left];
}

function getAttrPixValue(e,a){
   var px=0;
    if(window.getComputedStyle){
        var css,sty=window.getComputedStyle(e,'');
      if(sty&&sty.getPropertyCSSValue){
         css=sty.getPropertyCSSValue(a);
         if((css)&&css.primitiveType<=18){try{px=css.getFloatValue(5)|0;}catch(e){};}
      }
    }
    return px;
}


// Get URL Parameters Using Javascript, Published Aug 17, 2006
// http://www.netlobo.com/url_query_string_javascript.html
function getUrlParameter( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return results[1];
}


// this is a very bad idea.
// the loop do { sleep(10); animate(); conidtion exit; } will not animate as expected.
// since execution will never leave this thread, the animation will happen all at once,
// after the loop exits; thus, the effect will not be animated.
/*
function sleep(iDurationMilliSeconds) {
    var dateStart;
    var nStartMilliSeconds;
    var dateCurrent;
    var nCurrentMilliSeconds;
    var bSleeping;
    var i;

    dateStart = new Date();
    nStartMilliSeconds = dateStart.getTime();

    i = 0;bSleeping = true;
    while ( bSleeping ) {
         i++;
         dateCurrent = new Date();
         nCurrentMilliSeconds = dateCurrent.getTime();

         if(nCurrentMilliSeconds - nStartMilliSeconds > iDurationMilliSeconds) {
             bSleeping = false;
         }
    }
    //alert(i + ' times through the spin loop.');
}

function fadeOut(nodeHtml) {
    // $('cnx_main').setOpacity(0.25);
    var nCurrentOpacity;
    var nTargetOpacity;
    var nOpacityDelta;
    var nNextOpacity;
    var iMilliSeconds;

    nCurrentOpacity = nodeHtml.getOpacity();
    nTargetOpacity = 0.25;
    nOpacityDelta = 0.05;
    iMilliSeconds = 50; // quickest time => (1.00-0.25)/0.05 * 0.050s = 0.750s

    nNextOpacity = nCurrentOpacity - nOpacityDelta;
    while ( nNextOpacity >= nTargetOpacity ) {
        nodeHtml.setOpacity(nNextOpacity);
        nCurrentOpacity = nNextOpacity;
        nNextOpacity -= nOpacityDelta;
        if ( nNextOpacity >= nTargetOpacity ) {
            sleep(iMilliSeconds);
        }
    }
}
*/

// http://simonwillison.net/2006/Jan/20/escape/ sets us free
var g_specials = [
    '/', '.', '*', '+', '?', '|',
    '(', ')', '[', ']', '{', '}', '\\'
];

var g_reSpecials = new RegExp(
    '(\\' + g_specials.join('|\\') + ')', 'g'
);

function escapeRegularExpression(strInput) {
    var strInput;
    var strEscaped;
    var reEscaped;

    strEscaped = strInput.replace(g_reSpecials, '\\$1');

    reEscaped = new RegExp(strEscaped);

    return reEscaped;
}


/*
 * Begin MathEditor-specific code
 */

function MathEditor() {
	//Dummy constructor for now...
}

/**
 * Attaches a child element that contains a link to open up the MathEditor.
 * The link will only be added if the browser is Firefox.
 * 
 * @param {Element} parent The container for the created launcher link
 */
MathEditor.addLaunchButton = function(parent) {
    if (!(Prototype.Browser.Gecko || Prototype.Browser.WebKit)) 
        return; //Fail on anything other that Firefox, Chrome, or Safari
    // Adding launcher for the MathML Editor
    var launchMathEditor = document.createElement('div');
    launchMathEditor.className = 'eipMathEditor';
    var launchMathEditorLink = document.createElement('a');
    launchMathEditorLink.appendChild(document.createTextNode('MathML Editor'));
    launchMathEditor.appendChild(launchMathEditorLink);
    launchMathEditor.onclick = MathEditor.popupMathEditor;
    parent.appendChild(launchMathEditor);
}

/**
 * A global reference to the popup window. Subsequent launches 
 * should just refocus the child window instead of createing a new one.
 */
MathEditor.POPUP_WINDOW = null;

/**
 * Opens up the MathEditor window or attempts to refocus it if it can
 * detect that the window is still open (through cookie communication).
 */
MathEditor.popupMathEditor = function() {
    var value = readCookie('math-editor-popup-open');
			
    if(!value || 'focus' == value) {
        createCookie('math-editor-popup-open', '', -1);
        MathEditor.POPUP_WINDOW = window.open("/math-editor/popup",
        		"math-window","status=no,scrollbars=no,width=600,height=520");
    } else {
        //Try and focus manually, but hope 
        if(MathEditor.POPUP_WINDOW) {
            MathEditor.POPUP_WINDOW.focus();
        } else {
            // try and communicate through cookies.
            createCookie('math-editor-popup-open', 'focus');
        }
    }
}
