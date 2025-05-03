import jsonServer from "json-server";
import queryString from "query-string";
import bcrypt from "bcrypt"; // For password hashing
import jwt from "jsonwebtoken"; // For generating tokens
import { faker } from "@faker-js/faker";

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

const SECRET_KEY = "matmat"; // Secret key for JWT
const TOKEN_EXPIRATION = "1h"; // Token expiration time
const TOKEN_EXPIRATION_MS = 3600000; // Token expiration time in milliseconds (1 hour)

// Set default middlewares (logger, static, cors, and no-cache)
server.use(middlewares);

// Important: Add body-parser middleware BEFORE defining routes
server.use(jsonServer.bodyParser);

// Initialize tokens array in db.json if it doesn't exist
server.use((req, res, next) => {
  const db = router.db;
  if (!db.has("tokens").value()) {
    db.set("tokens", []).write();
  }

  // Initialize carts array if it doesn't exist
  if (!db.has("carts").value()) {
    db.set("carts", []).write();
  }

  next();
});

// Add create and update timestamps
server.use((req, res, next) => {
  if (req.method === "POST") {
    req.body.createdAt = Date.now();
    req.body.updatedAt = Date.now();
  }
  if (req.method === "PUT" || req.method === "PATCH") {
    req.body.updatedAt = Date.now();
  }
  next();
});

// Login endpoint
server.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const users = router.db.get("users").value(); // Access users from db.json
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(401).jsonp({ error: "Invalid email or password" });
  }

  // Verify password

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).jsonp({ error: "Invalid email or password" });
  }

  // Generate token
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
    expiresIn: TOKEN_EXPIRATION,
  });

  // Store token in database
  const expiresAt = Date.now() + TOKEN_EXPIRATION_MS; // 1 hour from now
  const tokenObject = {
    id: faker.string.uuid(),
    userId: user.id,
    token: token,
    createdAt: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // Adjusted to UTC+7
    expiresAt: new Date(expiresAt + 7 * 60 * 60 * 1000).toISOString(), // Adjusted to UTC+7
    isValid: true,
  };

  // Update user's lastLogin timestamp
  router.db
    .get("users")
    .find({ id: user.id })
    .assign({ lastLogin: new Date().toISOString() })
    .write();

  // Remove expired or duplicated tokens for this user
  const tokens = router.db.get("tokens").value();
  const validTokens = tokens.filter(
    (t) => !(t.userId === user.id) || new Date(t.expiresAt) > new Date()
  );
  router.db.set("tokens", validTokens).write();

  // Add the new token
  router.db.get("tokens").push(tokenObject).write();

  res.jsonp({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

// Register endpoint
server.post("/api/register", (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  const users = router.db.get("users").value(); // Access users from db.json

  // Check if the email is already registered
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).jsonp({ error: "Email is already registered" });
  }

  // Hash the password
  const passwordHash = bcrypt.hashSync(password, 10);
  const generateId = () => faker.string.uuid();

  // Create a new user
  const newUser = {
    id: generateId(),
    email,
    passwordHash,
    firstName,
    lastName,
    role: role || "customer", // Default role is "customer"
    verificationStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  // Add the new user to the database
  router.db.get("users").push(newUser).write();

  // Create an empty cart for the new user
  const newCart = {
    id: generateId(),
    userId: newUser.id,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add the cart to the database
  router.db.get("carts").push(newCart).write();

  // Generate a token for the new user
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, SECRET_KEY, {
    expiresIn: TOKEN_EXPIRATION,
  });

  // Store token in database
  const expiresAt = Date.now() + TOKEN_EXPIRATION_MS; // 1 hour from now
  const tokenObject = {
    id: faker.string.uuid(),
    userId: newUser.id,
    token: token,
    createdAt: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // Adjusted to UTC+7
    expiresAt: new Date(expiresAt + 7 * 60 * 60 * 1000).toISOString(), // Adjusted to UTC+7
    isValid: true,
  };

  router.db.get("tokens").push(tokenObject).write();

  res.status(201).jsonp({
    token,
    user: { id: newUser.id, email: newUser.email, role: newUser.role },
  });
});

// Logout endpoint to invalidate tokens
server.post("/api/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).jsonp({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // Invalidate the token in the database
  const tokens = router.db.get("tokens").value();
  const tokenIndex = tokens.findIndex((t) => t.token === token);

  if (tokenIndex >= 0) {
    router.db
      .get("tokens")
      .find({ token: token })
      .assign({ isValid: false })
      .write();
  }

  res.status(200).jsonp({ message: "Logged out successfully" });
});

