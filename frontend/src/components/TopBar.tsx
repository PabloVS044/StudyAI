export default function TopBar({ searchPlaceholder }: { searchPlaceholder?: string }) {
  return (
    <header className="bg-surface-bright/80 backdrop-blur-md shadow-sm fixed top-0 right-0 left-0 md:left-64 z-40 flex justify-between items-center h-16 px-gutter w-full md:max-w-[calc(100%-16rem)]">
      <div className="flex items-center gap-md flex-1">
        <div className="relative hidden sm:block max-w-md w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder={searchPlaceholder ?? "Search..."}
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-sm">
        <button className="text-on-surface-variant hover:bg-primary-container/10 rounded-full p-2 transition-all flex items-center justify-center">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="flex items-center gap-xs cursor-pointer hover:bg-primary-container/10 p-1 pr-3 rounded-full transition-all">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container text-[18px]">person</span>
          </div>
          <span className="text-label-md text-on-surface">Hola, Pablo</span>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
        </div>
      </div>
    </header>
  );
}
