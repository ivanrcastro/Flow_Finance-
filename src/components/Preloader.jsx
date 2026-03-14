import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const financialWords = [
  "Flow",
  "Syncing data...",
  "Securing assets",
  "Ready"
];

export const Preloader = ({ finishLoading }) => {
  const [index, setIndex] = useState(0);
  const isLastWord = index === financialWords.length - 1;

  useEffect(() => {
    if (index < financialWords.length - 1) {
      const timeout = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 250); // Velocidade ligeiramente mais lenta para ser legível
      return () => clearTimeout(timeout);
    } else {
      const finalTimeout = setTimeout(() => {
        finishLoading();
      }, 1200); 
      return () => clearTimeout(finalTimeout);
    }
  }, [index, finishLoading]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F2F2F7]" // Fundo oficial iOS
    >
      <div className="flex flex-col items-center">
        
        {/* ÍCONE ANIMADO (Substitui o LED) */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: isLastWord ? 360 : 0 
          }}
          transition={{ duration: 0.5, repeat: isLastWord ? 0 : Infinity }}
          className="mb-8 w-16 h-16 bg-blue-600 rounded-[22%] shadow-xl shadow-blue-500/20 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </motion.div>
        
        {/* TEXTO DE STATUS */}
        <div className="h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[17px] font-semibold text-black tracking-tight"
            >
              {financialWords[index]}
            </motion.p>
          </AnimatePresence>
        </div>
        
        {/* BARRA DE PROGRESSO ESTILO APPLE */}
        <div className="mt-8 h-[4px] w-32 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: `${((index + 1) / financialWords.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-blue-600"
          />
        </div>

        <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          Secure Connection
        </p>
      </div>
    </motion.div>
  );
};