const PORT = process.env.PORT || 10421; // If on production, Heroku will automatically select a port. Else if on local environemnt, defaults to 10421
const express = require("express");
const app = express();
const path = require('path');

let bodyParser = require("body-parser");
let cookieParser = require("cookie-parser");
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser()); // parse cookies before processing other middleware

// Authentication variables
const jwtSecretKey = "temporary-secret-key";
let jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// http://www.sqlitetutorial.net/sqlite-nodejs/connect/
const sqlite3 = require("sqlite3").verbose();

// Create connection to SQLite database
const db = new sqlite3.Database("db/database.db", err => {
	if (err) {
		console.error(err.message);
	}
	console.log("[INFO] express-server.js is now connected to the SQLite database");
});

// In production, front-end files are served from client/build. Test by going to localhost:10421
if (process.env.NODE_ENV === "production" || true) {
	console.log("[INFO] express-server.js is serving files from React build folder");
	// app.use(express.static('./client/build'));
	app.use('/static', express.static(path.join(__dirname, './client/build//static')));
	app.get('*', function(req, res) {
		res.sendFile('index.html', { 
			root: path.join(__dirname, './client/build/')
		});
	});
} 
// In development, front-end are served from CRA dev server
else {
	console.log("[INFO] express-server.js is using local React dev server");
	app.use("/", function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "http://localhost:3000");
		res.header("Access-Control-Allow-Credentials", true);
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
		next();
	});
}


// Register (create) a new user with the given credentials
app.post("/ftd/api/users", async (req, res) => {
	try {
		let result = {};
		// console.log(req.body);
		let username = req.body.username.toLowerCase();
		let plaintextPassword = req.body.password;
		let email = req.body.email;

		// Input validation for password and username
		if (username.length < 6 || username.length > 50 || plaintextPassword.length < 6 || plaintextPassword.length > 50) {
			res.status(400).send();
			return;
		}

		//check email
		const emailRE = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
		if (!emailRE.test(email)) {
			res.status(400).send();
			return;
		}

		// Attempt to create user, insert into database
		let hashedPassword = await bcrypt.hash(plaintextPassword, saltRounds);

		result["exists"] = "false";
		sql = "INSERT INTO users(username, password, email) VALUES (?,?,?);";
		db.run(sql, [username, hashedPassword, email], err => {
			// Username or email already exists
			if (err && err.errno == 19) {
				res.status(403).json(result);
				return;
			}
			// Other database error
			else if (err) {
				console.log(err);
				res.status(500).json();
				return;
			}
			// Successfully added user
			else {
				res.status(200).json(result);
				return;
			}
		});
	} catch (err) {
		// Internal Server Error
		console.log(err);
		res.status(500).send("500: Internal server error");
		return;
	}
});

// Login a user with the given credentials
app.post("/ftd/api/login", async (req, res) => {
	try {
		let result = {};
		let username = req.body.username.toLowerCase();
		let plaintextPassword = req.body.password;

		// Input validation for password and username
		if (username.length < 6 || username.length > 50 || plaintextPassword.length < 6 || plaintextPassword.length > 50) {
			res.status(400).send();
			return;
		}

		// Check if the username and password match a user in the database
		sql = "SELECT password FROM users WHERE username=?;";
		db.get(sql, [username], async (err, row) => {
			// Username does not exist
			if (!row) {
				res.status(401).json(result);
				return;
			}
			// The username exists
			else if (!err) {
				let passwordMatches = await bcrypt.compare(plaintextPassword, row.password);
				// The password matches
				if (passwordMatches) {
					// Generate a JWT token
					let payload = {
						humanUser: {
							username: username
						}
					};
					let token = jwt.sign(payload, jwtSecretKey, {
						expiresIn: 14400
					});
					//res.cookie("authToken", token);
					//add jwt to result
					result.jwt = token;

					// Send the JWT back to the user
					console.log(`${username} logged in`);
					res.status(200).json(result);
					return;
				}
				// Password does not match
				else {
					res.status(401).json(result);
					return;
				}
			} else {
				console.log(err);
				res.status(500).send("500: Internal server error");
				return;
			}
		});
	} catch (err) {
		// Internal Server Error
		console.log(err);
		res.status(500).send("500: Internal server error");
	}
});

