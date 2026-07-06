import { NextRequest } from "next/server";
import { TicketCategory } from "@shared/types/domain";
import { prisma, asNumber } from "@backend/services/db";
import { fail, ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT"], async () =>
    withErrorHandling(async () => {
      const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "false";

      const ticketTypes = await prisma.ticketType.findMany({
        where: activeOnly ? { active: true } : undefined,
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          description: true,
          imageUrl: true,
          sellingPrice: true,
          commissionRate: true,
          active: true,
          createdAt: true,
          outlet: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: [{ outlet: { name: "asc" } }, { name: "asc" }]
      });

      return ok(
        ticketTypes.map((ticketType) => ({
          ...ticketType,
          sellingPrice: asNumber(ticketType.sellingPrice),
          commissionRate: asNumber(ticketType.commissionRate)
        }))
      );
    })
  );
}

interface CreateProductBody {
  outletId: string;
  name: string;
  sku: string;
  type: TicketCategory;
  description: string;
  imageUrl: string;
  price: number;
}

const ALLOWED_TYPES: TicketCategory[] = ["ADULT", "CHILD", "BUNDLE"];

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () =>
    withErrorHandling(async () => {
      const body = await parseBody<CreateProductBody>(request);

      const outletId = body.outletId?.trim();
      const name = body.name?.trim();
      const sku = body.sku?.trim().toUpperCase();
      const description = body.description?.trim();
      const imageUrl = body.imageUrl?.trim();
      const price = Number(body.price);
      const type = body.type as TicketCategory;

      if (!outletId || !name || !sku || !description || !imageUrl || !Number.isFinite(price) || price <= 0) {
        return fail("outlet, name, sku, type, description, imageUrl and positive price are required", 400);
      }

      if (!ALLOWED_TYPES.includes(type)) {
        return fail("Invalid product type", 400);
      }

      const outlet = await prisma.outlet.findFirst({
        where: { id: outletId, active: true },
        select: { id: true }
      });

      if (!outlet) {
        return fail("Create an active outlet before creating products", 400);
      }

      const existingBySku = await prisma.ticketType.findUnique({
        where: { sku },
        select: { id: true }
      });

      if (existingBySku) {
        return fail("SKU must be unique", 400);
      }

      const created = await prisma.ticketType.create({
        data: {
          outletId,
          name,
          sku,
          category: type,
          description,
          imageUrl,
          sellingPrice: price,
          costPrice: price,
          commissionRate: 10,
          validityType: "FIXED_DATE",
          active: true
        }
      });

      return ok(
        {
          ...created,
          sellingPrice: asNumber(created.sellingPrice),
          costPrice: asNumber(created.costPrice),
          commissionRate: asNumber(created.commissionRate)
        },
        201
      );
    })
  );
}
