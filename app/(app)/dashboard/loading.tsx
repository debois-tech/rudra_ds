export default function DashboardLoading() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
                <div>
                    <div className="skeleton h-7 w-40 rounded" />
                    <div className="skeleton h-4 w-24 rounded mt-2" />
                </div>
                <div className="skeleton h-10 w-36 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
                        <div className="skeleton h-4 w-16 rounded mb-4" />
                        <div className="skeleton h-8 w-24 rounded mb-1" />
                        <div className="skeleton h-3 w-20 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
