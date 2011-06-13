var root;
root = this;
if (root.getSelection) {
  root.selection = {
    hasSelection: function(win) {
      var sel;
      return (sel = win.getSelection()) && (sel.focusNode != null) && (sel.anchorNode != null);
    },
    getOrigin: function(win) {
      var sel;
      if (!((sel = win.getSelection()) && (sel.anchorNode != null))) {
        return null;
      }
      return [sel.anchorNode, sel.anchorOffset];
    },
    getFocus: function(win) {
      var sel;
      if (!((sel = win.getSelection()) && (sel.focusNode != null))) {
        return null;
      }
      return [sel.focusNode, sel.focusOffset];
    },
    getStart: function(win) {
      var n1, n2, o1, o2, _ref, _ref2;
      if (!root.selection.hasSelection(win)) {
        return null;
      }
      _ref = root.selection.getOrigin(win), n1 = _ref[0], o1 = _ref[1];
      _ref2 = root.selection.getFocus(win), n2 = _ref2[0], o2 = _ref2[1];
      if (util.dom.isPreceding(n1, n2) || (n1 === n2 && o1 < o2)) {
        return [n1, o1];
      }
      return [n2, o2];
    },
    getEnd: function(win) {
      var n1, n2, o1, o2, _ref, _ref2;
      if (!root.selection.hasSelection(win)) {
        return null;
      }
      _ref = root.selection.getOrigin(win), n1 = _ref[0], o1 = _ref[1];
      _ref2 = root.selection.getFocus(win), n2 = _ref2[0], o2 = _ref2[1];
      if (util.dom.isPreceding(n1, n2) || (n1 === n2 && o1 < o2)) {
        return [n2, o2];
      }
      return [n1, o1];
    },
    setSelection: function(win, orgn, orgo, focn, foco) {
      var r, _ref, _ref2;
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
    }
  };
} else if (root.document.selection) {
  (function() {
    var getBoundary, moveBoundary;
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
        offset = util.dom.getChildIndex(cursorNode);
      }
      cursorNode.parentNode.removeChild(cursorNode);
      return [node, offset];
    };
    moveBoundary = function(doc, textRange, bStart, node, offset) {
      var anchorNode, anchorParent, cursor, cursorNode, textOffset;
      textOffset = 0;
      anchorNode = util.dom.isText(node) ? node : node.childNodes[offset];
      anchorParent = util.dom.isText(node) ? node.parentNode : node;
      if (util.dom.isText(node)) {
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
    return root.selection = {
      hasSelection: function(win) {
        var range;
        win.focus();
        if (!win.document.selection) {
          return false;
        }
        range = win.document.selection.createRange();
        return range && range.parentElement().document === win.document;
      },
      getStart: function(win) {
        var range;
        win.focus();
        if (!root.selection.hasSelection(win)) {
          return null;
        }
        range = win.document.selection.createRange();
        return getBoundary(win.document, range, true);
      },
      getEnd: function(win) {
        var range;
        win.focus();
        if (!root.selection.hasSelection(win)) {
          return null;
        }
        range = win.document.selection.createRange();
        return getBoundary(win.document, range, false);
      },
      getOrigin: function(win) {
        return root.selection.getStart(win);
      },
      getFocus: function(win) {
        return root.selection.getEnd(win);
      },
      setSelection: function(win, orgn, orgo, focn, foco) {
        var range;
        range = win.document.body.createTextRange();
        moveBoundary(win.document, range, false, focn, foco);
        moveBoundary(win.document, range, true, orgn, orgo);
        return range.select();
      }
    };
  })();
} else {
  throw new Exception('Browser not supported: no selection support.');
}