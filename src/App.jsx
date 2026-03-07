import React, { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CaseFormScreen from './screens/CaseFormScreen';
import ResultsScreen from './screens/ResultsScreen';
import LoadingModal from './components/LoadingModal';

function App() {
  const [screen, setScreen] = useState('login');
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const startAnalysis = () => {
    setIsLoading(true);
  };

  const finishAnalysis = () => {
    setIsLoading(false);
    setScreen('results');
  };

  return (
    <>
      {screen === 'login' && <LoginScreen setScreen={setScreen} />}
      {screen === 'dashboard' && <DashboardScreen setScreen={setScreen} setSelectedCase={setSelectedCase} />}
      {screen === 'case-form' && <CaseFormScreen setScreen={setScreen} selectedCase={selectedCase} onStartAnalysis={startAnalysis} />}
      {screen === 'results' && <ResultsScreen setScreen={setScreen} selectedCase={selectedCase} />}
      {isLoading && <LoadingModal onComplete={finishAnalysis} />}
    </>
  );
}

export default App;
