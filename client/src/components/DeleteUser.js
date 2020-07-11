import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Auth from "../Routing/auth";
import { Link } from 'react-router-dom';
import '../css/DeleteUser.css';
import Axios from 'axios';

class DeleteUser extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            password: "",
            error: "",
            alert: false
        }
        this.handleDeleteUser = this.handleDeleteUser.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.handleAlertClick = this.handleAlertClick.bind(this);
    }

    handlePassword(event) {
        this.setState({ password: event.target.value });
    }

    handleAlertClick() {
        this.setState({ alert: false });
    }

    handleDeleteUser() {
        //fetch code goes here
        const cookie = document.cookie;
        const splitCookie = cookie.split("=");
        const token = splitCookie[1];
        let postData = {
            cookies: token,
            password: this.state.password,
        };

        //api call to delete user
        const that = this;
        Axios({
            method: 'delete',
            withCredentials: true,
            url: '/ftd/api/users',
            data: postData
        })
            .then(response => {
                //delete user and redirect to login screen
                Auth.delete(() => {
                    this.props.history.push("/login");
                })
            })
            .catch(error => {
                //error checking api call
                if (error.response.status === 401) {
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
        if (this.state.alert) {
            alert = <Alert variant="danger" onClose={this.handleAlertClick} dismissible>{this.state.error}</Alert>;
        } else {
            alert = null;
        }

        return (
            <div className="delete-user">
                {alert}
                <p>Want to delete your account? Enter your password below and then click "Delete". Sorry to see you go :(</p>
                <hr />
                <input type="password" className="form-control" placeholder="enter Password" value={this.state.password} onChange={this.handlePassword} />
                <Button variant="danger" className="delete-button" onClick={this.handleDeleteUser}>Delete Me Forever</Button>
                <Link to="/dashboard">
                    <Button variant="primary" className="delete-button">Go to Dashboard</Button>
                </Link>
            </div>
        );
    }


}

export default DeleteUser;