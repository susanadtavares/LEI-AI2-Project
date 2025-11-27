import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import './AuthPages.css';

function EmailStep() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    console.log('Iniciando submissão do formulário');

    if (!email || !validateEmail(email)) {
      setErro('Por favor, insira um email válido.');
      setLoading(false);
      return;
    }
    if (!password || password.trim() === '') {
      setErro('Por favor, insira uma palavra-passe.');
      setLoading(false);
      return;
    }

    try {
      console.log('Enviando requisição para a API');
      const res = await api.post('/auth/login', { email, password });
      
      const data = res.data;
      console.log('Dados do utilizador recebidos:', data); 

      if (data.mensagem === 'Password incorreta') {
        setErro('Palavra-passe incorreta. Tente novamente.');
      } else if (data.mensagem === 'Conta desativada ou não existe') {
        setErro('Email não encontrado.');
      } else {
        localStorage.setItem('token', JSON.stringify(data.jwt_token));
        localStorage.setItem(
          'user',
          JSON.stringify({
            id_utilizador: data.id_utilizador,
            tipo: data.tipo,
            nome: data.nome,
            email: data.email,
            primeiro_login: data.primeiro_login, 
          })
        );

        if (data.primeiro_login === true) {
          console.log('Redirecionando para /alterarPassword devido a primeiro_login');
          navigate('/alterarPassword');
        } else if (data.tipo) {
          switch (data.tipo) {
            case 'gestor':
              navigate('/gestor');
              break;
            case 'formador':
              navigate('/formador');
              break;
            case 'formando':
              navigate('/formando');
              break;
            default:
              setErro('Tipo de utilizador desconhecido.');
              navigate('/');
          }
        } else {
          setErro('Dados de utilizador inválidos.');
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Erro capturado:', err);
      const errorMessage =
        err.response?.data?.mensagem ||
        'Erro de rede ou servidor. Tente novamente mais tarde.';
      setErro(
        errorMessage.includes('email') ? 'Email não encontrado.' :
        errorMessage.includes('password') ? 'Palavra-passe incorreta.' :
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pagina-login" role="main">
      <div className="container-login">
        <div className="lado-texto">
          <h1>SoftSkills</h1>
          <h2>powered by Softinsa</h2>
          <p>
            Prepara-te para crescer. A plataforma ideal para desenvolveres
            as tuas competências pessoais e profissionais.
          </p>
        </div>

        <div className="formulario-login">
          <form onSubmit={handleEmailSubmit} noValidate>
            <h2 className="titulo-formulario">Início de Sessão</h2>

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-describedby="erro"
            />

            <label htmlFor="password">Palavra-Passe</label>
            <input
              id="password"
              type="password"
              placeholder="Palavra-Passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-describedby="erro"
            />

            <button type="submit" disabled={loading}>
              {loading ? 'A carregar...' : 'Iniciar Sessão'}
            </button>

            {erro && (
              <p className="erro" id="erro" role="alert" aria-live="polite">
                {erro}
              </p>
            )}

            <p className="link-registo">
              Não tens conta?{' '}
              <Link to="/registo" className="registo-link">
                Regista-te aqui
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EmailStep;
