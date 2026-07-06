"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card } from "@/components/ui/card";

export const SalesLineChart = ({
  title,
  data,
  dataKey,
  xKey = "date"
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xKey?: string;
}) => (
  <Card>
    <h3 className="section-title">{title}</h3>
    <div className="mt-3 h-64 rounded-2xl bg-slate-50/80 p-2 ring-1 ring-slate-200">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey={xKey} stroke="#64748B" />
          <YAxis stroke="#64748B" />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#10B981" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

export const SalesBarChart = ({
  title,
  data,
  dataKey,
  xKey = "name"
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xKey?: string;
}) => (
  <Card>
    <h3 className="section-title">{title}</h3>
    <div className="mt-3 h-64 rounded-2xl bg-slate-50/80 p-2 ring-1 ring-slate-200">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey={xKey} stroke="#64748B" />
          <YAxis stroke="#64748B" />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#0F172A" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);
