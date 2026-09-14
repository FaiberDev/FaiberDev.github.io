import { useState } from 'react';
import BootScreen from './components/boot/BootScreen';
import Desktop from './components/desktop/Desktop';

export default function App() {
  const [booted, setBooted] = useState(false);

  return (
    <>
      {!booted && <BootScreen onBoot={() => setBooted(true)} />}
      {booted  && <Desktop />}
    </>
  );
}
