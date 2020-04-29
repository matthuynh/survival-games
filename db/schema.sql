--- load with 
--- sqlite3 database.db < schema.sql
DROP TABLE users;
DROP TABLE scores;

CREATE TABLE users (
	username VARCHAR(50) PRIMARY KEY CHECK (length(username) >= 6),
	password VARCHAR(255) NOT NULL CHECK (length(password) >= 6),
	email VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE scores (
	username VARCHAR(50) NOT NULL,
	recordDate DATETIME NOT NULL,
	kills INTEGER NOT NULL,
	completionTime INTEGER NOT NULL,
	FOREIGN KEY (username) REFERENCES users(username),
	PRIMARY KEY (username, recordDate) 
);
