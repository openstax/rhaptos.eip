from lxml import etree
from zope.app.component.hooks import getSite
from plone.app.textfield.interfaces import ITransformer
from plone.app.textfield.value import RichTextValue
from Products.Five.browser import BrowserView

class Eip(BrowserView):
    """ Eip
    """

    def eip_transform(self, value):
        """ Transform a RichTextValue to text/x-html-eip
        """
        site = getSite()
        transformer = ITransformer(site, None)
        if transformer is None:
            return None
        return transformer(value, 'text/x-html-eip')

    def rendered_content(self):
        value = self.context.body
        return self.eip_transform(value)

    def source_fragment(self):
        value = self.context.body
        return value.raw

    def eip_request(self):
        action = self.request.get('action',None)
        if not action:
            raise 'Bad Request', 'Action not specified.'

        xpath = self.request.get('xpath',None)
        if xpath:
            del self.request.form['xpath']
        position = self.request.get('position',None)
        content = self.request.get('content',None)

        marker = {}
        result = marker
        bodyfield = self.context.body
        bodytree = etree.fromstring(bodyfield.raw_encoded)
        root = bodytree.getroottree()

        if action=='add' and xpath and position and content:
            content = etree.fromstring(content)
            node = bodytree.xpath(xpath,
                        namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})[0]
            if position == 'before':
                node.addprevious(content)
                node = node.getprevious()
            else:
                node.addnext(content)
                node = node.getnext()
            docinfo = root.docinfo
            pi = '<?xml version="%s" encoding="%s"?>' % (
                docinfo.xml_version, docinfo.encoding)
            raw = pi + '\n' + etree.tostring(bodytree)
            self.context.body = RichTextValue(raw,
                                              bodyfield.mimeType,
                                              bodyfield.outputMimeType)
            content = RichTextValue(etree.tostring(node),
                                    bodyfield.mimeType,
                                    bodyfield.outputMimeType)
            result = self.eip_transform(content)

        elif action=='update':
            node = bodytree.xpath(xpath,
                        namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})[0]
            node.getparent().replace(node, etree.fromstring(content))
            docinfo = root.docinfo
            pi = '<?xml version="%s" encoding="%s"?>' % (
                docinfo.xml_version, docinfo.encoding)
            raw = pi + '\n' + etree.tostring(bodytree)
            self.context.body = RichTextValue(raw,
                                              bodyfield.mimeType,
                                              bodyfield.outputMimeType)
            content = RichTextValue(content,
                                    bodyfield.mimeType,
                                    bodyfield.outputMimeType)
            result = self.eip_transform(content)
        elif action=='delete' and xpath:
            node = bodytree.xpath(xpath,
                        namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})[0]
            node.getparent().remove(node)
            docinfo = bodytree.getroottree().docinfo
            pi = '<?xml version="%s" encoding="%s"?>' % (
                docinfo.xml_version, docinfo.encoding)
            raw = pi + '\n' + etree.tostring(bodytree)
            self.context.body = RichTextValue(raw,
                                              bodyfield.mimeType,
                                              bodyfield.outputMimeType)
            result = None

        self.request.RESPONSE.setHeader('Content-Type',
                                        'application/xhtml+xml; charset=utf-8')

        return result
