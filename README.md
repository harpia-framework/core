# Harpia Framework

Harpia Core is the foundational module of the Harpia Framework, designed exclusively for the Bun runtime. Like Express, Fastify, or Hono, it can be used independently, offering a lightweight yet powerful foundation for building modern web applications optimized for Bun.


[![TypeScript](https://img.shields.io/badge/TypeScript-%3E%3D%204.x-blue.svg)](https://www.typescriptlang.org/)

[![Bun](https://img.shields.io/badge/Bun-%3E%3D%201.x-blue.svg)](https://bun.sh/)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/harpia-framework/core/blob/main/LICENSE)


## Features

- Route management
- Middleware support
- Static file support
- Template engine support
- Custom "not found" route
- Custom cors
- Cookie handling
- Cache management
- Session management


## Examples

### Start the server
```typescript
import harpia from "harpia";

const app = harpia();

app.listen(3000, () => console.log("Server started at http://localhost:3000/"));
```

### Route management

Create a route in a different file.

```typescript
import { Router } from "harpia";

const books = Router();

books.get("/books", () => console.log("Books route"));

export default books;
```


Import the route into the main application.

```typescript
import harpia from "harpia";
import books from "./books.routes";

const app = harpia();

app.routes(books);
app.listen(3000, () => console.log("Server started at http://localhost:3000/"));
```

### Middlewares
**Set a global middleware**

```typescript
const app = harpia();

app.use((req, res, next) => {
  // Your middleware logic
  next();
});
```

**Set a middleware with path**

```typescript
app.use("/panel", (req, res, next) => {
  // Your middleware logic
  next();
});
```

**Set a middleware to a specific route**

```typescript
import { Router } from "harpia";

const books = Router();

books.get(
    "/books",
    () => console.log("auth middleware"),
    () => console.log("Books route")
);

export default books;
```

### Static Files
To serve static files, you need to create a folder for them—e.g., `public`.

```typescript
const app = harpia();

app.static("public");
```

### Template Engine
To set up a template engine, you can follow these steps:

Create a file for engine configuration:
```typescript
// src/ejs.ts
import ejs from "ejs";
import path from "node:path";
import type { Harpia } from "harpia";

export const ejsEngine = {
  configure: (app: Harpia) => {
    app.engine.set(ejsEngine);
  },
  render: async (view: string, data: Record<string, any>) => {
    const filePath = path.resolve(process.cwd(), "src/views", `${view}.ejs`);   

    return await ejs.renderFile(filePath, data);
  }
};
```

Set up the application to use the engine:
```typescript
import harpia from "harpia";
import { ejsEngine } from "./ejs";

const app = harpia();

ejsEngine.configure(app);

app.get("/books", async (req, res) => {
  await res.render("home", { title: "Books" })
});

app.listen(3000, () => console.log("Server started at http://localhost:3000/"));
```

Sample EJS Template (e.g., `src/views/home.ejs`):
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```

### Custom "not found" route
You can define a custom "Not Found" route to handle requests to undefined paths.
```typescript
const app = harpia();

app.setNotFound((req, res) => {
  res.json({ status: 404, message: "Not Found" });
});
```

If you want to specify a particular HTTP method for the "Not Found" route (e.g., only for `GET` requests), you can do it as follows:
```typescript
const app = harpia();

app.setNotFound((req, res) => {
  res.json({ status: 404, message: "Not Found" });
}, ["GET"]);
```

**Note**: Currently, the framework does not support multiple "Not Found" routes for different HTTP methods or paths. You can only define one "Not Found" route.

### Cors
Harpia provides a way to configure Cross-Origin Resource Sharing (CORS) for your application, allowing you to specify which origins, HTTP methods, and headers are permitted.

You can define CORS settings globally for the entire application or specify them for individual routes.

#### Basic CORS Setup

To set up basic CORS for your application:

```typescript
import harpia from "harpia";

const app = harpia();

app.cors({
  origin: "*",  // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE"],  // Allow specific HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"],  // Allow specific headers
});

app.listen(3000, () => console.log("Server started at http://localhost:3000/"));
```

#### Customizing CORS for Specific Routes

You can also apply different CORS configurations to specific routes or groups of routes.

```typescript
import harpia, { Router } from "harpia";

const books = Router();

books.get("/books", () => {
  console.log("Books route with custom CORS");
});

const app = harpia();
app.routes(books);

app.cors({
  origin: "https://example.com",  // Allow only this origin
  methods: "GET",  // Allow only GET method
}, "/books");  // Apply CORS only to the "/books" route

app.listen(3000, () => console.log("Server started at http://localhost:3000/"));
```

#### CORS Options

You can configure the following options for CORS:

- **`origin`**: Specifies the allowed origins. Can be a boolean (`true` to allow all), a string (a specific origin), a regular expression, or an array of origins or regular expressions.
  
  Example:
  - `true`: Allow all origins.
  - `"https://example.com"`: Allow only `example.com`.
  - `/^https:\/\/.*\.com$/`: Allow any `.com` domain.

- **`methods`**: Defines the allowed HTTP methods. It can be a single method (`"GET"`, `"POST"`, etc.), an array of methods, or `"*"`, which means all methods are allowed.

- **`allowedHeaders`**: Specifies which headers can be included in the request. It can be a string (e.g., `"Content-Type"`) or an array of headers.

- **`exposedHeaders`**: Allows you to specify which headers can be exposed to the browser. It can be a string or an array of headers.

- **`credentials`**: Indicates whether the browser should send cookies and HTTP authentication information with cross-origin requests. Set to `true` to allow credentials.

- **`maxAge`**: Specifies the maximum time (in seconds) that the browser should cache the CORS response.

- **`preflightContinue`**: If `true`, the framework will not respond to preflight requests automatically; this must be handled by the user manually.

- **`optionsSuccessStatus`**: Allows you to specify a custom success status code for preflight requests (defaults to `204`).

#### Example with All Options

```typescript
import type { CorsOptions } from 'harpia';

const corsOptions: CorsOptions = {
  origin: "https://example.com",  // Allow only requests from example.com
  methods: ["GET", "POST"],       // Allow only GET and POST methods
  allowedHeaders: ["Content-Type", "Authorization"],  // Allow specific headers
  exposedHeaders: ["X-Custom-Header"],  // Expose custom headers to the client
  credentials: true,  // Allow credentials (cookies) in cross-origin requests
  maxAge: 3600,  // Cache the CORS preflight response for 1 hour
  optionsSuccessStatus: 200,  // Custom success status code for preflight requests
}

app.cors(corsOptions);
```

### Cookies
You can use this to store session information, authentication tokens, or any other data that needs to persist across requests.

#### Setting a Cookie

To set a cookie, you can use the `res.cookies.set` method. You can specify various options such as expiration date, domain, path, and security settings.

```typescript
import harpia, { type CookiesOptions } from "harpia";

const app = harpia();

app.get("/set-cookie", (req, res) => {
  const cookieOptions: CookiesOptions = {
    path: "/",
    maxAge: 3600,  // 1 hour
    secure: true,  // Only send cookie over HTTPS
    httpOnly: true,  // Make the cookie inaccessible to JavaScript
    sameSite: "Strict",  // Restrict the cookie to first-party contexts
  };
  
  res.cookies.set("userSession", "abcd1234", cookieOptions);  // Set a cookie with options
  res.send("Cookie has been set!");
});

app.listen(3000, () => console.log("Server started at http://localhost:3000/"));
```

#### Getting a Cookie

To retrieve a cookie, you can use the `get` method. It returns the value of the specified cookie if it exists, or `undefined` if the cookie is not found.

```typescript
app.get("/get-cookie", (req, res) => {
  const userSession = req.cookies.get("userSession");  // Get the cookie

  if (userSession) {
    res.send(`User session: ${userSession}`);
  } else {
    res.send("No user session cookie found.");
  }
});
```

#### Deleting a Cookie

To delete a cookie, you can use the `delete` method. This sets the cookie value to an empty string and expires it immediately.

```typescript
app.get("/delete-cookie", (req, res) => {
  res.cookies.delete("userSession");  // Delete the cookie
  res.send("Cookie has been deleted.");
});
```

#### Cookie Options

You can customize cookies using the following options:

- **`path`**: The URL path for which the cookie is valid. Defaults to the root path (`/`).
- **`domain`**: The domain for which the cookie is valid. Defaults to the current domain.
- **`maxAge`**: The maximum age of the cookie in seconds. If not set, the cookie will be a session cookie, expiring when the browser closes.
- **`expires`**: The exact expiration date for the cookie. Can be set as a `Date` object.
- **`httpOnly`**: If `true`, the cookie will be inaccessible to JavaScript, protecting it from cross-site scripting (XSS) attacks.
- **`secure`**: If `true`, the cookie will only be sent over HTTPS connections, ensuring its security.
- **`sameSite`**: Controls whether the cookie should be sent with cross-origin requests. Possible values are:
  - `"Strict"`: The cookie will only be sent in a first-party context (i.e., when navigating to the origin site).
  - `"Lax"`: The cookie will be sent for top-level navigations and GET requests.
  - `"None"`: The cookie will be sent with all requests, including cross-origin requests. If using `"None"`, the `secure` flag must also be set to `true`.

Example of using `SameSite`:

```typescript
const cookieOptions: CookiesOptions = {
  sameSite: "Strict",  // Only send the cookie in a first-party context
  secure: true,        // Send only over HTTPS
};
res.cookie("userSession", "abcd1234", cookieOptions);
```

#### Getting All Cookies

To retrieve all cookies in the request, you can use the `getAll` method, which returns a dictionary of cookie names and values.

```typescript
app.get("/get-all-cookies", (req, res) => {
  const allCookies = req.cookies.getAll();  // Get all cookies
  res.json(allCookies);
});
```

### Cache

Harpia includes a `Cache` class that allows you to store and manage cached data for your web applications.

#### Creating a Cache Instance

To create a new cache instance, simply instantiate the `Cache` class. You can optionally provide a custom `store` (e.g., using a custom memory store or a third-party store like Redis).

```typescript
import harpia from "harpia";
import { Cache } from "harpia/cache";

const app = harpia();
const cache = new Cache();
```

#### Storing and Retrieving Data in Cache via Routes

You can store data in the cache or retrieve it from the cache within route handlers. Here's an example of caching a value in a route and retrieving it from the cache in a different route:

```typescript
import harpia from "harpia";
import { Cache } from "harpia/cache";

const app = harpia();
const cache = new Cache();

// Route to set data in the cache
app.get("/set-cache", async (req, res) => {
  const userProfile = { username: "john_doe", age: 30 };
  await cache.set("userProfile", userProfile);
  res.json({ message: "User profile cached!" });
});

// Route to retrieve data from the cache
app.get("/get-cache", async (req, res) => {
  const userProfile = await cache.get("userProfile");
  if (!userProfile) {
    res.json({ status: "not found", message: "User profile not found in cache." });
    return;  
  }

  res.json({ status: "success", data: userProfile });
});

app.listen(3000, () => console.log("Server started at http://localhost:3000/"));
```

In the example above:
1. **`/set-cache`** stores a user profile object in the cache under the key `userProfile`.
2. **`/get-cache`** retrieves the cached user profile if available. If it's not found, it returns a "not found" message.

#### Deleting Data from Cache via Route

You can also delete cached data using a route. Here's an example of how to delete a cache entry:

```typescript
app.get("/delete-cache", async (req, res) => {
  await cache.delete("userProfile");
  res.json({ message: "User profile cache deleted!" });
});
```

#### Example Usage

Here's an example of using caching in a real-world scenario, such as caching user profile data for performance optimization. In this case, if the user profile is already cached, it will be returned from the cache instead of fetching it again from the database.

```typescript
app.get("/user-profile/:id", async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `userProfile:${userId}`;

  // Try to fetch the user profile from the cache
  const cachedProfile = await cache.get(cacheKey);
  if (cachedProfile) {
    res.json({ status: "success", data: cachedProfile });
    return;
  }

  // If not in cache, fetch the profile from the database (simulated here)
  const profile = { id: userId, username: "john_doe", age: 30 };

  // Store the profile in cache for future requests
  await cache.set(cacheKey, profile);

  // Respond with the fetched profile
  res.json({ status: "success", data: profile });
});
```

### Session

Harpia includes a `Session` class that allows you to manage user sessions. The `Session` class utilizes a store (default is in-memory) to manage session data, and a cookie is used to track the session ID on the client-side.

#### Creating a Session Instance

To use the session management functionality, you first need to create an instance of the `Session` class.

```typescript
import harpia from "harpia";
import { Session } from "harpia/session";

const app = harpia();
const session = new Session();
```

#### Creating a New Session

You can create a new session with a given data object. When a session is created, a session ID is generated and the session data is stored.

```typescript
app.get("/login", async (req, res) => {
  const userData = { username: "john_doe", role: "admin" };
  const sessionId = await session.create(userData);
  
  // Set the session ID in the cookie
  session.setCookie(res, sessionId, { httpOnly: true, secure: true });
  
  res.json({ message: "User logged in successfully!" });
});
```

In this example, when a user logs in, a new session is created with the user data, and the session ID is stored in a cookie on the client.

#### Retrieving Session Data

You can retrieve session data from the store using the session ID stored in the client's cookies. The session ID is sent with each request in the cookie.

```typescript
app.get("/profile", async (req, res) => {
  const userSession = await session.fromRequest(req);
  
  if (userSession) {
    res.json({ status: "success", data: userSession });
  } else {
    res.json({ status: "not authenticated", message: "Please log in first." });
  }
});
```

Here, the session data is retrieved based on the session ID from the client's cookies. If the session exists, the user's data is returned; otherwise, the user is prompted to log in.

#### Updating Session Data

Session data can be updated by fetching the existing data and modifying it.

```typescript
app.get("/update-profile", async (req, res) => {
  const sessionId = req.cookies.get("session_id");
  if (sessionId) {
    const updatedData = { role: "super_admin" };
    const success = await session.update(sessionId, updatedData);
    
    if (success) {
      res.json({ status: "success", message: "Profile updated." });
    } else {
      res.json({ status: "error", message: "Session not found." });
    }
  } else {
    res.json({ status: "error", message: "Session not found." });
  }
});
```

In this example, the session data is updated by passing the new data. If the session is valid, the updated information is stored in the session.

#### Deleting a Session

When a user logs out or you want to clear the session data, you can delete the session both from the store and the client's cookies.

```typescript
app.get("/logout", async (req, res) => {
  const sessionId = req.cookies.get("session_id");
  if (sessionId) {
    await session.delete(sessionId, res);
    res.json({ message: "User logged out successfully!" });
  } else {
    res.json({ message: "No active session found." });
  }
});
```

Here, the session is deleted, and the corresponding cookie is also cleared.

#### Custom Session Cookie Options

When setting the session cookie, you can specify options such as `httpOnly`, `secure`, and `maxAge`.

```typescript
app.get("/set-cookie", (req, res) => {
  const sessionId = "example-session-id";
  session.setCookie(res, sessionId, { httpOnly: true, secure: true, maxAge: 3600 });
  res.json({ message: "Session cookie set." });
});
```

In this example, the session cookie is set with options that make it HTTP-only (not accessible via JavaScript) and secure (only sent over HTTPS). The `maxAge` option is also set to define how long the cookie should last (in seconds).


### Redis Store with ioredis

Harpia supports using Redis as a session store, which allows for scalable and persistent session management. This section demonstrates how to set up and use a Redis-backed session store using the `ioredis` client.

#### RedisStore Class

The `RedisStore` class provides methods to interact with Redis for session management. It allows you to store, retrieve, and delete session data using a Redis database.

```typescript
import Redis from "ioredis";
import type { Store } from "harpia";

export class RedisStore implements Store {
  private client: Redis;
  private prefix: string;

  constructor(client: Redis, prefix: string = "session_") {
    this.client = client;
    this.prefix = prefix;
  }

  private getKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  async get(sessionId: string): Promise<Record<string, any> | undefined> {
    const data = await this.client.get(this.getKey(sessionId));
    return data ? JSON.parse(data) : undefined;
  }

  async set(sessionId: string, data: Record<string, any>): Promise<void> {
    await this.client.set(this.getKey(sessionId), JSON.stringify(data));
  }

  async delete(sessionId: string): Promise<void> {
    await this.client.del(this.getKey(sessionId));
  }
}
```

In this example, the `RedisStore` class uses `ioredis` to interact with Redis. The session data is stored as a JSON string, and keys are prefixed with `session_` to avoid key collisions.

#### Example Usage with Harpia

Once you've set up the `RedisStore`, you can use it in your routes to manage sessions. Below is an example of how to use Redis to manage user sessions in a Harpia app:

```typescript
import Redis from "ioredis";
import { Router } from "harpia";
import { Session } from "harpia/session";
import { RedisStore } from "./redis-store";

// Redis Setup
const redisClient = new Redis();
const redisStore = new RedisStore(redisClient, "my_sessions_");
const useSession = new Session({ store: redisStore, cookieName: "my_session_id" });

// Routes Setup
const session = Router();

session.post("/login", async (req, res) => {
  const sessionExists = await useSession.fromRequest(req);
  if (sessionExists) {
    res.json({ message: "Session does not exists." });
  } else {
    const sessionData = { userId: "12345", username: "pyro" };
    const sessionId = await useSession.create(sessionData);
  
    useSession.setCookie(res, sessionId, { maxAge: 3600, httpOnly: true, secure: true });
    res.cookies.set("theme", "dark");
    res.json({ message: "Successful login!" });
  }
});

session.get("/profile", async (req, res) => {
  const sessionData = await useSession.fromRequest(req);  

  if (sessionData) {
    res.json({ profile: sessionData });
  } else {
    res.status(401).json({ message: "Session expired or not found!" });
  }
});

session.post("/logout", async (req, res) => {
  const sessionId = req.cookies.get("my_session_id");

  if (sessionId) {
    await useSession.delete(sessionId, res);
    res.json({ message: "Successful logout!" });
  } else {
    res.status(400).json({ message: "Session not found!" });
  }
});

export { session };
```

#### How It Works:

- **Login Route (`/login`)**: When a user logs in, a new session is created with the user's data. The session ID is stored in a Redis database and sent to the client as a cookie. If a session already exists, the user is notified.
- **Profile Route (`/profile`)**: The user's session data is fetched from Redis using the session ID stored in the client's cookie. If the session is valid, the user's profile data is returned.
- **Logout Route (`/logout`)**: When the user logs out, the session is deleted from Redis, and the session cookie is cleared from the client.

#### Redis Configuration

Ensure that the Redis client is properly configured to connect to your Redis instance. You can pass options to the `Redis` constructor for specific configurations such as host, port, or authentication credentials.

```typescript
const redisClient = new Redis({
  host: "localhost",
  port: 6379,
  password: "your_redis_password", // if authentication is required
});
```

---

This integration provides a persistent session management system backed by Redis, allowing you to scale your application efficiently. The session data is stored securely and can be accessed across different instances of your application.

### Redis Store with connect-redis

Here we use `connect-redis`, which integrates seamlessly with Redis for session storage and management. Below is the required code to set up `connect-redis` with the `redis` client to store sessions persistently.

#### RedisStore Class with connect-redis

The `RedisStore` class uses `connect-redis` to manage sessions. It stores and manages sessions in a way similar to `RedisStore` with `ioredis`, but now uses the `connect-redis` API.

```typescript
import { createClient } from "redis";
import { RedisStore as ConnectRedisStore } from "connect-redis";
import type { Store } from "harpia/session";

export class RedisStore implements Store {
  private store: ConnectRedisStore;

  constructor(options: { prefix?: string; client?: ReturnType<typeof createClient> }) {
    const redisClient = options.client || createClient();
    redisClient.connect().catch(console.error);
    this.store = new ConnectRedisStore({
      client: redisClient,
      prefix: options.prefix || "session_",
    });
  }

  async get(sessionId: string): Promise<Record<string, any> | undefined> {
    return new Promise((resolve, reject) => {
      this.store.get(sessionId, (err, session) => {
        if (err) return reject(err);
        resolve(session || undefined);
      });
    });
  }

  async set(sessionId: string, data: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.store.set(sessionId, data, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async delete(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.store.destroy(sessionId, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
```

The `RedisStore` class uses `createClient` from `redis` to connect to Redis and utilizes `connect-redis` to store and manage session data. Sessions are stored in Redis with a prefix, which defaults to `session_`.

#### Example Usage with Harpia

Here’s how you can integrate `RedisStore` with session management in your Harpia application, using cookies to maintain the session state across requests.

```typescript
import { Router } from "harpia";
import { Session } from "harpia/session";
import { RedisStore } from "./redis/connect-redis";
import { createClient } from "redis";

// Redis Setup
const redisClient = createClient();
const redisStore = new RedisStore({ client: redisClient, prefix: "session_" });
const useSession = new Session({ store: redisStore, cookieName: "my_session_id" });

// Routes Setup
const routes = Router();

routes.post("/login", async (req, res) => {
  const sessionExists = await useSession.fromRequest(req);
  if (sessionExists) {
    res.json({ message: "Session already exists" });
  } else {
    const sessionData = { userId: "12345", username: "pyro" };
    const sessionId = await useSession.create(sessionData);
  
    useSession.setCookie(res, sessionId, { maxAge: 3600, httpOnly: true, secure: true });
    res.cookies.set("theme", "dark"); 
    res.json({ message: "Login successful!" });
  }
});

routes.get("/profile", async (req, res) => {
  const sessionData = await useSession.fromRequest(req);  

  if (sessionData) {
    res.json({ profile: sessionData });
  } else {
    res.status(401).json({ message: "Session expired or not found!" });
  }
});

routes.post("/logout", async (req, res) => {
  const sessionId = req.cookies.get("my_session_id");

  if (sessionId) {
    await useSession.delete(sessionId, res);
    res.json({ message: "Logout successful!" });
  } else {
    res.status(400).json({ message: "Session not found!" });
  }
});

export { routes };
```

#### How it Works:

1. **Login (`/login`)**: When the user logs in, a new session is created in Redis. The session ID is stored as a cookie in the client, and session data is stored in Redis. If a session already exists, the user is notified.
2. **Profile (`/profile`)**: The user's session is checked by looking at the session ID stored in the cookies. If the session is valid, the profile data is returned.
3. **Logout (`/logout`)**: When the user logs out, the session is removed from Redis, and the session cookie is deleted.

#### Redis Configuration

Make sure Redis is properly configured for your environment. If necessary, you can configure additional options for the `redis` client:

```typescript
const redisClient = createClient({
  host: "localhost",
  port: 6379,
  password: "your_redis_password", // if needed
});
```

---

This setup provides a robust and scalable way to manage sessions in Redis, leveraging `connect-redis` and the `redis` client. It ensures your application is efficient in terms of storage and easily scalable.