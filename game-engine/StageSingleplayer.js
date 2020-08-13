const StageBase = require("./StageBase.js");

// A Stage for Singleplayer games. Logic for starting/finishing a game is different from a Multiplayer stage
// A Singleplayer game is also capable of having the player pause the game
module.exports = class StageSingleplayer extends StageBase {
	constructor(gameId, players, numPlayers, endSingleplayerGame, generationSettings) {
		super(gameId, players, numPlayers, generationSettings);
		this.endSingleplayerGame = endSingleplayerGame;
		this.calledEndSingleplayerGame = false; // eh.. we need this because of the timeout I set in LobbySingleplayer#endGame... the step() for loop would repeatedly call endSingleplayerGame during this timeout period
		this.humanPlayerAlive = true;
	}

	// Keeps the human player's canvas width and canvas height for bots to make appropriate calculations
	setCanvasDimensions(canvasWidth, canvasHeight) {
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
	}

	getCanvasWidth() {
		return this.canvasWidth;
	}

	getCanvasHeight() {
		return this.canvasHeight;
	}

	// Return JSON representation of the human player in this game
	getHumanPlayer() {
		if (this.humanPlayerAlive) {
			const humanPlayerIndex = 0;
			let humanPlayer = this.getPlayerWithIndex(humanPlayerIndex);
			if (humanPlayer) {
				return humanPlayer.getJSONRepresentation();
			}
		}
		return null;
	}

	// Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 
	step() {
		// Take a step for each player actor
		for (let i = 0; i < this.playerActors.length; i++) {
			// console.log(`Actors list: ${this.environmentActors}`);
			this.playerActors[i].step();
		}
		// Take a step for each bullet actor, passing in the stage for the bullets to be able to access
		for (let i = 0; i < this.bulletActors.length; i++) {
			this.bulletActors[i].step(this);
		}
		// Take a step for each crate actor
		for (let i = 0; i < this.crateActors.length; i++) {
			this.crateActors[i].step();
		}
		// Take a step for each environment actor
		for (let i = 0; i < this.environmentActors.length; i++) {
			this.environmentActors[i].step();
		}

		// Check if any player actors died. Don't check if we are waiting for the game to end
		if (!this.calledEndSingleplayerGame) {
			for (let i = 0; i < this.playerActors.length; i++) {
				// Dead players get removed from the player actors list
				if (this.playerActors[i].isDead()) {
					// If the human player died, end the game
					if (this.playerActors[i].playerType === "Human") {
						this.gameHasEnded = true;
						this.winningPID = -1; // indicates the bots have won
						this.removeActor(this.playerActors[i]);
						this.numAlive -= 1;
						this.humanPlayerAlive = false;
						this.endSingleplayerGame(-1, false);
						this.calledEndSingleplayerGame = true;
					} else {
						this.removeActor(this.playerActors[i]);
						this.numAlive -= 1;
					}
				}
				
				// Game ends (only one person is left)
				if (this.numAlive <= 1) {
					this.gameHasEnded = true;
					this.winningPID = this.playerActors[0].getPlayerID();
					this.endSingleplayerGame(this.winningPID, this.winningPID);
					this.calledEndSingleplayerGame = true;
				}
			}
		}

		// Update elapsed time (in seconds)
		let currentTime = Math.round(new Date().getTime() / 1000);
		this.elapsedTime = Math.round(currentTime) - this.startTime;
	}
}