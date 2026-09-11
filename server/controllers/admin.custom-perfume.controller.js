import { prisma } from "../config/db.js";
import { processAndUploadImage } from "../middlewares/multer.middlerware.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// GET /api/admin/custom-perfume/notes
export const getAdminCustomPerfumeNotes = async (req, res) => {
  try {
    const notes = await prisma.customPerfumeNote.findMany({
      orderBy: { createdAt: "desc" }
    });
    const bottles = await prisma.customPerfumeBottle.findMany({
      orderBy: { createdAt: "desc" }
    });

    const formattedNotes = notes.map((note) => ({
      ...note,
      image: getFileUrl(note.image)
    }));

    const formattedBottles = bottles.map((bottle) => ({
      ...bottle,
      price: parseFloat(bottle.price),
      image: getFileUrl(bottle.image)
    }));

    const base = formattedNotes.filter((n) => n.noteType === "BASE");
    const heart = formattedNotes.filter((n) => n.noteType === "HEART");
    const top = formattedNotes.filter((n) => n.noteType === "TOP");

    res.json({
      success: true,
      message: "Custom perfume options fetched successfully",
      data: {
        base,
        heart,
        top,
        bottles: formattedBottles
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/custom-perfume/notes
export const createCustomPerfumeNote = async (req, res) => {
  try {
    const { name, noteType, category, description, color, image: bodyImage } = req.body;

    if (!name || !noteType) {
      return res.status(400).json({ success: false, message: "Name and noteType are required" });
    }

    let imageUrl = bodyImage || null;
    if (req.file) {
      imageUrl = await processAndUploadImage(req.file, "custom-perfume");
    }

    const note = await prisma.customPerfumeNote.create({
      data: {
        name,
        noteType: noteType.toUpperCase(),
        category: category || "General",
        description: description || "",
        color: color || "#8B5A2B",
        image: imageUrl
      }
    });

    res.json({
      success: true,
      message: `Fragrance note '${name}' added successfully`,
      data: {
        ...note,
        image: getFileUrl(note.image)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/custom-perfume/bottles
export const createCustomPerfumeBottle = async (req, res) => {
  try {
    const { name, capacity, price, description, image: bodyImage } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: "Name and price are required" });
    }

    let imageUrl = bodyImage || null;
    if (req.file) {
      imageUrl = await processAndUploadImage(req.file, "custom-perfume");
    }

    const bottle = await prisma.customPerfumeBottle.create({
      data: {
        name,
        capacity: capacity || "100 ml",
        price: parseFloat(price),
        description: description || "",
        image: imageUrl
      }
    });

    res.json({
      success: true,
      message: `Bottle silhouette '${name}' added successfully`,
      data: {
        ...bottle,
        price: parseFloat(bottle.price),
        image: getFileUrl(bottle.image)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/custom-perfume/notes/:id
export const deleteCustomPerfumeNote = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customPerfumeNote.delete({ where: { id } });
    res.json({ success: true, message: "Fragrance note deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/custom-perfume/bottles/:id
export const deleteCustomPerfumeBottle = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customPerfumeBottle.delete({ where: { id } });
    res.json({ success: true, message: "Bottle silhouette deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
