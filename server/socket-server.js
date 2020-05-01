const wssport = 10000;
const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ port: wssport });
let connectedClients = [];
let allLobbies = [];
console.log(`WebSocket server listening on port ${wssport}`);

wss.on("close", function() {
	console.log("Server disconnected");
});

// Sends a game model state update to all connected clients
wss.broadcast = function(serverUpdate) {
	// Send the update to each connected client
	this.clients.forEach((clientSocket) => {
		clientSocket.send(serverUpdate);
	});
};

// If the update is a stage-update or stage-initialization, only broadcast to all clients in that lobby
wss.broadcastToLobby = function(serverUpdate, lobbyId) {
	connectedClients.forEach((connectedClient) => {
		if (connectedClient.lobbyID == lobbyId) {
			connectedClient.socket.send(serverUpdate);	
		};
	});
}

// Client connects to the web socket server
wss.on("connection", function(ws) {
	// Add this newly-connected client to our clients list
	connectedClients.push({
		socket: ws,
		PID: null,
		lobbyID: null
	});
	// console.log("Client connected");
	// console.log(`There are now ${connectedClients.length} number of connected clients`);
    
    // Send a list of lobbies to the user
    let lobbyList = JSON.stringify({
        type: "view-lobbies",
        lobbies: allLobbies
    })
	ws.send(lobbyList);
	
	// Client closes socket connection on server; remove them from any lobbies and gaves
	ws.on("close", function() {
		let disconnectedClient;
		let disconnectedClientIndex;
		// console.log(connectedClients);
		for (let i = 0; i < connectedClients.length; i++) {
			if (connectedClients[i].socket === ws) {
				disconnectedClient = connectedClients[i];
				disconnectedClientIndex = i;
				// console.log("Client with PID " + disconnectedClient.PID + " disconnected");
				break;
			}
		}

		// Remove that client from any lobbies it is in
		let lobby = serverInstance.getLobby(disconnectedClient.lobbyID);
		if (lobby) {				
			// console.log(`The disconnected client is in the lobby with ID ${disconnectedClient.lobbyID}, removing them`);
			lobby.leaveLobby(disconnectedClient.PID);
			// If the lobby is empty, delete the lobby
			if (lobby.getPlayers().length == 0) {
				serverInstance.deleteLobby(disconnectedClient.lobbyId);

				// Remove this lobbies reference from allLobbies
				for (let i = 0; i < allLobbies.length; i++) {
					if (allLobbies[i].id == disconnectedClient.lobbyId) {
						allLobbies.splice(i, 1);
						break;
					}
				}
			}
	
			// Send updated state of lobbies to all clients
			let lobbyList = JSON.stringify({
				type: "view-lobbies",
				lobbies: allLobbies
			})
			wss.broadcast(lobbyList);
		}

		// Remove the disconnected client from the connected clients list
		connectedClients.splice(disconnectedClientIndex, 1);
	});

	// When we receive an update from the client
	ws.on("message", function(clientUpdate) {
        clientUpdate = JSON.parse(clientUpdate);

        // Client wants to move or click (shoot)
        if (clientUpdate && clientUpdate.type == "move" || clientUpdate.type == "click" || clientUpdate.type == "cursor") {
            let lobby = serverInstance.getLobby(clientUpdate.lobbyId);
            if (lobby) {
                // console.log(clientUpdate);
                lobby.updateGameState(clientUpdate);
            }
		} 
		// Heal the player with the specified player id in the specified lobby
		else if (clientUpdate && clientUpdate.type == "heal-player") {
			let lobby = serverInstance.getLobby(clientUpdate.lobbyId);
			if (lobby && lobby.isPlayerInLobby(clientUpdate.pid) && lobby.isGameInProgress()) {
				lobby.updateGameState(clientUpdate);
			}
		}
        // Client creates lobby
        else if (clientUpdate && clientUpdate.type == "create-lobby") {
            // The given user id creates and joins the lobby
            let createdLobby = serverInstance.createLobby(clientUpdate.pid);
            
			// Add lobby to lobbies list
			let lobbyJSON = {
				id: createdLobby.getLobbyId(),
				lobbyOwner: clientUpdate.pid,
				lobbyPlayers: createdLobby.getPlayers(),
				gameInProgress: createdLobby.isGameInProgress(),
				numPlayers: createdLobby.getPlayers().length
			}
			allLobbies.push(lobbyJSON);
	
			// Associate that client socket with the newly-created lobby lobby
			for (let i = 0; i < connectedClients.length; i++) {
				if (connectedClients[i].PID === clientUpdate.pid) {
					// console.log("associating client with a lobby");
					connectedClients[i].lobbyID = createdLobby.getLobbyId();
					break;
				}
			}

			// Send information back to client
            ws.send(JSON.stringify({
				type: "new-lobby",
				newLobbyId: createdLobby.getLobbyId(),
				lobbies: allLobbies
			}));

			// Send updated state of lobbies to all clients
			let lobbyList = JSON.stringify({
				type: "view-lobbies",
				lobbies: allLobbies
			})
			wss.broadcast(lobbyList);
			// console.log("Client created and joined lobby with id " + createdLobby.getLobbyId());
        }
        // Client joins lobby
        else if (clientUpdate && clientUpdate.type == "join-lobby") {
            // console.log(`Client with id ${clientUpdate.pid} attempts to join lobby`);

            // The given user id attempts to join the lobby
            let lobby = serverInstance.getLobby(clientUpdate.lobbyId);
            if (lobby) {
                let successfulJoin = lobby.joinLobby(clientUpdate.pid);
                if (successfulJoin) {
					// Associate that client socket with this lobby
					for (let i = 0; i < connectedClients.length; i++) {
						if (connectedClients[i].PID === clientUpdate.pid) {
							connectedClients[i].lobbyID = lobby.getLobbyId();
							break;
						}
					}
					
					// Send update to client
                    let joinedLobbyInformation = JSON.stringify({
                        type: "joined-lobby",
                        lobbyId: lobby.getLobbyId(),
						lobbies: allLobbies
                    });
                    ws.send(joinedLobbyInformation);
    
                    // console.log("Client joined lobby");
					
					// Send updated state of lobbies to all clients
					let lobbyList = JSON.stringify({
						type: "view-lobbies",
						lobbies: allLobbies
					})
					wss.broadcast(lobbyList);
                } else {
					// console.log("Could not join lobby. Are you already in the lobby?");
                    let errorMessage = JSON.stringify({
                        type: "error",
                        message: "Could not join lobby. Are you already in the lobby?"
                    });
                    ws.send(errorMessage);
                }
            } else {
				// console.log("Could not join lobby. Make sure the lobby ID exists.");
                let errorMessage = JSON.stringify({
                    type: "error",
                    message: "Could not join lobby. Make sure the lobby ID exists."
                });
                ws.send(errorMessage);
            }
        }
        // Client starts game
        else if (clientUpdate && clientUpdate.type == "start-game") {
            // Check to see if the lobby exists, and the user is the owner
            let lobby = serverInstance.getLobby(clientUpdate.lobbyId);
            if (lobby) {
                if (lobby.getLobbyOwnerId() == clientUpdate.pid) {
                    let initialGameStatus = lobby.initializeGame(this);

					// Successfully initialized game
                    if (initialGameStatus) {
                        // Send the game model state to the connecting player
                        let initialGameState = JSON.stringify({
							type: "stage-initialization",
                            playerActors: initialGameStatus.players,
                            bulletActors: initialGameStatus.bullets,
                            crateActors: initialGameStatus.crates,
                            environmentActors: initialGameStatus.environment,
                            startTime: initialGameStatus.gameStartTime,
                            numAlive: initialGameStatus.numAlive,
                            numPlayers: initialGameStatus.numPlayers
                        });
    
                        // Start game for all players in lobby
						wss.broadcastToLobby(initialGameState, clientUpdate.lobbyId);
						
						// Change this lobby status to "game in progress", send update to all clients
						for (let i = 0; i < allLobbies.length; i++) {
							if (allLobbies[i].id == clientUpdate.lobbyId) {
								allLobbies[i].gameInProgress = true;
								break;
							}
						}
						let lobbyList = JSON.stringify({
							type: "view-lobbies",
							lobbies: allLobbies
						})
						wss.broadcast(lobbyList);
                    }
                }
            }
		}
		// Associate a client socket with its PID
		else if (clientUpdate && clientUpdate.type == "identify-client") {
			for (let i = 0; i < connectedClients.length; i++) {
				if (connectedClients[i].socket === ws) {
					connectedClients[i].PID = clientUpdate.pid;
					break;
				}
			}
		}
		// A client attemps to delete the lobby
		else if (clientUpdate && clientUpdate.type == "delete-lobby") {
			// console.log("Client tries to delete lobby on server");

			let lobby = serverInstance.getLobby(clientUpdate.lobbyId);
			if (lobby) {
				// Check if the player owns the lobby
				if (lobby.getLobbyOwnerId() == clientUpdate.pid) {
					serverInstance.deleteLobby(clientUpdate.lobbyId);
                    
					// Disassociate that client socket with this lobby
					for (let i = 0; i < connectedClients.length; i++) {
						if (connectedClients[i].PID === clientUpdate.pid) {
							connectedClients[i].lobbyID = null;
							break;
						}
					}

					// Remove this lobbies reference from allLobbies
					for (let i = 0; i < allLobbies.length; i++) {
						if (allLobbies[i].id == clientUpdate.lobbyId) {
							allLobbies.splice(i, 1);
							break;
						}
					}

					// Send status to user who deleted lobby
					let newLobbyState = JSON.stringify({
                        type: "deleted-lobby",
						status: "success",
						lobbies: allLobbies
					});
					ws.send(newLobbyState);

					// Send updated state of lobbies to all clients
					let lobbyList = JSON.stringify({
						type: "view-lobbies",
						lobbies: allLobbies
					})
					wss.broadcast(lobbyList);
				}
			}
		}
		// A client attempts to leave the lobby
        else if (clientUpdate && clientUpdate.type == "leave-lobby") {
            // console.log("Client tries to leave lobby on server");

            // Check to see if the lobby exists
            let lobby = serverInstance.getLobby(clientUpdate.lobbyId);
            if (lobby) {
                // Check to see if the user is in the lobby
                if (lobby.isPlayerInLobby(clientUpdate.pid)) {
					// console.log("The given client is in the lobby, removing them");

					lobby.leaveLobby(clientUpdate.pid);
					// If the lobby is empty, delete the lobby
					if (lobby.getPlayers().length == 0) {
						serverInstance.deleteLobby(clientUpdate.lobbyId);

						// Remove this lobbies reference from allLobbies
						for (let i = 0; i < allLobbies.length; i++) {
							if (allLobbies[i].id == clientUpdate.lobbyId) {
								allLobbies.splice(i, 1);
								break;
							}
						}
					}
					
					// Successfully left lobby, alert user
                    let newLobbyState = JSON.stringify({
                        type: "left-lobby",
                        status: "success"
					});
					ws.send(newLobbyState);
					
					// Disassociate that client socket with this lobby
					for (let i = 0; i < connectedClients.length; i++) {
						if (connectedClients[i].PID === clientUpdate.pid) {
							connectedClients[i].lobbyID = null;
							break;
						}
					}
					

					// Remove this player from that lobby's player list
					for (let i = 0; i < allLobbies.length; i++) {
						if (allLobbies[i].id === lobby.getLobbyId()) {
							for (let j = 0; j < allLobbies[i].lobbyPlayers; j++) {
								if (allLobbies[i][j] == clientUpdate.pid) {
									allLobbies[i][j].splice(j, 1);
								}
							}
						}
					}

					// Send updated state of lobbies to all clients
					let lobbyList = JSON.stringify({
						type: "view-lobbies",
						lobbies: allLobbies
					})
					wss.broadcast(lobbyList);
                }
                else {
                    // console.log("The given client is NOT in the lobby");
                    // Could not leave lobby, send message to that player
                    let errorMessage = JSON.stringify({
                        type: "left-lobby",
                        status: "failure",
                        message: "The given client is NOT in the lobby"
                    })
                    ws.send(errorMessage);
                }
            } else {
                // console.log("That lobby ID does not exist");
                let errorMessage = JSON.stringify({
                    type: "left-lobby",
                    status: "failure",
                    message: "That lobby ID does not exist"
                })
                ws.send(errorMessage);
            }
		} 
	});
});

