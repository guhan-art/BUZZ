const jwt = require("jsonwebtoken");

// Use a secure fallback or the environment variable
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me-in-production";

// Middleware for Admin routes
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

// Middleware for Driver routes
function requireDriver(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "driver") {
      return res.status(403).json({ error: "Forbidden: Driver access required" });
    }
    
    // Security check: ensure the driver is only updating their own bus
    if (req.body && req.body.busId && String(req.body.busId) !== String(decoded.busId)) {
      return res.status(403).json({ error: "Forbidden: Cannot update another bus's location" });
    }
    
    req.driver = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

module.exports = {
  requireAdmin,
  requireDriver,
  JWT_SECRET,
};
