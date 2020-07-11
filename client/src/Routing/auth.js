import axios from "axios";

class Auth {
	// Called when the user successfully logs into the server
	login(token, cb) {
		// console.log("Successfully authenticated user");
		document.cookie = "jwt=" + token;
		localStorage.setItem("isAuth", true);
		cb();
	}

	// Logs out user, and then calls the callback
	async logout(cb) {
        // console.log("Logging out user");
        try {
            let response = await axios({
                method: "POST",
                withCredentials: true,
                url: "/ftd/api/logout",
                data: {},
            });
            
            // Successfully logged out user
            if (response && response.data && response.data.loggedOut === "LoggedOut") {
                localStorage.removeItem('isAuth');
                cb();
            } else {
                console.log("Request failed");
            }
        } catch (error) {
            console.log("Request failed: ", error)
        }
	}

	// Remove login state when user deletes their account
	delete(cb) {
		localStorage.removeItem("isAuth");
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

				const response = await axios.post(
					"/ftd/api/username",
					postData
				);
				if (
					response &&
					response.data &&
					response.data.verified === "Verified"
				) {
					return response.data.username;
				}
			}
			return "";
		} catch {
			console.log("Unable to retrieve username, logging out user");
			localStorage.removeItem("isAuth");
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
			localStorage.removeItem("isAuth");
			return false;
		}
	}
}

export default new Auth();
