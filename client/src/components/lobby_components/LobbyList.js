import React from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import "../../css/Lobby.css";

// TODO: Improve styling, add more functionality to this page

// Display a list of lobbies currently stored on the server
class LobbyList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			lobbies: [],
		};
	}

	componentDidMount() {
		this.setState({ lobbies: this.props.lobbies });
	}

	// Update lobbies passed down from parent LobbiesPage
	componentDidUpdate(prevProps) {
		if (prevProps.lobbies !== this.props.lobbies) {
			this.setState({ lobbies: this.props.lobbies });
		}
	}

	render() {
		return (
			<div className="lobby-page">
				<h1>LOBBIES</h1>
				<p>
					{" "}
					To play a game, join a pre-existing lobby by clicking "Join
					Lobby", or create your own lobby below. Note that if you
					Create a Lobby and start a game by yourself, you will
					automatically win. The game will then end shortly, so you
					won't be able to control your player (as the canvas is
					disabled). You will need to start a game with at least two
					players in the lobby.
				</p>
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
						{this.state.lobbies.length > 0 &&
							this.state.lobbies.map((lobby, index) => {
								return (
									<tr key={index}>
										<td>{lobby.id}</td>
										<td>
											{lobby.numPlayers} /{" "}
											{lobby.maxLobbySize}{" "}
										</td>
										<td>
											{lobby.gameInProgress === true ? (
												<p>Ongoing Game</p>
											) : lobby.numPlayers >=
											  lobby.maxLobbySize ? (
												<Button
													variant="danger"
													disabled
													block
													className="disable-cursor"
												>
													Lobby Full
												</Button>
											) : (
												<Button
													variant="outline-success"
													block
													onClick={() => {
														this.props.joinLobby(
															lobby.id
														);
													}}
												>
													Join Lobby
												</Button>
											)}
										</td>
									</tr>
								);
							})}
						{/* No lobbies to render */}
						{this.state.lobbies.length < 1 && (
							<tr key="no-lobby">
								<td colSpan="3">
									No lobbies, click below to make one
								</td>
							</tr>
						)}
					</tbody>
				</Table>

				<Button
					variant="success"
					block
					onClick={this.props.createLobby}
				>
					Create Lobby
				</Button>
				<Button
					variant="primary"
					block
					onClick={this.props.returnToDashboard}
				>
					Go back to Dashboard
				</Button>
			</div>
		);
	}
}

export default LobbyList;
