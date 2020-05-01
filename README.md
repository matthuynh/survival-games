Steps to Run:
- Install server dependencies:
    - `cd server && npm install`

- Setup database
    - `cd server/db`
    - `sqlite3 database.db < schema.sql`
    - `sqlite3 database.db < schema.sql`

- Run Express Server:
    - From server directory, do `npx nodemon express-server.js 10421`
    - We have specified the express server to run on port 10421

- Run Web Socket Server:
    - From server directory, do `npx nodemon socket-server.js`
    - The web socket server runs on port 10000
    
- Install client dependencies (for Create-React-App):
    - `cd client && npm install`

- Running client code:
    - `cd client && npm start`

- On your browser navigate to `http://localhost:3000`

- The process of getting this working on mobile is explained in features.txt



----------------------------------------------------
** TODO
- Improve directory structure of back-end (eg. use config/.env, separate route JS files)
- Add a bash script for re-installing everything

** Known Bugs and Issues
- Recreate: on the same browser, have two tabs on the log-in page. Login to User A on one tab, and then to User B on another tab. This shows as User B being logged-in. This should not happen, and User B shouldn't be alloewd to login

