import React from "react";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import axios from "axios";
import Tooltip from "react-bootstrap/Tooltip"
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { Link } from "react-router-dom";
import "../css/SettingsPage.css";

class SettingsPage extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
			errorMessage: "",
			alert: "",
			successfulChange: false,
		};
		this.handleCurrentPassword = this.handleCurrentPassword.bind(this);
		this.handleChangePassword = this.handleChangePassword.bind(this);
		this.handleConfirmPassword = this.handleConfirmPassword.bind(this);
        this.handleEditUserInfo = this.handleEditUserInfo.bind(this);
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
			this.props.history.push("/dashboard");
		}
	};

	// Handler for current password input
	handleCurrentPassword(event) {
		this.setState({ currentPassword: event.target.value });
	}

	// Handler for newPassword input
	handleChangePassword(event) {
		this.setState({ newPassword: event.target.value });
	}

	// Handler for confirmPassword input
	handleConfirmPassword(event) {
		this.setState({ confirmPassword: event.target.value });
	}

    // Send request to server to modify user data
	async handleEditUserInfo(e) {
        e.preventDefault();
        this.setState({ alert: "", errorMessage: "" }); // Clear alerts

        // Front-end field validation
        if (this.state.newPassword !== this.state.confirmPassword) {
			this.setState({ 
				errorMessage: "Oops! Please ensure your new passwords match",
				alert: "warning"
			});
        } else if (this.areFieldsInvalid()) {
            this.setState({
                errorMessage: "Please fill in all the required fields. Passwords must be between 6 to 50 characters",
                alert: "warning"
            });
        } else {
            // Get JWT for authenticated request
            const cookie = document.cookie;
            const splitCookie = cookie.split("=");
            const token = splitCookie[1];
            let postData = {
                cookies: token,
                password: this.state.currentPassword,
                newPassword: this.state.newPassword,
                confirmPassword: this.state.confirmPassword,
            };
    
            // Authenticated request to change user settings
            try {
                const response = await axios.put("/ftd/api/users", postData);
                if (response) {
                    this.setState({ 
                        successfulChange: true, 
                        alert: "success" });
                } else {
                    this.setState({ 
                        alert: "warning", 
                        errorMessage: "Oops! Internal server error" });
                }
            } catch (err) {
                if (err.response && err.response.status === 400) {
                    this.setState({ 
                        alert: "warning",
                        errorMessage: "Please ensure your new passwords match"
                    });
                } else if (err.response && err.response.status === 401) {
                    this.setState({
                        alert: "warning",
                        errorMessage: "Your current password is not correct"
                    });
                } else {
                    this.setState({
                        alert: "warning",
                        errorMessage: "Oops! Internal server error"
                    })
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
        if (this.state.successfulChange && this.state.alert === "success") {
			return (
				<Alert
					variant="success"
				>
					Successfully changed settings
				</Alert>
			);
		} else if (this.state.alert === "warning") {
			return (
				<Alert
					variant="danger"
				>
					{this.state.errorMessage}
				</Alert>
			);
        }
        return null;
    }

    // Front-end validation for form fields
    areFieldsInvalid() {
        return (this.state.currentPassword.length < 6 || this.state.currentPassword.length > 50 || this.state.newPassword.length < 6 || this.state.newPassword.length > 50 || this.state.confirmPassword.length < 6 || this.state.confirmPassword.length > 50);
    }

	render() {
		return (
			<div className="user-info">
				<h1 className="text">Settings</h1>
				<p className="text">Change your password or delete your account</p>
				<hr />

                <form onSubmit={this.handleEditUserInfo}>
                    {this.renderAlert()}
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 100 }}
                        overlay={this.renderTooltip("Please enter your current password")}
                    >
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Current password"
                            value={this.state.currentPassword}
                            onChange={this.handleCurrentPassword}
                            required
                        />
                    </OverlayTrigger>
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 100 }}
                        overlay={this.renderTooltip("Your new password must be between 6-50 characters long")}
                    >
                        <input
                            type="password"
                            className="form-control"
                            placeholder="New password"
                            value={this.state.newPassword}
                            onChange={this.handleChangePassword}
                            required
                        />
                    </OverlayTrigger>
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 100 }}
                        overlay={this.renderTooltip("Re-enter your new password")}
                    >
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Re-enter new password"
                            value={this.state.confirmPassword}
                            onChange={this.handleConfirmPassword}
                            required
                        />
                    </OverlayTrigger>


                    <Button
                        variant="primary"
                        type="submit"
                        className="user-info-button"
                    >
                        Save Settings
                    </Button>
                </form>

				<Link to="/delete" style={{ textDecoration: "none" }}>
					<Button variant="danger" className="user-info-button">
						Delete User
					</Button>
				</Link>

				<Link to="/dashboard" style={{ textDecoration: "none" }}>
					<Button variant="dark" className="user-info-button">
						Home
					</Button>
				</Link>
			</div>
		);
	}
}

export default SettingsPage;
