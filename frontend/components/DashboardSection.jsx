import { Users, GraduationCap, TrendingUp, BookOpen } from "lucide-react";
import { useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444"];

export default function DashboardSection({
  dashboardSummary = {},
  performanceData = [],
  pieData = [],
}) {
  const [selectedSlice, setSelectedSlice] = useState(null);
  const total = pieData.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const formatSlice = (value) => ({
    value,
    percentage: total ? ((Number(value) / total) * 100).toFixed(1) : "0.0",
  });

  return (
    <>
      <div className="analytics-grid">
        <div className="analytics-card blue">
          <Users size={32} />
          <div>
            <h2>{dashboardSummary.total_students || 0}</h2>
            <p>Total Students</p>
          </div>
        </div>

        <div className="analytics-card green">
          <GraduationCap size={32} />
          <div>
            <h2>{dashboardSummary.total_teachers || 0}</h2>
            <p>Total Teachers</p>
          </div>
        </div>

        <div className="analytics-card purple">
          <TrendingUp size={32} />
          <div>
            <h2>{dashboardSummary.pass_percentage || 0}%</h2>
            <p>Pass Percentage</p>
          </div>
        </div>

        <div className="analytics-card orange">
          <BookOpen size={32} />
          <div>
            <h2>{dashboardSummary.total_classes || 0}</h2>
            <p>Total Classes</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3>Class-wise Performance</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <XAxis dataKey="class_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentage" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Pass vs Fail Analysis</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${formatSlice(value).percentage}%`}
                onClick={(entry) => setSelectedSlice(entry)}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`pie-${entry.name || index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const details = formatSlice(value);
                  return [`${details.value} (${details.percentage}%)`, name];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="chart-detail" aria-live="polite">
            {selectedSlice
              ? `${selectedSlice.name}: ${selectedSlice.value} (${formatSlice(selectedSlice.value).percentage}%)`
              : "Select a segment to view its details."}
          </p>
        </div>
      </div>
    </>
  );
}