// Import the Stage
const Stage = require("./game-engine/Stage.js");

// This server instance keeps track of lobbies and multiplayer games
class ServerInstance {
	constructor() {
		this.lobbies = [];
		this.newLobbyId = 0;
	}

	// Create a lobby for players to join, initially has the player ID of the lobby creator
	createLobby(lobbyOwnerId) {
        let newLobby = new Lobby(this.newLobbyId, lobbyOwnerId);
		this.lobbies.push(newLobby);
        this.newLobbyId++;
        return newLobby;
    }

    // Return the lobby with the given id
    getLobby(lobbyId) {
        for (let i = 0; i < this.lobbies.length; i++) {
            if (this.lobbies[i].getLobbyId() == lobbyId) {
                // console.log("Found lobby with with id " + lobbyId);
                return this.lobbies[i];
            }
        }
        return false;
    }
    
    // Get a list of all lobbies
    getLobbies() {
        return this.lobbies;
    }

	// Delete a lobby
	deleteLobby(lobbyId) {
		let lobbyToDelete = this.getLobby(lobbyId);
		if (lobbyToDelete) {
			lobbyToDelete.endGame("");
			for (let i = 0; i < this.lobbies.length; i++) {
				if (this.lobbies[i].getLobbyId() == lobbyId) {
					this.lobbies.splice(i, 1);
				}
			}
		}
	}

