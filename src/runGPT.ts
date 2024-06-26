import OpenAI from "openai";
import { readFileSync } from "fs";
import { createJsonTranslator, createOpenAILanguageModel } from "typechat";
import { createTypeScriptJsonValidator } from "typechat/ts";

export type Target = {
  name: string;
  online: "Yes" | "No";
  url: string;
  id: string;
  type: "B2B" | "B2C" | "Both B2B and B2C" | "Agency";
  model:
    | "Retail"
    | "E-commerce"
    | "Both e-commerce and physical stores"
    | "Physical stores";
  monthlyOrMoreCatalogs: "Yes" | "No" | "Maybe" | "Not sure";
};

const targetTypeString = `
  export type Target = {
    name: string;
    online: "Yes" | "No";
    url: string;
    id: string;
    type: "B2B" | "B2C" | "Both B2B and B2C" | "Agency";
    model:
      | "Retail"
      | "E-commerce"
      | "Both e-commerce and physical stores"
      | "Physical stores";
    monthlyOrMoreCatalogs: "Yes" | "No" | "Maybe" | "Not sure";
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
    Answer should be as broad and as big as possible with no speculation and really extensively long and detailed with exclusive analysis on each point where and what was found. Try to aim for 1500 words.
  
    1. Must include the id and url provided in the answer and display it only here once.
  
    2. Please check if the website provided is online. If offline answer offline in all of the checks.
  
    3. ${userInstructions.monthlyOrMoreCatalogs}
  
    4. ${userInstructions.type}
  
    5. ${userInstructions.model}
  `;

  return instructions;
};

const runGPT = async (website?: string, recordId?: string) => {
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
    max_tokens: 4000, // The maximum number of tokens to generate in the completion. 0-4096
    model: "gpt-4o",
  });

  const initialResult =
    chatCompletion?.choices?.[0]?.message?.content ?? ("No text" as string);
  console.log(initialResult);

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
