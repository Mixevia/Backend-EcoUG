import { Router, Request, Response } from "express";
import { body, validationResult, query } from "express-validator";
import { protect, AuthRequest } from "../middleware/auth";
import Report from "../models/report";
import mongoose from "mongoose";

const router = Router();

const reportRules = [
  body("type").isIn(["deforestation","wetland_drainage","poaching","fire","flood","pollution","other"]),
  body("description").trim().notEmpty().isLength({ max: 2000 }),
  body("location.district").trim().notEmpty(),
  body("severity").optional().isIn(["low","medium","high","critical"]),
];

// ── GET /api/reports ──────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const { district, type, status, page = "1", limit = "20" } = req.query;
    const filter: Record<string, unknown> = {};
    if (district) filter["location.district"] = new RegExp(`^${district}$`, "i");
    if (type) filter.type = type;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(filter).populate("reportedBy", "name avatarUrl").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Report.countDocuments(filter),
    ]);

    res.json({ reports, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("[GET /reports]", err);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

// ── POST /api/reports ─────────────────────────────────────────
router.post("/", protect, reportRules, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { type, description, location, photos, severity } = req.body;
    const report = await Report.create({ type, description, location, photos, severity, reportedBy: req.userId });
    res.status(201).json(report);
  } catch (err) {
    console.error("[POST /reports]", err);
    res.status(500).json({ message: "Failed to create report" });
  }
});

// ── POST /api/reports/:id/upvote ──────────────────────────────
router.post("/:id/upvote", protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string))
      return res.status(400).json({ message: "Invalid report ID" });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const userId = new mongoose.Types.ObjectId(req.userId as string);
    const idx = report.upvotes.findIndex(id => id.equals(userId));
    if (idx > -1) {
      report.upvotes.splice(idx, 1);
    } else {
      report.upvotes.push(userId);
    }
    await report.save();
    res.json({ upvotes: report.upvotes.length });
  } catch (err) {
    console.error("[upvote]", err);
    res.status(500).json({ message: "Failed to upvote" });
  }
});

export default router;