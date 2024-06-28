export interface UploadDataItem {
  "Website URL": string;
  "Record ID": string;
  "Company name": string;
}

export interface additionalItemProperties {
  Type: string;
  Model: string;
  "Monthly or more often catalogs": string;
}

export interface DataItemFromGPT
  extends UploadDataItem,
    additionalItemProperties {}
