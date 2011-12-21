from zope.app.component.hooks import getSite

from plone.app.textfield.interfaces import ITransformer

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
