"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/utils";

export interface ProductOption {
  id: string;
  outlet?: {
    id: string;
    name: string;
    code: string;
  };
  name: string;
  category: string;
  sellingPrice: number;
}

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  /** ticket type ids already added, hidden from the picker. */
  excludeIds?: string[];
  onConfirm: (selected: ProductOption[]) => void;
}

export const ProductPicker = ({ open, onClose, excludeIds = [], onConfirm }: ProductPickerProps) => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ProductOption[]>("/api/ticket-types");
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelected({});
      setSearch("");
      load();
    }
  }, [open, load]);

  const excluded = new Set(excludeIds);
  const visible = products
    .filter((p) => !excluded.has(p.id))
    .filter((p) => {
      const term = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        p.outlet?.name.toLowerCase().includes(term) ||
        p.outlet?.code.toLowerCase().includes(term)
      );
    });

  const confirm = () => {
    const chosen = products.filter((p) => selected[p.id]);
    onConfirm(chosen);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Products" className="max-w-2xl">
      <Input
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      <div className="max-h-[50vh] overflow-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2"> </th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Outlet</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  No products available
                </td>
              </tr>
            ) : (
              visible.map((product) => (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={Boolean(selected[product.id])}
                      onChange={(e) =>
                        setSelected((prev) => ({ ...prev, [product.id]: e.target.checked }))
                      }
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800">{product.name}</td>
                  <td className="px-3 py-2 text-slate-600">
                    <p className="font-medium text-slate-700">{product.outlet?.name ?? "-"}</p>
                    <p className="font-mono text-[11px] text-slate-400">{product.outlet?.code ?? ""}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{product.category}</td>
                  <td className="px-3 py-2 text-slate-600">{formatCurrency(product.sellingPrice)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={confirm}>Add Selected Product</Button>
      </div>
    </Modal>
  );
};
