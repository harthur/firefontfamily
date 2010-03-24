FBL.ns(function() { with (FBL) {
  Firebug.FontFamilyModule = extend(Firebug.Module,
  {
    dispatchName : 'fontfamily',

    initialize: function() {
      Firebug.Module.initialize.apply(this, arguments);
      Firebug.FontFamilyModule.registerListeners();
      this.fontRegex = getFontRegex();
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

    initContext: function(context, persistedState) {
      this.context = context;
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
           var fontParts = getFontParts(propName, propValue);
           CSSPropFontTag.tag.replace({prop: fontParts}, propValueElement, CSSPropFontTag);
         }
       }
    }
  });

  Firebug.registerModule(Firebug.FontFamilyModule);
  Firebug.CSSModule.addListener(Firebug.FontFamilyModule);

  var getFontRegex = function() {
    var defaults = '(?:inherit)|(?:normal)';
    var len = '(?:[0-9\\.]+px)|(?:[0-9\\.]+em)|(?:[0-9\\.]+ex)|(?:[0-9\\.]rem)|(?:[0-9\\.]+ch)|'
               + '(?:[0-9\\.]+%)|'
               + '(?:[0-9\\.]+)';
    var lineHeight = '(?:' + [len, defaults].join('|') + ')';
    var fontSize = '(?:' + ['(?:xx\\-small)|(?:x\\-small)|(?:small)|(?:medium)|(?:large)|(?:x\\-large)|(?:xx\\-large)|(?:smaller)|(?:larger)',
                    len, defaults].join('|') + ')(?:\\/' + lineHeight + ')?';                
    var fontStyle = '(?:normal)|(?:italic)|(?:oblique)';
    var fontVariant = '(?:small\\-caps)';
    var fontWeight = '(?:bold)|(?:bolder)|(?:lighter)|(?:[0-9]+)';
    var fontFamily = '(.*?)'; // subexp 2
    var others = '(?:caption)|(?:icon)|(?:menu)|(?:message\\-box)|(?:small\\-caption)|(?:status\\-bar)';  
    var fontItems = [fontStyle, fontVariant, fontWeight, fontSize]
                    .map(function(item) { return '(?:' + item + ')?';});
    var beforeFont = '\\s*(' + others + '|(?:' + fontItems.join('\\s*') + ')\\s*)'; // subexp 1
    var fontProp = beforeFont + fontFamily + '\\s*$';
    return RegExp(fontProp);
  };

  var getFontParts = function(propName, propValue) {
    var beforeFont = '';
    var fontFamily = propValue;
    if(propName == 'font') {
      var matches = Firebug.FontFamilyModule.fontRegex.exec(propValue);
      if(matches) {
        beforeFont = matches[1];
        fontFamily = matches[2];
      }
    }

    var rendered = getRenderedFontFamily(fontFamily);
    var fontFamilies = fontFamily.split(",");
    var index = fontFamilies.indexOf(rendered);
    var disabled = '';
    var tail = '';
    if(index > 0)
      disabled = fontFamilies.slice(0, index).join(",") + ",";
    if(index + 1 < fontFamilies.length) {
      if(index > 0)
        tail = ",";
      tail += fontFamilies.slice(index + 1).join(",");
    }
    return {before: beforeFont, disabled : disabled, matching: rendered, tail: tail};
  };

 var getRenderedFontFamily = function(propValue) {
      // create canvas in owner doc to get @font-face fonts
      var doc = Firebug.FontFamilyModule.context.window.document;
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
      return "";
    }

  var CSSPropFontTag = domplate(Firebug.Rep, {
    tag: SPAN({},
           SPAN({}, "$prop.before"),
           SPAN({style: "color: #aaa;"}, "$prop.disabled"),
           SPAN({}, "$prop.matching"),
           SPAN({style: "color: #aaa;"}, "$prop.tail")
       )
  });

}});


