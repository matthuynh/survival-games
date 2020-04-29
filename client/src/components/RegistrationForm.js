import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import '../css/RegisterForm.css';


class RegistrationForm extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            error: "",
            alert: false
        };

        this.handleRegisterUser = this.handleRegisterUser.bind(this);
        this.handleUsername = this.handleUsername.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.handleConfirmPassword = this.handleConfirmPassword.bind(this);
        this.handleEmail = this.handleEmail.bind(this);
        this.handleAlertClick = this.handleAlertClick.bind(this);
    }

    //handler for username input
    handleUsername(event) {
        this.setState({ username: event.target.value });
    }

    //handler for passwrod input
    handlePassword(event) {
        this.setState({ password: event.target.value });
    }

    //handler for password confirmation
    handleConfirmPassword(event) {
        this.setState({ confirmPassword: event.target.value });
    }

    //handler for email input
    handleEmail(event) {
        this.setState({ email: event.target.value });
    }

    handleAlertClick() {
        this.setState({ alert: false });
    }

    //handles register fetch call
    handleRegisterUser(e) {

        if (this.state.password != this.state.confirmPassword) {
            this.setState({ error: "Passwords must match to create Account!" });

        } else {
            let postData = {
                username: this.state.username,
                password: this.state.password,
                email: this.state.email
            };

            const that = this;
            //what url do we put??
            fetch('http://localhost:10421/ftd/api/users', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(postData)
            })
                .then(function (response) {
                    if (response.status === 403) {
                        that.setState({
                            error: "That username or email already exists",
                            alert: true
                        });
                    } else if (response.status === 400) {
                        that.setState({
                            error: "Your password and username must be between 6 to 50 (inclusive) characters long",
                            alert: true
                        });
                    } else if (response.status === 500) {
                        that.setState({
                            error: "Oops! Internal server error",
                            alert: true
                        });
                    } else {
                        that.setState({
                            error: "Account Created! Please go Home and log in",
                            alert: true
                        });
                    }
                })
                .catch(function (error) {
                    console.log('Request failed', error);
                })
        }
    }

    render() {
        let alert;
        if ((this.state.error == "Account Created! Please go Home and log in") && (this.state.alert)) {
            alert = <Alert variant="success" onClose={this.handleAlertClick} dismissible>{this.state.error}</Alert>;
        } else if (this.state.alert) {
            alert = <Alert variant="danger" onClose={this.handleAlertClick} dismissible>{this.state.error}</Alert>;
        } else {
            alert = null;
        }
        return (
            <div className="register-form">
                {alert}
                <h1>🏹 REGISTER</h1>
                <hr />

                <input type="text" className="form-control" placeholder="Username" value={this.state.username} onChange={this.handleUsername} required />
                <input type="email" className="form-control" placeholder="Email" value={this.state.email} onChange={this.handleEmail} required />
                <input type="password" className="form-control" placeholder="Password" value={this.state.password} onChange={this.handlePassword} />
                <input type="password" className="form-control" placeholder="Re-enter Password" value={this.state.confirmPassword} onChange={this.handleConfirmPassword} />

                <Button variant="primary" type="submit" onClick={this.handleRegisterUser} className="register-button">Register</Button>
                <Button variant="primary" type="submit" onClick={this.props.handleRegister} className="register-button">Home</Button>
            </div>
        );
    }
}

export default RegistrationForm;