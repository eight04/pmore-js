Pmore-js
========

A BBS Pmore system written in JavaScript.

Features
--------

* Parse pmore statements and run it.

Install
-------

	npm install --save pmore
	
Usage
-----

```js
var Pmore = require("pmore");

// A list of frames and the viewer service. See follow.
var pmore = Pmore(frames, myViewer);

// Transfer key event to pmore
window.addEventListener("keypress", function(event) {
	var key = event.key;
	// Map special key into "@x" form. See `inputOption.key` in `viewer.inputStart`
	if (key in specialMap) {
		key = specialMap[key];;
	}
	pmore.trigger(key);
});

// Start the animation
pmore.start();
```
	
### Frame

```js
var frame = {
	line: 0,	// The line number of the ^L tag.
	control: "^L..."	// ^L definition. This will be parsed into a control
						// object after sending to pmore
};
```
	
### Viewer

Viewer is a service used by pmore. Implement it with following interface:

```js
var viewer = {
	
	scrollTo: function(frame) {
		/* Scroll to the frame.
		
		The viewer should show the next line of ^L tag, i.e. the 
		`frame.line + 1` line.
		*/
	},
	
	scrollToLine: function(line) {
		/* Scroll to specified line. Return false when out of index */
	},
	
	getPageSize: function() {
		/* Return how many lines in one page. Integer. */
	}
	
	pause: function() {
		/* Display the pause message */
	},
	
	unpause: function() {
		/* Remove the pause message */
	},
	
	forceEnd: function() {
		/* This will be called when pmore is forced ended.

		That is, q key or any key that is not kept.
		*/
	}
	
	end: function() {
		/* This will be called when pmore stopped.

		It could be stopped by the user (after forceEnd) or met the ^LE tag.
		*/
	},
	
	inputStart: function(options) {
		/* Display a menu showing input options.
		
		`options` is a list of option object.
		
		The option object contains a `key` property and a `message` property.
		
		`option.key` is a printable character, or a 2 length string starting
		with "@". If it starts with "@", it represents a special key as follow:
		(case-sensitive)
		
		- @u UP
		- @d DOWN
		- @l LEFT
		- @r RIGHT
		- @b BACKSPACE
		- @H HOME
		- @E END
		- @P PAGEUP
		- @N PAGEDOWN
		- @I INSERT
		- @D DELETE
		- @a ANY KEY
		
		`option.key` is used to describe which key can trigger the function.
		
		`option.message` is the describtion of the option. String.
		*/
	},
	
	inputEnd: function() {
		/* Remove input menu */
	},
	
	inputSelect: function(i) {
		/* Select an option with index `i`.

		It is common to highlight the option.
		*/
	}
};
```

References
----------

The implemention follows:

* https://www.ptt.cc/bbs/BBSmovie/M.1197169523.A.F75.html
* https://www.ptt.cc/bbs/BBSmovie/M.1243129226.A.25D.html

Changelog
---------

* 0.1.0 (Apr 27, 2016)

    - First release.
