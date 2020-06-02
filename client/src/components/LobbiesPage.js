import React from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { Link } from 'react-router-dom';
import "../css/LobbiesPage.css";

// const localIPAddress = "192.168.2.235"; // NOTE: Modify this line to connect on your mobile device -- see features.txt to see what to put here
const localIPAddress = "localhost";
const wssServerURL = `ws://${localIPAddress}:10000`;
// const clientSocket = new WebSocket(wssServerURL);

class LobbiesPage extends React.Component {
	_isMounted = false;
	constructor(props) {
		super(props);
		this.state = {
			showGameView: false,
			playerId: props.playerId,
			isMobilePlayer: false,
			userWon: false,
			joinedLobbyId: null,
			lobbies: [],

			// Player movement code
			movingUp: false,
			movingLeft: false,
			movingDown: false,
			movingRight: false,
			horizontalDirection: 0,
			verticalDirection: 0,
			clientSocket: new WebSocket(wssServerURL)
		};

		// Set ref for canvas (alternative to document.getElementById(...))
		this.canvasRef = React.createRef();
		this.mobileCanvasRef = React.createRef();

		// Mobile functions
		this.handleMobileConnection = this.handleMobileConnection.bind(this);
		this.healPlayer = this.healPlayer.bind(this);
		this.activateHealingCanvas = this.activateHealingCanvas.bind(this);
		this.updateTouch = this.updateTouch.bind(this);

		// Controller functions
		this.returnToDashboard = this.returnToDashboard.bind(this);
		this.sendMovement = this.sendMovement.bind(this);
		this.sendMouseClick = this.sendMouseClick.bind(this);
		this.sendMouseMove = this.sendMouseMove.bind(this);
		this.initializeServerGame = this.initializeServerGame.bind(this);
		this.handleCreateLobby = this.handleCreateLobby.bind(this);
		this.handleJoinLobby = this.handleJoinLobby.bind(this);
		this.handleLeaveLobby = this.handleLeaveLobby.bind(this);
		this.handleDeleteLobby = this.handleDeleteLobby.bind(this);
		this.handleStartGame = this.handleStartGame.bind(this);
		this.handleLeaveGame = this.handleLeaveGame.bind(this);

		// Keyboard/mouse listener functions
		this.handleKeyPress = this.handleKeyPress.bind(this);
		this.handleKeyRelease = this.handleKeyRelease.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseDown = this.handleMouseDown.bind(this);
	}

	// Return to dashboard, close sockets, and reset state
	returnToDashboard() {
		// clientSocket.close();
		this.props.handleDash();
		this.setState({
			showGameView: false,
			joinedLobbyId: null,
			userWon: false,
			lobbies: []
		});
	}

	// Runs when the page unloads (eg. a game finishes)
	componentWillUnmount() {
		// This variable is used to prevent unnecessary setstates on this unmounted component
		this._isMounted = false;
	}

