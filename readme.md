## Starting server

1. Pull repo
2. `npm install`
3. `npm start`

The npm `start` script will launch server with nodemon. See `package.json` for more info.

## Endpoints

All endpoints start with /api/v1/

### User endpoints

- GET users/:id
- GET users/email/:email
- GET users/follow/:userid
- GET users/unfollow/:userid

- POST users/register
  - Requires: firstname, lastname, email, password, username
  - Returns 400 if missing parameter
  - Returns 400 + validation error if failing to validate
  - Returns: New user on success
- POST users/login

  - Requires: email or username + password
  - Returns: User object and session cookie.
  - Returns: Forbidden(403) if auth fails

- POST users/logout
  - Returns: Success message hopefully.

### Post endpoints

- GET posts/:id (unverified)
- GET posts/user/:id (unverified)
- GET posts/feed/all
  - Returns the 50 latest non-private posts ordered by date with most recent first.
- GET posts/feed/follows
  - Returns the 50 latest posts from those you follow. If the amount of posts is less than 50, additional non-private posts from other users are concatenated at the end, with the most recent first.
- POST posts/add
  - Requires: body
  - Returns: Added post
  - Info: author is added automatically via auth cookie
- PUT posts/edit
  - Requires: 0-n parameters (body, comments, likes, dislikes)
  - Returns: Edited post
  - Info: only body will be editable in the future
- DELETE posts/delete
  - Requires: \_id (post id)
  - Returns: Deleted post
  - Info: author is verified automatically via auth cookie
- POST posts/like
  - Requires: \_id
  - output: updated object
  - info:
    - automatically removes dislike
    - toggled, if already liked, the like is removed
- POST posts/dislike
  - Requires: \_id
  - output: updated object
  - info:
    - automatically removes dislike
    - toggled, if already liked, the like is removed

Post endpoints for comments:

- POST posts/comment/add
  - Requires: \_id (of post to comment)
  - output: updated post object
- POST posts/comment/delete
  - Requires: \_id, post_id (\_id refers to comment, post_id refers to \_id of post)
  - output: updated post object
