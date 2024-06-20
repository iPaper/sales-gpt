import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import stream from "stream";
import express from "express";
import fastCsv from "fast-csv";
import cors, { CorsOptions } from "cors";

import { createJsonTranslator, createOpenAILanguageModel } from "typechat";
import { createTypeScriptJsonValidator } from "typechat/ts";
import { fileURLToPath } from "url";

import TargetSchema from "./TargetSchema.ts";
import CsvDataItem from "./interfaces.ts";

dotenv.config();

// Load default instructions
const defaultInstructionsObj = JSON.parse(
  fs.readFileSync("json/defaultInstructions.json").toString()
);

// Load user instructions
let userInstructionsObj = JSON.parse(
  fs.readFileSync("json/userInstructionsSave.json").toString()
);

const app = express();
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const { headersToAdd, defaultInstructions } = defaultInstructionsObj;

let { userInstructions } = userInstructionsObj;

const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://boop-bap.github.io",
];

const corsOptions: CorsOptions = {
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
  methods: "GET, POST", // Specify allowed methods globally
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const options = {
  objectMode: true,
  delimiter: ",",
  quote: null,
  headers: true,
  renameHeaders: false,
};

// Initialize multer to handle file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single("file");

// Check file type
function checkFileType(
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const filetypes = /csv/; // Allowed file extension
  const extname = filetypes.test(file.originalname.toLowerCase());
  const mimetype =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel";

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    const err = new Error("Error: CSV Files Only!");
    return cb(err);
  }
}

// Load up the contents of our "Response" schema.

// Set up OpenAI
const key = process.env.OPENAI_API_KEY as string;
const model = createOpenAILanguageModel(key, "gpt-4o");

const targetSchema = fs.readFileSync(
  path.join(__dirname, "TargetSchema.ts"),
  "utf8"
);
const validator = createTypeScriptJsonValidator<TargetSchema>(
  targetSchema,
  "Target"
);
const translator = createJsonTranslator(model, validator);

const openai = new OpenAI({
  apiKey: key,
});

const getInstructions = () => {
  const instructions = `

I need you to be very very sure(100%) with the answers without any speculation.

${userInstructions.translate}.

The asnwers have to be extensively long and detailed where and what was found.

0. If the website is restricted with robots.txt skip the checks.

1. Include the id and url provided in the answer and display it only here once.

2. Please check if the website provided is online. If No skip the checks.

3. ${userInstructions.catalog}.

4. ${userInstructions.type}.

5. ${userInstructions.model}.

`;
  return instructions;
};

const runGPT = async (website?: string, recordId?: string) => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        name: "TestV1",
        content: getInstructions(),
      },
      {
        role: "user",
        content: `Website URL: ${website} Record ID: ${recordId}`,
      },
    ],
    temperature: 0.2, // Higher values means the model will take more risks.
    max_tokens: 1024, // The maximum number of tokens to generate in the completion.
    model: "gpt-4o-2024-05-13",
  });

  const initialResult = chatCompletion?.choices?.[0].message.content as any;
  const removedBreaksText = initialResult.replace(/(\r\n|\n|\r)/gm, "");

  const finalAnswer = ((await translator.translate(removedBreaksText)) as any)
    .data;

  return finalAnswer;
};

const getDataFromUploadedFile = (buffer: Buffer) => {
  return new Promise((resolve, reject) => {
    const results = [] as CsvDataItem[];

    const bufferStream = new stream.PassThrough();
    const readableStream = bufferStream.end(buffer);

    fastCsv
      .parseStream(readableStream, options)
      .on("data", (data: CsvDataItem) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err: Error) => reject(err));
  });
};

const getLeadDataFromGPT = async (csvData: CsvDataItem[]) => {
  const gptPromises = csvData.map((item: CsvDataItem) => {
    const url = item["Website URL"];
    const recordId = item["Record ID"];
    return runGPT(url, recordId);
  });

  const results = await Promise.all(gptPromises);

  return results;
};

const createCSV = (data: CsvDataItem[]) => {
  const headers = Object.keys(data[0]);
  // Create a CSV string
  let csv = headers.join(",") + "\n";
  data.forEach((row: any) => {
    let values = headers.map((header) => {
      let value = row[header];
      // Escape double quotes by doubling them and wrap values in double quotes
      if (typeof value === "string") {
        value = value.replace(/"/g, '""');
      }
      return `"${value}"`;
    });
    csv += values.join(",") + "\n";
  });

  return csv;

  // Write the CSV string to a file locally
  // fs.writeFileSync(`test copy ${randomFileName}.csv`, csv);
};

const combineTwoDataArrays = (
  csvArray: CsvDataItem[],
  gptArray: CsvDataItem[]
) => {
  const combinedArray = [] as CsvDataItem[];

  csvArray.map((csvArrayItem: CsvDataItem) => {
    const tempObj = csvArrayItem;

    gptArray.map((leadItem: CsvDataItem) => {
      if (leadItem["Record ID"] == csvArrayItem["Record ID"]) {
        headersToAdd.forEach((columnName: string) => {
          if (!tempObj[columnName]) {
            tempObj[columnName] = leadItem[columnName];
          }
        });
      }
    });

    combinedArray.push(tempObj);
  });

  return combinedArray;
};

const updateUserInstructions = (req: any) => {
  const newUserInstructions = req.body;

  let textToModify = JSON.stringify(defaultInstructionsObj);

  for (let key in newUserInstructions) {
    let placeholder = new RegExp(`\\$\\{${key}\\}`, "g");
    textToModify = textToModify.replace(placeholder, newUserInstructions[key]);
  }
  fs.writeFileSync("json/userInstructionsSave.json", textToModify);

  userInstructionsObj = JSON.parse(
    fs.readFileSync("json/userInstructionsSave.json").toString()
  );

  userInstructions = userInstructionsObj.userInstructions;
};

//GET REQUESTS ---------------------------
app.get("/", (req, res) => {
  res.send("Hello World!");
  res.status(200);
});

app.get("/defaultInstructions", (req, res) => {
  res.send(defaultInstructions);
  res.status(200);
});

app.get("/userSavedInstructions", (req, res) => {
  res.send(userInstructions);
  res.status(200);
});

//POST REQUESTS ---------------------------
app.post("/updateUserInstructions", (req, res) => {
  updateUserInstructions(req);
  res.status(200).send("Instructions updated successfully");
});

app.post("/upload", async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (req.file === undefined) {
        res.status(400).send("Error: No File Selected!");
      } else {
        const dataFromUploadedFile = (await getDataFromUploadedFile(
          req.file.buffer
        )) as CsvDataItem[];

        console.log(dataFromUploadedFile, "data from file");
        // const chatGPTArray: CsvDataItem[] = await getLeadDataFromGPT(
        //   dataFromUploadedFile
        // );

        // const combinedArray = combineTwoDataArrays(
        //   dataFromUploadedFile,
        //   chatGPTArray
        // );

        // const csvToExport = createCSV(combinedArray);

        // const randomFileName: string = crypto.randomUUID();

        // res.setHeader(
        //   "Content-Disposition",
        //   `attachment; filename="${randomFileName}"`
        // );
        // res.setHeader("Content-Type", "text/csv");
        // res.status(200).send(csvToExport);
        res.status(200).send("aa");
      }
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port- ${PORT}`);
});
