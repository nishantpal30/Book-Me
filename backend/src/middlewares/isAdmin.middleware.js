import jwt from "jsonwebtoken";

const isAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!token || !secret) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    const payload = jwt.verify(token, secret);
    if (payload?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.admin = { id: payload.sub || "admin", role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: "Admin token is invalid or expired" });
  }
};

export default isAdmin;
