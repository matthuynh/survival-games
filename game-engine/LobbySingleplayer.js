// Import the SingleplayerGame (this allows the server access to the game)
const SingleplayerGame = require("./GameSingleplayer.js");
const LobbyBase = require("./LobbyBase.js");

// A singleplayer lobby contains a single human player and can intiialize a singleplayer game
module.exports = class LobbySingleplayer extends LobbyBase {
	constructor(lobbyId, lobbyOwnerId, ws, wss) {
        super(lobbyId, lobbyOwnerId, ws, wss);
        this.maxLobbySize = 1;
        this.ws = ws;

        // Default generation settings for a singleplayer game
        this.generationSettings = {
			numBushes: 10,
			numCrates: 5,
			numHPPots: 5,
			numAmmo: 10,
			numSpeedBoost: 1,
			numRDS: 0,
			numSmallGun: 1,
			numBigGun: 1,
			stageWidth: 2000,
			stageHeight: 2000
		};

		this.singleplayerGame = null;
		this.singleplayerGameInterval = null;
		this.gameWinner = null;
    }
    
    // Return information about this lobby in a format readable by the client
	getLobbyJSON() {
		return {
			id: this.lobbyId,
			lobbyOwner: this.lobbyOwnerId,
			lobbyPlayers: this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status, type: player.type })),
			gameInProgress: this.gameInProgress,
			numPlayers: this.lobbyPlayers.length,
			maxLobbySize: this.maxLobbySize
		};
	}

    // Send updates to a server from the client's controller
	updateGameState(clientUpdate) {
		if (this.gameInProgress) {
			this.singleplayerGame.updateState(clientUpdate);
		}
	}
	
	// Ends the singleplayer game in this lobby
	endGame(gameWinner) {
		console.log("endGame() called!");

		// clearInterval(this.singleplayerGameInterval); // clearInterval is a library function
		this.singleplayerGame = null;
		this.gameWinner = gameWinner;
		this.gameInProgress = false;
		this.gameHasEnded = true;

		this.reinitializeLobby();
	}
	
	// Player leaves the singleplayer game. This is called from socket-server, and is triggered only when the user clicks on "Leave game" in the game menu
	leaveGame(playerId, reason) {
		const playerIndex = 0; // there will always only be 1 human player
		this.lobbyPlayers[playerIndex].status = "In Lobby";
		
		// This is if the user chose to leave the ongoing game via the game menu
		this.endGame("");		
		this.reinitializeLobby();
	}

	// When a singleplayer game finishes, the lobby is "reinitialized"
	reinitializeLobby() {
		let updatedState = JSON.stringify({
			type: "stage-termination",
			lobbyID: this.lobbyId,
			winningPID: this.gameWinner,
			isForced: false
		});
		
		clearInterval(this.singleplayerGameInterval);
		this.gameInProgress = false;
		this.singleplayerGame = null;
		this.gameHasEnded = false;
        this.gameWinner = null;
		
		this.ws.send(updatedState);
	}


	forceStageTermination() {
		
    }

	// Initialize a new singleplayer game. The game will run on an interval until the game finishes (user wins/loses or quits)
	initializeGame() {
        this.gameInProgress = true;
		this.lobbyPlayers.forEach((player) => {
			player.status = "In Game";
			player.type = "Human";
		})


		// TODO: Get these from front-end instead
		this.generationSettings.numberEasyBots = 1;
		this.generationSettings.numberMediumBots = 1;
		this.generationSettings.numberHardBots = 1;

		// Initialize bot players here
		if (this.generationSettings && this.generationSettings.numberEasyBots) {
			for (let i = 0; i < this.generationSettings.numberEasyBots; i++) {
				this.lobbyPlayers.push({
					pid: `EasyBot${i}`,
					status: "Bot",
					type: "EasyBot"
				})
			}
		}
		if (this.generationSettings && this.generationSettings.numberMediumBots) {
			for (let i = 0; i < this.generationSettings.numberMediumBots; i++) {
				this.lobbyPlayers.push({
					pid: `MediumBot${i}`,
					status: "Bot",
					type: "MediumBot"
				})
			}
		}
		if (this.generationSettings && this.generationSettings.numberHardBots) {
			for (let i = 0; i < this.generationSettings.numberHardBots; i++) {
				this.lobbyPlayers.push({
					pid: `HardBot${i}`,
					status: "Bot",
					type: "HardBot"
				})
			}
		}

		// NOTE: We pass in an anonymous function so that it can be called by ./game-engine/StageSingleplayer.js and access the 'this' keyword to refer to this Lobby instance
		this.singleplayerGame = new SingleplayerGame(
			this.ws,
			this.wss,
			this.lobbyId,
            this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status, type: player.type })),
            this.generationSettings,
			(playerId, playerWon) => {
				// function "name" is endSingleplayerGame
				console.log("endSingleplayerGame() in LobbySingleplayer called");

				let gameWinner = this.singleplayerGame.getGameWinner();
                let index = this.lobbyPlayers.findIndex(player => player.pid == playerId);
				this.lobbyPlayers[index].status = "In Lobby";
				this.endGame(gameWinner);
			}
		);

		try {
			// Run the multiplayer game on an interval
			this.singleplayerGameInterval = setInterval(async () => {
				// console.log("[GAME STATUS] SENDING UPDATES TO PLAYERS");
				if (this.singleplayerGame && !this.singleplayerGame.gameHasEnded) {
					(this.singleplayerGame && this.singleplayerGame.calculateUpdates());
					(this.singleplayerGame && this.singleplayerGame.sendPlayerUpdates(this.wss));
				}

				// Check to see if the game has ended (only 1 player remaining)
				// TODO: There is probably a better way to trigger endGame() when a player wins.... pass in a callback to MultiplayerGame, like with initializeGame?
				// let gameWinner = this.singleplayerGame.getGameWinner();
				// if (gameWinner) {
				// 	this.endGame(gameWinner);
				// }
			}, 20);
		} catch (e) {
			console.log(`[WSS WARNING] ${e}`);
		}

		// Return initial game state
		let initialState = this.singleplayerGame.getInitialState();
		// console.log(initialState);
		return initialState;
    }
    
    getLobbyType() {
        return "singleplayer";
    }
}