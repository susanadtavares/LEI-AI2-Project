import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./perfilAdmin.css"; 

export default function PerfilAdmin() {
  const { id } = useParams();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    // Simulação de fetch
    setAdmin({ id, nome: "Admin Geral", email: "admin@softinsa.pt" });
  }, [id]);

  if (!admin) return <p>A carregar...</p>;

  return (
    <div> 
        <div className="perfil-container">
        <h2>Perfil do Administrador</h2>
        <p><strong>ID:</strong> {admin.id}</p>
        <p><strong>Nome:</strong> {admin.nome}</p>
        <p><strong>Email:</strong> {admin.email}</p>
        </div>
    </div>
  );
}
