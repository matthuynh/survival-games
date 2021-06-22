import React from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Tooltip from "react-bootstrap/Tooltip"
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { Link } from "react-router-dom";
import Logo from "../assets/register.png";
import Popover from "react-bootstrap/Popover";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";
import HelpImg from "../assets/question-mark.png";
import Row from "react-bootstrap/row";
import Col from "react-bootstrap/col";
import "../css/LoginForm.css";

class RegistrationForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: "",
			password: "",
			confirmPassword: "",
			errorMessage: "",
			alert: ""
		};
		this.handleRegisterUser = this.handleRegisterUser.bind(this);
		this.handleUsername = this.handleUsername.bind(this);
		this.handlePassword = this.handlePassword.bind(this);
		this.handleConfirmPassword = this.handleConfirmPassword.bind(this);
		this.areFieldsInvalid = this.areFieldsInvalid.bind(this);
        this.renderTooltip = this.renderTooltip.bind(this);
        this.renderAlert = this.renderAlert.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }
    
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
            this.props.history.push("/login");
        }
    }

    // Front-end validation for form fields
    areFieldsInvalid() {
        return (this.state.username.length < 6 || this.state.username.length > 50 || this.state.password.length < 6 || this.state.password.length > 50 || this.state.confirmPassword.length < 6 || this.state.confirmPassword.length > 50);
    }

	handleUsername(event) {
		this.setState({ username: event.target.value });
	}

	handlePassword(event) {
		this.setState({ password: event.target.value });
	}

	handleConfirmPassword(event) {
		this.setState({ confirmPassword: event.target.value });
	}

	// Handles register API call
	async handleRegisterUser(e) {
        e.preventDefault();
        this.setState({ alert: "", errorMessage: "" }); // Clear alerts

        // Front-end validation
		if (this.state.password !== this.state.confirmPassword) {
			this.setState({ 
				errorMessage: "Oops! Please ensure your passwords match",
				alert: "warning"
			});
        } else if (this.areFieldsInvalid()) {
            this.setState({
                errorMessage: "Please fill in all the required fields",
                alert: "warning"
            });
        } 
        // Attempt to register user
        else {
			try {
				let postData = {
					username: this.state.username,
					password: this.state.password,
				};
				let response = await axios.post("/ftd/api/users", postData);
				if (response) {
					this.props.history.push("/login", { response: "successful-registration", username: this.state.username });
				} else {
					this.setState({
                        errorMessage: "Oops! Internal server error",
                        alert: "danger"
                    });
				}
			} 
			// Unsuccessful registration
			catch (err) {
				console.log(err.response);
				if (err.response && err.response.status === 400) {
					this.setState({
						errorMessage: "Please ensure you filled in all fields correctly",
						alert: "warning"
					});
				} else if (err.response && err.response.status === 403) {
					this.setState({
						errorMessage: "That username is already being used for another account",
						alert: "warning"
					});
				} else {
					this.setState({
						errorMessage: "Oops! Internal server error",
						alert: "warning"
					});
				}
			}
		}
	}

    // Renders a Tooltip with the given text
	renderTooltip(text) {
        return (
            <Tooltip id="button-tooltip">
                {text}
            </Tooltip>
        );
    }

    // Render any Alerts
    renderAlert() {
        if (this.state.alert) {
			return (
				<Alert
					variant={this.state.alert}
				>
					{this.state.errorMessage}
				</Alert>
			);
		} 
        return null;
    }

	// Displays when user hovers over help button
	renderHelpPopover() {
		return(
			<Popover id="popover-basic">
				<Popover.Title as="h3" style={{ textAlign: "center" }}>Having issues registering?</Popover.Title>
				<Popover.Content>
						<ListGroup variant="flush">
						<ListGroup.Item>Both your passwords must match</ListGroup.Item>
						<ListGroup.Item>Both usernames and passwords must be between 6-50 characters</ListGroup.Item>
					</ListGroup>
				</Popover.Content>
			</Popover>
		);
	};

	render() {
		return (
			<div className="form">
				<img src={Logo} alt={"WarCry-Logo"} />

				<form onSubmit={this.handleRegisterUser}>
					{this.renderAlert()}
					<OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 100 }}
                        overlay={this.renderTooltip("Must be between 6 and 50 characters long")}
                    >
						<input
							type="text"
							className="form-control"
							placeholder="Username"
							value={this.state.username}
                            onChange={this.handleUsername}
                            required
						/>
					</OverlayTrigger>
					<OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 100 }}
                        overlay={this.renderTooltip("Must be between 6 and 50 characters long. Passwords are stored in our database as hashes")}
                    >
						<input
							type="password"
							className="form-control"
							placeholder="Password"
							value={this.state.password}
                            onChange={this.handlePassword}
                            required
						/>
					</OverlayTrigger>
					<OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 100 }}
                        overlay={this.renderTooltip("Must be between 6 and 50 characters long")}
                    >
						<input
							type="password"
							className="form-control"
							placeholder="Re-enter password"
							value={this.state.confirmPassword}
                            onChange={this.handleConfirmPassword}
                            required
						/>
					</OverlayTrigger>

					<Button
						variant="primary"
						type="submit"
                        className="form-button"
					>
						Register!
					</Button>
				</form>

				<Link to="/login" style={{ textDecoration: "none" }}>
					<Button variant="dark" className="form-button">
						Home
					</Button>
				</Link>

				<Row className="settings-footer align-items-center">
						<Col xs={{ span: 3, offset: 10 }}>
								<OverlayTrigger trigger="click" placement="top" overlay={this.renderHelpPopover()}>
										<span id="settings-help-icon">
												<Image src={HelpImg} alt={"Help-Button-Image"} style={{maxHeight: "25px", maxWidth: "25px"}} />
										</span>
								</OverlayTrigger>
						</Col>
				</Row>
			</div>
		);
	}
}

export default RegistrationForm;
