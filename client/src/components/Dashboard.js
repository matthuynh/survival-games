import React from 'react';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import '../css/Dashboard.css';

class Dashboard extends React.Component {

    constructor(props) {
        super(props);

        this.handleLogOutUser = this.handleLogOutUser.bind(this);
    }

    //handle ajax logout request
    handleLogOutUser() {
        //make fetch request
        //data for fetch call
        let postData = {};

        const that = this;
        axios({
            method: 'post',
            withCredentials: true,
            url: 'http://localhost:10421/ftd/api/logout',
            data: postData
        })
            .then(response => {
                //logout user
                if (response.data.loggedOut == "LoggedOut") {
                    that.props.handleLoggedOut();
                }
            })
            .catch(error => {
                console.log('Request failed', error);
            })
    }

    render() {
        return (
            <div>
                <div className="dashboard-container">
                    <h1 id="dashboard-greeting">{'Welcome ' + this.props.User}</h1>
                    <p id="text">Select from one of the following options below</p>
                    <hr />
                    <Button variant="primary" block onClick={this.props.handleLobby}>View Lobbies</Button>
                    <Button variant="primary" block onClick={this.props.handleLeaderBoard}>Show Leaderboard</Button>
                    <Button variant="primary" block onClick={this.props.handleUserInfo}>Edit User Information</Button>
                    <Button variant="danger" block onClick={this.props.handleDelete}>Delete User</Button>
                    <Button variant="primary" block onClick={this.handleLogOutUser}>Log Out</Button>
                </div>
            </div>
        );
    }
}

export default Dashboard;