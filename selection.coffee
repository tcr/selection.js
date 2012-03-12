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

	contains: (n1, n2) ->
		if n1.compareDocumentPosition? then n1.compareDocumentPosition(n2) & 16
		else n1.contains?(n2)

	isCursorPreceding: (n1, o1, n2, o2) ->
		if n1 == n2 then return o1 <= o2 
		if Dom.isText(n1) and Dom.isText(n2) then return Dom.isPreceding(n1, n2)
		if Dom.isText(n1) and not Dom.isText(n2) then return !Dom.isCursorPreceding(n2, o2, n1, o1)
		unless Dom.contains(n1, n2) then return Dom.isPreceding(n1, n2) 
		if n1.childNodes.length <= o1 then return false
		if n1.childNodes[o1] == n2 then return 0 <= o2 
		return Dom.isPreceding n1.childNodes[o1], n2

	isText: (d) -> d?.nodeType == 3

	getChildIndex: (e) ->
		k = 0
		k++ while e = e.previousSibling
		return k

# DOMSelection
# ------------

root.Selection = class Selection
	constructor: (@win) ->
	hasSelection: -> Selection.hasSelection(@win)
	getOrigin: -> Selection.getOrigin(@win)
	getFocus: -> Selection.getFocus(@win)
	getStart: -> Selection.getStart(@win)
	getEnd: -> Selection.getEnd(@win)
	setSelection: (args...) -> Selection.setSelection(@win, args...)
	clearSelection: -> Selection.clearSelection(@win)

if root.getSelection
	Selection.supported = true

	Selection.hasSelection = (win) ->
		return (sel = win.getSelection()) and sel.focusNode? and sel.anchorNode?
		
	Selection.getOrigin = (win) ->
		return null unless (sel = win.getSelection()) and sel.anchorNode?
		return [sel.anchorNode, sel.anchorOffset]
			
	Selection.getFocus = (win) ->
		return null unless (sel = win.getSelection()) and sel.focusNode?
		return [sel.focusNode, sel.focusOffset]
			
	Selection.getStart = (win) ->
		return null unless Selection.hasSelection(win)
		[n1, o1] = Selection.getOrigin(win)
		[n2, o2] = Selection.getFocus(win)
		if Dom.isCursorPreceding(n1, o1, n2, o2)
			return [n1, o1]
		return [n2, o2]
		
	Selection.getEnd = (win) ->
		return null unless Selection.hasSelection(win)
		[n1, o1] = Selection.getOrigin(win)
		[n2, o2] = Selection.getFocus(win)
		if Dom.isCursorPreceding(n1, o1, n2, o2)
			return [n2, o2]
		return [n1, o1]

	Selection.setSelection = (win, orgn, orgo, focn = orgn, foco = orgo) ->
		return unless (sel = win.getSelection())?
		# .collapse() and .extend() required for directionality and drag preservation.
		if sel.collapse? and sel.extend?
			sel.collapse orgn, orgo
			sel.extend focn, foco
		# IE9, etc.
		else
			r = win.document.createRange()
			r.setStart orgn, orgo
			r.setEnd focn, foco
			try 
				sel.removeAllRanges()
			catch e
				# IE9 throws error sometimes
			sel.addRange(r)
	
	Selection.clearSelection = (win) ->
		try 
			win.getSelection()?.removeAllRanges()
		catch e
			# IE9 throws error sometimes

# TextRanges (<= IE8)
# -------------------

else if root.document.selection
	getBoundary = (doc, textRange, bStart) ->
		# We can get the "parentElement" of a cursor (an endpoint of a TextRange).
		# Create an anchor (throwaway) element and move it from the end of the element
		# progressively backward until the text range of the anchor's contents
		# meets or exceeds our original cursor.
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

		# When we exceed or meet the cursor, we've found the node our cursor is
		# anchored on.
		if cursor.compareEndPoints((if bStart then 'StartToStart' else 'StartToEnd'), textRange) == -1 and cursorNode.nextSibling
			# This node can be a text node...
			cursor.setEndPoint((if bStart then 'EndToStart' else 'EndToEnd'), textRange);
			node = cursorNode.nextSibling
			offset = cursor.text.length
		else
			# Or an element.
			node = cursorNode.parentNode
			offset = Dom.getChildIndex(cursorNode)
		
		# Remove our dummy node and return the anchor.
		cursorNode.parentNode.removeChild(cursorNode)
		return [node, offset]

	moveBoundary = (doc, textRange, bStart, node, offset) ->
		# Find the normalized node and parent of our anchor.
		textOffset = 0
		anchorNode = if Dom.isText(node) then node else node.childNodes[offset]
		anchorParent = if Dom.isText(node) then node.parentNode else node
		# Visible data nodes need an offset parameter.
		if Dom.isText(node)
			textOffset = offset

		# We create another dummy anchor element, insert it at the anchor,
		# and create a text range to select the contents of that node.
		# Then we remove the dummy.
		cursorNode = doc.createElement('a')
		anchorParent.insertBefore(cursorNode, anchorNode or null)
		cursor = doc.body.createTextRange()
		cursor.moveToElementText(cursorNode)
		cursorNode.parentNode.removeChild(cursorNode)
		# Update the passed-in range to this cursor.
		textRange.setEndPoint((if bStart then 'StartToStart' else 'EndToEnd'), cursor)
		textRange[if bStart then 'moveStart' else 'moveEnd']('character', textOffset)

	# Selection methods.

	Selection.supported = true

	Selection.hasSelection = (win) ->
		win.focus()
		return false unless win.document.selection
		range = win.document.selection.createRange()
		return range && range.parentElement().document == win.document
		
	Selection.getStart = (win) ->
		win.focus()
		return null unless Selection.hasSelection(win)
		range = win.document.selection.createRange()
		return getBoundary(win.document, range, yes)
		
	Selection.getEnd = (win) ->
		win.focus()
		return null unless Selection.hasSelection(win)
		range = win.document.selection.createRange()
		return getBoundary(win.document, range, no)
	
	# TextRange has no forward or backward indicator;
	# just assume origin is start, focus end
	
	Selection.getOrigin = (win) -> Selection.getStart(win)
	Selection.getFocus = (win) -> Selection.getEnd(win)
		
	Selection.setSelection = (win, orgn, orgo, focn = orgn, foco = orgo) ->
		range = win.document.body.createTextRange()
		# Intentionally do end, start order to fix selection bugs.
		moveBoundary(win.document, range, false, focn, foco)
		moveBoundary(win.document, range, true, orgn, orgo)
		range.select()
	
	Selection.clearSelection = (win) ->
		win.document.selection.empty()

# Unsupported
# -----------

else
	Selection.supported = false