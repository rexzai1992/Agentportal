"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductPicker, type ProductOption } from "@/components/shared/product-picker";
import { apiFetch } from "@/lib/fetcher";

interface UserOption {
  id: string;
  companyName: string;
  accountCode: string | null;
  partyType: string;
}
interface CartItem {
  ticketTypeId: string;
  name: string;
  quantity: number;
}

const MIN_QTY = 20;

export default function ComplimentaryPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [agentId, setAgentId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setUsers(await apiFetch<UserOption[]>("/api/complimentary/users"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  const addProducts = (selected: ProductOption[]) =>
    setCart((prev) => {
      const ids = new Set(prev.map((p) => p.ticketTypeId));
      return [
        ...prev,
        ...selected.filter((s) => !ids.has(s.id)).map((s) => ({ ticketTypeId: s.id, name: s.name, quantity: MIN_QTY }))
      ];
    });

  const submit = async () => {
    setError(null);
    setMessage(null);
    if (!agentId) {
      setError("Please select a user");
      return;
    }
    if (totalQty < MIN_QTY) {
      setError(`Minimum order is ${MIN_QTY} tickets`);
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/complimentary", {
        method: "POST",
        body: JSON.stringify({
          agentId,
          reason,
          items: cart.map((c) => ({ ticketTypeId: c.ticketTypeId, quantity: c.quantity }))
        })
      });
      setMessage(`Complimentary vouchers issued (${totalQty} tickets).`);
      setCart([]);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Complimentary" subtitle="Grant free tickets">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <h3 className="section-title mb-3">User</h3>
          <Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">Select user...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.companyName} ({u.accountCode})
              </option>
            ))}
          </Select>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="section-title">Order Summary</h3>
            <Button variant="ghost" onClick={() => setPickerOpen(true)}>
              Add Product
            </Button>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-slate-400">No products added.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.ticketTypeId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-24"
                      value={item.quantity}
                      min={MIN_QTY}
                      onChange={(e) =>
                        setCart((prev) =>
                          prev.map((x) =>
                            x.ticketTypeId === item.ticketTypeId ? { ...x, quantity: Number(e.target.value) } : x
                          )
                        )
                      }
                    />
                    <button
                      className="text-red-500"
                      onClick={() => setCart((prev) => prev.filter((x) => x.ticketTypeId !== item.ticketTypeId))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-3 border-t border-slate-200 pt-3 text-sm font-bold">
                Total tickets: {totalQty} {totalQty < MIN_QTY ? `(min ${MIN_QTY})` : ""}
              </div>
            </div>
          )}

          {error ? <p className="mt-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-3 rounded-xl bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p> : null}

          <Button className="mt-4" onClick={submit} disabled={saving || totalQty < MIN_QTY || !agentId}>
            {saving ? "Submitting..." : "Submit"}
          </Button>
        </Card>
      </div>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={cart.map((c) => c.ticketTypeId)}
        onConfirm={addProducts}
      />
    </ProtectedShell>
  );
}
