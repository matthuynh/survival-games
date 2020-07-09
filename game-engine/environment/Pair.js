// Represents a pair of (x,y)
module.exports = class Pair {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	// Returns a string representation of this pair
	toString() {
		return "(" + this.x + "," + this.y + ")";
	}

	normalize() {
		let magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
		this.x = this.x / magnitude;
		this.y = this.y / magnitude;
	}
}