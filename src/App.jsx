import React, { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CaseFormScreen from './screens/CaseFormScreen';
import ResultsScreen from './screens/ResultsScreen';
import CasesScreen from './screens/CasesScreen';
import LoadingModal from './components/LoadingModal';
import { transformPatientJson } from './utils/transformCase';

const PATIENT_FILES = [
  { url: '/data/patient_1.json', chatUrl: '/data/chat_tree_1.json', id: 'VRT-2026-10017' },
  { url: '/data/patient_2.json', chatUrl: '/data/chat_tree_2.json', id: 'VRT-2026-10018' },
  { url: '/data/patient_3.json', chatUrl: '/data/chat_tree_3.json', id: 'VRT-2026-10019' },
];

function App() {
  const [screen, setScreen] = useState('login');
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cases, setCases] = useState({});

  useEffect(() => {
    Promise.all(
      PATIENT_FILES.map(({ url, chatUrl, id }) =>
        Promise.all([fetch(url).then(r => r.json()), fetch(chatUrl).then(r => r.json())])
          .then(([json, chatTree]) => [id, transformPatientJson(json, id, chatTree)])
      )
    ).then(entries => setCases(Object.fromEntries(entries)));
  }, []);

  const startAnalysis = () => setIsLoading(true);
  const finishAnalysis = () => { setIsLoading(false); setScreen('results'); };

  return (
    <>
      {screen === 'login' && <LoginScreen setScreen={setScreen} />}
      {screen === 'dashboard' && <DashboardScreen setScreen={setScreen} setSelectedCase={setSelectedCase} cases={cases} />}
      {screen === 'cases' && <CasesScreen setScreen={setScreen} setSelectedCase={setSelectedCase} cases={cases} />}
      {screen === 'case-form' && <CaseFormScreen setScreen={setScreen} selectedCase={selectedCase} onStartAnalysis={startAnalysis} />}
      {screen === 'results' && <ResultsScreen setScreen={setScreen} selectedCase={selectedCase} cases={cases} />}
      {isLoading && <LoadingModal onComplete={finishAnalysis} />}
    </>
  );
}

export default App;
