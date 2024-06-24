export type Target = {
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

export default Target;
