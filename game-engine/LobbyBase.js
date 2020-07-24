// A base Lobby class that is extended by a singleplayer and multiplayer lobby
module.exports = class LobbyBase {
	constructor(lobbyId, lobbyOwnerId, ws, wss) {
		this.lobbyId = lobbyId;
		this.lobbyOwnerId = lobbyOwnerId;
		// possible statuses: "In Lobby", "In Game", "Winner!", "Spectating"
        this.lobbyPlayers = [{ pid: lobbyOwnerId, socket: ws, status: "In Lobby" }];
        
        this.gameInProgress = false;
		this.gameHasEnded = false;

		// Reference to web server socket
		this.wss = wss;
    }

	// Get the id of this lobby
	getLobbyId() {
		return this.lobbyId;
	}

    // Get id of lobby owner
	getLobbyOwnerId() {
		return this.lobbyOwnerId;
	}	

	// Return true if the game is in progress
	isGameInProgress() {
		return this.gameInProgress;
	}

	// Return true if the game has ended
	hasGameEnded() {
		return this.gameHasEnded;
    }
    
	// Return true if the lobby is full
	isFull() {
		return this.lobbyPlayers.length >= this.maxLobbySize;
	}
}