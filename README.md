<img src="https://schertzanimalhospital.com/wp-content/uploads/2018/03/Schertz_iStock-836716796_medium-1024x639.jpg" alt="Logo of the project" align="right">

# Lead Sniffer
A tool to analyze provided websites for specific business information, such as catalogs, business type, and model. Useful for sniffing out possible clients.


## Installing / Getting started

A quick introduction of the minimal setup you need to get going

-- Create your own env file with your OPENAI_API_KEY

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

## Things to consider 

This is just the backend for handling provided csv files with url, id, and name headers(column names) only!.
The information is returned in CSV format 

[Front-end repository](https://github.com/boop-bap/gpt/tree/TypeChat-page)

## Default headers(column names) and answers in output CSV file 
 
Name

Url

Id

Online: "Yes" | "No"

Type: "B2B" | "B2C" | "Both B2B and B2C" | "Agency"

MonthlyOrMoreCatalogs: "Yes" | "No" | "Maybe | "Not sure"

Model: "Retail"| "E-commerce"| "Both e-commerce and physical stores"| "Physical stores"