// Modify a user's credentials
app.put("/ftd/api/users", async (req, res) => {
	try {
		// Determine if the JWT cookie is a valid token
		let decoded = jwt.verify(req.body.cookies, jwtSecretKey);
		console.log("Token is valid");

		// The user has a valid JWT token
		if (decoded && decoded.humanUser.username) {
			let loggedInUsername = decoded.humanUser.username;
			let plainPassword = req.body.password;
			let plainNewPassword = req.body.newPassword;
			let confirmPassword = req.body.confirmPassword;
			let newEmail = req.body.email;
			let newPassword = "";

			let passwordChange = false;
			let emailChange = false;

			// Check if email is valid
			const emailRE = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
			if (newEmail && !emailRE.test(newEmail)) {
				res.status(400).send();
				return;
			} else if (newEmail) {
				emailChange = true;
			}

			// Check if user wants to change password, if so, validate input
			if (plainNewPassword.length != 0) {
				if (plainNewPassword.length < 6 || plainNewPassword.length > 50 || confirmPassword.length < 6 || confirmPassword.length > 50) {
					res.status(400).send();
					return;
				}
				else if (plainNewPassword != confirmPassword) {
					res.status(400).send();
					return;
				}
				passwordChange = true;

				// Generate a hash for that password
				newPassword = await bcrypt.hash(plainNewPassword, saltRounds);
			}

			// Check if the username exists
			let sql = "SELECT * FROM users WHERE username=?;";
			db.get(sql, [loggedInUsername], async (err, row) => {
				try {
					// Something went wrong with the database, return 500 error
					if (err != null) {
						console.log("Database error");
						console.log(err);
					}
					// The username exists
					if (row) {
						// console.log(row);
						if (!emailChange) {
							newEmail = row.email;
						}
						if (!passwordChange) {
							newPassword = row.password;
						}

						// Check to see if the user provided a correct password (so they can modify their info)
						let passwordMatches = await bcrypt.compare(plainPassword, row.password);

						// Password matches, modify user data
						if (passwordMatches) {
							let sql = "UPDATE users SET email=?, password=? WHERE username=?;";
							db.get(sql, [newEmail, newPassword, loggedInUsername], async (err, row) => {
								// Database error; unable to update successfully
								if (err) {
									console.log(err);
									res.status(500).send();
									return;
								}
								// Successfully updated user information
								else {
									res.status(200).send(
										"Modified user data"
									);
									return;
								}
							});
						}
						// User provided an incorrect password (current password)
						else {
							res.status(401).send();
							return;
						}
					} else {
						// The username does not exist in the database
						res.status(500).send();
						console.log("Should not be getting here")
						return;
					}
				} catch (error) {
					console.log(error);
					res.status(500).send();
					return;
				}
			});
		}
	} catch (err) {
		res.status(401).send("Not authorized. Please login");
		return;
	}
});

// Send userProfile info to prefill input fields
app.post("/ftd/api/getUserInfo", async (req, res) => {
	try {

		let decoded = jwt.verify(req.body.cookies, jwtSecretKey);

		// The user has a valid JWT token
		if (decoded && decoded.humanUser.username) {
			let loggedInUsername = decoded.humanUser.username;

			sql = "SELECT * FROM users WHERE username=?;";
			db.get(sql, [loggedInUsername], async (err, row) => {
				result = {};

				// Username does not exist
				if (!row) {
					res.status(403).json(result);
					return;
				}
				// The username exists, send the users information back to the front-end
				else if (!err) {
					result = {
						email: row.email,
						username: loggedInUsername
					};
					res.status(200).send(result);
				} else {
					// Database error
					// console.log(err);
					res.status(500).send();
					return;
				}
			});
		}
	} catch (err) {
		// console.log(err);
		res.status(401).send("Not authorized. Please login");
		return;
	}
});

// Log out the user; clear their JWT token when they log out
app.post("/ftd/api/logout", async (req, res) => {
	res.clearCookie("jwt");
	res.status(200).json({ loggedOut: "LoggedOut" });
	return;
});

