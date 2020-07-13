import React from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/row";
import Col from "react-bootstrap/col";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { Link } from "react-router-dom";
import Image from "react-bootstrap/Image";
import ListGroup from "react-bootstrap/ListGroup";
import Logo from "../../assets/warcry-logo-small.png";
import HelpImg from "../../assets/question-mark.png";
import "../../css/Lobby.css";

// Display a list of lobbies currently stored on the server
class LobbyList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			lobbies: [],
		};
		this.renderHelpPopover = this.renderHelpPopover.bind(this);
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

	// Displays when user hovers over help button
	renderHelpPopover() {
		return(
			<Popover id="popover-basic">
                <Popover.Title as="h3" style={{ textAlign: "center" }}>Lobby Help</Popover.Title>
                <Popover.Content>
					<ListGroup variant="flush">
						<ListGroup.Item>Join an open multiplayer lobby by selecting that lobby</ListGroup.Item>
						<ListGroup.Item>You cannot join a lobby while a game is ongoing</ListGroup.Item>
						<ListGroup.Item>You may create your own multiplayer or singleplayer lobby</ListGroup.Item>
						<ListGroup.Item>Only lobby owners are allowed to start a game</ListGroup.Item>
						<ListGroup.Item>Lobbies are closed when the lobby owner leaves</ListGroup.Item>
					</ListGroup>
                </Popover.Content>
			</Popover>
		);
	};
	  

	render() {
		return (
			<div className="lobby-page">
				<Row className="align-items-center">
                    <Col>
						<h1>Game Lobbies</h1>
                    </Col>
                </Row>
				<hr />
				<Container fluid={true}>
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
												{lobby.gameInProgress ===
												true ? (
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
										<p>There are currently no lobbies</p>
										Click below to create one!
									</td>
								</tr>
							)}
						</tbody>
					</Table>

					<Row className="align-items-center" noGutters>
						<Col>
							<Button
								variant="primary"
								onClick={this.props.createLobby}
								className="lobby-list-left-button"
							>
								Create Multiplayer Lobby
							</Button>
						</Col>
						<Col>
							<Button
								variant="primary"
								disabled
								className="lobby-list-right-button"
							>
								Create Singleplayer Lobby
							</Button>
						</Col>
					</Row>

					
					<Link to="/dashboard" style={{ textDecoration: "none" }}>
						<Button
							variant="dark"
							onClick={this.props.returnToDashboard}
							className="lobby-list-button"
							block
						>
							Home
						</Button>
					</Link>
					

				</Container>

				<Row className="lobby-list-footer align-items-center">
                    <Col xs={{ span: 3, offset: 10 }}>
                        <OverlayTrigger trigger="click" placement="top" overlay={this.renderHelpPopover()}>
                            <span id="lobby-help-icon">
                                <Image src={HelpImg} alt={"Help-Button-Image"} style={{maxHeight: "25px", maxWidth: "25px"}} />
                            </span>
                        </OverlayTrigger>
                    </Col>
                </Row>
			</div>
		);
	}
}

export default LobbyList;
