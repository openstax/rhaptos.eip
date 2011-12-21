from lxml import etree
from zope.app.component.hooks import getSite
from plone.app.textfield.interfaces import ITransformer
from plone.app.textfield.value import RichTextValue
from Products.Five.browser import BrowserView

class Eip(BrowserView):
    """ Eip
    """

    def rendered_content(self):
        value = self.context.body
        site = getSite()
        transformer = ITransformer(site, None)
        if transformer is None:
            return None
        return transformer(value, 'text/x-html-eip')

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
        newxpath = ''
        bodyfield = self.context.body
        bodytree = etree.fromstring(bodyfield.raw)

        # f = context.getDefaultFile()
        try:
            if action=='add' and xpath and position and content:
                if position == 'before':
                    newxpath = f.xpathInsertTree(xpath, content, idprefix="eip-")
                else:
                    newxpath = f.xpathAppendTree(xpath, content, idprefix="eip-")
            elif action=='update':
                node = bodytree.xpath(xpath,
                            namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})[0]
                node.getparent().replace(node, etree.fromstring(content))
                raw = etree.tostring(bodytree)
                self.context.body = RichTextValue(raw,
                                                  bodyfield.mimeType,
                                                  bodyfield.outputMimeType)
                newxpath = xpath
                result = content
            elif action=='delete' and xpath:
                result = f.xpathDeleteTree(xpath)
            # context.logAction('save')

        # Bad, bad, bad.  We should have it raise an XMLError or some such thing...
        except Exception, e:
            return e

        if result is marker:
            contentinplace = f.xpathGetTree(newxpath, namespaces=True)  # because after save we have ids auto-generated
            
            result = context.eip_transform(contentinplace)
            if self.request.RESPONSE.status in ('Bad Request', 400):
                import transaction
                transaction.abort()
                return result

        self.request.RESPONSE.setHeader('Content-Type', 'application/xhtml+xml; charset=utf-8')

        return result
