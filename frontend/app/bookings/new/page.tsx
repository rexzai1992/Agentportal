"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { useSession } from "@/hooks/use-session";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/utils";

interface ProductItem {
  id: string;
  name: string;
  sku?: string | null;
  category: "ADULT" | "CHILD" | "BUNDLE";
  description?: string | null;
  imageUrl?: string | null;
  sellingPrice: number | string;
  commissionRate: number | string;
}

interface AgentItem {
  id: string;
  companyName: string;
}

interface BookingResponse {
  id: string;
  bookingReference: string;
}

export default function CreateBookingPage() {
  const { user } = useSession(["ADMIN", "AGENT"]);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);

  const [agentId, setAgentId] = useState("");
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ bookingId?: string; reference?: string } | null>(null);

  useEffect(() => {
    Promise.all([apiFetch<ProductItem[]>("/api/ticket-types"), apiFetch<AgentItem[]>("/api/agents")])
      .then(([types, agentsData]) => {
        setProducts(types);
        setAgents(agentsData);

        if (types[0]) setTicketTypeId(types[0].id);
        if (agentsData[0]) setAgentId(agentsData[0].id);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load booking form data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === ticketTypeId),
    [products, ticketTypeId]
  );

  const subtotal = (Number(selectedProduct?.sellingPrice || 0) * Number(quantity || 0)) || 0;
  const commission = subtotal * (Number(selectedProduct?.commissionRate || 0) / 100);
  const payable = subtotal - commission;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!ticketTypeId || !customerName || Number(quantity) < 1) {
      setError("Please complete all required fields.");
      return;
    }

    const payload = {
      agentId: user?.role === "ADMIN" ? agentId : undefined,
      customerName,
      customerPhone,
      visitDate,
      items: [{ ticketTypeId, quantity: Number(quantity) }]
    };

    try {
      const booking = await apiFetch<BookingResponse>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSuccess({ bookingId: booking.id, reference: booking.bookingReference });
      setCustomerName("");
      setCustomerPhone("");
      setQuantity("1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create booking");
    }
  };

  return (
    <ProtectedShell
      roles={["ADMIN", "AGENT"]}
      title="Create Booking"
      subtitle="Sell products with live balance checks"
    >
      {loading ? (
        <LoadingState label="Loading booking form..." />
      ) : (
        <>
          <section className="bento-grid lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h3 className="section-title">Product Booking Flow</h3>
              <p className="muted mt-1">Complete booking in 3 quick steps.</p>
              <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
                {user?.role === "ADMIN" ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Step 1: Agent
                    </label>
                    <Select value={agentId} onChange={(event) => setAgentId(event.target.value)} required>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.companyName}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Step 1: Product
                  </label>
                  <Select value={ticketTypeId} onChange={(event) => setTicketTypeId(event.target.value)} required>
                    {products.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} {type.sku ? `(${type.sku})` : ""} - {formatCurrency(Number(type.sellingPrice))}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Visit Date
                    </label>
                    <Input
                      type="date"
                      value={visitDate}
                      onChange={(event) => setVisitDate(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Step 2: Customer Name
                  </label>
                  <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Customer Phone (Optional)
                  </label>
                  <Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                </div>

                <Button type="submit" className="mt-2">
                  Step 3: Create Booking
                </Button>
              </form>
            </Card>

            <Card>
              <h3 className="section-title">Pricing Preview</h3>

              {selectedProduct ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selectedProduct.name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {selectedProduct.sku || "-"} | {selectedProduct.category}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{selectedProduct.description || "-"}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(Number(selectedProduct.sellingPrice))}
                    </p>
                  </div>
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="mt-3 h-28 w-full rounded-xl object-cover ring-1 ring-slate-200"
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Commission</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(commission)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="font-semibold text-slate-700">Net Payable</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(payable)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-slate-200">
                <p>Rule checks:</p>
                <p>1. Prepaid agents must have sufficient credit.</p>
                <p>2. Weekly/monthly agents must stay within credit limit if configured.</p>
                <p>3. QR tickets are generated automatically after booking.</p>
              </div>
            </Card>
          </section>

          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          {success?.bookingId ? (
            <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              Booking created: <strong>{success.reference}</strong>.{" "}
              <Link href={`/bookings/${success.bookingId}`} className="font-semibold underline">
                Open booking details
              </Link>
            </p>
          ) : null}
        </>
      )}
    </ProtectedShell>
  );
}
