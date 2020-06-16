import axios from 'axios';
class Auth {
    constructor() {
        this.authenticated = false;
        this.username = "";
    }

    // Called when the user successfully logs into the server
    login(token, cb) {
        const loginTime = new Date();
        const timeToLive = 14400; // time in seconds
        const authTime = {
            loginTime: loginTime,
            ttl: timeToLive
        }
        this.authenticated = true;
        document.cookie = "jwt=" + token;
        localStorage.setItem('isAuth', this.authenticated);
        localStorage.setItem('authTime', authTime);

        // const cookie = document.cookie;
        // const splitCookie = cookie.split("=");
        // const token = splitCookie[1];
        let postData = {
            cookies: document.cookie.split("=")[1],
        };

        // Get username corresponding to the JWT
        const that = this;
        axios.post('http://localhost:10421/ftd/api/username', postData)
            .then(response => {
                if (response.data.verified === "Verified") {
                    that.username = response.data.username;
                    localStorage.setItem('Username', response.data.username);
                    cb();
                } else {
                    that.logout();
                }

            })
            .catch(error => {
                //error status
                console.log('Request failed', error);
                that.logout();
            });
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

    // Remove login state when user deletes their account
    delete(cb) {
        this.authenticated = false;
        localStorage.removeItem('isAuth');
        cb();
    }

    // Return logged-in user's username
    getUser() {
        return this.username;
    }

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

                const that = this;
                await axios.post('http://localhost:10421/ftd/api/username', postData)
                    .then(response => {
                        if (response.data.verified == "Verified") {
                            console.log(response.data.username);
                            return response.data.username;
                        }

                    })
                    .catch(error => {
                        //error status
                        console.log('Request failed', error);
                    })

            }

        } catch (error) {
            console.log(error);
        }

    }

    // Return true if the user is currently logged in (login expires after 4 hours)
    async isValidLoginSession() {
        console.log("checking..");
        const postData = {
            cookies: document.cookie.split("=")[1]
        }
        try {
            let response = await axios.post("http://localhost:10421/ftd/api/verify", postData);
            console.log(response);
            if (response && response.data.verified === "Verified") {
                console.log("Yes, the user is verified. Their username is " + response.data.username);
                return true;
            }
            console.log("No, the user is not verified")
            return false;
        } catch {
            console.log("LUL");
            return false;
        }
    }
}

export default new Auth();