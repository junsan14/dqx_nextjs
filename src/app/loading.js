export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
      <div className="relative flex items-center justify-center">

        {/* outer ring */}
        <div className="absolute w-24 h-24 border-4 border-cyan-400/20 rounded-full"></div>

        {/* spinning ring */}
        <div className="absolute w-24 h-24 border-4 border-transparent border-t-cyan-400 border-r-purple-500 rounded-full animate-spin"></div>

        {/* center glow */}
        <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_20px_white]"></div>

      </div>
    </div>
  );
}
