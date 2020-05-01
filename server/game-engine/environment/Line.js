// A Line class
module.exports = class Line {
	constructor(startingX, startingY, endingX, endingY, lineWidth, colour) {
		this.startingX = startingX;
		this.startingY = startingY;
		this.endingX = endingX;
		this.endingY = endingY;
		this.lineWidth = lineWidth;
		this.colour = colour;
	}

	// Take one "step" for animation
	step() {
    }
    
    // Return a JSON representation of this line
    getJSONRepresentation() {
        return {
            type: "LineEnv",
            lineStartingX: this.startingX,
            lineStartingY: this.startingY,
            lineEndingX: this.endingX,
            lineEndingY: this.endingY,
            lineColour: this.colour,
            lineWidth: this.lineWidth
        }
    }
}