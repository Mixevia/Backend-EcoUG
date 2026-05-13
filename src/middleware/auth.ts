import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const user = await User.findById(req.userId as string);
jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "15m" });

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role?: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  }
  next();
};