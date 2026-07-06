"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { ProductPicker, type ProductOption } from "@/components/shared/product-picker";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SchemeProduct {
  id: string;
  ticketTypeId: string;
  name: string;
  price: number;
  minQty: number;
  maxQty: number | null;
  incentiveRate: number | null;
}
interface Revision {
  id: string;
  revisionNumber: number;
  effectiveDate: string;
  products: SchemeProduct[];
}
interface SchemeDetail {
  id: string;
  code: string;
  name: string;
  organisation: string | null;
  status: "ACTIVE" | "INACTIVE";
  revisions: Revision[];
}

export default function SchemeDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<SchemeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [draft, setDraft] = useState<SchemeProduct[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await apiFetch<SchemeDetail>(`/api/purchase-schemes/${params.id}`));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (status: "ACTIVE" | "INACTIVE") => {
    await apiFetch(`/api/purchase-schemes/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    load();
  };

  const addProducts = (selected: ProductOption[]) =>
    setDraft((prev) => {
      const ids = new Set(prev.map((p) => p.ticketTypeId));
      return [
        ...prev,
        ...selected
          .filter((s) => !ids.has(s.id))
          .map((s) => ({
            id: s.id,
            ticketTypeId: s.id,
            name: s.name,
            price: s.sellingPrice,
            minQty: 1,
            maxQty: null,
            incentiveRate: null
          }))
      ];
    });

  const saveRevision = async () => {
    setMessage(null);
    if (!effectiveDate || draft.length === 0) {
      setMessage("Effective date and at least one product are required");
      return;
    }
    await apiFetch(`/api/purchase-schemes/${params.id}/revisions`, {
      method: "POST",
      body: JSON.stringify({
        effectiveDate,
        products: draft.map((p) => ({
          ticketTypeId: p.ticketTypeId,
          price: p.price,
          minQty: p.minQty,
          maxQty: p.maxQty,
          incentiveRate: p.incentiveRate
        }))
      })
    });
    setDraft([]);
    setEffectiveDate("");
    setMessage("Revision saved.");
    load();
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Review Purchase Scheme" subtitle="Scheme detail & revisions">
      {loading || !data ? (
        <LoadingState label="Loading scheme..." />
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Purchase Code</p>
                <p className="text-sm font-semibold text-slate-800">{data.code}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Purchase Name</p>
                <p className="text-sm font-semibold text-slate-800">{data.name}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Status</label>
                <Select value={data.status} onChange={(e) => toggleStatus(e.target.value as "ACTIVE" | "INACTIVE")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="section-title mb-3">Add New Revision</h3>
            {message ? <p className="mb-2 text-sm text-slate-600">{message}</p> : null}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Effective Date</label>
                <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
              </div>
              <Button variant="ghost" onClick={() => setPickerOpen(true)}>
                Add Product
              </Button>
              <Button onClick={saveRevision}>Save</Button>
            </div>

            {draft.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Product</th>
                      <th className="px-2 py-2">Price</th>
                      <th className="px-2 py-2">Min</th>
                      <th className="px-2 py-2">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.map((p) => (
                      <tr key={p.ticketTypeId} className="border-t border-slate-100">
                        <td className="px-2 py-2">{p.name}</td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            className="w-24"
                            value={p.price}
                            onChange={(e) =>
                              setDraft((prev) =>
                                prev.map((x) =>
                                  x.ticketTypeId === p.ticketTypeId ? { ...x, price: Number(e.target.value) } : x
                                )
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            className="w-16"
                            value={p.minQty}
                            onChange={(e) =>
                              setDraft((prev) =>
                                prev.map((x) =>
                                  x.ticketTypeId === p.ticketTypeId ? { ...x, minQty: Number(e.target.value) } : x
                                )
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            className="w-16"
                            value={p.maxQty ?? ""}
                            onChange={(e) =>
                              setDraft((prev) =>
                                prev.map((x) =>
                                  x.ticketTypeId === p.ticketTypeId
                                    ? { ...x, maxQty: e.target.value ? Number(e.target.value) : null }
                                    : x
                                )
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Card>

          {data.revisions.map((rev) => (
            <Card key={rev.id}>
              <h3 className="section-title mb-2">
                Revision {rev.revisionNumber} · Effective {formatDate(rev.effectiveDate)}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Min / Max</th>
                      <th className="px-3 py-2">Incentive %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rev.products.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{p.name}</td>
                        <td className="px-3 py-2">{formatCurrency(p.price)}</td>
                        <td className="px-3 py-2">
                          {p.minQty} / {p.maxQty ?? "∞"}
                        </td>
                        <td className="px-3 py-2">{p.incentiveRate ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={draft.map((p) => p.ticketTypeId)}
        onConfirm={addProducts}
      />
    </ProtectedShell>
  );
}
