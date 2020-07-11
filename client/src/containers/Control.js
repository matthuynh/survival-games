import React from 'react';
import LoginForm from '../components/LoginForm';
import RegistrationForm from '../components/RegistrationForm';
import Dashboard from '../components/Dashboard';
import UserInfo from '../components/UserInfo';
import LeaderBoard from '../components/LeaderBoard';
import DeleteUser from '../components/DeleteUser';
import LobbiesPage from '../components/LobbiesPage';

class Control extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            username: "",
            isDashBoard: false,
            isLoggedIn: false,
            isRegister: false,
            isLeaderBoards: false,
            isUserInfo: false,
            isDeleteUser: false,
            isJoinLobby: false,
            flag: true
        }
        this.handleRegisterClick = this.handleRegisterClick.bind(this);
        this.handleLoginClick = this.handleLoginClick.bind(this);
        this.handleLoggedInClick = this.handleLoggedInClick.bind(this);
        this.handleLoggedOutClick = this.handleLoggedOutClick.bind(this);
        this.handleUserInfoClick = this.handleUserInfoClick.bind(this);
        this.handleUserDashClick = this.handleUserDashClick.bind(this);
        this.handleExitLeaderBoardClick = this.handleExitLeaderBoardClick.bind(this);
        this.handleLeaderBoardClick = this.handleLeaderBoardClick.bind(this);
        this.handleDeleteUserClick = this.handleDeleteUserClick.bind(this);
        this.handleDeleteDashClick = this.handleDeleteDashClick.bind(this);
        this.handleLobbyDashClick = this.handleLobbyDashClick.bind(this);

        this.handleGetUsername = this.handleGetUsername.bind(this);
    }

    // Check to see if user is logged in
    componentDidMount() {
        this.handleGetUsername();
    }

    //get username of verified user logged in
    handleGetUsername() {
        if (document.cookie !== "") {
            // Getting jwtToken
            const cookie = document.cookie;
            const splitCookie = cookie.split("=");
            const token = splitCookie[1];
            let postData = {
                cookies: token,
            };

            const that = this;
            // Fetch call for logging in user
            fetch('/ftd/api/username', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(postData)
            })
                .then(function (response) {
                    //error checking status codes
                    if (response.status === 401) {
                        that.setState({
                            error: "Not authorized",
                            alert: true
                        });
                    } else {
                        return response.json();
                    }
                }).then(function (data) {
                    //set jwt token
                    if (data.verified == "Verified") {
                        that.setState({ username: data.username });
                    }
                })
                .catch(function (error) {
                    console.log('Request failed', error);
                })
        }
    }


    //handles render form login to register
    handleRegisterClick() {
        this.setState({ isRegister: true });
    }
    //handles render from register to login
    handleLoginClick() {
        this.setState({ isRegister: false });
    }

    //handles Loggedin state
    handleLoggedInClick() {
        this.setState({
            isLoggedIn: true,
            isDashBoard: true,
        });
    }

    //handles loggedout state
    handleLoggedOutClick() {
        this.setState({
            isLoggedIn: false,
            isDashBoard: false,
        });
    }

    //handles render userinfo page from dashboard
    handleUserInfoClick() {
        this.setState({
            isUserInfo: true,
            isDashBoard: false
        });
    }

    //handles Dashboard render
    handleUserDashClick() {
        if (this.state.isUserInfo) {
            this.setState({
                isDashBoard: true,
                isUserInfo: false
            });
        } else if (this.state.isDeleteUser) {
            this.setState({
                isDeleteUser: false,
                isDashBoard: true
            })
        } else if (this.state.isJoinLobby) {
            this.setState({
                isJoinLobby: false,
                isDashBoard: true
            });
        }
    }

    handleLeaderBoardClick() {
        if (this.state.isLoggedIn) {
            this.setState({
                isDashBoard: false,
                isLeaderBoards: true
            });
        } else {
            this.setState({ isLeaderBoards: true });
        }
    }

    handleExitLeaderBoardClick() {
        if (this.state.isLoggedIn) {
            this.setState({
                isLeaderBoards: false,
                isDashBoard: true
            });
        } else {
            this.setState({ isLeaderBoards: false });
        }
    }

    //changes state when user deletes account
    handleDeleteUserClick() {
        this.setState({
            isLoggedIn: false,
            isDeleteUser: false
        });
    }

    //renders Delete User Page
    handleDeleteDashClick() {
        this.setState({
            isDashBoard: false,
            isDeleteUser: true
        });
    }

    //renders lobby page from dashboard
    handleLobbyDashClick() {
        this.setState({
            isDashBoard: false,
            isJoinLobby: true
        })
    }

    render() {
        const isRegister = this.state.isRegister;
        const isDashBoard = this.state.isDashBoard;
        const isUserInfo = this.state.isUserInfo;
        const isLeaderBoard = this.state.isLeaderBoards;
        const isDeleteUser = this.state.isDeleteUser;
        const isJoinLobby = this.state.isJoinLobby;
        let state;

        if (isRegister) {
            state = <RegistrationForm handleRegister={this.handleLoginClick} />;
        } else if (isDashBoard) {
            state = <Dashboard handleLoggedOut={this.handleLoggedOutClick} handleUserInfo={this.handleUserInfoClick} handleLeaderBoard={this.handleLeaderBoardClick} handleDelete={this.handleDeleteDashClick} handleLobby={this.handleLobbyDashClick} User={this.state.username} />;
        } else if (isUserInfo) {
            state = <UserInfo handleDash={this.handleUserDashClick} />;
        } else if (isLeaderBoard) {
            state = <LeaderBoard handleExit={this.handleExitLeaderBoardClick} />;
        } else if (isDeleteUser) {
            state = <DeleteUser handleDash={this.handleUserDashClick} handleDeleteUser={this.handleDeleteUserClick} />
        } else if (isJoinLobby) {
            state = <LobbiesPage handleDash={this.handleUserDashClick} playerId={this.state.username} />
        } else {
            state = <LoginForm handleRegister={this.handleRegisterClick} handleLoggedIn={this.handleLoggedInClick} handleLeaderBoard={this.handleLeaderBoardClick} getUser={this.handleGetUsername}/>;
        }

        return (
            <div>
                {state}
            </div>
        );
    }
}

export default Control;