import { z } from "zod";

const money = z.number().finite().positive().max(9999999999.99)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.0001, "Use at most two decimal places");

export const productBatchSchema = z.object({
  outletId: z.string().trim().min(1, "Choose an outlet"),
  schemeId: z.string().trim().optional(),
  description: z.string().trim().max(5000).default(""),
  imageUrl: z.union([z.literal(""), z.string().url().refine((s) => /^https?:\/\//i.test(s), "Use an HTTP or HTTPS image URL")]).default(""),
  products: z.array(z.object({
    name: z.string().trim().min(1, "Product name is required").max(200),
    sku: z.string().trim().min(1, "SKU is required").max(100).transform((s) => s.toUpperCase()),
    type: z.enum(["ADULT", "CHILD", "BUNDLE"]),
    price: money,
    schemePrice: money.optional()
  })).min(1, "Add at least one product").max(200, "Create up to 200 products per batch")
}).superRefine((input, ctx) => {
  const seen = new Set<string>();
  input.products.forEach((row, index) => {
    if (seen.has(row.sku)) ctx.addIssue({ code: "custom", path: ["products", index, "sku"], message: `Duplicate SKU: ${row.sku}` });
    seen.add(row.sku);
  });
});

export type ProductBatchInput = z.input<typeof productBatchSchema>;

export function parseProductBatch(input: unknown) {
  const result = productBatchSchema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => {
      const prefix = issue.path[0] === "products" && typeof issue.path[1] === "number"
        ? `Row ${issue.path[1] + 1}: ` : "";
      return `${prefix}${issue.message}`;
    }).join("; "));
  }
  return result.data;
}
