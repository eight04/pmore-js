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
	var i, wait = 1;
	
	for (i = 0; i < frames.length; i++) {
		frames[i].control = parseControl(frames[i].control, wait);
		wait = frames[i].control.wait;
	}
	
	function start() {}
	
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
