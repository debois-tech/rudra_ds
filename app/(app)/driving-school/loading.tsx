export default function DrivingSchoolLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="skeleton h-7 w-40 rounded" />
                    <div className="skeleton h-4 w-32 rounded mt-1" />
                </div>
                <div className="skeleton h-9 w-36 rounded-xl" />
            </div>
            <div className="grid gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
                        <div className="flex items-center gap-4">
                            <div className="skeleton h-10 w-10 rounded-full" />
                            <div className="flex-1">
                                <div className="skeleton h-4 w-32 rounded mb-2" />
                                <div className="skeleton h-3 w-48 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