	// Runs when the page loads
	componentDidMount() {
		this._isMounted = true;
		// console.log("Starting socket connection");
		// console.log("This client's player ID is " + this.state.playerId);

		// When the server establishes the connect with the client here
		this.state.clientSocket.onopen = () => {
			// console.log("Front-end connected to the web server");

			let initialUpdate = JSON.stringify({
				pid: this.state.playerId,
				type: "identify-client",
			});
			this.state.clientSocket.send(initialUpdate);
		};

		this.state.clientSocket.onclose = (event) => {
			// alert(
			// 	"closed code:" +
			// 		event.code +
			// 		" reason:" +
			// 		event.reason +
			// 		" wasClean:" +
			// 		event.wasClean
			// );
		};

		// When the client receives a message from the server, we will execute this event
		this.state.clientSocket.onmessage = (event) => {
			let serverUpdate = JSON.parse(event.data);
			// console.log(serverUpdate);

			// Update the client game model state
			if (serverUpdate && serverUpdate.type == "stage-update") {
				// console.log(serverUpdate);
				window.updateStageModel(
					serverUpdate.playerActors,
					serverUpdate.bulletActors,
					serverUpdate.environmentActors,
					serverUpdate.numAlive,
					serverUpdate.hasEnded
				);
			}
			// Initialize client game model state by receiving initial model state from server
			else if (serverUpdate && serverUpdate.type == "stage-initialization") {
				if (this._isMounted) {
					this.setState({ showGameView: true });
				}
				// console.log("Starting client stage model");

				// Users on a browser will be able to player the game
				if (this.state.isMobilePlayer === false) {
					// Initialize state of the client model
					window.setupStageModel(
						this.canvasRef.current,
						serverUpdate.playerActors,
						serverUpdate.bulletActors,
						serverUpdate.crateActors,
						serverUpdate.environmentActors,
						serverUpdate.startTime,
						serverUpdate.numAlive,
						serverUpdate.numPlayers,
						this.state.playerId
					);

					// Start the client model interval (for re-drawing)
					window.startStageModel();
					document.addEventListener("keydown", this.handleKeyPress);
					document.addEventListener("keyup", this.handleKeyRelease);
					document.addEventListener("mousemove", this.handleMouseMove);
					document.addEventListener("mousedown", this.handleMouseDown);
				}
			}
			// Get list of lobbies
			else if (serverUpdate && serverUpdate.type == "view-lobbies") {
				// console.log("Updating lobby view");
				if (this._isMounted) {
					this.setState({
						lobbies: serverUpdate.lobbies
					});
				}
			}
			// Created a lobby, receive the lobby id
			else if (serverUpdate && serverUpdate.type == "new-lobby") {
				if (this._isMounted) {
					this.setState({
						lobbies: serverUpdate.lobbies,
						joinedLobbyId: serverUpdate.newLobbyId,
					});
				}
			}
			// Joined a lobby successfully
			else if (serverUpdate && serverUpdate.type == "joined-lobby") {
				// console.log("Setting state of lobbies");
				if (this._isMounted) {
					this.setState({
						joinedLobbyId: serverUpdate.lobbyId
					});
				}
			}
			// User left their lobby successfully
			else if (serverUpdate && serverUpdate.type == "left-lobby" && serverUpdate.status == "success") {
				if (this._isMounted) {
					this.setState({
						joinedLobbyId: null
					});
				}
			}
			// Lobby owner deleted lobby successfully
			else if (serverUpdate && serverUpdate.type == "deleted-lobby" && serverUpdate.status == "success") {
				if (this._isMounted) {
					this.setState({
						lobbies: serverUpdate.lobbies,
						joinedLobbyId: null
					});
				}
			}
			// Re-initialize the stage (user loss or won)
			else if (serverUpdate && serverUpdate.type == "stage-termination") {
				if (serverUpdate.lobbyID == this.state.joinedLobbyId) {
					document.removeEventListener("keydown", this.handleKeyPress);
					document.removeEventListener("keyup", this.handleKeyRelease);
					document.removeEventListener("mousemove", this.handleMouseMove);
					document.removeEventListener("mousedown", this.handleMouseDown);

					window.stopStageGame();

					// Check if user won
					if (serverUpdate.winningPID == this.state.playerId && this._isMounted) {
						this.setState({
							userWon: true
						});
					}
				}
			}
		};
	}

	// Handle a mobile connection to the game
	handleMobileConnection(lobbyId) {
		this.setState({
			isMobilePlayer: true,
			joinedLobbyId: lobbyId,
			showGameView: true
		});
	}

	// Given a specified PID, heal that user if it exists in the game
	healPlayer(playerId, lobbyId) {
		let clientUpdate = JSON.stringify({
			type: "heal-player",
			pid: playerId,
			lobbyId: lobbyId,
		});
		this.state.clientSocket.send(clientUpdate);
		this.activateHealingCanvas();
	}