// Token validation endpoint
server.get("/api/validate-token", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).jsonp({
      valid: false,
      error: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    // First verify JWT signature
    const decoded = jwt.verify(token, SECRET_KEY);

    // Then check if token exists in database and is valid
    const storedToken = router.db
      .get("tokens")
      .find({ token: token, isValid: true })
      .value();

    if (!storedToken) {
      return res.status(401).jsonp({
        valid: false,
        error: "Token not found or invalid",
      });
    }

    // Check if token has expired
    if (new Date(storedToken.expiresAt) < new Date()) {
      // Mark token as invalid
      router.db
        .get("tokens")
        .find({ token: token })
        .assign({ isValid: false })
        .write();
      return res.status(401).jsonp({
        valid: false,
        error: "Token expired",
      });
    }

    // Token is valid
    return res.status(200).jsonp({
      valid: true,
      user: { id: decoded.id, role: decoded.role },
    });
  } catch (err) {
    return res.status(401).jsonp({
      valid: false,
      error: "Invalid or expired token",
    });
  }
});

// Authentication middleware with token verification from database
server.use((req, res, next) => {
  if (
    req.path.startsWith("/api") &&
    req.method !== "GET" &&
    req.path !== "/api/login" &&
    req.path !== "/api/register"
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).jsonp({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
      // First verify JWT signature
      const decoded = jwt.verify(token, SECRET_KEY);

      // Then check if token exists in database and is valid
      const storedToken = router.db
        .get("tokens")
        .find({ token: token, isValid: true })
        .value();

      if (!storedToken) {
        return res.status(401).jsonp({ error: "Token not found or invalid" });
      }

      // Check if token has expired
      if (new Date(storedToken.expiresAt) < new Date()) {
        // Mark token as invalid
        router.db
          .get("tokens")
          .find({ token: token })
          .assign({ isValid: false })
          .write();
        return res.status(401).jsonp({ error: "Token expired" });
      }

      req.user = decoded; // Attach user info to the request
      next();
    } catch (err) {
      return res.status(401).jsonp({ error: "Invalid or expired token" });
    }
  } else {
    next();
  }
});

// Admin authorization middleware
server.use((req, res, next) => {
  if (req.path.startsWith("/admin")) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).jsonp({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, SECRET_KEY);

      // Verify token exists in database
      const storedToken = router.db
        .get("tokens")
        .find({ token: token, isValid: true })
        .value();

      if (!storedToken) {
        return res.status(401).jsonp({ error: "Token not found or invalid" });
      }

      if (decoded.role !== "admin") {
        return res
          .status(403)
          .jsonp({ error: "Forbidden: Admin access required" });
      }

      req.user = decoded; // Attach user info to the request
      next();
    } catch (err) {
      return res.status(401).jsonp({ error: "Invalid or expired token" });
    }
  } else {
    next();
  }
});

// Clean expired tokens once per hour
setInterval(() => {
  const tokens = router.db.get("tokens").value();
  const currentTime = new Date();
  const validTokens = tokens.filter(
    (token) => new Date(token.expiresAt) > currentTime && token.isValid
  );

  if (validTokens.length < tokens.length) {
    router.db.set("tokens", validTokens).write();
    console.log(
      `Cleaned up ${tokens.length - validTokens.length} expired tokens`
    );
  }
}, TOKEN_EXPIRATION_MS); // Run every hour

// add pagination to response
router.render = (req, res) => {
  const headers = res.getHeaders();
  const totalCountHeader = headers["x-total-count"];

  if (req.method === "GET" && totalCountHeader) {
    const queryParams = queryString.parse(req._parsedUrl.query); // Corrected usage

    const result = {
      body: res.locals.data,
      pagination: {
        _page: Number.parseInt(queryParams._page) || 1,
        _limit: Number.parseInt(queryParams._limit) || 16,
        _totalRows: Number.parseInt(totalCountHeader),
      },
    };

    return res.jsonp(result);
  }

  res.jsonp(res.locals.data);
};

// add /api before default routing
server.use("/api", router);
server.listen(3000, () => {
  console.log("JSON Server is running at http://localhost:3000/api");
});
