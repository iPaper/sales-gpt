import multer from "multer";

// Initialize multer to handle file uploads in memory
const storage = multer.memoryStorage();

// Check file type
const checkFileType = (
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const filetypes = /xlsx|xls/; // Allowed file extension
  const extname = filetypes.test(file.originalname.toLowerCase());
  const mimetype =
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel";

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    const err = new Error("Error: CSV Files Only!");
    return cb(err);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single("file");

export default upload;
