import React from "react";
import Button from "react-bootstrap/Button";
import "../../css/CloseLobby.css";

// Display a detailed view about a specific lobby on the server
class CloseLobby extends React.Component {
	constructor(props) {
		super(props);
    }
    
	render() {
		return (
            <div className="lobby-page">
                <h1> Lobby Closed! </h1>
                <h4> The lobby owner closed this lobby. </h4>
        
                <Button
                    variant="success"
                    block
                    onClick={() => {this.props.handleCloseLobbyDialog()}}
                >
                    Go back
                </Button>
            </div>
        );
	}
}

export default CloseLobby;
