export default function FormField({ label, type = 'text', name, value, onChange, placeholder, options = [] }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {type === 'select' ? (
        <select name={name} value={value} onChange={onChange}>
          <option value="">-- Selecionar --</option>
          {options.map((opt, idx) =>
            typeof opt === 'object' ? (
              <option key={idx} value={opt.value}>{opt.label}</option>
            ) : (
              <option key={idx} value={opt}>{opt}</option>
            )
          )}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      )}
    </div>
  );
}
