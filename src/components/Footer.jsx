const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 mt-4 text-center flex flex-col items-center gap-1">
      <div className="w-6 h-[1px] bg-gray-200 mb-2"></div>
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Ivan Castro</p>
      <p className="text-[9px] font-medium text-gray-400/40">© {currentYear}</p>
    </footer>
  );
};