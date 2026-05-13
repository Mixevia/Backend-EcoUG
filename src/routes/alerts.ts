import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { protect, requireRole, AuthRequest } from "../middleware/auth";
import Alert from "../models/alerts";
import mongoose from "mongoose";

const router = Router();

const alertRules = [
  body("title").trim().notEmpty().isLength({ max: 200 }),
  body("description").trim().notEmpty().isLength({ max: 2000 }),
  body("type").isIn(["fire","flood","air_quality","deforestation","other"]),
  body("severity").isIn(["low","medium","high","critical"]),
  body("location.district").trim().notEmpty(),
];

// ── GET /api/alerts ───────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    const alerts = await Alert.find({ isActive: true }).sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    console.error("[GET /alerts]", err);
    res.status(500).json({ message: "Error fetching alerts" });
  }
});

// ── GET /api/alerts/:district ─────────────────────────────────
router.get("/:district", async (req: Request, res: Response) => {
  try {
    const alerts = await Alert.find({
      "location.district": new RegExp(`^${req.params.district}$`, "i"),
      isActive: true,
    });
    res.json(alerts);
  } catch (err) {
    console.error("[GET /alerts/:district]", err);
    res.status(500).json({ message: "Error fetching district alerts" });
  }
});

// ── POST /api/alerts ─── admin/agent only ─────────────────────
router.post("/", protect, requireRole(["admin", "agent"]), alertRules, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, type, severity, location } = req.body;
    const alert = await Alert.create({ title, description, type, severity, location });
    res.status(201).json(alert);
  } catch (err) {
    console.error("[POST /alerts]", err);
    res.status(400).json({ message: "Error creating alert. Check your data." });
  }
});

// ── PATCH /api/alerts/:id/deactivate ─── admin/agent only ─────
router.patch("/:id/deactivate", protect, requireRole(["admin", "agent"]), async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string))
      return res.status(400).json({ message: "Invalid alert ID" });

    const updated = await Alert.findByIdAndUpdate(req.params.id as string, { isActive: false }, { new: true });
    if (!updated) return res.status(404).json({ message: "Alert not found" });
    res.json(updated);
  } catch (err) {
    console.error("[deactivate]", err);
    res.status(500).json({ message: "Error updating alert" });
  }
});

export default router;