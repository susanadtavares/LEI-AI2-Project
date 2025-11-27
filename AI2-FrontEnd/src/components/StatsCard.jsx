export default function StatsCard({ label, value, percentage }) {
  return (
    <div className="stats-card">
      <h4>{label}</h4>
      <p>{value}</p>
      <small>{percentage} Desde o último ano</small>
    </div>
  );
}
