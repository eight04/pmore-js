var parser = require("./parser");

function FrameSet(values, viewer) {
	var i, wait = 1, nameMap = {};
	
	for (i = 0; i < values.length; i++) {
		values[i].control = parser.control(values[i].control, wait);
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

module.exports = FrameSet;
