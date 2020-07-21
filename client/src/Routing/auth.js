import axios from "axios";

class Auth {
	logout() {
		// Deletes the JWT cookie and removes the isAuth local storage on the client
		document.cookie = 'jwt=; expires=Thu, 01-Jan-1970 00:00:01 GMT;';
		localStorage.removeItem('isAuth');
	}

	// Called when the user successfully logs into the server
	login(token, cb) {
		// console.log("Successfully authenticated user");
		document.cookie = "jwt=" + token;
		localStorage.setItem("isAuth", true);
		cb();
	}

	// Logs out user, and then calls the callback
	async serverLogout(cb) {
		// console.log("Logging out user");
		// Note: this request to the back-end isn't stricly necessary
        try {
            let response = await axios({
                method: "POST",
                withCredentials: true,
                url: "/ftd/api/logout",
                data: {},
            });
            
            // Successfully logged out user
            if (response && response.data && response.data.loggedOut === "LoggedOut") {
				console.log("Server logout caught by back-end")
            } else {
				console.log("Request failed");
            }
        } catch (error) {
			console.log("Request failed: ", error)
		}
		
		this.logout();
		cb();
	}

	// Remove login state when user deletes their account
	delete(cb) {
		this.logout();
		cb();
	}

	// Return the user's username if exists, else empty string
	async getUsername() {
		try {
			if (document.cookie !== "") {
				// Get JWT
				const cookie = document.cookie;
				const splitCookie = cookie.split("=");
				const token = splitCookie[1];
				let postData = {
					cookies: token,
				};

				const response = await axios.post(
					"/ftd/api/username",
					postData
				);
				if (response && response.data && response.data.verified === "Verified") {
					return response.data.username;
				}
			}
			return "";
		} catch {
			console.log("Unable to retrieve username, logging out user");
			this.logout();
			return "";
		}
	}

	// Checks login session, and returns true if the user is currently logged in
	// This makes a call to the server (sends JWT to server, server checks TTL)
	async isValidLoginSession() {
		const postData = {
			cookies: document.cookie.split("=")[1],
		};
		try {
			const response = await axios.post(
				"/ftd/api/verify",
				postData
			);
			return (
				response &&
				response.data &&
				response.data.verified === "Verified"
			);
		} catch {
			console.log("Unable to retrieve username, logging out user");
			this.logout();
			return false;
		}
	}
}

export default new Auth();
