import React from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Auth from "../Routing/auth";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { Link } from "react-router-dom";
import Logo from "../assets/warcry-logo-small.png";
import axios from "axios";
import "../css/SettingsPage.css";

class DeleteUser extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			password: "",
			errorMessage: "",
			alert: "",
		};
		this.handleDeleteUser = this.handleDeleteUser.bind(this);
		this.handlePassword = this.handlePassword.bind(this);
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
			this.props.history.push("/settings");
		}
	};

	handlePassword(event) {
		this.setState({ password: event.target.value });
	}

	// Renders a Tooltip with the given text
	renderTooltip(text) {
		return <Tooltip id="button-tooltip">{text}</Tooltip>;
	}

	// Render any Alerts
    renderAlert() {
		if (this.state.alert) {
			return <Alert variant={this.state.alert}>{this.state.errorMessage}</Alert>;
		}
		return null;
	}

    // Attempts to delete user from server
	async handleDeleteUser() {
		// Get JWT for authenticated request
		const cookie = document.cookie;
		const splitCookie = cookie.split("=");
		const token = splitCookie[1];
		let data = {
			cookies: token,
			password: this.state.password
        };

        // Authenticated request to delete user
        try {
            const res = await axios({ method: 'delete', withCredentials: true, url: '/ftd/api/users', data: data });
            if (res) {
                Auth.delete(() => {
                    this.props.history.push("/login", { response: "successful-deletion" });
				});
            } else {
                this.setState({
                    errorMessage: "Oops! Internal server error",
                    alert: "danger"
                });
            }
        } catch(err) {
            if (err.response.status === 401) {
                this.setState({
                    errorMessage: "Your current password is incorrect",
                    alert: "danger"
                });
            } else {
                this.setState({
                    errorMessage: "Oops! Internal server error",
                    alert: "danger"
                });
            }
        }
	}

	render() {
		return (
			<div className="user-info">
                <h3 className="text">Are you sure?</h3>
                <p>
                    Please enter your password to confirm
                </p>
				<hr />
                {this.renderAlert()}
				<OverlayTrigger
					placement="right"
					delay={{ show: 150, hide: 100 }}
					overlay={this.renderTooltip("This action cannot be reversed!")}
				>
					<input
						type="password"
						className="form-control"
						placeholder="Password"
						value={this.state.password}
						onChange={this.handlePassword}
					/>
				</OverlayTrigger>
				<Link to="/settings" style={{ textDecoration: "none" }}>
					<Button variant="primary" className="user-info-button">
						Back to Safety
					</Button>
				</Link>
				<OverlayTrigger
					placement="right"
					delay={{ show: 150, hide: 100 }}
					overlay={this.renderTooltip("Sorry to see you go :(")}
				>
					<Button
						variant="danger"
						className="user-info-button"
						onClick={this.handleDeleteUser}
						disabled={this.state.password.length < 6 || this.state.password.length > 50}
					>
						Delete Me
					</Button>
				</OverlayTrigger>
				{/* <hr />
				<Link to="/dashboard" style={{ textDecoration: "none" }} >
                	<img src={Logo} alt={"WarCry-Logo"} />
				</Link> */}
			</div>
		);
	}
}

export default DeleteUser;
