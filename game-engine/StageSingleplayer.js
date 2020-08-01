const StageBase = require("./StageBase.js");

// A Stage for Singleplayer games. Logic for starting/finishing a game is different from a Multiplayer stage
// A Singleplayer game is also capable of having the player pause the game
module.exports = class StageSingleplayer extends StageBase {
    // TODO: Check if the constructor needs to be different
	constructor(gameId, players, numPlayers, endSingleplayerGame, generationSettings) {
		super(gameId, players, numPlayers, generationSettings);
		this.canvasHeight = 0; // TODO: get better initial values
		this.canvasWidth = 0;
		this.endSingleplayerGame = endSingleplayerGame;
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
		const humanPlayerIndex = 0;
		let humanPlayer = this.getPlayerWithIndex(humanPlayerIndex);
		if (humanPlayer) {
			return humanPlayer.getJSONRepresentation();
		}
		return null;
	}

	// Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 
	step() {
        // TODO: this
        // Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 

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

		// Check if any player actors died
		for (let i = 0; i < this.playerActors.length; i++) {
			// TODO: Implement this a bit better
			// TODO: Replace setPlayerStatus with endSingleplayerGame when the human has won or lost
            // Dead players get removed from the player actors list
			if (this.playerActors[i].isDead()) {
				// this.setPlayerStatus(this.playerActors[i].getPlayerID(), "Spectating");
				this.removeActor(this.playerActors[i]);
                // this.numAlive -= 1;
            }
            
			// Game ends (only one person is left)
			// NOTE: Set this value to be 0 for single player mode, and 1 for multiplayer mode. Setting the incorrect value will BUG OUT THE GAME!! (specifically the intervals in socket-server.js)
            if (this.numAlive <= 1) {
                this.gameHasEnded = true;
                
				let playerId = this.playerActors[0].getPlayerID();
				this.endSingleplayerGame(playerId, true);
            }
		}

		// Update elapsed time (in seconds)
		let currentTime = Math.round(new Date().getTime() / 1000);
		this.elapsedTime = Math.round(currentTime) - this.startTime;
	}
}