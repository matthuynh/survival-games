import React from "react";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/row";
import Col from "react-bootstrap/col";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";
import HelpImg from "../assets/question-mark.png";
import { Link } from "react-router-dom";
import "../css/HelpPage.css";

class HelpPage extends React.Component {
	// Attaches event listener for key press
	componentDidMount() {
		document.addEventListener("keydown", this.handleKeyPress, false);
	}

	// Removes event listener for key press
	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleKeyPress, false);
	}

	// Handles key press for "Esc" button
	handleKeyPress = (event) => {
		if (event.keyCode === 27) {
			this.props.history.push("/dashboard");
		}
	};

	render() {
		return (
			<div className="help-page">
                <Row className="align-items-center">
                    <Col>
                        <h1 className="text">How to Play</h1>
                    </Col>
                </Row>

                <ListGroup variant="flush">
                    <ListGroup.Item><kbd>WASD</kbd> to move around.</ListGroup.Item>
                    <ListGroup.Item>Walk into a bush to hide from enemies... but make sure they don't get too close</ListGroup.Item>
                    <ListGroup.Item>Walk over a weapon or power-up to pick it up</ListGroup.Item>
                    <ListGroup.Item>Use the scroll wheel or <kbd>1234</kbd> or <kbd>t</kbd> to switch weapons</ListGroup.Item>
                    <ListGroup.Item><kbd>Esc</kbd> to open and close game menu</ListGroup.Item>
                    <ListGroup.Item><kbd>H</kbd> to toggle GUI display</ListGroup.Item>
                    <ListGroup.Item>Click on { }<Image src={HelpImg} alt={"Help-Button-Image"} style={{maxHeight: "25px", maxWidth: "25px"}} /> for more help on other pages </ListGroup.Item>
                </ListGroup>
				<hr />

				<Link to="/dashboard" style={{ textDecoration: "none" }}>
					<Button variant="dark" className="help-page-button">
						Home
					</Button>
				</Link>
			</div>
		);
	}
}

export default HelpPage;
