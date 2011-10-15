# Cross-Browser Selection Utilities

This utility provides a window.Selection object with common API for 

* all modern browsers (using window.getSelection())      
* IE5—8 (using TextRanges)      

window.Selection is a static object with the following methods:

* _hasSelection(window)_ — Returns true if anything is currently
selected.                
* _getOrigin(window)_ — Returns an array \[anchorNode, anchorOffset\]
of the current selection's starting anchor (in IE, returns left anchor)                
* _getFocus(window)_ — Returns an array \[focusNode, focusOffset\]
of the current selection's focus anchor (in IE, returns right anchor)                
* _getStart(window)_ — Returns an array \[node, offset\] for the leftmost
anchor.                
* _getEnd(window)_ — Returns an array \[node, offset\] for the rightmost
anchor.                
* _setSelection(window, originNode, originOffset, focusNode, focusOffset)_ --
Sets the selection to include the new origin anchor and focus anchor
(in IE, origin will be leftmost anchor, focus rightmost)

Released under the MIT license. Copyright (c) 2010–2011 Tim Cameron Ryan.

