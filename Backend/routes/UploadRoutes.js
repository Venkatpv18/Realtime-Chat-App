const express =
  require("express");

const router =
  express.Router();

const upload =
  require("../middleware/upload");

/* FILE UPLOAD */

router.post(
  "/",

  upload.single("file"),

  (req, res) => {

    if (!req.file) {

      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    res.json({

      fileUrl:
        `http://localhost:5000/uploads/${req.file.filename}`,
    });
  }
);

module.exports =
  router;