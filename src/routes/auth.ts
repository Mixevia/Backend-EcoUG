import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/user";
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ── Validation rules ─────────────────────────────────────────
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("district").optional().trim().isLength({ max: 100 }),
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

// ── POST /api/auth/register ───────────────────────────────────
router.post("/register", registerRules, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, district } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, district });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, district: user.district, role: user.role },
    });
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post("/login", loginRules, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, district: user.district, role: user.role },
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get("/me", protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[me]", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
