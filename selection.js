/**
 * @license selection.js Copyright (c) 2011-12 Tim Cameron Ryan. MIT licensed.
 */

/*

Cross-Browser Selection Utilities
=================================

This utility provides a window.Selection object with common API for 

 - all modern browsers (using window.getSelection())
 - IE5--8 (using TextRanges)

window.Selection is a static object with the following methods:

- *hasSelection(window)* -- Returns true if anything is currently
  selected.
- *getOrigin(window)* -- Returns an array [anchorNode, anchorOffset]
  of the current selection's starting anchor (in IE, returns left anchor)
- *getFocus(window)* -- Returns an array [focusNode, focusOffset]
  of the current selection's focus anchor (in IE, returns right anchor)
- *getStart(window)* -- Returns an array [node, offset] for the leftmost
  anchor.
- *getEnd(window)* -- Returns an array [node, offset] for the rightmost
  anchor.
- *setSelection(window, originNode, originOffset, focusNode, focusOffset)* --
  Sets the selection to include the new origin anchor and focus anchor
  (in IE, origin will be leftmost anchor, focus rightmost)

Released under the MIT license. Copyright (c) 2010--2012 Tim Cameron Ryan.

*/

(function () {

var root = this;

// Utilities.

var Dom = {
	
	isPreceding: function (n1, n2) {
		return n2.compareDocumentPosition(n1) & 0x02;
	},
	
	contains: function (n1, n2) {
		if (n1.compareDocumentPosition != null) {
			return n1.compareDocumentPosition(n2) & 16;
		} else {
			return n1.contains(n2);
		}
	},
	
	isCursorPreceding: function (n1, o1, n2, o2) {
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
	
	isText: function (d) {
		return (d != null ? d.nodeType == 3 : false);
	},
	
	getChildIndex: function (e) {
		var k = 0;
		while (e = e.previousSibling) {
			k++;
		}
		return k;
	}
};

// DOM Selection and Ranges
// ------------------------

var Selection = root.Selection = (function () {
	function Selection(win) {
		this.win = win;
	}

	Selection.prototype.hasSelection = function () {
		return Selection.hasSelection(this.win);
	};

	Selection.prototype.getOrigin = function () {
		return Selection.getOrigin(this.win);
	};

	Selection.prototype.getFocus = function () {
		return Selection.getFocus(this.win);
	};

	Selection.prototype.getStart = function () {
		return Selection.getStart(this.win);
	};

	Selection.prototype.getEnd = function () {
		return Selection.getEnd(this.win);
	};

	Selection.prototype.setSelection = function (orgn, orgo, focn, foco) {
		return Selection.setSelection(this.win, orgn, orgo, focn, foco);
	};

	Selection.prototype.clearSelection = function () {
		return Selection.clearSelection(this.win);
	};

	return Selection;
})();

// DOM Selctions and Ranges
// ------------------------

if (root.getSelection) {

	Selection.supported = true;

	Selection.hasSelection = function (win) {
		var sel;
		return (sel = win.getSelection()) && (sel.focusNode != null) && (sel.anchorNode != null);
	};

	Selection.getOrigin = function (win) {
		var sel;
		if (!((sel = win.getSelection()) && (sel.anchorNode != null))) {
			return null;
		}
		return [sel.anchorNode, sel.anchorOffset];
	};

	Selection.getFocus = function (win) {
		var sel;
		if (!((sel = win.getSelection()) && (sel.focusNode != null))) {
			return null;
		}
		return [sel.focusNode, sel.focusOffset];
	};

	Selection.getStart = function (win) {
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

	Selection.getEnd = function (win) {
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

	Selection.setSelection = function (win, orgn, orgo, focn, foco) {
		var sel = win.getSelection();
		if (!sel) {
			return;
		}

		// Default arguments.
		if (focn == null) {
			focn = orgn;
		}
		if (foco == null) {
			foco = orgo;
		}

		// .collapse() and .extend() required for directionality and drag preservation.
		if (sel.collapse && sel.extend) {
			sel.collapse(orgn, orgo);
			sel.extend(focn, foco);
		}
		// IE9, etc.
		else {
			r = win.document.createRange();
			r.setStart(orgn, orgo);
			r.setEnd(focn, foco);
			try {
				sel.removeAllRanges();
			} catch (e) {
				// IE9 throws error sometimes
			}
			sel.addRange(r);
		}
	};

	Selection.clearSelection = function (win) {
		try {
			var sel = win.getSelection();
			if (!sel) {
				return;
			}
			sel.removeAllRanges();
		} catch (e) {
			// IE9 throws error sometimes
		}
	};

// TextRanges (<= IE8)
// -------------------

} else if (root.document.selection) {

	var getBoundary = function (doc, textRange, bStart) {
		var cursor, cursorNode, node, offset, parent;

		// We can get the "parentElement" of a cursor (an endpoint of a TextRange).
		// Create an anchor (throwaway) element and move it from the end of the element
		// progressively backward until the text range of the anchor's contents
		// meets or exceeds our original cursor.
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

		// When we exceed or meet the cursor, we've found the node our cursor is
		// anchored on.
		if (cursor.compareEndPoints((bStart ? 'StartToStart' : 'StartToEnd'), textRange) === -1 && cursorNode.nextSibling) {
			// This node can be a text node...
			cursor.setEndPoint((bStart ? 'EndToStart' : 'EndToEnd'), textRange);
			node = cursorNode.nextSibling;
			offset = cursor.text.length;
		} else {
			// ...or an element.
			node = cursorNode.parentNode;
			offset = Dom.getChildIndex(cursorNode);
		}

		// Remove our dummy node and return the anchor.
		cursorNode.parentNode.removeChild(cursorNode);
		return [node, offset];
	};

	var moveBoundary = function (doc, textRange, bStart, node, offset) {
		var anchorNode, anchorParent, cursor, cursorNode, textOffset;

		// Find the normalized node and parent of our anchor.
		textOffset = 0;
		anchorNode = Dom.isText(node) ? node : node.childNodes[offset];
		anchorParent = Dom.isText(node) ? node.parentNode : node;
		// Visible data nodes need an offset parameter.
		if (Dom.isText(node)) {
			textOffset = offset;
		}

		// We create another dummy anchor element, insert it at the anchor,
		// and create a text range to select the contents of that node.
		// Then we remove the dummy.
		cursorNode = doc.createElement('a');
		anchorParent.insertBefore(cursorNode, anchorNode || null);
		cursor = doc.body.createTextRange();
		cursor.moveToElementText(cursorNode);
		cursorNode.parentNode.removeChild(cursorNode);
		// Update the passed-in range to this cursor.
		textRange.setEndPoint((bStart ? 'StartToStart' : 'EndToEnd'), cursor);
		return textRange[bStart ? 'moveStart' : 'moveEnd']('character', textOffset);
	};

	// Selection methods.

	Selection.supported = true;

	Selection.hasSelection = function (win) {
		var range;
		win.focus();
		if (!win.document.selection) {
			return false;
		}
		range = win.document.selection.createRange();
		return range && range.parentElement().document === win.document;
	};

	Selection.getStart = function (win) {
		var range;
		win.focus();
		if (!Selection.hasSelection(win)) {
			return null;
		}
		range = win.document.selection.createRange();
		return getBoundary(win.document, range, true);
	};
	
	Selection.getEnd = function (win) {
		var range;
		win.focus();
		if (!Selection.hasSelection(win)) {
			return null;
		}
		range = win.document.selection.createRange();
		return getBoundary(win.document, range, false);
	};

	// TextRange has no forward or backward indicator;
	// just assume origin is start, focus end
	
	Selection.getOrigin = function (win) {
		return Selection.getStart(win);
	};
	
	Selection.getFocus = function (win) {
		return Selection.getEnd(win);
	};
	
	Selection.setSelection = function (win, orgn, orgo, focn, foco) {
		// Default arguments.
		if (focn == null) {
			focn = orgn;
		}
		if (foco == null) {
			foco = orgo;
		}

		var range = win.document.body.createTextRange();
		// Intentionally do end, start order to fix selection bugs.
		moveBoundary(win.document, range, false, focn, foco);
		moveBoundary(win.document, range, true, orgn, orgo);
		return range.select();
	};
	
	Selection.clearSelection = function (win) {
		return win.document.selection.empty();
	};

// Unsupported
// -----------

} else {

	Selection.supported = false;

}

}).call(this);
