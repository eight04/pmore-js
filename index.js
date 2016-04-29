function parseCmd(cmd) {
	var match = cmd.match(/:([^:]):|([fpl])([+-]?)(\d+)/),
		typeTable = {
			f: "frame",
			p: "page",
			l: "line"
		};
	
	if (match[1]) {
		return {
			type: "name",
			name: match[1]
		};
	} else {
		return {
			type: typeTable[match[2]],
			relative: match[3],
			number: +match[4]
		};
	}
}

function parseGoto(s) {
	return s.substring(1).split(",").map(parseCmd);
}

function getNextKey(key) {
	// are these keycode order?
	var arrowKeys = ["@u", "@d", "@r", "@l"],
		editKeys = ["@H", "@I", "@D", "@E", "@P", "@D"];
		
	if (key.length == 1) {
		if (key != "~") {
			return String.fromCharCode(key.charCodeAt(0) + 1);
		}
		return null;
	}
	
	var i = arrowKeys.indexOf(key);
	if (i >= 0) {
		if (i + 1 < arrowKeys.length) {
			return arrowKeys[i + 1];
		}
		return null;
	}
	
	i = editKeys.indexOf(key);
	if (i >= 0 && i + 1 < editKeys.length) {
		return editKeys[i + 1];
	}
	return null;
}
		
function parseInput(s) {
	var re = /#([^#,]{0,2}),([^#,]+)(?:,([^#]*))?|#(\d+)|#/g,
		match,
		result = {
			wait: null,
			options: []
		},
		defaultKey = "1";
	
	while (match = re.exec(s)) { // eslint-disable-line no-cond-assign
		if (match[2]) {
			var option = {
				key: match[1],
				cmd: parseCmd(match[2]),
				message: match[3]
			};
			if (!option.key && defaultKey) {
				option.key = defaultKey;
			}
			if (option.key) {
				defaultKey = getNextKey(option.key);
			}
			result.options.push(option);
		} else if (match[4]) {
			result.wait = +match[4];
			if (result.wait < 0.1) {
				result.wait = 0.1;
			}
		}
	}
	
	return result;
}

function parseKeep(s) {
	s = s.substring(2, s.length - 1);
	var keys = s.match(/@?./g),
		i,
		result = {};
	for (i = 0; i < keys.length; i++) {
		result[keys[i]] = true;
	}
	return result;
}

function parseControl(s, defaultWait) {
	s = s.replace(/^(==)?\^L/, "");
	
	var re = /[\d.]+|P|E|S|O=([\d.]+)|G.+|#(?:[^#]+#)+|K#[^#]+#|:[^:]+:|I(:[^:]+:|[fpl][+-]?\d+),(:[^:]+:|[fpl][+-]?\d+)/g,
		match,
		result = {
			wait: defaultWait,
			pause: false,
			end: false,
			sync: false,
			oldWait: false,
			goto: null,
			input: null,
			keep: null,
			name: null,
			include: null
		};	
	
	while (match = re.exec(s)) { // eslint-disable-line no-cond-assign
		switch (match[0][0]) {
			case "P":
				result.pause = true;
				break;
			case "E":
				result.end = true;
				break;
			case "S":
				result.sync = true;
				break;
			case "O":
				result.oldWait = +match[1];
				if (result.oldWait < 0.1) {
					result.oldWait = 0.1;
				}
				break;
			case "G":
				result.goto = parseGoto(match[0]);
				break;
			case "#":
				result.input = parseInput(match[0]);
				break;
			case "K":
				result.keep = parseKeep(match[0]);
				break;
			case ":":
				result.name = match[0].substring(1, match[0].length - 1);
				break;
			case "I":
				result.include = {
					start: parseCmd(match[2]),
					end: parseCmd(match[3])
				};
				break;
			default:
				result.wait = +match[0];
				if (result.wait < 0.1) {
					result.wait = 0.1;
				}
		}
	}
	
	return result;
}

function FrameSet(values, viewer) {
	var i, wait = 1, nameMap = {};
	
	for (i = 0; i < values.length; i++) {
		values[i].control = parseControl(values[i].control, wait);
		wait = values[i].control.wait;
		if (values[i].control.name) {
			nameMap[values[i].control.name] = i;
		}
	}
	
	function resolve(i, cmd) {
		// find next frame
		if (cmd.type == "name") {
			return nameMap[cmd.name];
		}

		if (cmd.type == "frame") {
			// it is confusing when negative
			if (!cmd.relative) {
				return cmd.number - 1;	// frame number starts with 1
			}
			if (cmd.number < 0) {
				return i + cmd.number - 1;	// why? no idea
			}
			return i + cmd.number;
		}
		
		var targetLine, j;
		if (cmd.type == "line") {
			if (cmd.relative) {
				targetLine = values[i].line + cmd.number;
			} else {
				targetLine = cmd.number - 1;	// line number starts with 1
			}
		} else {
			/* It seems that this is how pmore works with pages:
			(not sure)
			
			0. A page has 23 lines.
			1. Find the page number of the line of the ^LG tag. (line // 23)
			2. + cmd.number.
			3. Find the ^L tag on target page
			*/
			var pageSize = viewer.getPageSize();
			if (cmd.relative) {
				targetLine = (Math.floor(values[i].line / pageSize) + cmd.number) * pageSize;
			} else {
				targetLine = (cmd.number - 1) * pageSize;	// page number starts with 1
			}
		}
		for (j = 0; j < values.length; j++) {
			if (values[j].line >= targetLine) {
				return j;
			}
		}
		// not found
		return null;
	}
	
	return {
		values: values,
		resolve: resolve
	};
}

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
