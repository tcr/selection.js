(function() {
  var Dom, Selection, getBoundary, moveBoundary, root;
  var __slice = Array.prototype.slice;
  root = this;
  Dom = {
    isPreceding: function(n1, n2) {
      return n2.compareDocumentPosition(n1) & 0x02;
    },
    contains: function(n1, n2) {
      if (n1.compareDocumentPosition != null) {
        return n1.compareDocumentPosition(n2) & 16;
      } else {
        return n1.contains(n2);
      }
    },
    isCursorPreceding: function(n1, o1, n2, o2) {
      if (n1 === n2) {
        return o1 <= o2;
      }
      if (Dom.isText(n1) && Dom.isText(n2)) {
        return Dom.isPreceding(n1, n2);
      }
      if (Dom.isText(n1) && !Dom.isText(n2)) {
        return !Dom.isCursorPreceding(n2, o2, n1, o1);
      }
      if (!Dom.contains(n1, n2)) {
        return Dom.isPreceding(n1, n2);
      }
      if (n1.childNodes.length <= o1) {
        return false;
      }
      if (n1.childNodes[o1] === n2) {
        return 0 <= o2;
      }
      return Dom.isPreceding(n1.childNodes[o1], n2);
    },
    isText: function(d) {
      return (d != null ? d.nodeType : void 0) === 3;
    },
    getChildIndex: function(e) {
      var k;
      k = 0;
      while (e = e.previousSibling) {
        k++;
      }
      return k;
    }
  };
  root.Selection = Selection = (function() {
    function Selection(win) {
      this.win = win;
    }
    Selection.prototype.hasSelection = function() {
      return Selection.hasSelection(this.win);
    };
    Selection.prototype.getOrigin = function() {
      return Selection.getOrigin(this.win);
    };
    Selection.prototype.getFocus = function() {
      return Selection.getFocus(this.win);
    };
    Selection.prototype.getStart = function() {
      return Selection.getStart(this.win);
    };
    Selection.prototype.getEnd = function() {
      return Selection.getEnd(this.win);
    };
    Selection.prototype.setSelection = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return Selection.setSelection.apply(Selection, [this.win].concat(__slice.call(args)));
    };
    Selection.prototype.clearSelection = function() {
      return Selection.clearSelection(this.win);
    };
    return Selection;
  })();
  if (root.getSelection) {
    Selection.supported = true;
    Selection.hasSelection = function(win) {
      var sel;
      return (sel = win.getSelection()) && (sel.focusNode != null) && (sel.anchorNode != null);
    };
    Selection.getOrigin = function(win) {
      var sel;
      if (!((sel = win.getSelection()) && (sel.anchorNode != null))) {
        return null;
      }
      return [sel.anchorNode, sel.anchorOffset];
    };
    Selection.getFocus = function(win) {
      var sel;
      if (!((sel = win.getSelection()) && (sel.focusNode != null))) {
        return null;
      }
      return [sel.focusNode, sel.focusOffset];
    };
    Selection.getStart = function(win) {
      var n1, n2, o1, o2, _ref, _ref2;
      if (!Selection.hasSelection(win)) {
        return null;
      }
      _ref = Selection.getOrigin(win), n1 = _ref[0], o1 = _ref[1];
      _ref2 = Selection.getFocus(win), n2 = _ref2[0], o2 = _ref2[1];
      if (Dom.isCursorPreceding(n1, o1, n2, o2)) {
        return [n1, o1];
      }
      return [n2, o2];
    };
    Selection.getEnd = function(win) {
      var n1, n2, o1, o2, _ref, _ref2;
      if (!Selection.hasSelection(win)) {
        return null;
      }
      _ref = Selection.getOrigin(win), n1 = _ref[0], o1 = _ref[1];
      _ref2 = Selection.getFocus(win), n2 = _ref2[0], o2 = _ref2[1];
      if (Dom.isCursorPreceding(n1, o1, n2, o2)) {
        return [n2, o2];
      }
      return [n1, o1];
    };
    Selection.setSelection = function(win, orgn, orgo, focn, foco) {
      var r, _ref, _ref2;
      if (focn == null) {
        focn = orgn;
      }
      if (foco == null) {
        foco = orgo;
      }
      r = win.document.createRange();
      r.setStart(orgn, orgo);
      r.setEnd(focn, foco);
      try {
        if ((_ref = win.getSelection()) != null) {
          _ref.removeAllRanges();
        }
      } catch (e) {

      }
      return (_ref2 = win.getSelection()) != null ? _ref2.addRange(r) : void 0;
    };
    Selection.clearSelection = function(win) {
      var _ref;
      try {
        return (_ref = win.getSelection()) != null ? _ref.removeAllRanges() : void 0;
      } catch (e) {

      }
    };
  } else if (root.document.selection) {
    getBoundary = function(doc, textRange, bStart) {
      var cursor, cursorNode, node, offset, parent;
      cursorNode = doc.createElement('a');
      cursor = textRange.duplicate();
      cursor.collapse(bStart);
      parent = cursor.parentElement();
      while (true) {
        parent.insertBefore(cursorNode, cursorNode.previousSibling);
        cursor.moveToElementText(cursorNode);
        if (!(cursor.compareEndPoints((bStart ? 'StartToStart' : 'StartToEnd'), textRange) > 0 && (cursorNode.previousSibling != null))) {
          break;
        }
      }
      if (cursor.compareEndPoints((bStart ? 'StartToStart' : 'StartToEnd'), textRange) === -1 && cursorNode.nextSibling) {
        cursor.setEndPoint((bStart ? 'EndToStart' : 'EndToEnd'), textRange);
        node = cursorNode.nextSibling;
        offset = cursor.text.length;
      } else {
        node = cursorNode.parentNode;
        offset = Dom.getChildIndex(cursorNode);
      }
      cursorNode.parentNode.removeChild(cursorNode);
      return [node, offset];
    };
    moveBoundary = function(doc, textRange, bStart, node, offset) {
      var anchorNode, anchorParent, cursor, cursorNode, textOffset;
      textOffset = 0;
      anchorNode = Dom.isText(node) ? node : node.childNodes[offset];
      anchorParent = Dom.isText(node) ? node.parentNode : node;
      if (Dom.isText(node)) {
        textOffset = offset;
      }
      cursorNode = doc.createElement('a');
      anchorParent.insertBefore(cursorNode, anchorNode || null);
      cursor = doc.body.createTextRange();
      cursor.moveToElementText(cursorNode);
      cursorNode.parentNode.removeChild(cursorNode);
      textRange.setEndPoint((bStart ? 'StartToStart' : 'EndToEnd'), cursor);
      return textRange[bStart ? 'moveStart' : 'moveEnd']('character', textOffset);
    };
    Selection.supported = true;
    Selection.hasSelection = function(win) {
      var range;
      win.focus();
      if (!win.document.selection) {
        return false;
      }
      range = win.document.selection.createRange();
      return range && range.parentElement().document === win.document;
    };
    Selection.getStart = function(win) {
      var range;
      win.focus();
      if (!Selection.hasSelection(win)) {
        return null;
      }
      range = win.document.selection.createRange();
      return getBoundary(win.document, range, true);
    };
    Selection.getEnd = function(win) {
      var range;
      win.focus();
      if (!Selection.hasSelection(win)) {
        return null;
      }
      range = win.document.selection.createRange();
      return getBoundary(win.document, range, false);
    };
    Selection.getOrigin = function(win) {
      return Selection.getStart(win);
    };
    Selection.getFocus = function(win) {
      return Selection.getEnd(win);
    };
    Selection.setSelection = function(win, orgn, orgo, focn, foco) {
      var range;
      if (focn == null) {
        focn = orgn;
      }
      if (foco == null) {
        foco = orgo;
      }
      range = win.document.body.createTextRange();
      moveBoundary(win.document, range, false, focn, foco);
      moveBoundary(win.document, range, true, orgn, orgo);
      return range.select();
    };
    Selection.clearSelection = function(win) {
      return win.document.selection.empty();
    };
  } else {
    Selection.supported = false;
  }
}).call(this);
