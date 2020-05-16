import React from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import "../../css/Lobby.css";

// Display a detailed view about a specific lobby on the server
class Lobby extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
            lobbies: null,
            lobbyPlayers: [],
            lobbyId: null,
            isLobbyOwner: false,
            playerId: null,
            lobbyOwnerId: null,
            maxLobbySize: null
        };

        this.determineLobbyInfo = this.determineLobbyInfo.bind(this);
    }

    // Calculate the lobby players and lobby owner for this lobby
    determineLobbyInfo() {
        console.log("Inside");
        console.log(this.state.lobbies);
        if (this.state.lobbies) {
            console.log("Inside2");
            for (let i = 0; i < this.state.lobbies.length; i++) {
                console.log(this.state.lobbies[i].id);
                console.log(this.state.lobbyId);
                if (this.state.lobbies[i].id == this.state.lobbyId) {
                    console.log("Updating lobby players");
                    this.setState({ 
                        lobbyPlayers: this.state.lobbies[i].lobbyPlayers,
                        lobbyOwnerId: this.state.lobbies[i].lobbyOwner,
                        maxLobbySize: this.state.lobbies[i].maxLobbySize
                    });
                    // this.setState({ 
                    //     lobbyPlayers: this.state.lobbies[i].lobbyPlayers,
                    //     lobbyOwnerId: this.state.lobbies[i].lobbyOwner
                    // }, console.log(this.state.lobbies[i].lobbyPlayers));
                    break;
                }
            }
        }
    }

    componentDidMount() {
        console.log(this.props);
        this.setState({ 
            lobbies: this.props.lobbies,
            lobbyId: this.props.lobbyId,
            playerId: this.props.playerId
        }, () => {
            this.determineLobbyInfo()
        });
    }
    
    // Update this child component's state depending on parent state changes
    componentDidUpdate(prevProps) {
        if (prevProps.lobbies !== this.props.lobbies) {
            console.log("Updated lobbies");
            // Note: setState is async, so we assign it a callback determineLobbyInfo()
            // Q: This call to determineLobbyInfo() only works properly if it is put in an arrow function... why?
            // It doesn't work if it is not placed in a function
            this.setState({ lobbies: this.props.lobbies }, () =>{
                // console.log(this.state.lobbies);
                this.determineLobbyInfo();
            });
        }
        if (prevProps.lobbyId !== this.props.lobbyId) {
            // console.log("Updated lobbyId");
            // console.log(this.props.lobbyId);
            this.setState({ lobbyId: this.props.lobbyId });
        }
        if (prevProps.isLobbyOwner !== this.props.isLobbyOwner) {
            // console.log("Updated isLobbyOwner");
            // console.log(this.props.isLobbyOwner);
            this.setState({ isLobbyOwner: this.props.isLobbyOwner });
        }
        if (prevProps.playerId !== this.props.playerId) {
            // console.log("Updated lobbies");
            // console.log(this.props.playerId);
            this.setState({ playerId: this.props.playerId });
        }

    }

	render() {
		return (
            <div className="lobby-page">
                <h1>Lobby {this.state.lobbyId}</h1>
                <h4>Size: {this.state.lobbyPlayers.length} / {this.state.maxLobbySize} </h4>
                <br />
                
                {/* Display all players in lobby */}
                <Table bordered size="sm">
					<thead>
						<tr>
							<th> Players </th>
							<th> Lobby Owner </th>
                            <th> In Game? </th>
						</tr>
					</thead>
					<tbody>
                        {this.state.lobbyPlayers.map((lobbyPlayer, index) => {
                            return this.state.playerId == lobbyPlayer ? 
                            (
                                <tr key={index} style={{color: "blue"}}>
                                    <td>{lobbyPlayer}</td>
                                    <td>
                                        {this.state.lobbyOwnerId == lobbyPlayer ? (<p> Yes </p>) : (<p> No</p>)}
                                    </td>
                                </tr>
                            )
                            :
                                <tr key={index}>
                                    <td>{lobbyPlayer}</td>
                                    <td>
                                        {this.state.lobbyOwnerId == lobbyPlayer ? (<p> Yes </p>) : (<p> No</p>)}
                                    </td>
                                </tr>
                        })}
					</tbody>
				</Table>

                {(this.state.lobbyOwnerId == this.state.playerId) ? 
                    // Lobby view for the lobby owner
                    <p>
                        You are lobby owner! You must have at least two players in the lobby to start the game
                        <Button
                            variant="success"
                            block
                            disabled={this.state.lobbyPlayers.length == 1}
                            className={(this.state.lobbyPlayers.length == 1) ? "disable-cursor" : ""}
                            onClick={() => {this.props.handleStartGame(this.state.playerId, this.state.lobbyId)}}
                        >
                            Start Game
                        </Button>
                        <Button
                            variant="danger"
                            block
                            onClick={() => {this.props.handleDeleteLobby(this.state.playerId, this.state.lobbyId)}}
                        >
                            Delete Lobby
                        </Button>
                    </p>
                :
                    // Lobby view for all other lobby members
                    <p> Welcome. Please wait for lobby owner to start game. Your game will automatically load once the lobby owner starts the game
                        <Button
                            variant="danger"
                            block
                            onClick={() => {this.props.handleLeaveLobby(this.state.playerId, this.state.lobbyId)}}
                        >
                            Leave Lobby
                        </Button>
                    </p>
                }
            </div>
        );
	}
}

export default Lobby;
