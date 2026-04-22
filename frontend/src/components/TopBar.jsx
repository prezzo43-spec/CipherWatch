const TopBar = ({ page }) => (
  <div className="flex justify-between items-center px-8 py-4 bg-slate-900 border-b border-slate-700">
    <h2 className="text-white font-semibold text-lg">{page}</h2>
    <div className="flex items-center gap-4">
      <span className="text-slate-400 text-sm">🟢 All Systems Active</span>
      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-bold">C</div>
    </div>
  </div>
);

export default TopBar;