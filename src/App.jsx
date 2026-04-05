import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MatchDetails from './pages/MatchDetails';
import MarketOverview from './pages/MarketOverview';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/market" element={<MarketOverview />} />
        <Route path="/match/:fixtureId" element={<MatchDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
