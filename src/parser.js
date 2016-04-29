function cmd(cmd) {
	var match = cmd.match(/:([^:]+):|([fpl])(([+-]?)\d+)/),
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
			relative: match[4],
			number: +match[3]
		};
	}
}

function goto(s) {
	return s.substring(1).split(",").map(cmd);
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

function input(s) {
	var re = /#([^#,]{0,2}),([^#,]+)(?:,([^#]*))?|#([\d.]+)|#/g,
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
				cmd: cmd(match[2]),
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

function keep(s) {
	s = s.substring(2, s.length - 1);
	var keys = s.match(/@?./g),
		i,
		result = {};
	for (i = 0; i < keys.length; i++) {
		result[keys[i]] = true;
	}
	return result;
}

function control(s, defaultWait) {
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
				result.goto = goto(match[0]);
				break;
			case "#":
				result.input = input(match[0]);
				break;
			case "K":
				result.keep = keep(match[0]);
				break;
			case ":":
				result.name = match[0].substring(1, match[0].length - 1);
				break;
			case "I":
				result.include = {
					start: cmd(match[2]),
					end: cmd(match[3])
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

module.exports = {
	cmd: cmd,
	goto: goto,
	input: input,
	keep: keep,
	control: control
};
