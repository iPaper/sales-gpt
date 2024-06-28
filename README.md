<img src="https://schertzanimalhospital.com/wp-content/uploads/2018/03/Schertz_iStock-836716796_medium-1024x639.jpg" alt="Logo of the project" align="right">

# Lead Sniffer
A tool to analyze websites for specific business details like catalogs, business type, and model. It's useful for sniffing out potential clients. First, it browses the provided URLs with the given criteria and returns a detailed description of each site. Then, it analyzes the text to see if it meets the criteria and provides the results in the specified format.


## Installing / Getting started

A quick introduction of the minimal setup you need to get going

-- Create your own env file with your OPENAI_API_KEY and PORT

```shell
npm i
```

```shell
npm run dev
```
OR
```shell
npm run start
```

npm run dev runs dev with --watch flag.

## TS to JS guide

```shell
npm run build
```
OR

```shell
npm run start:build
```

to build and run js

## Things to consider 

This is just the backend for handling provided XLXS files with  "Website URL", "Record ID", and  "Company name" headers(column names) only!
The information is returned in CSV format

[Front-end repository](https://github.com/boop-bap/gpt/tree/UI) or just use the included public folder in this repository.

## Default headers(column names) and answers in output XLXS file
 
Record ID

Website URL

Company name

Online: "Yes" | "No"

Type: "B2B" | "B2C" | "Both B2B and B2C" | "Agency"

MonthlyOrMoreCatalogs: "Yes" | "No" | "Maybe | "Not sure"

Model: "Retail"| "E-commerce"| "Both e-commerce and physical stores"| "Physical stores"

