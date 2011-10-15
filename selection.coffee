# Cross-Browser Selection Utilities
# =================================

# This utility provides a window.Selection object with common API for 
#
#  - all modern browsers (using window.getSelection())
#  - IE5--8 (using TextRanges)
#
# window.Selection is a static object with the following methods:
#
# - *hasSelection(window)* -- Returns true if anything is currently
#   selected.
# - *getOrigin(window)* -- Returns an array [anchorNode, anchorOffset]
#   of the current selection's starting anchor (in IE, returns left anchor)
# - *getFocus(window)* -- Returns an array [focusNode, focusOffset]
#   of the current selection's focus anchor (in IE, returns right anchor)
# - *getStart(window)* -- Returns an array [node, offset] for the leftmost
#   anchor.
# - *getEnd(window)* -- Returns an array [node, offset] for the rightmost
#   anchor.
# - *setSelection(window, originNode, originOffset, focusNode, focusOffset)* --
#   Sets the selection to include the new origin anchor and focus anchor
#   (in IE, origin will be leftmost anchor, focus rightmost)
#
# Released under the MIT license. Copyright (c) 2010--2011 Tim Cameron Ryan.

root = this

Dom =
	isPreceding: (n1, n2) ->
		return n2.compareDocumentPosition(n1) & 0x02

	isText: (d) -> d?.nodeType == 3

	getChildIndex: (e) ->
		k = 0
		k++ while e = e.previousSibling
		return k

# DOMSelection
# ------------

if root.getSelection
	root.Selection = Selection =
		hasSelection: (win) ->
			return (sel = win.getSelection()) and sel.focusNode? and sel.anchorNode?
		
		getOrigin: (win) ->
			return null unless (sel = win.getSelection()) and sel.anchorNode?
			return [sel.anchorNode, sel.anchorOffset]
			
		getFocus: (win) ->
			return null unless (sel = win.getSelection()) and sel.focusNode?
			return [sel.focusNode, sel.focusOffset]
			
		getStart: (win) ->
			return null unless Selection.hasSelection(win)
			[n1, o1] = Selection.getOrigin(win)
			[n2, o2] = Selection.getFocus(win)
			if Dom.isPreceding(n1, n2) or (n1 == n2 and o1 < o2)
				return [n1, o1]
			return [n2, o2]
			
		getEnd: (win) ->
			return null unless Selection.hasSelection(win)
			[n1, o1] = Selection.getOrigin(win)
			[n2, o2] = Selection.getFocus(win)
			if Dom.isPreceding(n1, n2) or (n1 == n2 and o1 < o2)
				return [n2, o2]
			return [n1, o1]

		setSelection: (win, orgn, orgo, focn, foco) ->
			# not using Selection methods as IE9 doesn't support extend()
			#win.getSelection()?.collapse(orgn, orgo)
			#win.getSelection()?.extend(focn, foco)
			
			r = win.document.createRange()
			r.setStart(orgn, orgo)
			r.setEnd(focn, foco)
			try 
				win.getSelection()?.removeAllRanges()
			catch e
				# IE9 throws error sometimes
			win.getSelection()?.addRange(r)

# TextRanges (<= IE8)
# -------------------

else if root.document.selection
	getBoundary = (doc, textRange, bStart) ->
		# iterate backwards through parent element to find anchor location
		cursorNode = doc.createElement('a')
		cursor = textRange.duplicate()
		cursor.collapse(bStart)
		parent = cursor.parentElement()
		loop
			parent.insertBefore(cursorNode, cursorNode.previousSibling);
			cursor.moveToElementText(cursorNode);
			unless cursor.compareEndPoints((if bStart then 'StartToStart' else 'StartToEnd'), textRange) > 0 and
			  cursorNode.previousSibling?
				break

		# when we exceed or meet the cursor, we've found the node
		if cursor.compareEndPoints((if bStart then 'StartToStart' else 'StartToEnd'), textRange) == -1 and
		  cursorNode.nextSibling
			# data node
			cursor.setEndPoint((if bStart then 'EndToStart' else 'EndToEnd'), textRange);
			node = cursorNode.nextSibling
			offset = cursor.text.length
		else
			# element
			node = cursorNode.parentNode
			offset = Dom.getChildIndex(cursorNode)
			
		cursorNode.parentNode.removeChild(cursorNode)
		return [node, offset]

	moveBoundary = (doc, textRange, bStart, node, offset) ->
		# find anchor node and offset
		textOffset = 0
		anchorNode = if Dom.isText(node) then node else node.childNodes[offset]
		anchorParent = if Dom.isText(node) then node.parentNode else node
		# visible data nodes need a text offset
		if Dom.isText(node)
			textOffset = offset

		# create a cursor element node to position range (since we can't select text nodes)
		cursorNode = doc.createElement('a')
		anchorParent.insertBefore(cursorNode, anchorNode or null)
		cursor = doc.body.createTextRange()
		cursor.moveToElementText(cursorNode)
		cursorNode.parentNode.removeChild(cursorNode)
		# move range
		textRange.setEndPoint((if bStart then 'StartToStart' else 'EndToEnd'), cursor)
		textRange[if bStart then 'moveStart' else 'moveEnd']('character', textOffset)

	root.Selection = Selection =
		hasSelection: (win) ->
			win.focus()
			return false unless win.document.selection
			range = win.document.selection.createRange()
			return range && range.parentElement().document == win.document
			
		getStart: (win) ->
			win.focus()
			return null unless Selection.hasSelection(win)
			range = win.document.selection.createRange()
			return getBoundary(win.document, range, yes)
			
		getEnd: (win) ->
			win.focus()
			return null unless Selection.hasSelection(win)
			range = win.document.selection.createRange()
			return getBoundary(win.document, range, no)
		
		# TextRange has no forward or backward indicator;
		# just assume origin is start, focus end
		
		getOrigin: (win) -> Selection.getStart(win)
		getFocus: (win) -> Selection.getEnd(win)
			
		setSelection: (win, orgn, orgo, focn, foco) ->
			range = win.document.body.createTextRange()
			# intentionally [end, start] order
			moveBoundary(win.document, range, false, focn, foco)
			moveBoundary(win.document, range, true, orgn, orgo)
			range.select()

# Unsupported
# -----------

else
	throw new Exception('Browser has no selection support.')