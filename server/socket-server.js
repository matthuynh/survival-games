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

// --- SERVER GAME MODEL CODE Q: ---------------------------------------------

// Return a random integer between 0 and n, inclusive
function randInt(n) { return Math.round(Math.random() * n); }

// Return a random float between 0 and n, inclusive
function rand(n) { return Math.random() * n; }

// Return the distance between two points, given the x and y coordinate of each point
function distanceBetweenTwoPoints(startingX, startingY, endingX, endingY) {
	return Math.sqrt((startingX - endingX) ** 2 + (startingY - endingY) ** 2);
}

// Return the distance between two Pairs
function distanceBetweenTwoPairs(startingPair, endingPair) {
	return Math.sqrt((startingPair.x - endingPair.x) ** 2 + (startingPair.y - endingPair.y) ** 2);
}

// Represents a pair of (x,y)
class Pair {
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

// A general Shape class. Shapes are extended by Circles and Rectangles
class Shape {
	constructor(position, colour) {
		this.position = position;
		this.colour = colour;
	}

	getStartingPosition() {
		return this.position;
	}

	getStartingX() {
		return this.position.x;
	}

	getStartingY() {
		return this.position.y;
	}
}

// A general Circle class. Circles include the Player, Bullets, Enemies, Bushes, and more
class Circle extends Shape {
	constructor(position, colour, radius) {
		super(position, colour);
		this.radius = radius;
	}

	step() {
	}

	getRadius() {
		return this.radius;
	}
}

// A general Rectangle class. Rectangles include Ammo that can be picked up, Crates, and more
class Rectangle extends Shape {
	constructor(position, colour, width, height) {
		super(position, colour);
		this.width = width;
		this.height = height;
	}

	getWidth() {
		return this.width;
	}

	getHeight() {
		return this.height;
	}
}

// A Crate class
class Crate extends Rectangle {
	constructor(startingX, startingY, colour, width, height) {
		super(new Pair(startingX, startingY), colour, width, height);
		this.width = width;
		this.height = height;
    }
    
    // Return a JSON representation of this crate
    getJSONRepresentation() {
        return {
            crateColour: this.colour,
            crateX: this.position.x,
            crateY: this.position.y,
            crateWidth: this.width,
            crateHeight: this.height
        }
    }

	toString() {
		return `Crate: (${this.x},${this.y})`;
	}

	// Take one "step" for animation
	step() {
	}
}

// A Bush object that Players can use to hide themselves in
class BushEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
    }
    
    // Return a JSON representation of this bush
    getJSONRepresentation() {
        return {
            type: "BushEnv",
            bushX: this.x,
            bushY: this.y,
            bushRadius: this.radius,
            bushColour: this.colour
        }
    }

	// Included this empty method here, as all actors need a Step method
	step() {
	}
}

