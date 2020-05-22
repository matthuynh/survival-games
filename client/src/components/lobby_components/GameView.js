import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "../../css/GameView.css";

// Display a detailed view about a specific lobby on the server
class GameView extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			playerId: null,
			joinedLobbyId: null,
			userWon: false,
			userLost: false,
			innerWidth: 0,
			innerHeight: 0,

			showMenuScreen: false,
		};

		this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
		this.openMenuScreen = this.openMenuScreen.bind(this);
		this.closeMenuScreen = this.closeMenuScreen.bind(this);
		this.handleKeyPress = this.handleKeyPress.bind(this);
	}

	componentDidMount() {
		this.setState({
			playerId: this.props.playerId,
			joinedLobbyId: this.props.joinedLobbyId,
			userWon: this.props.userWon,
			userLost: this.props.userLost,
		});

		this.updateWindowDimensions();
		window.addEventListener("resize", this.updateWindowDimensions);
		document.addEventListener("keydown", this.handleKeyPress, false);
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.updateWindowDimensions);
		document.removeEventListener("keydown", this.handleKeyPress, false);
	}

	// Update lobbies passed down from parent LobbiesPage
	componentDidUpdate(prevProps) {
		if (prevProps.playerId !== this.props.playerId) {
			this.setState({ playerId: this.props.playerId });
		}
		if (prevProps.joinedLobbyId !== this.props.joinedLobbyId) {
			this.setState({ joinedLobbyId: this.props.joinedLobbyId });
		}
		if (prevProps.userWon !== this.props.userWon) {
			this.setState({ userWon: this.props.userWon, showMenuScreen: true });
		}
		if (prevProps.userLost !== this.props.userLost) {
			this.setState({ userLost: this.props.userLost, showMenuScreen: true });
			console.log("Inside line 58");
		}
	}

	// Runs when the user resizes their browser screen
	updateWindowDimensions() {
		this.setState({
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
		});
		this.props.updateDimensions(window.innerWidth, window.innerHeight);
		// console.log(`Width: ${window.innerWidth}, Height: ${window.innerHeight}`);
	}

	openMenuScreen() {
		this.setState({ showMenuScreen: true });
	}

	closeMenuScreen() {
		this.setState({ showMenuScreen: false });
		console.log("inside line 78");
	}

	handleKeyPress(e) {
		if (e.keyCode === 27) {
			this.openMenuScreen();
		}
	}

	// TODO: Improve Modal styling. Consider disabling the ability to close the modal once the game ends
	render() {
		return (
			<div className="clientGameUI">
				<canvas
					ref={this.props.canvasRef}
					id="stage"
					width={this.state.innerWidth}
					height={this.state.innerHeight}
					className="clientCanvas"
				></canvas>

				<Modal
					show={this.state.showMenuScreen}
					onHide={this.closeMenuScreen}
					centered
				>
					<Modal.Header closeButton>
						<Modal.Title>Game Menu</Modal.Title>
						{this.state.userWon && <h1> You won! </h1>}
						{this.state.userLost && <h1> You lost! </h1>}
					</Modal.Header>
					<Modal.Body>
						<Button
							variant="success"
							onClick={this.closeMenuScreen}
							block
						>
							Back to game
						</Button>
						<Button
							variant="warning"
							onClick={() => {
								this.props.handleLeaveGame(
									this.state.playerId,
									this.state.joinedLobbyId
								);
							}}
							className="leaveGameButton"
							block
						>
							Leave game
						</Button>
					</Modal.Body>
					<Modal.Footer>
						How to play: Use WASD to move around. Walk over weapons and powerups to pick them up.
					</Modal.Footer>
				</Modal>
			</div>
		);
	}
}

export default GameView;
