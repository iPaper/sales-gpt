import cors from "cors";
import express from "express";

import runGPT from "./runGPT.js";
import multerUpload from "./multerUpload.js";

import { readFileSync } from "fs";
import {
  getDataFromUploadedFile,
  updateUserInstructions,
  getLeadDataFromGPT,
  createXLSX,
} from "./dataManipulationFunctions.js";

const app = express();

const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://boop-bap.github.io",
  "http://salesgpt.ipaper-dev.io",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    console.log(origin);
    if (origin === undefined) {
      callback(null, false);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Origin not allowed by CORS: ${origin}`);
      callback(new Error(`Origin not allowed by CORS: ${origin}`), false);
    }
  },
  methods: "GET, POST",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//GET REQUESTS ---------------------------
app.get("/", (req, res) => {
  res.status(200).send("Hello");
});

app.get("/defaultInstructions", (req, res) => {
  const { defaultInstructions } = JSON.parse(
    readFileSync("json/userInstructionsSave.json").toString()
  );

  res.status(200).send(defaultInstructions);
});

app.get("/userSavedInstructions", (req, res) => {
  const { userInstructions } = JSON.parse(
    readFileSync("json/userInstructionsSave.json").toString()
  );

  res.status(200).send(userInstructions);
});

//POST REQUESTS ---------------------------
app.post("/upload", async (req, res) => {
  try {
    const { headersToAdd } = JSON.parse(
      readFileSync("json/userInstructionsSave.json").toString()
    );

    multerUpload(req, res, async (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      if (req.file === undefined) {
        return res.status(400).send("Error: No File Selected!");
      }

      try {
        const dataFromUploadedFile = await getDataFromUploadedFile(
          req.file.buffer
        );
        const chatGPTArray = await getLeadDataFromGPT(dataFromUploadedFile);

        const fileToSend = createXLSX(chatGPTArray, headersToAdd);
        const randomFileName = crypto.randomUUID();

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${randomFileName}.xlsx"`
        );
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.status(200).send(fileToSend);
      } catch (processingError) {
        if (processingError instanceof Error) {
          res.status(500).send(processingError.message);
        } else {
          res.status(500).send("An unknown error occurred during processing.");
        }
      }
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).send(err.message);
    } else {
      res.status(500).send("An unknown error occurred.");
    }
  }
});

app.post("/updateUserInstructions", (req, res) => {
  updateUserInstructions(req.body);
  res.status(200).send("Instructions updated successfully");
});

app.post("/check", async (req, res) => {
  const url = req.body.url;
  const answer = await runGPT(url, "00001");
  res.status(200).send({ answer });
});

app.listen(PORT, () => {
  console.log(`Server listening on port- ${PORT}`);
});