	// Runs on an interval
	// Check to see if any games in lobbies have finished. Start ready lobbies
	checkLobbies() {
		this.lobbies.forEach((lobby) => {
			if (lobby.isGameInProgress() == false && lobby.hasGameEnded() == true) {
                lobby.reinitializeLobby();
			}
		});
	}
}

// A Lobby contains players and can intiialize a multiplayer game
class Lobby {
	constructor(lobbyId, lobbyOwnerId) {
		this.lobbyId = lobbyId;
        this.lobbyOwnerId = lobbyOwnerId;
		this.lobbyPlayers = [lobbyOwnerId];

		this.gameInProgress = false;
		this.gameHasEnded = false;

		// this.isReady = false;
        this.multiplayerGame = null;
        this.multiplayerGameInterval = null;
        this.gameWinner = null;

        // Reference to server socket
        this.wss = null;
    }
    
    // Get the id of this lobby
    getLobbyId() {
        return this.lobbyId;
    }

    // Return true if the given player ID is in lobby, else false
    isPlayerInLobby(playerId) {
        return this.lobbyPlayers.includes(playerId);
    }

    // Get a list of players in this lobby
    getPlayers() {
        return this.lobbyPlayers;
    }
    
    getLobbyOwnerId() {
        return this.lobbyOwnerId;
    }

