var Viewer = {
	/**
	 *  Scroll to specified position.
	 *  
	 *  @param {string} type "frame", "line", or "page".
	 *  @param {int} number The offset or the index of destination.
	 *  @param {bool} relative If true, use number as offset from current 
	 *  position.
	 */
	goto: function(type, number, relative) {},
	
	/**
	 *  Display the pause message.
	 */
	pause: function() {},
	
	/**
	 *  Remove the pause message.
	 */
	unpause: function() {},
	
	/**
	 *  Stop the viewer.
	 */
	end: function() {},
	
	/**
	 *  Display input message.
	 *  
	 *  @param {array} options A list of InputOption.
	 */
	inputStart: function(options) {},
	
	/**
	 *  Remove input message.
	 */
	inputEnd: function() {},
	
	/**
	 *  Select the InputOption according to index.
	 *  
	 *  @param {int} index The index of InputOption.
	 */
	inputSelect: function(index) {}
};
	
var InputOption = {
	/**
	 *  {string} `key` is a character or a character with "@" prefix. If it
	 *  starts with "@", it represents a special key as follow:
	 *  (case-sensitive)
	 *  
	 *  -  @u UP
	 *  -  @d DOWN
	 *  -  @l LEFT
	 *  -  @r RIGHT
	 *  -  @b BACKSPACE
	 *  -  @H HOME
	 *  -  @E END
	 *  -  @P PAGEUP
	 *  -  @N PAGEDOWN
	 *  -  @I INSERT
	 *  -  @D DELETE
	 *  -  @a ANY KEY
	 */
	key: "",
	
	/**
	 *  {string} The message of the InputOption.
	 */
	message: ""
};