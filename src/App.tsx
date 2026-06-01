import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { SortingArena } from './pages/SortingArena';
import { PathfindingWorld } from './pages/PathfindingWorld';
import { TreeExplorer } from './pages/TreeExplorer';
import { GraphUniverse } from './pages/GraphUniverse';

const basename = import.meta.env.BASE_URL.replace(/\/+$/, '');

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/sorting"     element={<SortingArena />} />
        <Route path="/pathfinding" element={<PathfindingWorld />} />
        <Route path="/tree"        element={<TreeExplorer />} />
        <Route path="/graph"       element={<GraphUniverse />} />
      </Routes>
    </BrowserRouter>
  );
}
