import OpenAI from "openai";
import { readFileSync } from "fs";
import { DataItemFromGPT } from "./interfaces.js";
import { createTypeScriptJsonValidator } from "typechat/ts";
import { createJsonTranslator, createOpenAILanguageModel } from "typechat";

export type Target = {
  "Company name": string;
  Online: "Yes" | "No";
  "Website URL": string;
  "Record ID": string;
  Type: "B2B" | "B2C" | "Both B2B and B2C" | "Agency";
  Model:
    | "Retail"
    | "E-commerce"
    | "Both e-commerce and physical stores"
    | "Physical stores";
  "Monthly or more often catalogs": "Yes" | "No" | "Maybe" | "Not sure";
};

const targetTypeString = `
  export type Target = {
  "Company name": string;
   Online: "Yes" | "No";
  "Website URL": string;
  "Record ID": string;
   Type: "B2B" | "B2C" | "Both B2B and B2C" | "Agency";
   Model:
    | "Retail"
    | "E-commerce"
    | "Both e-commerce and physical stores"
    | "Physical stores";
  "Monthly or more often catalogs": "Yes" | "No" | "Maybe" | "Not sure";
  };
  `;

// Set up OpenAI
const validator = createTypeScriptJsonValidator<Target>(
  targetTypeString,
  "Target"
);

const key = process.env.OPENAI_API_KEY as string;
const model = createOpenAILanguageModel(key, "gpt-4o");
const translator = createJsonTranslator(model, validator);

const openai = new OpenAI({
  apiKey: key,
});

export const getInstructions = () => {
  const { userInstructions } = JSON.parse(
    readFileSync("json/userInstructionsSave.json").toString()
  );

  const instructions = `
    Answer should be as broad and as big as possible with no speculation and really extensively long and detailed with exclusive analysis on each point where and what was found. Try to aim for 1000 words.
  
    1. Must include the id and url provided in the answer and display it only here once.
  
    2. Please check if the website provided is online. If offline answer offline in all of the checks.
  
    3. ${userInstructions.monthlyOrMoreCatalogs}
  
    4. ${userInstructions.type}
  
    5. ${userInstructions.model}
  `;

  return instructions;
};

const runGPT = async (
  website?: string,
  recordId?: string
): Promise<DataItemFromGPT> => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        name: "V1",
        content: getInstructions(),
      },
      {
        role: "user",
        content: `url: ${website} id: ${recordId}`,
      },
    ],
    temperature: 0, // Higher values means the model will take more risks.
    max_tokens: 3500, // The maximum number of tokens to generate in the completion. 0-4096
    model: "gpt-4o",
  });

  const initialResult =
    chatCompletion?.choices?.[0]?.message?.content ?? ("No text" as string);

  const removedBreaksText = initialResult.replace(/(\r\n|\n|\r)/gm, "");

  const finalAnswer = (await translator.translate(removedBreaksText)) as any;
  return finalAnswer.data;
};

// Big money spend
// setInterval(async () => {
//   await runGPT("https://www.ipaper.io/", "0001112");
//   console.log(123);
// }, 5000);

export default runGPT;