	// A player joins a lobby. Return true if successful, otherwise false.
	joinLobby(playerId) {
		let playerIndex = this.lobbyPlayers.indexOf(playerId);

		// Player is not in lobby yet; add them
		if (playerIndex == -1) {
			this.lobbyPlayers.push(playerId);
			return true;
		}
		return false;
	}

	// A player leaves a lobby. Return true if successful, otherwise false.
	leaveLobby(playerId) {
		let playerIndex = this.lobbyPlayers.indexOf(playerId);
		
		// Player is in lobby; remove them
		if (playerIndex > -1) {
			this.lobbyPlayers.splice(this.lobbyPlayers.indexOf(playerId), 1);
			// console.log("Successfully removed player from lobby, at index " + playerIndex);

			// If there is an ongoing game, remove them from the game as well
			if (this.gameInProgress) {
				this.multiplayerGame.handleDisconnectedPlayer(playerId);
			}
			return true;
		}
		return false;
	}

	// Begins the multiplayer game in this lobby, returns the initial game state
	initializeGame(wss) {
        this.wss = wss;
        this.gameInProgress = true;

		this.multiplayerGame = new MultiplayerGame(
			this.lobbyId,
			this.lobbyPlayers
		);
		
		try {
			// Run the multiplayer game on an interval
			this.multiplayerGameInterval = setInterval(async () => {
				await this.multiplayerGame.calculateUpdates();
				await this.multiplayerGame.sendPlayerUpdates(wss);
	
				// Check to see if the game has ended (only 1 player remaining)
				let gameWinner = this.multiplayerGame.getGameWinner();
				if (gameWinner) {
					this.endGame(gameWinner)
				}
			}, 20);

		} catch(e){
			console.log(e);
		}
        
        // Return initial game state
        let initialState = this.multiplayerGame.getInitialState();
        // console.log(initialState);
        return initialState;
    }
    
    // Send updates to a server from a client's controller
    updateGameState(clientUpdate){
		if (this.gameInProgress) {
			this.multiplayerGame.updateState(clientUpdate);
		}
    }

