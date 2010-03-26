FBL.ns(function() { with (FBL) {
               
  Firebug.FontFamilyModule = extend(Firebug.Module,
  {
    dispatchName : 'firefontfamily',

    initialize: function() {
      Firebug.Module.initialize.apply(this, arguments);
      Firebug.FontFamilyModule.registerListeners();
    },

    registerListeners : function() {
      this.onCSSInsertRule = this.highlightFonts;
      this.onCSSSetProperty = this.highlightFonts;

      // onCSSRulesAdded is what we want but only A11yModel listeners get notified
      var oldOnCSSRulesAdded = Firebug.A11yModel.onCSSRulesAdded;
      Firebug.A11yModel.onCSSRulesAdded = function() {
        oldOnCSSRulesAdded.apply(this, arguments);
        Firebug.FontFamilyModule.highlightFonts();
      }
    },

    loadedContext : function(context) {
      Firebug.Module.loadedContext.apply(this, arguments);
      setTimeout(this.highlightFonts, 2000); // 'wait' for fonts to download
    },

    showPanel : function(browser, panel) {
      if(panel.name != 'stylesheet' && panel.name != 'css')
        return;
      this.currentPanelDoc = panel.document;
      this.highlightFonts();

    },

    showSidePanel: function(browser, panel) {
      if(panel.name != 'stylesheet' && panel.name != 'css')
        return;
      this.currentPanelDoc = panel.document;
      this.highlightFonts();
    },

    highlightFonts: function() {
       var panelDoc = Firebug.FontFamilyModule.currentPanelDoc; // onCSSInsertRule etc don't tell you which panel changed
       var props = panelDoc.getElementsByClassName("cssProp");

       if(FBTrace.DBG_FIREFONTFAMILY)
          FBTrace.sysout("fontfamily: highlighting font rules for " + FirebugContext.window.document.location.href);

       for(var i = 0; i < props.length; i++) {
         var prop = props[i];
         var propName = prop.getElementsByClassName("cssPropName")[0].textContent;
         if(propName == 'font-family' || propName == 'font') {
           var propValueElem = prop.getElementsByClassName("cssPropValue")[0];
           var propValue = propValueElem.textContent;
           var fontParts = Firebug.FontFamilyModule.getFontParts(propName, propValue);
           Firebug.FontFamilyModule.CSSPropFontTag.tag.replace({prop: fontParts},
                            propValueElem, Firebug.FontFamilyModule.CSSPropFontTag);
         }
       }
    },

    getFontParts : function(propName, propValue) {
      var fontFamily = propValue;
      if(propName == 'font') {
        var div = document.createElement('div');
        div.style.font = propValue;
        fontFamily = div.style.fontFamily;
      }

      var beforeFamily = '';
      var ffregex = new RegExp('^(.*)' + fontFamily);
      var matches = propValue.match(ffregex);
      if(matches && matches[1])
        beforeFamily = matches[1];

      var rendered = Firebug.FontFamilyModule.getRenderedFontFamily(fontFamily);

      // have to watch out for Times vs. "Times New Roman" errors
      var index = fontFamily.search(new RegExp(rendered + '(?=\\,|$)'));
      var before = fontFamily.substring(0, index);
      var after = fontFamily.substring(index + rendered.length);

      return {beforeFamily: beforeFamily, before: before,
              rendered: rendered, after: after};
    },

    getRenderedFontFamily : function(fontFamily) {
      // create canvas in owner doc to get @font-face fonts
      var doc = FirebugContext.window.document;
      var canvas = doc.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
      var context = canvas.getContext("2d");
      var fonts = fontFamily.split(",")
 
      for(var i = 0; i < fonts.length; i++) {
        if(fonts[i] == 'serif')
          return 'serif';

        var testString = "abcdefghijklmnopqrstuvwxyz";

        context.font = "800px serif";
        var defaultWidth = context.measureText(testString).width;
 
        context.font = "800px " + fonts[i];
        var fontWidth = context.measureText(testString).width;
 
        if(FBTrace.DBG_FIREFONTFAMILY)
          FBTrace.sysout("fontfamily: testing font " + fonts[i]
                + ", width difference: " + Math.abs(defaultWidth - fontWidth));

        if(defaultWidth != fontWidth)
          return fonts[i];
      }
      return '';
    },

    CSSPropFontTag : domplate(Firebug.Rep, {
      tag: SPAN({},
             SPAN({}, "$prop.beforeFamily"),
             SPAN({style: "color: #aaa;"}, "$prop.before"),
             SPAN({}, "$prop.rendered"),
             SPAN({style: "color: #aaa;"}, "$prop.after")
            )
    }) 
  })

  Firebug.registerModule(Firebug.FontFamilyModule);
  Firebug.CSSModule.addListener(Firebug.FontFamilyModule);

}});


