import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MatchDetails from './pages/MatchDetails';
import MarketOverview from './pages/MarketOverview';
import OddsOverview from './pages/OddsOverview';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/predictions" element={<MarketOverview />} />
        <Route path="/odds" element={<OddsOverview />} />
        <Route path="/match/:fixtureId" element={<MatchDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
