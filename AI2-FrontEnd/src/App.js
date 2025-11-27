import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';

function App() {
  useEffect(() => {
    const dark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', dark);
  }, []);

  return <AppRoutes />;
}

export default App;
