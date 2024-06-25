export interface CsvDataItem {
  url: string;
  id: string;
  name: string;
}

export interface additionalItemProperties {
  type: string;
  model: string;
  monthlyOrMoreCatalogs: string;
}

export interface DataItemFromGPT
  extends CsvDataItem,
    additionalItemProperties {}
