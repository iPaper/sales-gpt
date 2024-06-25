import { readFileSync } from "fs";
import express from "express";
import cors from "cors";

import { CsvDataItem, DataItemFromGPT } from "./interfaces";
import multerUpload from "./multerUpload";
import runGPT from "./runGPT";
import {
  getDataFromUploadedFile,
  updateUserInstructions,
  getLeadDataFromGPT,
  createCSV,
} from "./dataManipulationFunctions";

const app = express();

const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://boop-bap.github.io",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
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

    multerUpload(req, res, async () => {
      if (req.file === undefined) {
        res.status(400).send("Error: No File Selected!");
      } else {
        const dataFromUploadedFile = (await getDataFromUploadedFile(
          req.file.buffer
        )) as CsvDataItem[];
        const chatGPTArray: DataItemFromGPT[] = await getLeadDataFromGPT(
          dataFromUploadedFile
        );

        const csvToExport = createCSV(chatGPTArray, headersToAdd);
        const randomFileName: string = crypto.randomUUID();

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${randomFileName}"`
        );
        res.setHeader("Content-Type", "text/csv");
        res.status(200).send(csvToExport);
      }
    });
  } catch (err) {
    res.status(500).send(err);
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