	// Ends the multiplayer game in this lobby
	endGame(gameWinner) {
        clearInterval(this.multiplayerGameInterval);
		this.multiplayerGame  = null;
		this.gameWinner = gameWinner;
		this.gameInProgress = false;
		this.gameHasEnded = true;
	}
	
    // Return true if the game is in progress
    isGameInProgress() {
        return this.gameInProgress;
	}
	
	// Return true if the game has ended
	hasGameEnded() {
		return this.gameHasEnded;
	}

    // Return the winner of the game
    getLobbyWinner() {
        return this.gameWinner;
    }

    // When a game finishes, the lobby is "reinitialized"
    reinitializeLobby() {
        this.gameInProgress = false;
        this.multiplayerGame = null;
        this.multiplayerGameInterval = null;
		this.wss = wss;
		this.gameHasEnded = false;

        // Send update to all clients, telling those who are connected
        // to this lobby to clear their own model instance
        let updatedState = JSON.stringify({
            type: "stage-termination",
            lobbyID: this.lobbyId,
            winningPID: this.gameWinner
		});
		
		this.gameWinner = null;
        wss.broadcastToLobby(updatedState, this.lobbyId);
    }
}

// A multiplayer game has multiplayer players in it
class MultiplayerGame {
	constructor(gameId, gamePlayers) {
		this.gameId = gameId; // a game has the same ID as its lobby
        this.players = gamePlayers;
        const numPlayers = gamePlayers.length;
        
        // These values are equivalent to the canvas width and height from A2
        // The stage still needs to know the map size
        this.mapWidth = 1200;
        this.mapHeight = 800;

        // Game specific settings
        const generationSettings = {
            numBushes: 10,
            numCrates: 5,
            numHPPots: 7,
            numAmmo: 15,
            numSpeedBoost: Math.floor(numPlayers/2) + 1,
            numRDS: numPlayers,
            numSmallGun: numPlayers,
            numBigGun: Math.floor(numPlayers/2) + 1
        }

        // Initialize the server-side stage
        this.stage = new Stage(this.gameId, this.players, this.mapWidth, this.mapHeight, generationSettings, numPlayers);
    }
    
    // Return the initial starting state of this stage (called when the game starts)
    getInitialState() {
        return this.stage.getInitialStageState();
    }

    // Given a player's movement or mouse click, update the state
    updateState(update) {
        // console.log("Fetching player updates");
        
        // Get the ID of the player who triggered this update
        let pid = update.pid;
        let player = this.stage.getPlayer(pid);

        // Only clients with a player that is still alive can make updates
        if (player) {
            if (update.type == "move") {
				player.setMovementDirection(update.x, update.y);
            } else if (update.type == "click") {
                player.setFiringDirection(update.x, update.y);
            } else if (update.type == "cursor") {
                player.setCursorDirection(update.x, update.y);
            } else if (update.type == "heal-player") {
				player.increaseHP(0.0005, true);
			}
        }
    }

    // Triggers a step in the stage, allowing stage model to re-calculate all logic
	async calculateUpdates() {
		this.stage.step();
    }

    // Send the state of the stage to all players
	async sendPlayerUpdates() {
		// console.log("Sending player updates");
		let update = this.stage.getUpdatedStageState();

		let updatedState = JSON.stringify({
			type: "stage-update",
			playerActors: update.players,
			bulletActors: update.bullets,
			environmentActors: update.environment,
			numAlive: update.numAlive,
			hasEnded: update.hasEnded
		});
		wss.broadcastToLobby(updatedState, this.gameId);
    }   

    // Return the PID of the winner of the game, else if game is still ongoing, return null
    getGameWinner() {
        return this.stage.getWinner();
	}
	
	// Remove the player that disconnected
	handleDisconnectedPlayer(playerID) {
		this.stage.removePlayer(playerID);
	}
}

// --- SERVER INTERVAL CODE Q: ---------------------------------------------


let globalInterval = null;
let serverInstance = new ServerInstance();

// Global server interval
const startGlobalInterval = (server) => {
	// This does not need to run that frequently, as it only checks for lobbies where games have finished
	globalInterval = setInterval(() => {
		// console.log(`Checking lobbies... there are ${allLobbies.length} lobbies`);
        server.checkLobbies();
	}, 5000);
};

startGlobalInterval(serverInstance);
