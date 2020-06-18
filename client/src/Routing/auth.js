import axios from 'axios';
import { withRouter } from 'react-router-dom';

class Auth {
    constructor() {
        // TODO: Do we still need this?
        this.authenticated = false;
    }

    // Called when the user successfully logs into the server
    login(token, cb) {
        console.log("Logging in the user")
        this.authenticated = true;
        document.cookie = "jwt=" + token;
        localStorage.setItem('isAuth', this.authenticated);
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
                    that.authenticated = false;
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
        this.authenticated = false;
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

    // Return true if the user is currently logged in (sends JWT to server, server checks TTL)
    async isValidLoginSession() {
        const postData = {
            cookies: document.cookie.split("=")[1]
        }
        try {
            const response = await axios.post("http://localhost:10421/ftd/api/verify", postData);
            return (response && response.data && response.data.verified === "Verified")
        } catch {
            return false;
        }
    }
}

export default new Auth();