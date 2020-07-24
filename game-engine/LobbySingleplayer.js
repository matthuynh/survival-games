// Import the SingleplayerGame (this allows the server access to the game)
const SingleplayerGame = require("./GameSingleplayer.js");
const LobbyBase = require("./LobbyBase.js");

// A singleplayer lobby contains a single human player and can intiialize a singleplayer game
module.exports = class LobbySingleplayer extends LobbyBase {
	constructor(lobbyId, lobbyOwnerId, ws, wss) {
        super(lobbyId, lobbyOwnerId, ws, wss);

		this.maxLobbySize = 1;

        // TODO: Everything below here needs to be updated to work in a singleplayer lobby
		this.singleplayerGame = null;
		this.singleplayerGameInterval = null;
		this.gameWinner = null;
    }
    
    // Return information about this lobby in a format readable by the client
	getLobbyJSON() {
		return {
			id: this.lobbyId,
			lobbyOwner: this.lobbyOwnerId,
			lobbyPlayers: this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status })),
			gameInProgress: this.gameInProgress,
			numPlayers: this.lobbyPlayers.length,
			maxLobbySize: this.maxLobbySize
		};
	}

    // Send updates to a server from a client's controller
	updateGameState(clientUpdate) {
		if (this.gameInProgress) {
			this.singleplayerGame.updateState(clientUpdate);
		}
	}
	
	// Ends the singleplayer game in this lobby
	endGame(gameWinner) {
		clearInterval(this.singleplayerGamenterval); // clearInterval is a library function
		this.singleplayerGame = null;
		this.gameWinner = gameWinner;
		this.gameInProgress = false;
		this.gameHasEnded = true;
	}

	// When a singleplayer game finishes, the lobby is "reinitialized"
	reinitializeLobby() {
		this.gameInProgress = false;
		this.singleplayerGame = null;
		this.singleplayerGameInterval = null;
		// this.wss = wss; // TODO: Check to see if this is necessary
		this.gameHasEnded = false;

		// Send update to all clients, telling those who are connected
		// to this lobby to clear their own model instance
		let updatedState = JSON.stringify({
			type: "stage-termination",
			lobbyID: this.lobbyId,
			winningPID: this.gameWinner,
			isForced: false
		});

		this.gameWinner = null;
		this.wss.broadcastToLobby(updatedState, this.lobbyId);
	}

	// A player leaves the currently ongoing singleplayer game in the lobby
	leaveGame(playerId, reason) {
		let playerIndex = this.lobbyPlayers.findIndex(player => player.pid == playerId);

		if (playerIndex > -1) {
			this.lobbyPlayers[playerIndex].status = "In Lobby";
			if (this.gameInProgress) {
				this.singleplayerGame.setPlayerDead(playerId, reason);
			}
			return true;
		}
		return false;
    }
    
	forceStageTermination() {
		// TODO: This version of the method will slightly differ from LobbyMultiplayer's
    }
    
	initializeGame() {
        // TODO: this
    }
}