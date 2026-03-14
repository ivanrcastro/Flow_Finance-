export const Navbar = ({ username }) => {
  return (
    <nav className="w-full p-6 flex flex-col items-center border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <h1 className="text-xl font-black text-indigo-600 tracking-tight uppercase">
        Expenses Tracker
      </h1>
      {username && (
        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
          Olá, <span className="text-indigo-400">{username}</span>
        </p>
      )}
    </nav>
  );
};