import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MatchDetails from './pages/MatchDetails';
import './App.css';

/**
 * Main App Component
 * Sets up routing for the SportMonks Predictions application
 *
 * Routes:
 * - "/" - Landing page with leagues and fixtures
 * - "/match/:fixtureId" - Match details with predictions
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/match/:fixtureId" element={<MatchDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
