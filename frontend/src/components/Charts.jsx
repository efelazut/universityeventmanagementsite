import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const palette = ["#0f766e", "#1d4ed8", "#c2410c", "#be123c", "#c6a86b", "#334155"];

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.98)",
        borderRadius: 16,
        padding: "12px 14px",
        boxShadow: "0 16px 32px rgba(22, 37, 55, 0.12)",
        border: "1px solid rgba(23, 37, 55, 0.08)"
      }}
    >
      <strong style={{ display: "block", marginBottom: 6 }}>{label}</strong>
      <span style={{ color: "#627084", fontSize: 13 }}>Değer: {payload[0].value}</span>
    </div>
  );
}

export function Bars({ data, xKey, dataKey }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(23, 37, 55, 0.08)" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: "#627084", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#627084", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(15, 118, 110, 0.05)" }} />
          <Bar dataKey={dataKey} radius={[10, 10, 0, 0]} fill="#0f766e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieBreakdown({ data, nameKey, dataKey }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<TooltipContent />} />
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} outerRadius={100} innerRadius={52} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={`${entry[nameKey]}-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
