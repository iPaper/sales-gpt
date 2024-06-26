import fastCsv from "fast-csv";
import stream from "stream";

import { CsvDataItem, DataItemFromGPT } from "./interfaces.js";
import { readFileSync, writeFileSync } from "fs";
import runGPT from "./runGPT.js";

const fastCsvOptions = {
  objectMode: true,
  delimiter: ",",
  quote: null,
  headers: true,
  renameHeaders: false,
};

export const getDataFromUploadedFile = (buffer: Buffer) => {
  return new Promise((resolve, reject) => {
    const results = [] as CsvDataItem[];

    const bufferStream = new stream.PassThrough();
    const readableStream = bufferStream.end(buffer);

    fastCsv
      .parseStream(readableStream, fastCsvOptions)
      .on("data", (data: CsvDataItem) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err: Error) => reject(err));
  });
};

export const getLeadDataFromGPT = async (csvData: CsvDataItem[]) => {
  const gptPromises = csvData.map((item: CsvDataItem) => {
    return runGPT(item.url, item.id);
  });

  const results = await Promise.all(gptPromises);

  return results;
};

export const createCSV = (
  data: DataItemFromGPT[],
  headersToAdd: (keyof DataItemFromGPT)[]
) => {
  // Create a CSV string
  let csv = headersToAdd.join(",") + "\n";

  data.forEach((row) => {
    let values = headersToAdd.map((header) => {
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
  // writeFileSync(`test copy ${randomFileName}.csv`, csv);
};

export const updateUserInstructions = (newUserInstructions: any) => {
  const defaultInstructions = JSON.parse(
    readFileSync("json/defaultInstructions.json").toString()
  );
  let textToModify = JSON.stringify(defaultInstructions);

  for (let key in newUserInstructions) {
    let placeholder = new RegExp(`\\$\\{${key}\\}`, "g");
    textToModify = textToModify.replace(placeholder, newUserInstructions[key]);
  }
  writeFileSync("json/userInstructionsSave.json", textToModify);
};

// const combineTwoDataArrays = (
//   csvArray: CsvDataItem[],
//   gptArray: CsvDataItem[]
// ) => {
//   const combinedArray = [] as CsvDataItem[];

//   csvArray.forEach((csvArrayItem: CsvDataItem) => {
//     const tempObj = csvArrayItem;

//     gptArray.forEach((leadItem: CsvDataItem) => {
//       if (leadItem?.id == csvArrayItem?.id && leadItem) {
//         headersToAdd.forEach((columnName: string) => {
//           if (!tempObj[columnName] && leadItem[columnName]) {
//             tempObj[columnName] = leadItem[columnName];
//           }
//         });
//       }
//     });

//     combinedArray.push(tempObj);
//   });

//   return combinedArray;
// };
