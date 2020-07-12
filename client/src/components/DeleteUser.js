import React from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Auth from "../Routing/auth";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { Link } from "react-router-dom";
import "../css/DeleteUser.css";
import axios from "axios";

class DeleteUser extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			password: "",
			errorMessage: "",
			alert: false,
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
			return <Alert variant="danger">{this.state.errorMessage}</Alert>;
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
                    alert: true
                });
            }
        } catch(err) {
            if (err.response.status === 401) {
                this.setState({
                    errorMessage: "Your current password is incorrect",
                    alert: true
                });
            } else {
                this.setState({
                    errorMessage: "Oops! Internal server error",
                    alert: true
                });
            }
        }
	}

	render() {
		return (
			<div className="delete-user">
                <h3 className="text">You want to delete your account?</h3>
                <p>
                    Sorry to see you go :(
                </p>
				<hr />
                {this.renderAlert()}
				<OverlayTrigger
					placement="right"
					delay={{ show: 250, hide: 100 }}
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
					<Button variant="primary" className="delete-button">
						Back to Safety
					</Button>
				</Link>
				<Button
					variant="danger"
					className="delete-button"
					onClick={this.handleDeleteUser}
					disabled={this.state.password.length < 6 || this.state.password.length > 50}
				>
					Delete Me Forever
				</Button>
			</div>
		);
	}
}

export default DeleteUser;
