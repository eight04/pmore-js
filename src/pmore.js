var FrameSet = require("./frame.js");

function Pmore(frames, viewer) {
	var frameSet = FrameSet(frames);
	
	var timer, sync, include, current, pause, keep, input, waitInput, inputSelect;
	
	function syncTimeout(fn, delay) {
		if (!sync) {
			timer = setTimeout(fn, delay);
		} else {
			sync.base += delay;
			timer = setTimeout(fn, sync.base - Date.now());
		}
		return timer;
	}
	
	function startOldMode(line, delay) {
		// old mode: always scroll 22 lines down
		function next() {
			if (viewer.scrollToLine(line) !== false) {
				line += 22;
				syncTimeout(next, delay);
			}
		}
		next();
	}
	
	function execute(i) {
		current = i;
		
		var next;
		
		if (include && include.target == i) {
			next = include.back;
			include = null;
			execute(next);
			return;
		}

		var frame = frameSet.values[i],
			control = frame.control;
		
		if (!control.goto && !control.include) {
			// Don't show the frame if it is jump command
			viewer.scrollTo(frame);
		}
		
		if (control.end) {
			// end
			stop();
			return;
		}
		
		if (control.oldWait) {
			// old mode
			startOldMode(frame.line, control.oldWait);
			return;
		}
			
		if (control.sync) {
			// start syncing
			sync = {
				base: Date.now()
			};
		}
		
		if (control.keep) {
			// keep keys
			keep = control.keep;
		}
		
		if (control.pause) {
			pause = true;
			viewer.pause();
			
		} else if (control.goto) {
			var j = Math.floor(Math.random() * control.goto.length),
				cmd = control.goto[j];
			
			next = frameSet.resolve(i, cmd);
				
			syncTimeout(function(){
				execute(next);
			}, 0.1 * 1000);
			
		} else if (control.input) {
			input = control.input;
			if (control.input.options[0].message) {
				inputSelect = 0;
				viewer.inputStart(control.input.options);
				viewer.inputSelect(inputSelect);
			}
			// Input key will reset the timeout
			if (control.input.wait) {
				waitInput = syncTimeout(function(){
					viewer.inputEnd();
					input = null;
					waitInput = null;
					inputSelect = null;
					execute(i + 1);
				}, control.input.wait * 1000);
			}
			
		} else if (control.include) {
			include = {
				target: frameSet.resolve(i, control.include.end),
				back: i + 1
			};
			
			syncTimeout(function(){
				execute(control.include.start);
			}, 0.1 * 1000);
			
		} else {
			// nothing else, just simple ^Lx
			syncTimeout(function(){
				execute(i + 1);
			}, control.wait * 1000);
		}
	}
	
	function start() {
		execute(0);
	}
	
	function stop() {
		// cleanup everything
		clearTimeout(timer);
		timer = null;
		sync = null;
		include = null;
		current = null;
		viewer.unpause();
		pause = null;
		keep = null;
		viewer.inputEnd();
		input = null;
		clearTimeout(waitInput);
		waitInput = null;
		viewer.end();
	}
	
	function trigger(key) {
		if (key == "q") {
			viewer.forceEnd();
			stop();
			return;
		}
		
		if (pause) {
			pause = null;
			execute(current + 1);
			return;
		}
		
		if (input) {
			var i, cmd;
			for (i = 0; i < input.options.length; i++) {
				if (input[i].key == key || input[i].key == "@a") {
					cmd = input[i].cmd;
					break;
				}
			}
			if (cmd) {
				var next = frameSet.resolve(current, cmd);
				viewer.inputEnd();
				sync.base = Date.now();
				input = null;
				clearTimeout(waitInput);
				waitInput = null;
				inputSelect = null;
				execute(next);
				return;
			}
			
			// handle menu option select
			if (inputSelect != null) {
				if (key == "@l") {
					inputSelect--;
					if (inputSelect < 0) {
						inputSelect = 0;
					}
					viewer.inputSelect(inputSelect);
				} else if (key == "@r") {
					inputSelect++;
					if (inputSelect >= input.options.length) {
						inputSelect = input.options.length - 1;
					}
					viewer.inputSelect(inputSelect);
				}
			}
		}
		
		
		if (!input && (!keep || !keep["@a"] && !keep[key])) {
			viewer.forceEnd();
			stop();
		}
	}
	
	return {
		start: start,
		stop: stop,
		trigger: trigger
	};
}

module.exports = Pmore;