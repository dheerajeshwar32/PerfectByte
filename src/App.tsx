import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Home from './Home';
import TargetCompressor from './TargetCompressor';
import BulkCompressor from './BulkCompressor';
import Assistant from './Assistant';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/target-size" element={<TargetCompressor />} />
        <Route path="/bulk-compress" element={<BulkCompressor />} />
        <Route path="/assistant" element={<Assistant />} />
      </Routes>
      <Analytics />
    </Router>
  );
}
