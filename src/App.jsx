import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Home } from "./Pages/Home";
import { Preloader } from "./components/Preloader"; // Ajusta o caminho se necessário
import "./i18n";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <Preloader finishLoading={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* O site só aparece "atrás" ou "depois" do loader */}
      {!isLoading && (
        <main>
          <Home />
        </main>
      )}
    </>
  );
}

export default App;