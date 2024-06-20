export type Target = {
  online: "Yes" | "No";
  url: string;
  id: string;
  type: "B2B" | "B2C" | "Both B2B and B2C" | "Agency" | "Unknown";
  model:
    | "Retail"
    | "E-commerce"
    | "Both e-commerce and physical stores"
    | "Physical stores"
    | "Unknown";
  catalogs: "Yes" | "No" | "Maybe" | "Less than monthly";
  catalogLinks?: string[];
};

export default Target;
