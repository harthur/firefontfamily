FBL.ns(function() { with (FBL) {
  Firebug.FontFamilyModule = extend(Firebug.Module,
  {
    dispatchName : 'fontfamily',

    initialize: function() {
      Firebug.Module.initialize.apply(this, arguments);
      Firebug.FontFamilyModule.registerListeners();
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

    highlightFonts: function() { 
       var doc = this.currentPanelDoc; // necessary for onCSSInsertRule invokations

       var props = doc.getElementsByClassName("cssProp");
       for(var i = 0; i < props.length; i++) {
         var prop = props[i];
         var propName = prop.getElementsByClassName("cssPropName")[0].textContent;
         if(propName == 'font-family' || propName == 'font') {
           var propValueElement = prop.getElementsByClassName("cssPropValue")[0];
           var propValue = propValueElement.textContent;
           CSSPropFontTag.tag.replace({propValue: propValue}, propValueElement, CSSPropFontTag);
         }
       }
    }
  });

  Firebug.registerModule(Firebug.FontFamilyModule);
  Firebug.CSSModule.addListener(Firebug.FontFamilyModule);

  var CSSPropFontTag = domplate(Firebug.Rep, {
    tag: SPAN({},
           SPAN({style: "color: #aaa;"}, "$propValue|getPropPart1"),
           SPAN({}, "$propValue|getPropFont"),
           SPAN({style: "color: #aaa;"}, "$propValue|getPropPart2")),

    getPropPart1 : function(propValue) {
      var ff = this.getRenderedFontFamily(propValue);
      var regex = new RegExp('(.*?)' + ff);
      var matches = propValue.match(regex);
      if(matches)
        return matches[1];
      return propValue;
    },

    getPropFont : function(propValue) {
      var ff = this.getRenderedFontFamily(propValue);
      var regex = new RegExp('(.*?)' + ff + '');
      var matches = propValue.match(regex);
      if(matches)
        return '' + ff + '';
      return '';
    },

    getPropPart2 : function(propValue) {
      var ff = this.getRenderedFontFamily(propValue);
      var regex = new RegExp('.*?' + ff + '(.*)');
      var matches = propValue.match(regex);
      if(matches)
        return matches[1];
      return '';
    },

    getRenderedFontFamily : function(propValue) {
      // create canvas in owner doc to get @font-face fonts
      var doc = document;
      var canvas = doc.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
      var context = canvas.getContext("2d");
      var fonts = propValue.split(',');
 
      for(var i = 0; i < fonts.length; i++) {
        var testString = "abcdefghijklmnopqrstuvwxyz";

        context.font = "800px serif";
        var defaultWidth = context.measureText(testString).width;
 
        context.font = "800px " + fonts[i];
        var fontWidth = context.measureText(testString).width;
 
        if(defaultWidth != fontWidth)
          return fonts[i];
      }
      return "serif";
    }
  });
}});


