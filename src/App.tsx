import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SetupPage from './pages/SetupPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
