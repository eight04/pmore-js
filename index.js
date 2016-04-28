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

function parseStatements(ss) {
	var result = [], i, s,
		re = /[\d.]+|P|E|S|O=([\d.]+)|G.+|#(?:[^#]+#)+|K#[^#]+#|:[^:]+:|I(:[^:]+:|[fpl][+-]?\d+),(:[^:]+:|[fpl][+-]?\d+)/g,
		match, wait = 1, control;
	
	for (i = 0; i < ss.length; i++) {
		s = ss[i].replace(/^(==)?\^L/, "");
		control = {
			id: i + 1,
			wait: wait,
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
					control.pause = true;
					break;
				case "E":
					control.end = true;
					break;
				case "S":
					control.sync = true;
					break;
				case "O":
					control.oldWait = +match[1];
					if (control.oldWait < 0.1) {
						control.oldWait = 0.1;
					}
					break;
				case "G":
					control.goto = parseGoto(match[0]);
					break;
				case "#":
					control.input = parseInput(match[0]);
					break;
				case "K":
					control.keep = parseKeep(match[0]);
					break;
				case ":":
					control.name = match[0].substring(1, match[0].length - 1);
					break;
				case "I":
					control.include = {
						start: parseCmd(match[2]),
						end: parseCmd(match[3])
					};
					break;
				default:
					wait = +match[0];
					if (wait < 0.1) {
						wait = 0.1;
					}
			}
		}
		control.wait = wait;
		result.push(control);
	}
	
	return result;
}

function createAnimate(statements, viewer) {
	statements = parseStatements(statements);
	
	// Start the animation
	function start() {}
	
	// Stop the animation
	function stop() {}
	
	/**
	 *  @param {string} key A character or two characters with "@" prefix. If 
	 *  it starts with "@", it represents a special key as follow:
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
	function trigger(key) {
		
	}
	
	return {
		start: start,
		stop: stop,
		trigger: trigger
	};	
}

module.exports = createAnimate;
