import axios from 'axios';
class Auth {
    constructor() {
        this.authenticated = false;
        this.username = "";
    }

    login(token, cb) {
        this.authenticated = true;
        document.cookie = "jwt=" + token;
        localStorage.setItem('isAuth', this.authenticated);
        if (document.cookie !== "") {
            // Getting jwtToken
            const cookie = document.cookie;
            const splitCookie = cookie.split("=");
            const token = splitCookie[1];
            let postData = {
                cookies: token,
            };

            const that = this;
            axios.post('http://localhost:10421/ftd/api/username', postData)
                .then(response => {
                    if (response.data.verified == "Verified") {
                        that.username = response.data.username;
                        cb();
                    }

                })
                .catch(error => {
                    //error status
                    console.log('Request failed', error);
                })

        }
    }

    logout(cb) {
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

    delete(cb) {
        this.authenticated = false;
        localStorage.removeItem('isAuth');
        cb();
    }

    getUser() {
        return this.username;
    }
}

export default new Auth();