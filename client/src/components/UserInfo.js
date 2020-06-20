import React from 'react';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../css/UserInfo.css';

class UserInfo extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            email: "",
            password: "",
            changePassword: "",
            confirmPassword: "",
            error: "",
            alert: false,
            success: ""
        };

        this.handleEmail = this.handleEmail.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.handleChangePass = this.handleChangePass.bind(this);
        this.handleConfirmPass = this.handleConfirmPass.bind(this);
        this.handleEditUserInfo = this.handleEditUserInfo.bind(this);
        this.handleAlertClick = this.handleAlertClick.bind(this);
    }

    //get all userinfo to prefill
    componentDidMount() {
        //getting jwtToken
        const cookie = document.cookie;
        const splitCookie = cookie.split("=");
        const token = splitCookie[1];
        let postData = {
            cookies: token
        };

        const that = this;
        axios.post('http://localhost:10421/ftd/api/getUserInfo', postData)
            .then(response => {
                //setting state
                that.setState({ email: response.data.email });
            })
            .catch(error => {
                //error catching
                if (error.response.status === 401) {
                    that.setState({
                        error: "Please log in. You are currently unauthenticated",
                        alert: true
                    });
                } else if (error.response.status === 403) {
                    that.setState({
                        error: "Oops! We could not find your username in the database. Try logging out and logging in again.",
                        alert: true
                    });
                } else if (error.response.status === 500) {
                    that.setState({
                        error: "Oops! Internal server error",
                        alert: true
                    });
                }
            })

    }

    //handler for email input
    handleEmail(event) {
        this.setState({ email: event.target.value });
    }

    //handler for password input
    handlePassword(event) {
        this.setState({ password: event.target.value });
    }

    //handler for changePassword input
    handleChangePass(event) {
        this.setState({ changePassword: event.target.value });
    }

    //handler for confirmPassword input
    handleConfirmPass(event) {
        this.setState({ confirmPassword: event.target.value });
    }

    //handler for Alerts
    handleAlertClick() {
        this.setState({ alert: false });
    }

    handleEditUserInfo() {
        //getting jwtToken
        const cookie = document.cookie;
        const splitCookie = cookie.split("=");
        const token = splitCookie[1];
        let postData = {
            cookies: token,
            password: this.state.password,
            email: this.state.email,
            newPassword: this.state.changePassword,
            confirmPassword: this.state.confirmPassword
        };

        //api call to change usr info
        const that = this;
        axios.put('http://localhost:10421/ftd/api/users', postData)
            .then(response => {
                that.setState({
                    success: "information modified",
                    alert: true
                });
            })
            .catch(error => {
                if (error.response.status === 400) {
                    that.setState({
                        error: "Your passwords must match and be between 6 to 50 (inclusive) characters long. Your email must be valid",
                        alert: true
                    });
                } else if (error.response.status === 401) {
                    that.setState({
                        error: "Your current password is incorrect",
                        alert: true
                    });
                } else if (error.response.status === 500) {
                    that.setState({
                        error: "Oops! Internal server error",
                        alert: true
                    });
                }
            })

    }

    render() {
        let alert;
        if (this.state.success === "information modified" && this.state.alert) {
            alert = <Alert variant="success" onClose={this.handleAlertClick} dismissible>{this.state.success}</Alert>;
        } else if (this.state.alert) {
            alert = <Alert variant="danger" onClose={this.handleAlertClick} dismissible>{this.state.error}</Alert>;
        } else {
            alert = null;
        }

        return (
            <div className="user-info">
                {alert}
                <h1 className="text">User Profile Page</h1>
                <p className="text">Edit your password and email</p>
                <hr />
                <input type="email" className="form-control" placeholder={this.state.email} value={this.state.email} onChange={this.handleEmail} />
                <input type="password" className="form-control" placeholder="Password" value={this.state.password} onChange={this.handlePassword} />
                <input type="password" className="form-control" placeholder="Change Password" value={this.state.changePassword} onChange={this.handleChangePass} />
                <input type="password" className="form-control" placeholder="Re-enter Password" value={this.state.confirmPassword} onChange={this.handleConfirmPass} />

                <Button variant="primary" value="login" className="login-button" onClick={this.handleEditUserInfo}>Change</Button>
                <Link to="/dashboard">
                    <Button variant="primary" className="login-button">Go to Dashboard</Button>
                </Link>
            </div>
        );
    }
}

export default UserInfo;