export default function AppLoading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
                <p className="text-sm text-slate-400">Loading...</p>
            </div>
        </div>
    )
}
