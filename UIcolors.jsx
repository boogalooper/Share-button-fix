/*
<javascriptresource>
<name>UI colors</name>
<eventid>962b569a-c528-4dc1-a084-9735a1e72688</eventid>
</javascriptresource>
*/
#target photoshop;
var s2t = stringIDToTypeID,
  t2s = typeIDToStringID,
  currentColorTheme = null,
  colorBars = [],
  samplerEnabled = false,
  colors = {},
  cfg = new Config,
  presets = new Preset;
const defaultName = 'UIColors.txt',
  loadFromFile = 'load from file...',
  colorThemes = {
    kPanelBrightnessOriginal: 0,
    kPanelBrightnessLightGray: 1,
    kPanelBrightnessMediumGray: 2,
    kPanelBrightnessDarkGray: 3
  },
  UUID = [
    '962b569a-c528-4dc1-a084-9735a1e72688',
    'f9835b6c-b235-429b-b370-52334040d2ad'
  ];
if (!playbackParameters.count) {
  var f = $.os.indexOf('Windows') != -1 ? new File(app.path + '/Required/' + defaultName) :
    new File(app.path.getFiles('*.app')[0] + '/Contents/Required/' + defaultName);
  var source = readColorsFromFile(f);
  if (source.content) {
    (r = new ActionReference()).putProperty(s2t('property'), p = s2t('interfacePrefs'));
    r.putEnumerated(s2t('application'), s2t('ordinal'), s2t('targetEnum'));
    currentColorTheme = colorThemes[t2s(executeActionGet(r).getObjectValue(p).getEnumerationValue(s2t('kuiBrightnessLevel')))];
    try {
      (d = new ActionDescriptor()).putBoolean(s2t("checkEvent"), true);
      executeAction(s2t("962b569a-c528-4dc1-a084-9735a1e72688"), d, DialogModes.NO);
      samplerEnabled = true;
    } catch (e) { }
    if (copyColorObject(source.content.Colors, colors));
    {
      presets.getPresets();
      var w = new Window('dialog', 'UIColors: ' + function () { var i = 0; for (var a in colors) i++; return i }() + ' items loaded'),
        gPreset = w.add("group{alignment : ['fill', 'center'], orientation: 'row', alignChildren: ['left', 'center']}"),
        stPreset = gPreset.add("statictext{text:'Preset:', preferredSize: [40,-1]}"),
        dlPreset = gPreset.add("dropdownlist{selection:0, preferredSize: [200, -1]}"),
        gPresetButtons = gPreset.add("group{orientation: 'row', alignChildren: ['left', 'center'], spacing: 0, margins:0}"),
        bnRefresh = gPresetButtons.add("button{text:'↻',helpTip: 'reload', preferredSize: [30, -1]}"),
        bnSave = gPresetButtons.add("button{text:'✔',helpTip: 'save',preferredSize: [30, -1]}"),
        bnAdd = gPresetButtons.add("button{text:'+',helpTip: 'add new',preferredSize: [30, -1]}"),
        bnDel = gPresetButtons.add("button{text:'×',helpTip: 'delete',preferredSize: [30, 10]}"),
        gFilter = w.add('group {alignment : ["fill", "center"], alignChildren : ["left", "center"]}'),
        stFilter = gFilter.add('statictext {text : "Filter:", preferredSize: [40,-1]}'),
        etFilter = gFilter.add('edittext {helpTip:"keyword or hex value", preferredSize: [160,-1]}'),
        chCurrentTheme = gFilter.add('checkbox', [0, 0, 120, -1], 'current color theme'),
        bnSampler = gFilter.add("button{text:'◎',helpTip: 'eyedropper tool', preferredSize: [30, -1]}"),
        gColors = w.add('group'),
        pColors = gColors.add('panel {maximumSize: [355, 400], minimumSize: [355, 400]}'),
        sbColors = gColors.add('scrollbar {stepdelta: 100}', [0, 0, 20, 400]),
        gColorBars = pColors.add('group{orientation : "column"}'),
        gOptions = w.add('group {alignment : ["fill", "center"], alignChildren : ["left", "fill"], orientation : "row"}'),
        chChangeAll = gOptions.add('checkbox', [0, 0, 200, 20], 'same color for all themes'),
        bnRandom = gOptions.add('button', [0, 0, 145, 20], 'random colors'),
        bnOk = w.add('button', undefined, 'Save UIColors.txt', { name: 'ok' });
      dlPreset.onChange = function () {
        if (w.visible) {
          if (this.selection.index) {
            if (this.selection.text != loadFromFile) {
              cfg.preset = copyColorObject(presets.presetList[this.selection.text], colors) ? this.selection.text : ''
            } else {
              var tmp = readColorsFromFile()
              if (tmp.content) {
                if (copyColorObject(tmp.content.Colors, colors)) {
                  if (!bnAdd.onClick(decodeURI(tmp.path.name))) {
                    loadPresets()
                  }
                }
              } else loadPresets()
            }
          } else {
            cfg.preset = '';
            copyColorObject(source.content.Colors, colors)
          }
          gColorBars.visible = false
          gColorBars.visible = true
          presets.checkPresetIntegrity(this.selection.text, bnSave, bnDel)
        }
      }
      bnRefresh.onClick = function () { dlPreset.onChange() }
      bnSave.onClick = function () {
        presets.putPreset(dlPreset.selection.text, colors, 'save')
        presets.checkPresetIntegrity(dlPreset.selection.text, bnSave, bnDel)
      }
      bnAdd.onClick = function (s) {
        s = s ? s : dlPreset.selection.text + ' copy';
        nm = prompt('Specify name of new preset', s, 'Add preset');
        if (nm != null && nm != "") {
          if (dlPreset.find(nm) == null) {
            presets.putPreset(nm, colors, 'add')
            cfg.preset = nm;
            loadPresets();
            return true
          } else {
            if (nm != (defaultName + ' file') && nm != UUID[1]) {
              if (confirm(localize('Preset \"%1\" already exists. Overwrite?', nm), false, 'Add preset')) {
                presets.putPreset(nm, colors, 'save');
                cfg.preset = nm;
                loadPresets();
                return true
              }
            } else alert('Default preset cannot be overwritten!')
          }
        }
        return false
      }
      bnDel.onClick = function () {
        cfg.preset = dlPreset.items[dlPreset.selection.index - 1].text
        presets.putPreset(dlPreset.selection.text, colors, 'delete')
        loadPresets();
      }
      etFilter.onChanging = function () {
        cfg.filter = this.text.toUpperCase()
        for (var i = gColorBars.children.length - 1; i >= 0; i--) { gColorBars.remove(gColorBars.children[0]) }
        loadColors()
      }
      chCurrentTheme.onClick = function () {
        cfg.currentTheme = this.value;
        if (cfg.filter != '') {
          for (var i = gColorBars.children.length - 1; i >= 0; i--) { gColorBars.remove(gColorBars.children[0]) }
          loadColors()
        }
        colorThemeVisiblity(colorBars)
      }
      bnSampler.onClick = function () {
        cfg.filter = etFilter.text
        cfg.putScriptSettings(UUID[1])
        presets.putPreset(UUID[1], colors, 'add')
        var bt = new BridgeTalk();
        bt.target = BridgeTalk.getSpecifier('photoshop');
        bt.body = "var f=" + samplerWindow.toSource() + "; f();";
        bt.send();
        currentTool = 'eyedropperTool';
        var f = File(Folder.temp + "/samplerWindow.jsx");
        f.open('w');
        f.encoding = 'text';
        f.write("var f=" + samplerEvent.toSource() + ";f();");
        f.close();
        var f = File(Folder.temp + '/samplerWindow.jsx');
        for (var i = 0; i < app.notifiers.length; i++) {
          var ntf = app.notifiers[i];
          if (ntf.eventFile.name == f.name) { ntf.remove(); i-- };
        }
        var tmp = app.preferences.rulerUnits;
        app.preferences.rulerUnits = Units.PIXELS
        app.documents.add(500, 500, 72, UUID[1])
        app.preferences.rulerUnits = tmp;
        app.notifiersEnabled = true
        app.notifiers.add('setd', f, 'Clr ')
        w.close()
      }
      sbColors.onChanging = function () { gColorBars.location.y = -100 * this.value }
      chChangeAll.onClick = function () { cfg.changeAll = this.value }
      bnRandom.onClick = function () {
        var hexFilter = cfg.filter ? cfg.filter.replace('#', '') : '';
        for (a in colors) {
          if (a.toUpperCase().indexOf(cfg.filter) != -1 || !cfg.filter || findColorByHex(colors[a], hexFilter)) {
            var rnd = [Math.random(), Math.random(), Math.random()]
            for (var i = 0; i < 4; i++) {
              if (currentColorTheme != i && cfg.currentTheme) continue;
              for (var x = 0; x < 3; x++) {
                colors[a][i][x] = Math.round(cfg.changeAll ? rnd[x] * 255 : Math.random() * 255)
              }
            }
          }
        }
        gColorBars.visible = false
        gColorBars.visible = true
        presets.checkPresetIntegrity(dlPreset.selection.text, bnSave, bnDel)
      }
      bnOk.onClick = function () {
        cfg.preset = cfg.filter = ''
        cfg.putScriptSettings(UUID[0])
        var tmp = new File(source.content.path + '/' + (new Date()).getTime());
        if (tmp.open('w')) {
          tmp.close();
          tmp.remove();
          w.close();
          writeColorsToFile(source.content.path, source, colors)
        } else {
          n = f.saveDlg('Save file', '*.txt');
          if (n) {
            var tmp = new File(n.path + '/' + (new Date()).getTime());
            if (tmp.open('a')) {
              tmp.close();
              tmp.remove();
              w.close()
              writeColorsToFile(n, source, colors)
            }
            else { alert(n.fsName + '\nFile access error!\nMake sure you have the required access rights') }
          }
        }
      }
      w.onShow = function () {
        cfg.getScriptSettings(UUID[0])
        if (cfg.getScriptSettings(UUID[1])) {
          cfg.eraseScriptSettings(UUID[1])
          try { (documents.getByName(UUID[1])).close(SaveOptions.DONOTSAVECHANGES) } catch (e) { }
          etFilter.text = foregroundColor.rgb.hexValue
          cfg.filter = foregroundColor.rgb.hexValue.toUpperCase();
          copyColorObject(presets.presetList[UUID[1]], colors)
          presets.putPreset(UUID[1], colors, 'delete')
        }
        chCurrentTheme.value = cfg.currentTheme
        chChangeAll.value = cfg.changeAll
        bnSampler.enabled = samplerEnabled
        loadColors()
        colorThemeVisiblity(colorBars)
        loadPresets()
        presets.checkPresetIntegrity(dlPreset.selection.text, bnSave, bnDel)
      }
      w.show();
      function loadColors() {
        {
          var hexFilter = cfg.filter ? cfg.filter.replace('#', '') : '';
          colorBars = [];
          for (a in colors) {
            if (a.toUpperCase().indexOf(cfg.filter) != -1 || !cfg.filter || findColorByHex(colors[a], hexFilter)) {
              colorBars.push(addColorBar(gColorBars, a, colors[a]))
            }
          }
          w.layout.layout(true)
          sbColors.value = sbColors.minvalue = 0
          sbColors.maxvalue = (gColorBars.size.height - pColors.size.height + 100) / 100
        }
        function addColorBar(parent, cpt, col) {
          {
            var g = parent.add('group{orientation : "row", alignChildren : ["left", "center"]}'),
              s = g.add('statictext', undefined, cpt),
              colorBar = [];
            s.preferredSize.width = 200
            for (var i = 0; i < 4; i++) colorBar.push(addColor(g, col[i], cpt, i))
            return colorBar
          }
          function addColor(parent, col, cpt, idx) {
            var img = parent.add('image {preferredSize : [20,20]}')
            img.onDraw = function () {
              var g = this.graphics
              g.ellipsePath(2, 2, 15, 15)
              g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [col[0] / 255, col[1] / 255, col[2] / 255, col[3]]))
              g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0, 0, 0], 2))
            }
            img.onClick = function () {
              var a = new SolidColor
              with (a.rgb) {
                red = col[0]
                green = col[1]
                blue = col[2]
              }
              app.foregroundColor = a
              if (app.showColorPicker()) {
                var a = app.foregroundColor,
                  from = !cfg.changeAll || (idx == currentColorTheme && cfg.currentTheme) ? idx : 0,
                  to = !cfg.changeAll || (idx == currentColorTheme && cfg.currentTheme) ? idx : 3;
                for (var i = from; i <= to; i++) {
                  colors[cpt][i][0] = col[0] = Math.round(a.rgb.red)
                  colors[cpt][i][1] = col[1] = Math.round(a.rgb.green)
                  colors[cpt][i][2] = col[2] = Math.round(a.rgb.blue)
                }
                parent.visible = false
                parent.visible = true
              }
              presets.checkPresetIntegrity(dlPreset.selection.text, bnSave, bnDel)
            }
            return img
          }
        }
      }
      function loadPresets() {
        dlPreset.removeAll()
        dlPreset.add('item', defaultName + ' file')
        for (var a in presets.presetList) dlPreset.add('item', a)
        dlPreset.add('separator', '-')
        dlPreset.add('item', loadFromFile)
        dlPreset.selection = dlPreset.find(cfg.preset) ? dlPreset.find(cfg.preset) : 0
      }
      function findColorByHex(a, s) {
        if (s.length == 6) {
          for (var i = 0; i < 4; i++) {
            if (currentColorTheme != i && cfg.currentTheme) continue;
            if ((RgbToHex(a[i])).indexOf(s) != -1) return true
          }
        }
      }
      function colorThemeVisiblity(p) {
        len = p.length
        for (var i = 0; i < len; i++) {
          cur = p[i]
          for (var x = 0; x < 4; x++) {
            cur[x].visible = !cfg.currentTheme ? true : (x == currentColorTheme ? true : false);
          }
        }
      }
    }
  }
  function readColorsFromFile(f) {
    if (!f || !f.exists) f = File.openDialog('Select your ' + defaultName, '*.txt', false);
    var output;
    if (f && f.exists) {
      var obj = '('
      f.open('r')
      while (!f.eof) { obj += f.readln() }
      f.close()
      obj = obj.replace(/00\./g, '0.') + ')'
      try {
        if (obj.indexOf('0x') != -1) throw new Error()
        output = eval(obj)
      } catch (e) { alert(decodeURI(f.name) + ' format is wrong!', '', true) }
    }
    return { content: output, path: f }
  }
  function writeColorsToFile(f, source, target) {
    if (f.exists) f.copy(new File(f.path + '/UIColors ' + (new Date()).getTime() + '.bak'))
    if (copyColorObject(target, source.content.Colors)) {
      var s = source.content.toSource()
      f.open('w')
      f.write(s.substr(1, s.length - 2))
      f.close()
    }
  }
  function RgbToHex(color) {
    var hex = ''
    for (var i = 0; i < 3; i++) hex += ('0' + color[i].toString(16)).substr(-2);
    return hex.toUpperCase()
  }
  function copyColorObject(a, b) {
    b = b ? b : {};
    try {
      for (var k in a) {
        b[k] = b[k] ? b[k] : [];
        for (var i = 0; i < 4; i++) {
          b[k][i] = b[k][i] ? b[k][i] : []
          for (var x = 0; x < 4; x++) {
            b[k][i][x] = a[k][i][x]
          }
        }
      }
    } catch (e) { alert(e + 'Color object structure is broken!'); return false; }
    return true
  }
  function samplerWindow() {
    var z = Window.find('palette', 'Select color');
    if (z) {
      z.show();
      return;
    }
    var d = new Window('palette');
    d.text = 'Select color';
    d.orientation = 'row';
    d.alignChildren = ['left', 'top'];
    d.spacing = 10;
    d.margins = 16;
    var grTool = d.add('group');
    grTool.orientation = 'row';
    grTool.alignChildren = ['left', 'center'];
    grTool.spacing = 10;
    grTool.alignment = ['left', 'center'];
    var img = grTool.add('image {preferredSize : [20,20]}');
    var stTip = grTool.add('statictext');
    stTip.preferredSize.width = 300;
    stTip.justify = 'center';
    stTip.text = 'Use Eyedropper Tool to get a color sample';
    var grBn = d.add('group');
    grBn.orientation = 'column';
    grBn.alignChildren = ['center', 'center'];
    grBn.spacing = 10;
    var ok = grBn.add('button');
    ok.text = 'Ok';
    ok.preferredSize.width = 90;
    ok.onClick = function () {
      var f = File(Folder.temp + '/samplerWindow.jsx');
      for (var i = 0; i < app.notifiers.length; i++) {
        var ntf = app.notifiers[i];
        if (ntf.eventFile.name == f.name) { ntf.remove(); i-- };
      }
      f.remove();
      d.hide();
      executeAction(stringIDToTypeID("962b569a-c528-4dc1-a084-9735a1e72688"), undefined, DialogModes.NO);
    }
    img.onDraw = function () {
      var g = this.graphics;
      g.ellipsePath(2, 2, 15, 15);
      g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [foregroundColor.rgb.red / 255, foregroundColor.rgb.green / 255, foregroundColor.rgb.blue / 255, 1]));
      g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0, 0, 0], 2));
    }
    d.show();
  }
  function samplerEvent() {
    var z = Window.find('palette', 'Select color');
    z.show();
    z.children[0].visible = false;
    z.children[0].visible = true;
  }
}
function Preset() {
  var f = new File(app.preferencesFolder + '/UIColors.desc');
  this.presetList = {};
  this.putPreset = function (key, val, mode) {
    var result = false;
    switch (mode) {
      case "add":
        this.presetList[key] = {}
        result = copyColorObject(val, this.presetList[key])
        break;
      case "save":
        result = copyColorObject(val, this.presetList[key])
        break;
      case "delete":
        result = true
        delete this.presetList[key]
        break;
    }
    if (result) {
      var presetList = new ActionDescriptor();
      for (var a in this.presetList) {
        var currentPreset = new ActionList(),
          cur = this.presetList[a];
        for (var b in cur) {
          var d = new ActionDescriptor(),
            colors = new ActionList();
          for (var x = 0; x < 4; x++) {
            var l = new ActionList();
            l.putInteger(cur[b][x][0])
            l.putInteger(cur[b][x][1])
            l.putInteger(cur[b][x][2])
            l.putDouble(cur[b][x][3])
            colors.putList(l)
          }
          d.putList(s2t(b), colors);
          currentPreset.putObject(s2t('object'), d)
        }
        presetList.putList(s2t(a), currentPreset);
      }
      if (presetList.count) {
        try {
          f.open('w')
          f.encoding = 'BINARY'
          f.write(presetList.toStream())
          f.close()
        } catch (e) { alert(e, '', 1) }
      } else {
        f.remove()
      }
    } else {
      delete this.presetList[key]
    }
  }
  this.getPresets = function () {
    try {
      var d = new ActionDescriptor();
      if (f.exists) {
        f.open('r')
        f.encoding = 'BINARY'
        var s = f.read()
        f.close();
        d.fromStream(s);
      }
      this.presetList = {};
      for (var i = 0; i < d.count; i++) {
        key = t2s(d.getKey(i));
        var presetList = d.getList(s2t(key)),
          colors = {};
        for (var x = 0; x < presetList.count; x++) {
          var cur = presetList.getObjectValue(x),
            typename = t2s(cur.getKey(0)),
            colorList = cur.getList(s2t(typename));
          colors[typename] = [];
          for (var y = 0; y < colorList.count; y++) {
            colors[typename].push([
              colorList.getList(y).getInteger(0),
              colorList.getList(y).getInteger(1),
              colorList.getList(y).getInteger(2),
              colorList.getList(y).getDouble(3)
            ])
          }
        }
        this.presetList[key] = colors;
      }
    } catch (e) { alert('Preset file currupted!\n' + f.fsName, '', 1); f.remove(); }
  }
  this.checkPresetIntegrity = function (k, bnSave, bnDel) {
    var cur = !this.presetList[k] ? source.content.Colors : this.presetList[k]
    found = false;
    for (a in cur) {
      for (var i = 0; i < 4 && !found; i++) {
        for (var x = 0; x < 3 && !found; x++) {
          if (cur[a][i][x] != colors[a][i][x]) {
            found = true
          }
        }
      }
    }
    if (cur == source.content.Colors) bnSave.enabled = bnDel.enabled = false else {
      bnSave.enabled = found
      bnDel.enabled = true
    }
  }
}
function Config() {
  this.preset = ''
  this.filter = ''
  this.currentTheme = false
  this.changeAll = false
  this.getScriptSettings = function (UUID) {
    try { var d = app.getCustomOptions(UUID) } catch (e) { }
    if (d != undefined) { descriptorToObject(this, d); return true; }
    else return false;
    function descriptorToObject(o, d) {
      var l = d.count;
      if (l) {
        for (var i = 0; i < l; i++) {
          var k = d.getKey(i),
            t = d.getType(k),
            v = t2s(k);
          switch (t) {
            case DescValueType.BOOLEANTYPE: o[v] = d.getBoolean(k); break;
            case DescValueType.STRINGTYPE: o[v] = d.getString(k); break;
            case DescValueType.INTEGERTYPE: o[v] = d.getDouble(k); break;
          }
        }
      }
    }
  }
  this.putScriptSettings = function (UUID) {
    var d = objectToDescriptor(this)
    app.putCustomOptions(UUID, d)
    function objectToDescriptor(o) {
      var d = new ActionDescriptor,
        l = o.reflect.properties.length;
      for (var i = 0; i < l; i++) {
        var k = o.reflect.properties[i].toString();
        if (k == "__proto__" || k == "__count__" || k == "__class__" || k == "reflect") continue;
        var v = o[k];
        k = app.stringIDToTypeID(k);
        switch (typeof (v)) {
          case "boolean": d.putBoolean(k, v); break;
          case "string": d.putString(k, v); break;
          case "number": d.putInteger(k, v); break;
        }
      }
      return d;
    }
  }
  this.eraseScriptSettings = function (UUID) {
    eraseCustomOptions(UUID);
  }
}
