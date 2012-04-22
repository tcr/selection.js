selection.js
============

A simple (4kb) library for manipulating cursor selections across all browsers:

* Modern browsers, using DOM Selection/Ranges
* IE5—8, using TextRanges

This library adds a `window.Selection` object with static methods for retrieving,
setting, and clearing a user selection. By manipulating the DOM, you can replicate
most DOM Range functionality (like extract/clone/deleteContents, etc.) or just
implement what your application actually needs.

### Usage

Include "selection.js" in your project. The global `window.Selection` object is
has the following static methods. As a shorthand, `new Selection(window)` instantiates
an object with the same methods, but the `window` argument is no longer necessary.

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

### License

Released under the MIT license.