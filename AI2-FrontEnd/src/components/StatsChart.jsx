import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F'];

export default function StatsChart({ stats }) {
  const barData = [
    { name: 'Utilizadores', value: stats.totalUsers },
    { name: 'Formadores', value: stats.totalFormadores },
    { name: 'Cursos', value: stats.totalCursos },
  ];

  const pieData = [
    { name: 'Formadores', value: stats.totalFormadores },
    { name: 'Outros', value: stats.totalUsers - stats.totalFormadores },
  ];

  return (
    <div className="charts">
      <h3>Resumo Gráfico</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} dataKey="value" outerRadius={80} label>
              {pieData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
