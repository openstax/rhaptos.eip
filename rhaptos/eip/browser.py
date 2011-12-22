from lxml import etree
from zope.app.component.hooks import getSite
from plone.app.textfield.interfaces import ITransformer
from rhaptos.xmlfile.value import XMLTextValue
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

        bodyfield = self.context.body

        if action=='add' and xpath and position and content:
            bodyfield.xpathInsert(content, position, xpath,
                namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})
            content = XMLTextValue(content,
                                   bodyfield.mimeType,
                                   bodyfield.outputMimeType)
            result = self.eip_transform(content)

        elif action=='update':
            bodyfield.xpathUpdate(content, xpath,
                namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})
            content = XMLTextValue(content,
                                   bodyfield.mimeType,
                                   bodyfield.outputMimeType)
            result = self.eip_transform(content)
        elif action=='delete' and xpath:
            bodyfield.xpathDelete(xpath,
                namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})
            result = None
        else:
            result = None

        self.request.RESPONSE.setHeader('Content-Type',
                                        'application/xhtml+xml; charset=utf-8')

        return result