// An Ammo object that Players can use to restock ammo
class AmmoEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this ammo
    getJSONRepresentation() {
        return {
            type: "AmmoEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}

// A small gun that Players can use to pick up
class SmallGunEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this small gun
    getJSONRepresentation() {
        return {
            type: "SmallGunEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}

// A big gun that Players can use to pick up
class BigGunEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this big gun
    getJSONRepresentation() {
        return {
            type: "BigGunEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
    
}

// A buff that gives users a movement boost
class SpeedBoostEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this speed boost
    getJSONRepresentation() {
        return {
            type: "SpeedBoostEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}

// A buff that restores the player's health
class HealthPotEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this HealthPot
    getJSONRepresentation() {
        return {
            type: "HealthPotEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}

class ScopeEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }

    // Return a JSON representation of this ScopeEnv
    getJSONRepresentation() {
        return {
            type: "ScopeEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}

// A Bullet object. A Gun object has Bullet objects, which it can shoot. A Bullet also knows which player shot it.
class Bullet extends Circle {
	constructor(playerPosition, cursorDirection, bulletVector, colour, radius, range, bulletSpeed, bulletDamage, owner) {
		super(playerPosition, colour, radius);
		this.originalPosition = playerPosition; // the position where the bullet was shot
		this.setBulletPosition(); // this.x, this.y are the int versions of this.position
		this.dx = 0;
		this.dy = 0;
		this.cursorDirection = cursorDirection;
		this.setBulletVector(bulletVector.x, bulletVector.y, bulletSpeed);
		this.bulletSpeed = bulletSpeed;
		this.bulletDamage = bulletDamage;
		this.range = range;
		this.owner = owner; // bullet knows who fired it
	}

    // Return a JSON representation of this bullet
    getJSONRepresentation() {
        return {
            bulletX: this.x,
            bulletY: this.y,
            bulletRadius: this.radius,
            bulletColour: this.colour,
            bulletCursorDirectionX: this.cursorDirection.x,
            bulletCursorDirectionY: this.cursorDirection.y
        }
    }
    

	// Set this.x and this.y to the original position of the bullet
	setBulletPosition() {
		this.x = Math.round(this.originalPosition.x);
		this.y = Math.round(this.originalPosition.y);
	}

	// Returns a string representation of the Bullet's current location
	toString() {
		return "Bullet (starting position): " + this.originalPosition.toString();
	}

	// Sets the movement direction and speed for the bullet
	setBulletVector(dx, dy, bulletSpeed) {
		if (dx != 0) { this.dx = dx * bulletSpeed; }
		if (dy != 0) { this.dy = dy * bulletSpeed; }
	}

	// Take one "step" for animation, checking for collisions and the like
	step(stage) {
		let destinationX = this.x + this.dx;
        let destinationY = this.y + this.dy;

		// Remove the bullet from the stage if it has exceeded its maximum range
		if (distanceBetweenTwoPoints(this.originalPosition.x, this.originalPosition.y, this.x, this.y) > this.range) {
			stage.removeActor(this);
		}
		// Remove the bullet from the stage if it will hit the border
		else if (destinationX < 0 || destinationX > stage.stageWidth || destinationY < 0 || destinationY > stage.stageHeight) {
			stage.removeActor(this);
		}
		else {
			// Check if the bullet will collide with other players
			let collidesPlayer = false;
			let playersList = stage.getPlayerActors();
			for (let i = 0; i < playersList.length; i++) {
				// Check if the player is shooting ANOTHER player (not the one shooting the bullet)
				if (playersList[i] == this.owner) {
					// Skip this collision detection (player cannot collide with their own bullet)
					continue;
				}

				let playerPosition = playersList[i].getPlayerPosition();
				let dx = destinationX - playerPosition.x;
				let dy = destinationY - playerPosition.y;
				let distance = Math.sqrt(dx * dx + dy * dy);

				// Bullet collides with the player
				if (distance < this.radius + playersList[i].getRadius()) {
					// console.log("Bullet collision detected -- Bullet with player");

					// Decrease the player's HP
					playersList[i].decreaseHP(this.bulletDamage);
					// console.log("players HP: " + playersList[i].HP);
					collidesPlayer = true;
				}
			}

			// Player collision takes precendence over crate collision
			if (collidesPlayer) {
				stage.removeActor(this);
			} else {
				// Check if the bullet will collide with anything else in the environment
				let collidesCrate = false;
				let crateList = stage.getCrateActors();
				for (let i = 0; i < crateList.length; i++) {
					let crateObject = crateList[i];

					// Bullets do not collide with Bushes
					// Check for collision with Crates
					if (crateList[i] instanceof Crate) {
						// Bullets only collide with Crates (guaranteed to have height and width)
						let objectPosition = crateList[i].getStartingPosition();

						// x and y distance between the Bullet (a circle) and the Crate (a rectangle)
						let distanceX = Math.abs(this.x - objectPosition.x - crateObject.getWidth() / 2);
						let distanceY = Math.abs(this.y - objectPosition.y - crateObject.getHeight() / 2);

						// If the distance between the Bullet and Crate is longer than the Bullet radius + half(Crate Width), we know they are not colliding
						if ((distanceX > ((crateObject.getWidth() / 2) + this.radius) || distanceY > ((crateObject.getWidth() / 2) + this.radius))) {
							continue;
						}
						// If the distance between the Bullet and Crate is too short (indicating that they are colliding)
						else if (distanceX <= (crateObject.getWidth() / 2) || distanceY <= (crateObject.getHeight() / 2)) {
							// console.log("Bullet collision detected -- Bullet with Crate");
							collidesCrate = true;
							break;
						}
					}
				}

				// Bullet collides with crate; remove it
				if (collidesCrate || false) {
					stage.removeActor(this);
				} else {
					this.x = destinationX;
					this.y = destinationY;
					// console.log(`Coordinates of bullet: (${this.x}, ${this.y})`);
				}
			}
		}
	}
}

// A Gun object. A Player has a Gun object, and uses it to shoot Bullet objects. Gun objects create Bullets. A Gun knows who owns it
class Gun {
	constructor(stage, startingBullets, bulletCapacity, range, bulletSpeed, cooldown, bulletDamage, owner) {
		this.stage = stage;
		this.numberBullets = startingBullets;
		this.bulletCapacity = bulletCapacity;
		this.range = range;
		this.bulletSpeed = bulletSpeed; // the gun determines how fast a bullet is fired
		this.bulletDamage = bulletDamage; // the gun determines how much damage its bullets do
		this.owner = owner;

		// Used to calculate the cooldown of the weapon
		this.cooldown = cooldown; // cooldown of fire rate in milliseconds
		this.previousFireTime = new Date().getTime(); // the previous time at which a bullet was fired (total milliseconds since Jan 1, 1970)
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shoot(position, cursorDirection, firingVector, colour, bulletRadius) {
		if (this.numberBullets < 1) {
			return false;
		} else if (new Date().getTime() - this.previousFireTime >= this.cooldown) {
			this.bullet = new Bullet(position, cursorDirection, firingVector, colour, bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
			this.stage.addActor(this.bullet);
			this.numberBullets -= 1;
			this.previousFireTime = new Date().getTime();
			return true;
		}
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shootBurst(position, cursorDirection, firingVector, colour, bulletRadius) {
		if (this.numberBullets < 1) {
			return false;
		} else {
			if (this.numberBullets > 0) {
				this.bullet = new Bullet(position, cursorDirection, firingVector, colour, bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
				this.stage.addActor(this.bullet);
				this.numberBullets -= 1;
			}

			if (this.numberBullets > 0) {
				this.bullet = new Bullet(position, cursorDirection, firingVector, colour, bulletRadius, this.range, this.bulletSpeed / 1.1, this.bulletDamage, this.owner);
				this.stage.addActor(this.bullet);
				this.numberBullets -= 1;
			}

			if (this.numberBullets > 0) {
				this.bullet = new Bullet(position, cursorDirection, firingVector, colour, bulletRadius, this.range, this.bulletSpeed / 1.2, this.bulletDamage, this.owner);
				this.stage.addActor(this.bullet);
				this.numberBullets -= 1;
			}

			this.previousFireTime = new Date().getTime();
			return true;
		}
	}

	// Reloads a gun by giving it more bullets
	reloadGun(bulletCount) {
		this.numberBullets += bulletCount;
	}

	// Return the range of this gun
	getRange() {
		return this.range;
	}

	// Return the number of bullets this gun has left
	getRemainingBullets() {
		return this.numberBullets;
	}

	// Return the ammo capacity of this gun
	getAmmoCapacity() {
		return this.bulletCapacity;
	}
}

// A Line class
class Line {
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

// Ran-dom color generator
function getRandomColor() {
	let red = Math.floor(Math.random() * 255);
	let green = Math.floor(Math.random() * 255);
	let blue = Math.floor(Math.random() * 255);
	let color = "rgb(" + red + ", " + green + ", " + blue + ")";
	return color;
}

// A Stage stores a actors, and the player
class Stage {
	constructor(gameId, playerIDList, canvasWidth, canvasHeight, generationSettings, numPlayers) {
        this.gameId = gameId;
        this.playerIDList = playerIDList;
        this.numPlayers = numPlayers;
        this.numAlive = numPlayers;
        this.gameHasEnded = false;
        this.winningPID = null;

		// Each actor is stored in different arrays to handle collisions differently
		this.playerActors = []; // includes all Players
		this.bulletActors = []; // stores Bullets
		this.crateActors = []; // Crates and Bushes
		this.environmentActors = []; // these actors cannot collide. Includes Lines, buffs (HP, ammo, speed boost, RDS)
        
        // The logical width and height of the stage
		let logicalMultiplier = 2;
		this.stageWidth = canvasWidth * logicalMultiplier;
        this.stageHeight = canvasHeight * logicalMultiplier;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Initialize each player in the stage
        for (let i = 0; i < this.numPlayers; i++) {
            // console.log("Adding player with id " + this.playerIDList[i]);
            // Player spawns in a random spot (they spawn away from the border)
            let xSpawn = (this.stageWidth / 2) - randInt(this.stageWidth / 4) + randInt(this.stageWidth / 4);
            let ySpawn = (this.stageHeight / 2) - randInt(this.stageHeight / 4) + randInt(this.stageWidth / 4);
            
            // Check to see if the would collide with another player
            let collides = this.checkForGenerationCollisions(xSpawn, ySpawn);
            let attemptsToMake = 3;
            while (collides || attemptsToMake > 0) {
                xSpawn = (this.stageWidth / 2) - randInt(this.stageWidth / 4) + randInt(this.stageWidth / 4);
                ySpawn = (this.stageHeight / 2) - randInt(this.stageHeight / 4) + randInt(this.stageWidth / 4);
                attemptsToMake--;
                collides = this.checkForGenerationCollisions(xSpawn, ySpawn);
            }
            
            const playerStartingPosition = new Pair(xSpawn, ySpawn);
            const playerColour = getRandomColor(); // each player has a different color
            const playerRadius = 30;
            const playerHP = 100;
            const playerMovementSpeed = 8;
            let player = new Player(this, playerStartingPosition, playerColour, playerRadius, playerHP, playerMovementSpeed, this.playerIDList[i]);
            this.addActor(player);
        }

		// Generate environment (bushes, crates, buffs) and add them to the corresponding actors lists
		this.generateBushes(generationSettings.numBushes);
		this.generateCrates(generationSettings.numCrates);
		this.generateBuffs(generationSettings);

		this.startTime = Math.round(new Date().getTime() / 1000);
    }
    
    // Given a player ID, return that player
    getPlayer(pid) {
        for (let i = 0; i < this.playerActors.length; i++) {
            if (this.playerActors[i].getPlayerID() == pid) {
                return this.playerActors[i];
            }
        }
        return null;
	}
	
	// Given a player ID, remove that player from the game
	removePlayer(pid) {
		for (let i = 0; i < this.playerActors.length; i++) {
            if (this.playerActors[i].getPlayerID() == pid) {
				this.removeActor(this.playerActors[i]);
				this.numAlive -= 1;

				// There is only one player left in the game; he wins automatically
				if (this.numAlive == 1) {
					this.gameHasEnded = true;
					// TODO: Insert this record into the leaderboards 
					this.winningPID = this.playerActors[0].getPlayerID();
					// console.log("The player who won is " + this.winningPID);
				}

				// If this.numAlive == 0, then no one wins game, as all clients disconnected
				return true;
            }
		}
        return null;
	}

    // Return the initial state of the actors lists
    getInitialStageState() {
        let players = [];
        let bullets = [];
        let crates = [];
        let environmentObjs = [];
        
        // Get JSON representation (only stores information necessary for client-side)
        this.playerActors.forEach(player => players.push(player.getJSONRepresentation()));
        this.bulletActors.forEach(bullet => bullets.push(bullet.getJSONRepresentation()));
        this.crateActors.forEach(crate => crates.push(crate.getJSONRepresentation()));
        this.environmentActors.forEach(environment => environmentObjs.push(environment.getJSONRepresentation()));

        let state = {
            players: players,
            bullets: bullets,
            crates: crates,
            environment: environmentObjs,
            gameStartTime: this.startTime,
            numAlive: this.numAlive,
            numPlayers: this.numPlayers
        }
        return state;
    }

    // Return the current state of the actors lists
    getUpdatedStageState() {
        // This does not return the crates list (as they are static, and cannot be changed)
        // Eventually, add Bushes so that they are not part of environmentObjs (as they are static)
        let players = [];
        let bullets = [];
        let environmentObjs = [];
        
        // Get JSON representation (only stores information necessary for client-side)
        this.playerActors.forEach(player => players.push(player.getJSONRepresentation()));
        this.bulletActors.forEach(bullet => bullets.push(bullet.getJSONRepresentation()));
        this.environmentActors.forEach(environment => environmentObjs.push(environment.getJSONRepresentation()));

        let state = {
            players: players,
            bullets: bullets,
            environment: environmentObjs,
            numAlive: this.numAlive,
            hasEnded: this.gameHasEnded
        }
        return state;
    }


	// Generate bushes in random locations throughout the map
	generateBushes(numBushes) {
		for (let i = 0; i < numBushes; i++) {
			// console.log("Generating bush");
			let validGeneration = false;
			let attemptsToMake = 3;
			const colour = "rgba(0,61,17,0.9)", radius = 50;
			while (!validGeneration && attemptsToMake > 0) {
				let startingX = randInt(this.stageWidth - 250);
				let startingY = randInt(this.stageHeight - 250);
				if (this.collidesWithWorldBorder(startingX, startingY, 40)) { continue; }

				// Check if this bush would collide any other actors
				let collides = this.checkForGenerationCollisions(startingX, startingY);
				if (!collides) {
					let bush = new BushEnv(new Pair(startingX, startingY), colour, radius)
					this.addActor(bush);
					validGeneration = true;
					// console.log(`Bush generated at (${startingX}, ${startingY})`);
				}
				attemptsToMake -= 1;
			}

		}
	}

    // Generate crates in random locations throughout the map
	generateCrates(numCrates) {
		for (let i = 0; i < numCrates; i++) {
			let validGeneration = false;
			let attemptsToMake = 3; // after 3 attempts, stops trying to generate this crate
			const colour = "rgb(128,128,128,1)";
			while (!validGeneration && attemptsToMake > 0) {
				let width = 100, height = 100;
				let startingX = randInt(this.stageWidth - 200);
				let startingY = randInt(this.stageHeight - 200);

				// Check if this crate would collide any other actors
				let collides = this.checkForGenerationCollisions(startingX, startingY);
				if (!collides) {
					let crate = new Crate(startingX, startingY, colour, width, height)
					this.addActor(crate);
					validGeneration = true;
					// console.log(`Crate generated at (${startingX}, ${startingY})`);
				}
				attemptsToMake -= 1;
			}
		}
	}

	// Generate buffs in random locations throughout the map
	generateBuffs(generationSettings) {
        // Generate RDS buffs
        for (let i = 0; i < generationSettings.numRDS; i++) {
            let validGeneration = false;
            let attemptsToMake = 3;
            let colour = "rgba(255,255,0,1)", radius = 20;
            while (!validGeneration && attemptsToMake > 0) {
                let startingX = randInt(this.stageWidth - 250);
                let startingY = randInt(this.stageHeight - 250);
                if (this.collidesWithWorldBorder(startingX, startingY, 40)) { continue; }
    
                // Check if this scope buff would collide any other actors
                let collides = this.checkForGenerationCollisions(startingX, startingY);
                if (!collides) {
                    let ammo = new ScopeEnv(new Pair(startingX, startingY), colour, radius)
                    this.addActor(ammo);
                    validGeneration = true;
                    // console.log(`Scope generated at (${startingX}, ${startingY})`);
                }
                attemptsToMake -= 1;
            }
        }
		

        // Generate speed buffs
        for (let i = 0; i < generationSettings.numSpeedBoost; i++) {
            let validGeneration = false;
            let attemptsToMake = 3;
            let colour = "rgba(0,0,255,1)", radius = 20;
            while (!validGeneration && attemptsToMake > 0) {
                let startingX = randInt(this.stageWidth - 250);
                let startingY = randInt(this.stageHeight - 250);
                if (this.collidesWithWorldBorder(startingX, startingY, 40)) { continue; }
    
                // Check if this speed buff would collide any other actors
                let collides = this.checkForGenerationCollisions(startingX, startingY);
                if (!collides) {
                    let speedBoost = new SpeedBoostEnv(new Pair(startingX, startingY), colour, radius)
                    this.addActor(speedBoost);
                    validGeneration = true;
                    // console.log(`Speed Buff generated at (${startingX}, ${startingY})`);
                }
                attemptsToMake -= 1;
            }
        }

        // Generate small guns
        for (let i = 0; i < generationSettings.numSmallGun; i++) {
            let validGeneration = false;
            let attemptsToMake = 3;
            let colour = "rgba(255,255,0,1)", radius = 20;
            while (!validGeneration && attemptsToMake > 0) {
                let startingX = randInt(this.stageWidth - 250);
                let startingY = randInt(this.stageHeight - 250);
                if (this.collidesWithWorldBorder(startingX, startingY, 40)) { continue; }
    
                // Check if this small gun would collide any other actors
                let collides = this.checkForGenerationCollisions(startingX, startingY);
                if (!collides) {
                    let smallGun = new SmallGunEnv(new Pair(startingX, startingY), colour, radius)
                    this.addActor(smallGun);
                    validGeneration = true;
                    // console.log(`Small gun generated at (${startingX}, ${startingY})`);
                }
                attemptsToMake -= 1;
            }
        }

        // Generate big guns
        for (let i = 0; i< generationSettings.numBigGun; i++) {
            let validGeneration = false;
            let attemptsToMake = 3;
            let colour = "rgba(255,255,0,1)", radius = 20;
            while (!validGeneration && attemptsToMake > 0) {
                let startingX = randInt(this.stageWidth - 250);
                let startingY = randInt(this.stageHeight - 250);
                if (this.collidesWithWorldBorder(startingX, startingY, 40)) { continue; }
    
                // Check if this big gun would collide any other actors
                let collides = this.checkForGenerationCollisions(startingX, startingY);
                if (!collides) {
                    let bigGun = new BigGunEnv(new Pair(startingX, startingY), colour, radius)
                    this.addActor(bigGun);
                    validGeneration = true;
                    // console.log(`Big gun generated at (${startingX}, ${startingY})`);
                }
                attemptsToMake -= 1;
            }
        }

		// Generate numBuffs number of ammo
		for (let i = 0; i < generationSettings.numAmmo; i++) {
			let validGeneration = false;
			let attemptsToMake = 3;
			const colour = "rgba(0,0,0,1)", radius = 20;
			while (!validGeneration && attemptsToMake > 0) {
				let startingX = randInt(this.stageWidth - 250);
				let startingY = randInt(this.stageHeight - 250);
				if (this.collidesWithWorldBorder(startingX, startingY, 40)) { continue; }

				// Check if this ammo would collide any other actors
				let collides = this.checkForGenerationCollisions(startingX, startingY);
				if (!collides) {
					let ammo = new AmmoEnv(new Pair(startingX, startingY), colour, radius)
					this.addActor(ammo);
					validGeneration = true;
					// console.log(`Ammo generated at (${startingX}, ${startingY})`);
				}
				attemptsToMake -= 1;
			}
		}

		// Generate numBuffs number of HP pots
		for (let i = 0; i < generationSettings.numHPPots; i++) {
			let validGeneration = false;
			let attemptsToMake = 3;
			const colour = "rgba(255,0,0,1)", radius = 20;
			while (!validGeneration && attemptsToMake > 0) {
				let startingX = randInt(this.stageWidth - 250);
				let startingY = randInt(this.stageHeight - 250);
				if (this.collidesWithWorldBorder(startingX, startingY, 40)) { continue; }

				// Check if this HP pot would collide any other actors
				let collides = this.checkForGenerationCollisions(startingX, startingY);
				if (!collides) {
					let hpPot = new HealthPotEnv(new Pair(startingX, startingY), colour, radius)
					this.addActor(hpPot);
					validGeneration = true;
					// console.log(`hpPot generated at (${startingX}, ${startingY})`);
				}
				attemptsToMake -= 1;
			}
		}
	}

	// Check for generation collisions 
	checkForGenerationCollisions(destinationX, destinationY) {
		// Check if our structure will collide with other players
		let playersList = this.getPlayerActors();
		for (let i = 0; i < playersList.length; i++) {
			let playerPosition = playersList[i].getPlayerPosition();
			let dx = destinationX - playerPosition.x;
			let dy = destinationY - playerPosition.y;
			let distance = Math.sqrt(dx * dx + dy * dy);

			// Player collides with another player
			if (distance < playersList[i].getRadius()) {
				return true;
			}
		}

		// Check if our structure will collide with other crate structures
		let crateList = this.getCrateActors();
		for (let i = 0; i < crateList.length; i++) {
			// Check for collision with Crates
			if (crateList[i] instanceof Crate) {
				let objectPosition = crateList[i].getStartingPosition();
				let structureCenterX = crateList[i].getWidth() / 2;
				let structureCenterY = crateList[i].getHeight() / 2;
				let dx = destinationX - objectPosition.x - structureCenterX;
				let dy = destinationY - objectPosition.y - structureCenterY;
				let distance = Math.sqrt(dx * dx + dy * dy);

				// Player collides with crate
				if (distance < 300) {
					return true;
				}
			}
		}

		// Check generation collision with ammo, etc.
		let actorsList = this.getBulletActors();
		for (let i = 0; i < actorsList.length; i++) {
			// Players do not collide with Bushes
			if (actorsList[i] instanceof BushEnv) {
				let bushPosition = actorsList[i].getStartingPosition();
				let dx = destinationX - bushPosition.x;
				let dy = destinationY - bushPosition.y;
				let distance = Math.sqrt(dx * dx + dy * dy);

				// player collides with the player
				if (distance < actorsList[i].getRadius()) {
					return true;
				}
			}
		}

		return false;
	}

	// Add an actor (eg. enemy, boxes) to the stage (actor spawns)
	addActor(actor) {
		// Each actor is stored in different arrays to handle collisions differently
		if (actor instanceof Player) {
			this.playerActors.push(actor);
		} else if (actor instanceof Bullet) {
			this.bulletActors.push(actor);
		} else if (actor instanceof Crate) {
			this.crateActors.push(actor);
		}
		// This environment actors list stores items/buffs the user can pick up (eg. ammo, health pots, speed buff, line sight, guns)
		else {
			this.environmentActors.push(actor);
		}
	}

	// Remove an actor (eg. enemy, boxes) to the stage (actor despawns/dies)
	removeActor(actor) {
		// Determine which actors list to remove this object from
		if (actor instanceof Player) {
			let index = this.playerActors.indexOf(actor);
			if (index != -1) {
				// console.log("Removing actor " + this.playerActors[index]);
				this.playerActors.splice(index, 1);
			}

		} else if (actor instanceof Bullet) {
			let index = this.bulletActors.indexOf(actor);
			if (index != -1) {
				// console.log("Removing actor " + this.bulletActors[index]);
				this.bulletActors.splice(index, 1);
			}
		} else if (actor instanceof Crate) {
			let index = this.crateActors.indexOf(actor);
			if (index != -1) {
				// console.log("Removing actor " + this.crateActors[index]);
				this.crateActors.splice(index, 1);
			}
		} else {
			let index = this.environmentActors.indexOf(actor);
			if (index != -1) {
				// console.log("Removing actor " + this.environmentActors[index]);
				this.environmentActors.splice(index, 1);
			}
		}
	}

    getCanvasWidth() {
        return this.canvasWidth;
    }

    getCanvasHeight() {
        return this.canvasHeight;
    }

	getPlayerActors() {
		return this.playerActors;
	}

	getCrateActors() {
		return this.crateActors;
	}

	getBulletActors() {
		return this.bulletActors;
	}

	getEnvironmentActors() {
		return this.environmentActors;
	}

	collidesWithWorldBorder(destinationX, destinationY, tolerance) {
		if ((destinationX < 0 + tolerance || destinationX > this.stageWidth - tolerance || destinationY < 0 + tolerance || destinationY > this.stageHeight - tolerance)) {
			return true;
		}
		return false;
    }
    
    // Return the PID of the player who won the game, else null
    getWinner() {
        return this.winningPID;
    }

    // Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 
	// NOTE: Careful if an actor died, this may break!
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

		// Check if any player actors died
		for (let i = 0; i < this.playerActors.length; i++) {

            // Dead players get removed from the player actors list
			if (this.playerActors[i].isDead()) {
                this.removeActor(this.playerActors[i]);
                this.numAlive -= 1;
            }
            
            // Game ends (only one person is left)
            if (this.numAlive <= 1) {
                this.gameHasEnded = true;
                
                // TODO: Insert this record into the leaderboards 
                this.winningPID = this.playerActors[0].getPlayerID();
            }
		}

		// Update elapsed time (in seconds)
		let currentTime = Math.round(new Date().getTime() / 1000);
		this.elapsedTime = Math.round(currentTime) - this.startTime;
	}
}

// A Player class that represents human players
class Player extends Circle {
	constructor(stage, position, colour, radius, hp, movementSpeed, playerID) {
        super(position, colour, radius);
        this.stage = stage;
        this.playerID = playerID;

		this.setPlayerPosition(); // this.x, this.y are the int versions of this.position
		this.dx = 0; // displacement in x and y direction
		this.dy = 0;

		// Stores where the cursor is currently pointing at
		this.cursorX = 0;
		this.cursorY = 0;
		this.directionLine = new Line(this.x, this.y, 0, 0, 1, "rgba(255,0,0,0)"); // a player has an invisible line drawn in the direction they are facing

		this.velocity = new Pair(0, 0);
		this.cursorDirection = new Pair(0, 1); // represents the cursor direction, aka. where the player is facing

		// Stores the player's buffs
		this.hidden = false; // set to true when the player is under a bush
		this.isUsingScope = false; // set to true when the player picks up the RDS buff

		// The coordinates of where this player's hands are located
		this.handX = 0;
		this.handY = 0;

		// The user starts with an "empty gun" -- they will need to pick up a real gun
		this.stage.addActor(this.directionLine);
		const numStartingBullets = 0, bulletCapacity = 0, startingRange = 400, bulletSpeed = 30, bulletDamage = 5, cooldown = 0;
		this.gun = new Gun(stage, numStartingBullets, bulletCapacity, startingRange, bulletSpeed, cooldown, bulletDamage, this);

		this.movementSpeed = movementSpeed;
		this.HP = hp;
		this.maxHP = hp;
    }
    
    // Return a JSON representation of this player
    getJSONRepresentation() {
        return {
            playerID: this.playerID,
            playerPositionX: this.x,
            playerPositionY: this.y,
            cursorDirectionX: this.cursorDirection.x,
            cursorDirectionY: this.cursorDirection.y,
            playerColour: this.colour,
            playerRadius: this.radius,
            playerHP: this.HP,
            playerMaxHP: this.maxHP,
            gunBullets: this.gun.getRemainingBullets(),
            gunCapacity: this.gun.getAmmoCapacity()
        }
    }

    // Returns this Player's ID
    getPlayerID() {
        return this.playerID;
    }

	// Decrease HP for this player
	decreaseHP(damage) {
		this.HP -= damage;
	}

	// Increase HP for this player
	increaseHP(hp, overload) {
		// The mobile feature allows you to overload your health
		if (overload) {
			if (this.HP + hp < 110) {
				this.HP += hp;
			} else {
				this.HP = 110;
			}
		}
	}

	// Get this player's HP 
	getHP() {
		return this.HP;
	}

	// Get this player's max HP
	getMaxHP() {
		return this.maxHP;
	}

	setUsingScope() {
		this.isUsingScope = true;
	}

	// Return true if the player is in a bush
	isHidden() {
		return this.hidden;
	}

	// Return this player's gun
	getPlayerGun() {
		return this.gun;
	}

	// Change this player's movement speed
	setMovementSpeed(newSpeed) {
		this.movementSpeed = newSpeed;
	}

	// Get this player's living status
	isDead() {
		return this.HP <= 0;
	}

	// Returns a string representation of the Player's current location
	toString() {
		return "Player: " + this.position.toString() + " " + this.velocity.toString();
	}

	// Note that this.x and this.y is the ACTUAL location of the player
	setPlayerPosition() {
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Get the position of this player
	getPlayerPosition() {
		return new Pair(this.x, this.y);
	}

	// When the human player moves the mouse, need to move the "direction" of the player's hands accordingly
	setCursorDirection(xCoordinate, yCoordinate) {
		this.cursorX = xCoordinate;
        this.cursorY = yCoordinate;

		// Calculate the cursor position relative to the canvas, as a unit vector
		let relativeX = xCoordinate - this.x - (this.stage.getCanvasWidth() / 2 - this.x);
		let relativeY = yCoordinate - this.y - (this.stage.getCanvasHeight() / 2 - this.y);
		this.cursorDirection = new Pair(relativeX, relativeY);
        this.cursorDirection.normalize();
        
        this.handX = this.x + this.cursorDirection.x * this.radius;
		this.handY = this.y + this.cursorDirection.y * this.radius;
		this.setDirectionLine(xCoordinate, yCoordinate);
		// console.log(`Cursor direction is (${xCoordinate},${yCoordinate})`);
	}

	// Set direction for which the player should move
	setMovementDirection(dx, dy) {
		this.hidden = false;
		this.dx = dx;
		this.dy = dy;
        this.setVelocity();
        
        // Used to calculate a new direction line
        this.handX = this.x + this.cursorDirection.x * this.radius;
		this.handY = this.y + this.cursorDirection.y * this.radius;
		this.setDirectionLine(this.cursorX, this.cursorY);
	}

	// When human player moves the mouse, need to move the bullet from the "direction" of the player's hands accordingly
	setFiringDirection(xCoordinate, yCoordinate) {
		if (!this.isDead()) {
			const firingVector = new Pair(xCoordinate - this.x - (this.stage.getCanvasWidth() / 2 - this.x), yCoordinate - this.y - (this.stage.getCanvasHeight() / 2 - this.y));
			firingVector.normalize();
            const bulletRadius = 5;
            
			// If the player is using a rifle, shoot 3 times (burst fire)
			if (this.gun.getAmmoCapacity() == 200) {
				this.gun.shootBurst(this.position, this.cursorDirection, firingVector, "rgba(0,0,0,1)", bulletRadius);
			} else {
				this.gun.shoot(this.position, this.cursorDirection, firingVector, "rgba(0,0,0,1)", bulletRadius);
			}
		}
	}


	// When the player moves around, or the mouse moves, generate a new direction line from player to cursor
	setDirectionLine(xCoordinate, yCoordinate) {
		// Remove the previous direction line
		this.stage.removeActor(this.directionLine);

		// Only use this when the player picks up the powerup
		if (!this.isDead() && this.isUsingScope) {
			// Create a line between the player and the location of the mouse cursor
			let lineColour = "rgba(255,0,0,0.7)";
			let lineDestinationX = xCoordinate - (this.stage.getCanvasWidth() / 2 - this.x);
			let lineDestinationY = yCoordinate - (this.stage.getCanvasHeight() / 2 - this.y);
            this.directionLine = new Line(this.handX, this.handY, lineDestinationX, lineDestinationY, 2, lineColour);
			this.stage.addActor(this.directionLine);
		}
	}

	// Add speed to the player (combined with direction, this makes a vector)
	setVelocity() {
		const speedMultiplier = this.movementSpeed;
		this.velocity.x = this.dx * speedMultiplier;
		this.velocity.y = this.dy * speedMultiplier;
	}

	// Check for collisions between this player and other actors
	// Return the type of actor it collides with, else null
	checkForCollisions(destinationX, destinationY) {
		let collidesPlayer = false;
		let collidesCrate = false;
		let crateCollidingDirection = "";
		

		// Check for collision with buffs and debuffs (Bushes, HP, ammo, speed boost, RDS)
		let actorsList = this.stage.getEnvironmentActors();
		for (let i = 0; i < actorsList.length; i++) {
			// Only the human Player should pick up buffs / debuffs
			if (this instanceof Player) {
				// Player collides with Bush
				if (actorsList[i] instanceof BushEnv) {
					let bushPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - bushPosition.x;
					let dy = destinationY - bushPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy);

					// Make sure player is almost fully within the bush
					if (distance < this.radius / 4 + actorsList[i].getRadius() / 2) {
						// console.log("player collision detected -- Player with Bush");
						this.hidden = true;
					}
				}
				// Player collides with Ammo
				else if (actorsList[i] instanceof AmmoEnv) {
					// Check if player is within the Ammo
					let ammoPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - ammoPosition.x;
					let dy = destinationY - ammoPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					// The player should only pick up ammo if they are not full
					if (distance < this.radius + actorsList[i].getRadius()) {
						if (this.getPlayerGun().getRemainingBullets() < this.getPlayerGun().getAmmoCapacity()) {
							// console.log("player collision detected -- Player with Ammo");
							this.stage.removeActor(actorsList[i]);

							const bulletsToRefill = 5;
							const bulletDifference = this.getPlayerGun().getAmmoCapacity() - this.getPlayerGun().getRemainingBullets();
							if (bulletDifference < bulletsToRefill) {
								this.getPlayerGun().reloadGun(bulletDifference);
							} else {
								this.getPlayerGun().reloadGun(10);
							}
						}
					}
				}
				// Player collides with HP Pot
				else if (actorsList[i] instanceof HealthPotEnv) {
					// Check if player is within the HP pot
					let HPPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - HPPosition.x;
					let dy = destinationY - HPPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					// Recover HP for the player
					if (distance < this.radius + actorsList[i].getRadius()) {
						// console.log("player collision detected -- Player with HP");
						if (this.getHP() < this.getMaxHP()) {
							this.increaseHP(5);
							this.stage.removeActor(actorsList[i]);
						}
					}
				}
				// Player collides with Speed boost
				else if (actorsList[i] instanceof SpeedBoostEnv) {
					// Check if player is within the HP pot
					let speedBoostPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - speedBoostPosition.x;
					let dy = destinationY - speedBoostPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					// Give the player a speed boost
					if (distance < this.radius + actorsList[i].getRadius()) {
						// console.log("player collision detected -- Player with Speed boost");
						this.setMovementSpeed(12);
						this.stage.removeActor(actorsList[i]);
					}
				}
				// Player collides with small gun
				else if (actorsList[i] instanceof SmallGunEnv) {
					// Check if player is within the small gun
					let smallGunPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - smallGunPosition.x;
					let dy = destinationY - smallGunPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					if (distance < this.radius + actorsList[i].getRadius()) {
						// console.log("player collision detected -- Player with Small gun");
                        
						// "Upgrade" the player gun only if they had an empty gun before
						if (this.getPlayerGun().getAmmoCapacity() == 0) {
                            this.stage.removeActor(actorsList[i]);
							this.gun = new Gun(this.stage, 20, 40, 300, 15, 0, 5, this);
						}
					}
				}
				// Player collides with big gun
				else if (actorsList[i] instanceof BigGunEnv) {
					// Check if player is within the big gun
					let bigGunPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - bigGunPosition.x;
					let dy = destinationY - bigGunPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					if (distance < this.radius + actorsList[i].getRadius()) {
                        // console.log("player collision detected -- Player with big gun");
                        
                        // Player should only pick up big gun if they don't hold it yet
                        if (this.getPlayerGun().getAmmoCapacity() < 200) {
                            this.stage.removeActor(actorsList[i]);
                            // "Upgrade the player gun"
                            this.gun = new Gun(this.stage, 100, 200, 1600, 20, 0, 5, this);
                        }
					}
				}
				// Player collides with RDS
				else if (actorsList[i] instanceof ScopeEnv) {
					// Check if player is within the scope
					let scopePosition = actorsList[i].getStartingPosition();
					let dx = destinationX - scopePosition.x;
					let dy = destinationY - scopePosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					if (distance < this.radius + actorsList[i].getRadius()) {
						// Player should only pick up RDS if they already have a gun
						if (this.getPlayerGun().getAmmoCapacity() != 0) {
							// console.log("player collision detected -- Player with Scope");
							this.setUsingScope();
							this.stage.removeActor(actorsList[i]);
						}
					}
				}
			}
		}

        // Check if the player (a circle) will collide with other players (also circles)
		let playersList = this.stage.getPlayerActors();
		for (let i = 0; i < playersList.length; i++) {
			// Check if the player is ANOTHER player
			if (playersList[i] == this) {
				// Skip this collision detection (player cannot collide with self)
				continue;
			}

			let playerPosition = playersList[i].getPlayerPosition();
			let dx = destinationX - playerPosition.x;
			let dy = destinationY - playerPosition.y;
			let distance = Math.sqrt(dx * dx + dy * dy) + 10;

			// player collides with the player
			if (distance < this.radius + playersList[i].getRadius()) {
				// console.log("player collision detected -- player with player");
				collidesPlayer = true;
				break;
			}
		}

		// Check for crate collision
		if (!collidesPlayer) {
			// Check if the player will collide with any crate
			let crateList = this.stage.getCrateActors();
			for (let i = 0; i < crateList.length; i++) {
				let crateObject = crateList[i];

				// Check for collision with Crates
				// https://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle
				// players only collide with Crates (guaranteed to have height and width)
				let objectPosition = crateList[i].getStartingPosition();

				// Check which corner the player is closest to
				let destinationPair = new Pair(destinationX, destinationY);
				let distanceToTopLeft = distanceBetweenTwoPoints(destinationX, destinationY, objectPosition.x, objectPosition.y);
				let distanceToBottomRight = distanceBetweenTwoPoints(destinationX, destinationY, objectPosition.x + crateObject.getWidth(), objectPosition.y + crateObject.getHeight());
				if (distanceToTopLeft < distanceToBottomRight) {
					crateCollidingDirection = "TopLeft";
				} else {
					crateCollidingDirection = "BottomRight";
				}

				// x and y distance between the player (a circle) and the Crate (a rectangle)
				let distanceX = Math.abs(this.x - objectPosition.x - crateObject.getWidth() / 2);
				let distanceY = Math.abs(this.y - objectPosition.y - crateObject.getHeight() / 2);

				// If the distance between the player and Crate is longer than the player radius + half(Crate Width), we know they are not colliding
				if ((distanceX > ((crateObject.getWidth() / 2) + this.radius) || distanceY > ((crateObject.getWidth() / 2) + this.radius))) {
					continue;
				}
				// If the distance between the player and Crate is too short (indicating that they are colliding)
				else if (distanceX <= (crateObject.getWidth() / 2) || distanceY <= (crateObject.getHeight() / 2)) {
					// console.log("player collision detected -- player with Crate");
					collidesCrate = true;
					break;
				}
				// Check if the corners of the player and Crate are colliding
				else {
					let dx = distanceX - crateObject.getWidth() / 2;
					let dy = distanceY - crateObject.getHeight() / 2;
					if (dx * dx + dy * dy <= (this.radius * this.radius)) {
						// console.log("player collision detected -- player with Crate");
						collidesCrate = true;
						break;
					}
				}

			}
		}
		if (collidesPlayer) {
			return "player";
		} else if (collidesCrate) {
			return "crate" + crateCollidingDirection;
		}
		return false;
	}

	// Take one "step" for animation
	step() {
		if (!this.isDead()) {
            this.setDirectionLine(this.cursorX, this.cursorY);

			// Check if where we are proposing to move will cause a collision
			let destinationX = this.position.x + this.velocity.x;
			let destinationY = this.position.y + this.velocity.y;
			let collided = this.checkForCollisions(destinationX + 10, destinationY + 10);

			// Collision with another actor
			if (collided) {
				// console.log("Collided with another actor!");
				// Move the player back so they are no longer colliding
				if (collided == "player") {
					this.position.x = this.position.x - (this.velocity.x / 10);
					this.position.y = this.position.y - (this.velocity.y / 10);
					this.setPlayerPosition();
				} else if (collided == "crateTopLeft") {
					// Move the player back so they are no longer colliding
					this.position.x = this.position.x - 5;
					this.position.y = this.position.y - 5;
					this.setPlayerPosition();
				} else if (collided == "crateBottomRight") {
					// Move the player back so they are no longer colliding
					this.position.x = this.position.x + 5;
					this.position.y = this.position.y + 5;
					this.setPlayerPosition();
				}
			}
			// Check for collision of player against world map
			else if (this.stage.collidesWithWorldBorder(this.position.x + this.velocity.x, this.position.y + this.velocity.y, 30)) {
				// console.log("Collision with world border!");

				// Check which border we hit
				let tolerance = 30;
				let destinationX = this.position.x + this.velocity.x;
				let destinationY = this.position.y + this.velocity.y;

				// Hit left border
				if (destinationX < 0 + tolerance) {
					destinationX = this.position.x - this.velocity.x;
				}
				// Hit right border
				else if (destinationX > this.stage.stageWidth - tolerance) {
					destinationX = this.position.x - this.velocity.x;
				}
				// Hit top border
				else if (destinationY < 0 + tolerance) {
					destinationY = this.position.y - this.velocity.y;
				}
				// Hit bottom border
				else if (destinationY > this.stage.stageHeight - tolerance) {
					destinationY = this.position.y - this.velocity.y;
				}

				// Move the Player away from the world border
				this.setVelocity();
				this.position.x = destinationX;
				this.position.y = destinationY;
				this.setPlayerPosition();
			}
			else {
				// Update the player's location
				this.position.x = destinationX;
				this.position.y = destinationY;
				this.setPlayerPosition();
			}
		}
	}
}