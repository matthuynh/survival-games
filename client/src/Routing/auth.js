import axios from 'axios';
import { withRouter } from 'react-router-dom';

class Auth {
    constructor() {
        this.isAuthenticated = false;
    }

    // Called when the user successfully logs into the server
    login(token, cb) {
        console.log("Logging in the user")
        this.isAuthenticated = true;
        document.cookie = "jwt=" + token;
        localStorage.setItem('isAuth', this.isAuthenticated);
        cb();
    }

    // Logs out user, and then calls the callback
    logout(cb) {
        console.log("Logging out user")
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
                    console.log("trying to log out user");
                    that.isAuthenticated = false;
                    localStorage.removeItem('isAuth');
                    cb();
                }
            })
            .catch(error => {
                console.log('Request failed', error);
            })
    }

    // TODO: Check if this is fine
    // Remove login state when user deletes their account
    delete(cb) {
        this.isAuthenticated = false;
        localStorage.removeItem('isAuth');
        cb();
    }

    // Return the user's username if exists, else empty string
    async getUsername() {
        try {
            if (document.cookie !== "") {
                // Getting jwtToken
                const cookie = document.cookie;
                const splitCookie = cookie.split("=");
                const token = splitCookie[1];
                let postData = {
                    cookies: token,
                };

                const response = await axios.post('http://localhost:10421/ftd/api/username', postData);
                if (response && response.data && response.data.verified === "Verified") {
                    return response.data.username;
                }
            }
            return "";   
        } catch {
            console.log("Bruh2");
            return "";
        }
    }

    // Checks login session, and returns true if the user is currently logged in
    // This makes a call to the server (sends JWT to server, server checks TTL)
    async isValidLoginSession() {
        const postData = {
            cookies: document.cookie.split("=")[1]
        }
        try {
            const response = await axios.post("http://localhost:10421/ftd/api/verify", postData);
            const isAuthenticated = (response && response.data && response.data.verified === "Verified");
            this.isAuthenticated = isAuthenticated;
            console.log("Setting authenticated status to " + isAuthenticated);
            return isAuthenticated;
        } catch {
            this.isAuthenticated = false;
            return false;
        }
    }

    isAuthenticated() {
        return this.isAuthenticated;
    }

}

export default new Auth();