import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const token = req.cookies.token || bearerToken;
    if (!token) {
      return res.status(401).json({ message: "User not authenticated", success: false });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = typeof decode?.userId === "object"
      ? decode.userId?.userId
      : decode?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token", success: false });
    }

    req.user = { id: { userId: String(userId) } };
    
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Invalid or expired token", success: false });
  }
};

export default isAuthenticated;
