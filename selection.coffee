########################################################################
# Cross-Browser Selection Utilities
# Provides a 'selection' object whose API support all modern browsers
# (using window.getSelection()) as well as <= IE8 (using TextRanges)
########################################################################

if this.getSelection
	# DOMSelection
	
	this.selection =
		hasSelection: (win) ->
			return (sel = win.getSelection()) and sel.focusNode? and sel.anchorNode?
		
		getOrigin: (win) ->
			return null unless (sel = win.getSelection()) and sel.anchorNode?
			return [sel.anchorNode, sel.anchorOffset]
			
		getFocus: (win) ->
			return null unless (sel = win.getSelection()) and sel.focusNode?
			return [sel.focusNode, sel.focusOffset]
			
		getStart: (win) ->
			return null unless util.selection.hasSelection(win)
			[n1, o1] = util.selection.getOrigin(win)
			[n2, o2] = util.selection.getFocus(win)
			if util.dom.isPreceding(n1, n2) or (n1 == n2 and o1 < o2)
				return [n1, o1]
			return [n2, o2]
			
		getEnd: (win) ->
			return null unless util.selection.hasSelection(win)
			[n1, o1] = util.selection.getOrigin(win)
			[n2, o2] = util.selection.getFocus(win)
			if util.dom.isPreceding(n1, n2) or (n1 == n2 and o1 < o2)
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

else if this.document.selection
	# <= IE8
	
	(->	
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
				offset = util.dom.getChildIndex(cursorNode)
				
			cursorNode.parentNode.removeChild(cursorNode)
			return [node, offset]

		moveBoundary = (doc, textRange, bStart, node, offset) ->
			# find anchor node and offset
			textOffset = 0
			anchorNode = if util.dom.isText(node) then node else node.childNodes[offset]
			anchorParent = if util.dom.isText(node) then node.parentNode else node
			# visible data nodes need a text offset
			if util.dom.isText(node)
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
	
		this.selection =
			hasSelection: (win) ->
				win.focus()
				return false unless win.document.selection
				range = win.document.selection.createRange()
				return range && range.parentElement().document == win.document
				
			getStart: (win) ->
				win.focus()
				return null unless util.selection.hasSelection(win)
				range = win.document.selection.createRange()
				return getBoundary(win.document, range, yes)
				
			getEnd: (win) ->
				win.focus()
				return null unless util.selection.hasSelection(win)
				range = win.document.selection.createRange()
				return getBoundary(win.document, range, no)
			
			# TextRange has no forward or backward indicator;
			# just assume origin is start, focus end
			
			getOrigin: (win) -> util.selection.getStart(win)
			getFocus: (win) -> util.selection.getEnd(win)
				
			setSelection: (win, orgn, orgo, focn, foco) ->
				range = win.document.body.createTextRange()
				# intentionally [end, start] order
				moveBoundary(win.document, range, false, focn, foco)
				moveBoundary(win.document, range, true, orgn, orgo)
				range.select()
	)()

else
	# not supported
	throw new Exception('Browser not supported: no selection support.')