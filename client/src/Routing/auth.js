import axios from 'axios';
class Auth {
    constructor() {
        this.authenticated = false;
    }

    login(token, cb) {
        this.authenticated = true;
        document.cookie = "jwt=" + token;
        localStorage.setItem('isAuth', this.authenticated);
        cb();
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
}

export default new Auth();