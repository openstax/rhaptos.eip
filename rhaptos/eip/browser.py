import re
from lxml import etree
from zope.app.component.hooks import getSite
from plone.app.textfield.interfaces import ITransformer
from rhaptos.xmlfile.value import XMLTextValue
from Products.Five.browser import BrowserView

doctype = """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1 plus MathML 2.0//EN" "http://www.w3.org/Math/DTD/mathml2/xhtml-math11-f.dtd">"""


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
        xpath = self.request.get('xpath', None)
        namespaces = {}
        if xpath is None or xpath == '/':
            return value.raw_encoded
        elif xpath.startswith('/cnx:'):
            namespaces = {'cnx': 'http://cnx.rice.edu/cnxml'}

        result = value.raw_encoded
        tree = etree.fromstring(value.raw_encoded)
        result = ''
        for node in tree.xpath(xpath, namespaces=namespaces):
            result += etree.tostring(node)

        # if we don't strip namespaces from the fragment, eip loses the
        # plot completely
        result = etree.fromstring(result)
        for prefix, ns in result.nsmap.items():
            if prefix is None:
                prefix = 'nil'
            etree.strip_attributes(result, '{%s}%s' % (ns, prefix))
        etree.cleanup_namespaces(result)
        result = etree.tostring(result)
        result = result.replace('xmlns="http://cnx.rice.edu/cnxml" ', '')

        return result

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
            result = bodyfield.processingInstruction + '\n' + \
                     doctype + '\n' + result
        elif action=='update':
            bodyfield.xpathUpdate(content, xpath,
                namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})
            content = XMLTextValue(content,
                                   bodyfield.mimeType,
                                   bodyfield.outputMimeType)
            result = self.eip_transform(content)
            result = bodyfield.processingInstruction + '\n' + \
                     doctype + '\n' + result
        elif action=='delete' and xpath:
            bodyfield.xpathDelete(xpath,
                namespaces={'cnx': 'http://cnx.rice.edu/cnxml'})
            result = None
        else:
            result = None

        self.request.RESPONSE.setHeader('Content-Type',
                                        'application/xhtml+xml; charset=utf-8')

        return result
