Dagbok Backend

## 8/5

### Setup

Började med etablera node-version..

> npm list available

| CURRENT | LTS     | OLD STABLE | OLD UNSTABLE |
| ------- | ------- | ---------- | ------------ |
| 22.1.0  | 20.13.0 | 0.12.18    | 0.11.16      |
| 22.0.0  | 20.12.2 | 0.12.17    | 0.11.15      |

Senaste LTS är 20.13.0, den hämtas med

> nvm install --lts
> Och sen byta till den
> nvm use --lts

Nu kan node version verifieras med

> node -v

Nytt project:

> npm init

Lämnar alla values default förutom author och git-repo

Namnbyte av 'main' från index.js till app.js som i webbkursen.

Sen är det dags att lägga till lite standardpaket. Lägger även till mappar för routes och schemas, samt placeholder .js filer för dessa så de trackas av git.

> npm i express cors mongoose dotenv express-session

Nu är dags för initial commit. Skapar även en .gitignore för modules mappen.

```bash
git init
git add -A
git commit -m "Init"
git remote add origin git@bitbucket.org:nyste/dt167_project_backend.git
git push -u origin master
```

### Start building app.js

Kör igång express, dotenv, cors osv. Lägger även till "type": "module" i package.json så att det blir ES6 format på allt istället. Planen är att hosta DBn i molnet, så lägger även in DB adressen i .env.

## 10/5

Från mötet

- Lagra kommentarer på posts
- Lagra likes och dislikes som en lista med namn
- Konvertera till typescript

Konvertera till typescript:

```bash

npm install --save-dev typescript @types/node # Add typescript to project, and node types
npx tsc --init # Add TS config file
Use settings: # https://www.youtube.com/watch?v=H91aqUHn8sE
Move code to /src, add build script "tsc" to "package.json"
npm install -D @types/express @types/mongoose @types/cors # Add TS types for dependencies
Add "esModuleInterop": true to tsconfig..

# Add compile step to nodemon by adding scripts to package.json
  "scripts": {
    "build": "tsc --incremental",
    "start": "nodemon --watch src/**/*.ts --ext ts,tsx --exec \"npm run build && node dist/app.js\""
  },

```

### Atlas mongoDB setup

- Nytt project dt167g-project med kluster cluster0
- Ny user | heos2200 | Axoj1R2gpyNqyPfG

## 13/5

Arbete med authentication!

Nya funktioner för att genererar salt och password (sha256). Ny endspoints
api/users/register
api/users/login

Lägger till 'lodash' npm paket för saker som lodash.omit och lodash.merge som gör det enkelt att filtrerar bort password etc ur ett user objekt innan det returneras.
Lagt till verify function som nu används för nya posts endpoints

Inför möte imorrn

- Är SHA256 tillräckligt?
- Är sessionToken tillräckligt tsms med origin/ref headers och CSP policy?
- Bör vi ha en timestamp till auth?
- Vad sa daniel om timstamps förut?
- HTTPS som sista steg innan inlämning?
- Presentera endpoints. Vilka endpoints ska vara säkra? Bör vara möjligt att länka enskild post!

## 14/5

NPM paket för express: helmet, helmet-csp
https://www.npmjs.com/package/helmet
ratelimiting
schema-fix
fixa endpoints docs till readme.md

## 15/5

Todays todo-list:

- Fix posts routes that may crash server.
- Use posts routes as blueprint to implement comments routes.
- Fix Schemas to utilize timestamps as shown by DAJO. FIXED
- Evaluate timestamp fixes to cookies:
  - Band-aid solution with extra field in User schema (tokenTS), that is evaluated by verify() function?
  - Express-session migration?
- Upload API documentation to repo readme.md!
- follow/unfollow route user. Done.
- user schema valdidation update. Done.
- add username to User schema and allow route to accept it. Done.

## 16/5

Spillover from 15/5

- Fix posts routes that may crash server. Check.
- Use posts routes as blueprint to implement comments routes. Fixed. Comments are now nested inside posts.
- Evaluate timestamp fixes to cookies: Rain check.
  - Band-aid solution with extra field in User schema (tokenTS), that is evaluated by verify() function?
  - Express-session migration? Rain check.
- Upload API documentation to repo readme.md! Fixed.

New stuff:

- posts/edit endpoint: It is possible to edit arrays currently... If a malicious user figures out that you can pass validation by entering arbitary ObjectIDs into arrays it might lead to instability down the line.. Could be used to "farm" likes. Limited to fucking up your own posts, so not that big of a deal.
- comments endpoint needs some fancy logic so that they are also added to the posts array. Fixed. Comments are now nested inside posts.

Från möte:

- Ny endpoint - hämta followers/vänner - färdig populerade. Check
- Hoppas över friend requests? Bara followers så länge! Check
- Nytt user field `profilePicture` Check

23/5
 - Put profile page
 - Global posts feed
 - Joina user info
 - Joina lägst profile

