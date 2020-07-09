Steps to Run:
- Install server dependencies:
    - `cd server && npm install`

- Setup database
    - `cd server/db`
    - `sqlite3 database.db < schema.sql`
    - `sqlite3 database.db < schema.sql`

- Run Express Server:
    - From root directory, do `npx nodemon ./server/express-server.js`
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

- In game-engine, remove unnecessary imports and extra functions (left them in for now for development purposes)

** Known Bugs and Issues
- Recreate: on the same browser, have two tabs on the log-in page. Login to User A on one tab, and then to User B on another tab. This shows as User B being logged-in. This should not happen, and User B shouldn't be alloewd to login

---

## Deploying

### Initial Setup
- CRA Production Build:
    - This builds the React client code so that it can be served by express-server.js
    - `cd client && npm run build`

- Heroku Build:
    - 1. https://devcenter.heroku.com/articles/git#creating-a-heroku-remote
    - 2. https://devcenter.heroku.com/articles/preparing-a-codebase-for-heroku-deployment
    - 3. https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true
    - Notes:
        - We want to deploy from the server directory

### Pushing updates to production (after initial setup)
- Whenever new changes are made to be made live, we will need to re-deploy the app
- We do this by pushing to Heroku's remote Git repostory
    - `cd server`
    - `git push heroku`