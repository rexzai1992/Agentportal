"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AgentItem {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  agreementType: "PREPAID" | "WEEKLY" | "MONTHLY";
  commissionRate: number | string;
  creditBalance: number | string;
  outstandingBalance: number | string;
  creditLimit?: number | string | null;
  isActive: boolean;
  createdAt: string;
}

interface AgentForm {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  agreementType: "PREPAID" | "WEEKLY" | "MONTHLY";
  commissionRate: string;
  creditLimit: string;
  initialBalance: string;
}

const initialForm: AgentForm = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  agreementType: "PREPAID",
  commissionRate: "10",
  creditLimit: "",
  initialBalance: "0"
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [form, setForm] = useState<AgentForm>(initialForm);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [topUpAmount, setTopUpAmount] = useState("500");
  const [topUpRef, setTopUpRef] = useState("TOPUP-");
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadAgents = useCallback(async () => {
    const data = await apiFetch<AgentItem[]>("/api/agents");
    setAgents(data);
    if (data[0] && !selectedAgentId) {
      setSelectedAgentId(data[0].id);
      setTopUpRef(`TOPUP-${data[0].id.slice(0, 6).toUpperCase()}`);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    loadAgents().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to load agents");
    }).finally(() => {
      setInitialLoading(false);
    });
  }, [loadAgents]);

  if (initialLoading) {
    return (
      <ProtectedShell
        roles={["ADMIN"]}
        title="Agent Management"
        subtitle="Create, monitor, and top up OTA agents"
      >
        <LoadingState label="Loading agents..." />
      </ProtectedShell>
    );
  }

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await apiFetch("/api/agents", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          commissionRate: Number(form.commissionRate),
          creditLimit: form.creditLimit ? Number(form.creditLimit) : null,
          initialBalance: Number(form.initialBalance)
        })
      });

      setForm(initialForm);
      await loadAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create agent");
    }
  };

  const onTopUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await apiFetch(`/api/agents/${selectedAgentId}/topup`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(topUpAmount),
          reference: topUpRef,
          notes: "Admin top-up"
        })
      });

      await loadAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to top up agent");
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Agent Management" subtitle="Create, monitor, and top up OTA agents">
      <section className="bento-grid lg:grid-cols-2">
        <Card>
          <h3 className="section-title">Create Agent</h3>
          <p className="muted mt-1">Set pricing agreement, commission and opening balance.</p>
          <form className="mt-3 grid gap-3" onSubmit={onCreate}>
            <Input
              placeholder="Company name"
              value={form.companyName}
              onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
              required
            />
            <Input
              placeholder="Contact person"
              value={form.contactName}
              onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
              required
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              required
            />

            <Select
              value={form.agreementType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  agreementType: event.target.value as "PREPAID" | "WEEKLY" | "MONTHLY"
                }))
              }
            >
              <option value="PREPAID">Prepaid Credit</option>
              <option value="WEEKLY">Weekly Settlement</option>
              <option value="MONTHLY">Monthly Settlement</option>
            </Select>

            <Input
              placeholder="Commission Rate (%)"
              type="number"
              value={form.commissionRate}
              onChange={(event) => setForm((prev) => ({ ...prev, commissionRate: event.target.value }))}
              min={0}
              max={100}
              required
            />

            <Input
              placeholder="Credit Limit (optional)"
              type="number"
              value={form.creditLimit}
              onChange={(event) => setForm((prev) => ({ ...prev, creditLimit: event.target.value }))}
            />

            {form.agreementType === "PREPAID" ? (
              <Input
                placeholder="Initial Balance"
                type="number"
                value={form.initialBalance}
                onChange={(event) => setForm((prev) => ({ ...prev, initialBalance: event.target.value }))}
              />
            ) : null}

            <Button type="submit">Create Agent</Button>
          </form>
        </Card>

        <Card>
          <h3 className="section-title">Top Up Agent</h3>
          <p className="muted mt-1">Instantly increase prepaid credit for selected agents.</p>
          <form className="mt-3 grid gap-3" onSubmit={onTopUp}>
            <Select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} required>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.companyName}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              value={topUpAmount}
              onChange={(event) => setTopUpAmount(event.target.value)}
              min={1}
              required
            />
            <Input value={topUpRef} onChange={(event) => setTopUpRef(event.target.value)} required />
            <Button type="submit" variant="secondary">
              Apply Top Up
            </Button>
          </form>

          <p className="mt-3 text-xs text-slate-500">Top-ups increase prepaid credit balance immediately.</p>
        </Card>
      </section>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <h3 className="section-title">Agents</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-2">Company</th>
                <th className="px-2 py-2">Agreement</th>
                <th className="px-2 py-2">Commission</th>
                <th className="px-2 py-2">Credit</th>
                <th className="px-2 py-2">Outstanding</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">
                    <p className="font-semibold text-slate-800">{agent.companyName}</p>
                    <p className="text-xs text-slate-500">{agent.contactName}</p>
                  </td>
                  <td className="px-2 py-2">{agent.agreementType}</td>
                  <td className="px-2 py-2">{Number(agent.commissionRate).toFixed(2)}%</td>
                  <td className="px-2 py-2">{formatCurrency(Number(agent.creditBalance))}</td>
                  <td className="px-2 py-2">{formatCurrency(Number(agent.outstandingBalance))}</td>
                  <td className="px-2 py-2">
                    <Badge tone={agent.isActive ? "success" : "danger"}>
                      {agent.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-slate-500">{formatDate(agent.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </ProtectedShell>
  );
}
