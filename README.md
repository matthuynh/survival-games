Steps to Run:
- Install server dependencies:
    - `cd server && npm install`

- Setup database
    - `cd db`
    - `sqlite3 database.db < schema.sql`
    - `sqlite3 database.db < schema.sql`

- Running Express Server:
    - From project root, do `npx nodemon express-server.js 10421`
    
- Install client dependencies (for Create-React-App):
    - `cd client && npm install`

- Running client code:
    - `cd client && npm start`

- On your browser navigate to `http://localhost:3000`

- The process of getting this working on mobile is explained in features.txt