export default function OrganizationsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
                <div>
                    <div className="skeleton h-7 w-44 rounded" />
                    <div className="skeleton h-4 w-28 rounded mt-1" />
                </div>
                <div className="skeleton h-10 w-36 rounded-xl" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0">
                            <div className="flex-1">
                                <div className="skeleton h-5 w-40 rounded mb-2" />
                                <div className="skeleton h-3 w-56 rounded" />
                            </div>
                            <div className="skeleton h-8 w-24 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
