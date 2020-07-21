## Running Locally (development environment):
1. Install server dependencies:
    - `npm install`

2. Setup database
    - `cd db`
    - `sqlite3 database.db < schema.sql`
    - `sqlite3 database.db < schema.sql`

3. Run Backend Server:
    - Do `npx nodemon socket-server.js`
    - This runs both the Express server and WebSocket server on port 10000 by default

4. Install client dependencies (for Create-React-App):
    - `cd client && npm install`

5. Running client code:
    - `cd client && npm start`

6. On your browser navigate to `http://localhost:3000`
    - This connects to the local React dev server, meaning any changes you make to front-end files will reflect automatically

7. Optional - To simulate a prod environment, navigate to `http://localhost:10000` instead of `http://localhost:3000`
    - This serve files directly from the `client/build` folder
        - This only works if you have already done a prod build from CRA (see below)

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

### Workflow for deploying new builds to production
VERY IMPORTANT: To keep our git log looking nice, please follow the steps below carefully when deploying!! You may follow this workflow after following the steps above (ie. you already have a working instance of this application up on Heroku). Whenever you want your changes are made to be made live, you will need to re-deploy the app
0. Test your changes. If you have the `client/build` folder, be sure to delete it `rm -rf build` before the next step
1. Add and commit your changes to Git `git add --all`, `git commit -m <message>`
2. Build the front-end: `cd client && npm run build`
    - This uses CRA's webpack to build our front-end files
3. Notice that you will now have a `client/build` folder. Don't push this to `remote` (GitHub!)!!11!
    - Create a temp commit: `git add --all && git commit -m "Temporary Commit for Heroku"`
        - We will be reverting this commit later
    - Deploy to heroku: `git push heroku master --force`
        - You will know if you successfully deployed the build if you see something like this:
            ```
            ...
            remote: -----> Launching...
            remote:        Released v8
            remote:        https://your-app-name-here.herokuapp.com/ deployed to Heroku
            remote:
            remote: Verifying deploy... done.
            ...
            ```
    - Now, we want to delete the temporary commit you made earlier: `git reset --soft HEAD~1`
        - Careful! This removes your most RECENT commit! Your most recent commit should be the temp commit
4. Do `git log` to see if you have successfully deleted your most recent commit
    - The reason why we want to delete our most recent commit is because we don't want to push `client/build` to GitHub
5. Do `git status` -- you may see that `build` is staged for commit. What you can do now is delete the `build` folder, `rm -rf build`. Or, you can unstage them (however they'll still appear in your `git status` as unstaged changes): `git reset HEAD <file>`
6. Push your changes from Step 1 to GitHub: `git push` or `git push remote`

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