// Check to see if the user is logged in (used for when they refresh the page)
app.post("/ftd/api/verify", async (req, res) => {
	try {
		// Verify JWT Token
		let decoded = jwt.verify(req.body.cookies, jwtSecretKey);

		return res.status(200).json({
			username: decoded.humanUser.username,
			verified: "Verified"
		});
	} catch (err) {
		// console.log(err);
		res.status(401).send("Not authorized");
		return;
	}
});

// TODO: This is a duplicate method of the one above
// Get username of the user logged in
app.post("/ftd/api/username", async (req, res) => {
	try {
		// Verify JWT Token
		let decoded = jwt.verify(req.body.cookies, jwtSecretKey);

		return res.status(200).json({
			username: decoded.humanUser.username,
			verified: "Verified"
		});
	} catch (err) {
		// console.log(err);
		res.status(401).send("Not authorized");
		return;
	}
});

// Delete the user 
app.delete("/ftd/api/users", async (req, res) => {
	try {
		let plaintextPassword = req.body.password;

		// Verify JWT Token
		let decoded = jwt.verify(req.body.cookies, jwtSecretKey);
		loggedInUsername = decoded.humanUser.username;

		sql = "SELECT password FROM users WHERE username=?;";
		db.get(sql, [loggedInUsername], async (err, row) => {
			// Database error
			if (err) {
				res.status(500).json(result);
				return;
			}

			// The username exists
			if (row) {
				let passwordMatches = await bcrypt.compare(plaintextPassword, row.password);
				// The password matches
				if (passwordMatches) {
					let sql = "DELETE FROM users WHERE username=?;";
					db.get(sql, [loggedInUsername], async (err, row) => {
						// Database error; unable to update successfully
						if (err) {
							// console.log(err);
							res.status(500).send();
							return;
						}
						// Successfully delete user
						else {
							res.clearCookie("jwt");
							res.status(200).send();
							return;
						}
					});
				} else {
					res.status(401).send();
					return;
				}
			}
		});
	} catch (err) {
		// console.log(err);
		res.status(401).send();
		return;
	}
});


// Insert game record into leaderboard
app.post("/ftd/api/leaderboard", async (req, res) => {
	try {
		// Verify JWT Token
		let decoded = jwt.verify(req.cookies.authToken, jwtSecretKey);

		let username = decoded.humanUser.username;
		let currentTime = (new Date()).toISOString();
		let kills = req.body.kills;
		let completionTime = req.body.completionTime;

		let sql = "INSERT INTO scores(username, recordDate, kills, completionTime) VALUES (?,?,?,?);";
		db.run(sql, [username, currentTime, kills, completionTime], err => {
			// Database error
			if (err) {
				console.log(err);
				res.status(500).send();
				return;
			}
			// Successfully added user
			else {
				res.status(200).send();
				return;
			}
		});
	} catch (err) {
		// console.log(err);
		res.status(401).send("Not authorized");
		return;
	}
});

// Get all game records from the leaderboard
app.get("/ftd/api/leaderboard", async (req, res) => {
	try {
		let sql = "SELECT * FROM scores ORDER BY completionTime;";
		db.all(sql, [], (err, rows) => {
			// Database error
			if (err) {
				res.status(500).send();
				return;
			}
			// Successfully grabbed data
			else {
				let numRecords = rows.length;
				let records = {
					numScores: numRecords
				};

				// No data yet (leaderboards are empty)
				if (numRecords == 0) {
					res.status(200).json(records);
					return;
				}

				// Populate the return JSON array with scores
				let i = 0;
				while (i < rows.length && i < 10) {
					records[i + 1] = {
						username: rows[i].username,
						recordDate: rows[i].recordDate,
						kills: rows[i].kills,
						completionTime: rows[i].completionTime
					};
					i++;
				}

				// console.log(records);
				res.status(200).send(records);
				return;
			}
		});
	} catch (err) {
		// console.log(err);
		res.status(500).send("Not authorized");
		return;
	}
});

app.listen(PORT, function () {
	console.log(`[INFO] express-server.js is listening on port ${PORT}`);
});