	// Activate the healing canvas on mobile
	activateHealingCanvas() {
		let mobileCanvas = this.mobileCanvasRef.current;
		let context = mobileCanvas.getContext("2d");
		context.fillStyle = "rgb(29,107,12)";
		context.fillRect(0, 0, mobileCanvas.width, mobileCanvas.height);
		// this.mobileCanvasRef.current.addEventListener('touchend', (event) => { this.updateTouch("touchend", event); });
		this.mobileCanvasRef.current.addEventListener('touchmove', (event) => { this.updateTouch("touchmove", event); });
		// this.mobileCanvasRef.current.addEventListener('touchstart', (event) => { this.updateTouch("touchstart", event) ;});
	}

	updateTouch(eventType, event) {
		if (eventType == "touchmove") {
			this.healPlayer(this.state.playerId, this.state.joinedLobbyId);
		}
		event.preventDefault();
	}


	// A player can join a preexisting lobby on the server
	handleJoinLobby(lobbyId) {
		// console.log("Client tries to join lobby with id " + lobbyId);

		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			type: "join-lobby",
			lobbyId: lobbyId,
		});
		this.state.clientSocket.send(clientUpdate);
	}

	// A player can leave the lobby they are in
	handleLeaveLobby(playerId, lobbyNumber) {
		// console.log("Client tries to leave lobby with id " + lobbyNumber);

		let clientUpdate = JSON.stringify({
			pid: playerId,
			type: "leave-lobby",
			lobbyId: lobbyNumber,
		});
		this.state.clientSocket.send(clientUpdate);
	}

	// A player creates a lobby on the server. That player automatically joins the lobby as well
	handleCreateLobby() {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			type: "create-lobby",
		});
		this.state.clientSocket.send(clientUpdate);
	}

	// A player deletes the lobby he is in 
	handleDeleteLobby(playerId, lobbyId) {
		let clientUpdate = JSON.stringify({
			type: "delete-lobby",
			pid: playerId,
			lobbyId: lobbyId
		})
		this.state.clientSocket.send(clientUpdate);
	}

	// A lobby owner attempts to starts a game on a lobby on the server
	handleStartGame(ownerId, lobbyId) {
		// Note that only the owner of a valid lobby may start a game
		let clientUpdate = JSON.stringify({
			pid: ownerId,
			type: "start-game",
			lobbyId: lobbyId,
		});
		this.state.clientSocket.send(clientUpdate);
	}

	// User leaves game
	handleLeaveGame(playerId, lobbyId) {
		// Note that leaving a game also causes you to leave the lobby
		let clientUpdate = JSON.stringify({
			type: "leave-lobby",
			pid: playerId,
			lobbyId: lobbyId,
		});
		this.state.clientSocket.send(clientUpdate);
		window.stopStageGame();

		// Unhook keyboard and mouse listeners
		document.removeEventListener("keydown", this.handleKeyPress);
		document.removeEventListener("keyup", this.handleKeyRelease);
		document.removeEventListener("mousemove", this.handleMouseMove);
		document.removeEventListener("mousedown", this.handleMouseDown);

		this.returnToDashboard();
	}

	// Sends this player's movement to server
	sendMovement(horizontalDirection, verticalDirection) {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			lobbyId: this.state.joinedLobbyId,
			type: "move",
			x: horizontalDirection,
			y: verticalDirection,
		});
		this.state.clientSocket.send(clientUpdate);
	}

	// Sends this player's mouse click to server
	sendMouseClick(xPosition, yPosition) {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			lobbyId: this.state.joinedLobbyId,
			type: "click",
			x: xPosition,
			y: yPosition,
		});
		this.state.clientSocket.send(clientUpdate);
	}

	// Sends this player's mouse click to server
	sendMouseMove(xPosition, yPosition) {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			lobbyId: this.state.joinedLobbyId,
			type: "cursor",
			x: xPosition,
			y: yPosition,
		});
		this.state.clientSocket.send(clientUpdate);
	}

	// A player attempts to starts a game on a lobby on the server
	initializeServerGame() {
		// Note that only the owner of a valid lobby may start a game
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			type: "start-game",
			lobbyId: this.state.joinedLobbyId,
		});
		this.state.clientSocket.send(clientUpdate);
	}

	// ----- KEYBOARD AND MOUSE LISTENER CODE --------------------------------------------
	// Captures any keyboard presses
	handleKeyPress(event) {
		// console.log("Pressed on key " + event.key);
		if (event && event.key) {
			let key = event.key.toLowerCase();

			// Check which key(s) were pressed; calculate movement direction
			if ("wasd".includes(key)) {
				if (key == "a") {
					this.setState({ movingLeft: true });
					this.setState({ horizontalDirection: -1 });
				}
				if (key == "d") {
					this.setState({ movingRight: true });
					this.setState({ horizontalDirection: 1 });
				}
				if (key == "w") {
					this.setState({ movingUp: true });
					this.setState({ verticalDirection: -1 });
				}
				if (key == "s") {
					this.setState({ movingDown: true });
					this.setState({ verticalDirection: 1 });
				}
				this.sendMovement(
					this.state.horizontalDirection,
					this.state.verticalDirection
				);
			}
		}
	}

	// When key is released, performs appropriate task
	handleKeyRelease(event) {
		// console.log("Released key " + event.key);
		if (event && event.key) {
			let key = event.key.toLowerCase();

			// A movement key is released; calculate new movement direction
			if ("wasd".includes(key)) {
				if (key == "a") {
					this.setState({ movingLeft: false });
					if (this.state.movingRight) {
						this.setState({ horizontalDirection: 1 });
					} else {
						this.setState({ horizontalDirection: 0 });
					}
				}
				if (key == "d") {
					this.setState({ movingRight: false });
					if (this.state.movingLeft) {
						this.setState({ horizontalDirection: -1 });
					} else {
						this.setState({ horizontalDirection: 0 });
					}
				}
				if (key == "w") {
					this.setState({ movingUp: false });
					if (this.state.movingDown) {
						this.setState({ verticalDirection: 1 });
					} else {
						this.setState({ verticalDirection: 0 });
					}
				}
				if (key == "s") {
					this.setState({ movingDown: false });
					if (this.state.movingUp) {
						this.setState({ verticalDirection: -1 });
					} else {
						this.setState({ verticalDirection: 0 });
					}
				}
				this.sendMovement(
					this.state.horizontalDirection,
					this.state.verticalDirection
				);
			}
		}
	}

	// Handle when the mouses buttons are pressed
	handleMouseDown(event) {
		let canvas = this.canvasRef.current;
		let xPosition = event.clientX - canvas.offsetLeft;
		let yPosition = event.clientY - canvas.offsetTop;
		// console.log(`{${xPosition}, ${yPosition}}`);

		// Only send valid mouse clicks (must be within canvas)
		if (xPosition >= 0 && yPosition >= 0) {
			// Send this action through websockets to the server
			this.sendMouseClick(xPosition, yPosition);
		}
	}

	// Handle mouse movement (movement os human's cursor)
	handleMouseMove(event) {
		let canvas = this.canvasRef.current;
		let xPosition = event.clientX - canvas.offsetLeft;
		let yPosition = event.clientY - canvas.offsetTop;
		// console.log(`{${xPosition}, ${yPosition}}`);

		// Only send valid mouse movements (must be within canvas)
		if (xPosition >= 0 && yPosition >= 0) {
			// Send this action through websockets to the server
			this.sendMouseMove(xPosition, yPosition);
		}
	}

	render() {
		// console.log("State of joined lobby id is " + this.state.joinedLobbyId);
		// Render the main lobby view
		if (this.state.joinedLobbyId === null) {
			return (
				<div className="lobby-page">
					<h1>LOBBIES</h1>
					<p> To play a game, join a pre-existing lobby by clicking "Join Lobby", or create your own lobby below. Note that if you Create a Lobby and start a game by yourself, you will automatically win. The game will then end shortly, so you won't be able to control your player (as the canvas is disabled). You will need to start a game with at least two players in the lobby.</p>
					<hr />
					<Table striped bordered hover size="sm">
						<thead>
							<tr>
								<th> Lobby ID </th>
								<th> Players </th>
								<th> Status </th>
							</tr>
						</thead>
						<tbody>
							{/* Render each lobby */}
							{this.state.lobbies.map((lobby, index) => {
								return (
									<tr key={index}>
										<td>{lobby.id}</td>
										<td>{lobby.numPlayers}</td>
										<td>
											{lobby.gameInProgress === true ? (
												<p>
													Ongoing Game
												</p>
											) : (
													<p>
														<Button
															variant="outline-success"
															block
															onClick={() => { this.handleJoinLobby(lobby.id) }}
														>
															Join Lobby
													</Button>
														<Button
															variant="outline-success"
															block
															onClick={() => { this.handleMobileConnection(lobby.id) }}
														>
															Connect Mobile Device
													</Button>
													</p>
												)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</Table>
					{this.state.lobbies.length < 1 && (
						<p> No lobbies, click below to make one </p>
					)}

					<Button
						variant="success"
						block
						onClick={this.handleCreateLobby}
					>
						Create Lobby
					</Button>
					<Link to="/dashboard">
						<Button
							variant="primary"
							block
						>
							Go back to Dashboard
						</Button>
					</Link>
				</div>
			);
		}

		// Render the individual lobby or game view
		else if (this.state.joinedLobbyId !== null) {
			// Render the game view for a regular browser connection
			if (this.state.showGameView && this.state.isMobilePlayer === false) {
				return (
					<div className="clientGameUI">
						<Container>
							<Row>
								<br />
								<canvas
									ref={this.canvasRef}
									id="stage"
									width="1200"
									height="800"
									className="clientCanvas"
								>
								</canvas>
							</Row>
							<Row>
								<Button
									variant="danger"
									onClick={() => { this.handleLeaveGame(this.state.playerId, this.state.joinedLobbyId) }}
									className="leaveGameButton"
									block
								>
									Quit game and lobby
								</Button>
							</Row>
							{this.state.userWon &&
								<Row>
									<h1> You won! To play another game, click on the button above</h1>
								</Row>
							}
						</Container>
					</div>
				)
			}
			// Render the game for a mobile player
			else if (this.state.showGameView && this.state.isMobilePlayer === true) {
				return (
					<div className="mobileUI">
						<Button
							variant="success"
							block
							disabled
						>
							Successfully connected to game
						</Button>
						<br />
						<center>
							<canvas
								ref={this.mobileCanvasRef}
								width="200"
								height="200"
								className="mobileClientCanvas"
								id="mobileStage"
							>
							</canvas>
						</center>
						<br />
						<Button
							variant="light"
							block
							size="lg"
							onClick={() => {
								this.activateHealingCanvas();
							}}
						>
							Activate Healing!
						</Button>
					</div>
				)
			}
			// Render the lobby view
			else {
				// Check to see if user is owner of lobby
				let isLobbyOwner = false;
				for (let i = 0; i < this.state.lobbies.length; i++) {
					if (this.state.lobbies[i].lobbyOwner == this.state.playerId) {
						isLobbyOwner = true;
						break;
					}
				}
				return (
					<div className="lobby-page">
						<h1>You are in Lobby {this.state.joinedLobbyId}</h1>
						{(isLobbyOwner) ?
							<p>
								You are lobby owner (only you can start the game)
								Note that if you start a game by yourself, you will automatically win. The game will then end shortly, so you won't be able to control your player (as the canvas is disabled). You will need to start a game with at least two players in the lobby.
								<Button
									variant="success"
									block
									onClick={() => { this.handleStartGame(this.state.playerId, this.state.joinedLobbyId) }}
								>
									Start Game
								</Button>
								<Button
									variant="danger"
									block
									onClick={() => { this.handleDeleteLobby(this.state.playerId, this.state.joinedLobbyId) }}
								>
									Delete Lobby
								</Button>
							</p>
							:
							<p> Welcome. Please wait for lobby owner to start game. Your game will automatically load once the lobby owner starts the game
								<Button
									variant="danger"
									block
									onClick={() => { this.handleLeaveLobby(this.state.playerId, this.state.joinedLobbyId) }}
								>
									Leave Lobby
								</Button>
							</p>
						}
					</div>
				);
			}
		}
	}
}

export default LobbiesPage;
