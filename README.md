Cross-Browser Selection Utilities
=================================

This utility provides a window.Selection object with common API for 

* all modern browsers (using window.getSelection())      
* IE5—8 (using TextRanges)

All modern browsers support window.getSelection(), with the notable exception
of previous versions of Internet Explorer. DOM Selections are still a working
standard. IE exposes its selection interface through TextRanges, which operate
on text characters rather than DOM nodes.

This is a simple API to find middle ground between current browsers. A new
window.Selection object is created that operates on nodes and offsets (like 
DOMRange anchors). By manipulating the DOM you can add support for most Range
functionality (extract/clone/deleteContents, etc.) or just implement what
you need.

Released under the MIT license.

### API

Include "selection.js" in your project. The global "Selection" object is a collection of static methods. It can also be instantiated as an object `new Selection(window)` with the same methods as below but no `window` argument necessary.

* __Selection.supported__ -- This property is `true` if the browser supports the Selection object.
* __Selection.hasSelection(__*window*__)__ -- Returns true if anything is currently
  selected.                
* __Selection.getOrigin(__*window*__)__ -- Returns an array \[anchorNode, anchorOffset\]
  of the current selection's starting anchor (in IE, returns leftmost anchor)                
* __Selection.getFocus(__*window*__)__ -- Returns an array \[focusNode, focusOffset\]
  of the current selection's focus anchor (in IE, returns rightmost anchor)                
* __Selection.getStart(__*window*__)__ -- Returns an array \[node, offset\] for the leftmost
  anchor.                
* __Selection.getEnd(__*window*__)__ -- Returns an array \[node, offset\] for the rightmost
  anchor.                
* __Selection.setSelection(__*window, originNode, originOffset, focusNode, focusOffset*__)__
  -- Sets the selection to include the new origin anchor and focus anchor
  (in IE, origin will be leftmost anchor, focus rightmost)
* __Selection.clearSelection(__*window*__)__ -- Deselects all content.
