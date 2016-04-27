function parseGoto(s) {}

function parseInput(s) {}

function parseKeep(s) {}

function parseStatements(ss) {
	var result = [], i, s,
		re = /[\d.]+|P|E|S|O=([\d.]+)|G.+|#(?:[^#]+#)+|K#[^#]+#|:[^:]+:/g,
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
			name: null
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
	var animate = {
		start: start,
		end: end,
		input: input
	};
	
	statements = parseStatements(statements);
	
	
}

module.exports = createAnimate;
