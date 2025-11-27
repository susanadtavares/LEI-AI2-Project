# LEI-PINT

Estrutura do projeto por componentes:
A. Backend (Node.js + SQL Server) Função:
- Processa lógica, armazena e gere dados
- Fornece API para frontends (web/mobile) consumirem Tecnologias:
- Node.js: Ambiente de execução do servidor
- Express: Framework para criar a API
- MSSQL: Driver para conectar ao SQL Server
- Nodemailer: Envio de emails (confirmação de registro)
- JWT (JSON Web Tokens): Autenticação de utilizadores

B. Frontend Web (React + HTML/CSS) Função:
- Interface para utilizadores (web)
- Consome API do backend Tecnologias:
- React: Biblioteca para interfaces dinâmicas
- React Router: Navegação entre páginas
- Axios/Fetch: Chamadas à API do backend
- HTML/CSS: Estrutura e estilos

C. Mobile (Flutter) Função:
- Versão Android da aplicação
- Consome a mesma API que o frontend web Tecnologias:
- Flutter: Framework para apps multiplataforma (Android)
- HTTP Package: Chamadas à API
- Shared Preferences: Armazenar tokens de autenticação localmente
- Comunicação das diferentes partes
- Backend (Node.js): único que acede ao SQL Server.
- Frontend (React/Flutter): só interage com o backend via HTTP (JSON).
- Ordem de execução do projeto
- Protótipos de alta fidelidade (Figma)
- Modelação de dados (Power Designer + SQL Server)
- Frontend (web e mobile)

Passos a seguir:
- Modelar o SQL Server (tabelas de utilizadores, cursos, fórum).
- Criar endpoints básicos no Node.js (ex: POST /api/register).
- Testar tudo no Postman. B. Frontend:
- Web (React) e mobile (Flutter) podem ser desenvolvidos em paralelo, pois ambos consomem a mesma API. C. Integração final:
- Garantir que web/mobile mostram os dados corretamente.