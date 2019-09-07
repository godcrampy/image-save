const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const imageminMozjpeg = require("imagemin-mozjpeg");

const port = process.env.PORT || 3000;


// Express Config
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "/public"));

// Image Upload Config
const destination = "images/";
const mozJpegConfig = {
  quality: 30
}
const pngQuantConfig = {
  quality: [0.3, 0.4]
}

const upload = multer({
  dest: path.resolve(__dirname, "temporary")
});

app.get("/", (req, res) => {
  res.render("home");
});

const handleError = (err, res) => {
  res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");
};

app.post("/upload", upload.single("file"), (req, res) => {
  const temporaryPath = req.file.path;
  const targetPath = path.join(__dirname, `./temporary/${req.file.filename}.${path.extname(req.file.originalname).toLowerCase()}`);

  fs.rename(temporaryPath, targetPath, err => {
    if (err) return handleError(err, res);
    res
      .status(200)
      .contentType("text/plain")
      .end("File uploaded!");
  });

  // compress images
  (async () => {
    await imagemin(["temporary/*.{jpg,png}"], {
      destination: destination,
      plugins: [
        imageminMozjpeg(mozJpegConfig),
        imageminPngquant(pngQuantConfig)
      ]
    });

    // Empty temporary directory
    const directory = path.join(__dirname, "/temporary");
    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err;
        });
      }
    });
  })();
});

app.listen(port, () => console.log(`server started on port ${port}`));
