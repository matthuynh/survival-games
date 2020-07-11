## Running Locally (development environment):
1. Install server dependencies:
    - `npm install`

2. Setup database
    - `cd server/db`
    - `sqlite3 database.db < schema.sql`
    - `sqlite3 database.db < schema.sql`

3. Run Express Server:
    - Do `npx nodemon express-server.js`
    - We have specified the express server to run on port 10421

4. Run Web Socket Server:
    - Do `npx nodemon socket-server.js`
    - The web socket server runs on port 10000
    
5. Install client dependencies (for Create-React-App):
    - `cd client && npm install`

6. Running client code:
    - `cd client && npm start`

7. On your browser navigate to `http://localhost:3000`
    - This connects to the local React dev server
    - Alternatively, you may navigate to `http://localhost:10421` to serve files directly from the `build` folder

---

## Deploying to Heroku (production environment)

### Initial Setup
- Create React App Production Build:
    - This builds the React client code so that it can be served by express-server.js
    - Read https://create-react-app.dev/docs/deployment/
        - `cd client && npm run build`
    - This generates a `build` directory that contains all front-end client files
    - We want `express-server.js` to be serve front-end files from `build` when the user visits the site

- Heroku Build:
    - General docs: https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true
    1. Set-up a Heroku app (you may do this on the site or through the command line) and connect this app to Heroku's remote Git repository
        - https://devcenter.heroku.com/articles/git#creating-a-heroku-remote
    2. Prepare the codebase for Heroku deployment
        - https://devcenter.heroku.com/articles/preparing-a-codebase-for-heroku-deployment
    3. Deploying to Heroku means pushing to Heroku's remote Git repo
        - The client directory is only used for local dev env
        - From project root, `git push heroku master`
    4. Sockets

### Useful Heroku Commands
- Check if an instance of the Heroku app is up
    - From root, do `heroku ps:scale web=1`
    - Visit the app by doing `heroku open` or by visiting the actual URL of the app
- Viewing logs
    - `heroku logs --tail`
- Connecting to Heroku bash
    - `heroku run bash`
    - You can check out the deployed files here `ls`
    - `exit` to exit

### Pushing updates to production (after initial setup)
- Whenever new changes are made to be made live, we will need to re-deploy the app
    - Prepare front-end for deployment:
        - if any changes were made to the `client` folder, rebuild it: `npm run build`
    - Push to Heroku's remote Git repostory
        - Make your changes and then commit them `git commit`
        - From project root, `git push heroku master`