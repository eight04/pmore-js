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

	var PMore = require("pmore");
	
	// You have to implement a viewer object to use pmore. See interface.js.
	var pmore = PMore(statements, myViewer);
	
	// Transfer key event to pmore
	window.addEventListener("keypress", function(event) {
		pmore.trigger(event.key);
	});
	
	// Start the animation
	pmore.start();

Changelog
---------

* 0.1.0 (Apr 27, 2016)

    - First release.
