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

function parseInput(s) {
	var re = /#([^#,]{0,2}),([^#,]+)(?:,([^#]*))?|#(\d+)|#/g,
		match,
		result = {
			wait: null,
			options: []
		};
	
	while (match = re.exec(s)) {
		if (match[2]) {
			result.options.push({
				key: match[1],
				cmd: parseCmd(match[2]),
				message: match[3]
			});
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
	return s.match(/@?./g);
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
	
	while (match = re.exec(s)) {
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

function createAnimate(frames, viewer) {
	var i, wait = 1, nameMap = {};
	
	for (i = 0; i < frames.length; i++) {
		frames[i].control = parseControl(frames[i].control, wait);
		wait = frames[i].control.wait;
		if (frames[i].control.name) {
			nameMap[frames[i].control.name] = i;
		}
	}
	
	var sync, include, current, pause, keep;
	
	function startOldMode(line, delay) {}
	
	function execute(i) {
		var frame = frames[i],
			control = frames[i].control;
		
		if (!control.goto && !control.include) {
			// Don't show the frame if it is jump command
			viewer.scrollTo(frame);
			current = i;
		}
		
		if (control.end) {
			// end
			viewer.end();
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
				base: Date.now(),
				elapse: 0
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
			i = Math.floor(Math.random() * control.goto.length);
			
			var cmd = control.goto[i],
				next;
				
			// find next frame
			if (cmd.type == "name") {
				next = nameMap[cmd.name];
			} else if (cmd.type == "frame") {
				// target frame is relate to current view
				if (cmd.relative) {
					next = current + cmd.number;
				} else {
					next = cmd.number;
				}
			} else if (cmd.type == "line") {
				// target line is relate to current ^L
				var targetLine;
				if (cmd.relative) {
					targetLine = frame.line + cmd.number;
				} else {
					targetLine = cmd.number;
				}
				for (i = 0; i < frames.length; i++) {
					if (frames[i].line >= targetLine) {
						next = i;
						break;
					}
				}
			} else if (cmd.type == "page") {
				/* It seems that this is how pmore works with pages:
				(not sure)
				
				0. A page has 23 lines.
				1. Find the page number of the line of the ^LG tag. (line // 23)
				2. + cmd.number.
				3. Find the ^L tag on target page
				*/
				var targetLine, pageSize = viewer.getPageSize();
				if (cmd.relative) {
					targetLine = (Math.floor(frame.line / pageSize) + cmd.number) * pageSize;
				} else {
					targetLine = cmd.number * pageSize;
				}
				for (i = 0; i < frames.length; i++) {
					if (frames[i].line >= targetLine) {
						next = i;
						break;
					}
				}
			}
			if (!sync) {
				setTimeout(function(){
					execute(next);
				}, control.wait * 1000);
			} else {
				sync.elapse += control.wait;
				setTimeout(function(){
					execute(next);
				}, sync.base + sync.elapse * 1000 - Date.now())
			}
		} else if (control.input) {
			
		}
	}
	
	function start() {
		execute(0);
	}
	
	function stop() {}
	
	function trigger(key) {
		
	}
	
	return {
		start: start,
		stop: stop,
		trigger: trigger
	};	
}

module.exports = createAnimate;
