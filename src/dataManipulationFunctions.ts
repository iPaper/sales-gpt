import xlsx from "xlsx";
import { PassThrough } from "stream";

import { UploadDataItem, DataItemFromGPT } from "./interfaces.js";
import { readFileSync, writeFileSync } from "fs";
import runGPT from "./runGPT.js";

export const getDataFromUploadedFile = (
  buffer: Buffer
): Promise<UploadDataItem[][]> => {
  return new Promise((resolve, reject) => {
    try {
      const bufferStream = new PassThrough();
      bufferStream.end(buffer);

      const workbook = xlsx.read(buffer, { type: "buffer" });

      // Get the first sheet name
      const sheetName = workbook.SheetNames[0];

      // Get the first worksheet
      const worksheet = workbook.Sheets[sheetName];

      // Convert the worksheet to JSON
      const jsonArray = xlsx.utils.sheet_to_json(worksheet) as UploadDataItem[];

      resolve(splitArrayIntoChunks(jsonArray));
    } catch (error) {
      reject(error);
    }
  });
};

export const getLeadDataFromGPT = async (
  csvData: UploadDataItem[][]
): Promise<DataItemFromGPT[]> => {
  const finalResult: DataItemFromGPT[] = [];

  let current = 1;
  for (const chunk of csvData) {
    console.log(`Processing chunk ${current} of ${csvData.length}`);
    current++;

    try {
      const gptPromises = chunk.map((item) => runGPT(item.url, item.id));
      const chunkAnswers = await Promise.all(gptPromises);
      finalResult.push(...chunkAnswers);
    } catch (error) {
      console.error(`Error processing chunk ${current}:`, error);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000)); // Delay for 10 seconds
  }

  console.log("Finished processing all chunks");
  return finalResult;
};

const splitArrayIntoChunks = (
  array: UploadDataItem[],
  chunkSize: number = 50
): UploadDataItem[][] => {
  return array.reduce<UploadDataItem[][]>((acc, _, index) => {
    if (index % chunkSize === 0)
      acc.push(array.slice(index, index + chunkSize));
    return acc;
  }, []);
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
};

export const createXLSX = (
  data: DataItemFromGPT[],
  headersToAdd: (keyof DataItemFromGPT)[]
): Buffer => {
  // Create a new workbook
  const workbook = xlsx.utils.book_new();

  // Prepare the data for the worksheet
  const worksheetData = [
    headersToAdd, // Headers
    ...data.map((row) => headersToAdd.map((header) => row[header])), // Data rows
  ];

  // Create a worksheet
  const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

  // Append the worksheet to the workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Write the workbook to a buffer
  const xlsxBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  return xlsxBuffer;
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

// const largeArray = Array.from({ length: 120 }, (_, index) => index);
// const chunks = splitArrayIntoChunks(largeArray, 100);

// const combineTwoDataArrays = (
//   csvArray: UploadDataItem[],
//   gptArray: UploadDataItem[]
// ) => {
//   const combinedArray = [] as UploadDataItem[];

//   csvArray.forEach((csvArrayItem: UploadDataItem) => {
//     const tempObj = csvArrayItem;

//     gptArray.forEach((leadItem: UploadDataItem) => {
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
