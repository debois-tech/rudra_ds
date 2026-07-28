'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[Admin Error]', error)
    }, [error])

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
            <div className="text-center max-w-md">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-950/20 flex items-center justify-center">
                    <AlertTriangle className="h-7 w-7 text-red-400" />
                </div>
                <h2 className="text-[18px] font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-[14px] text-slate-400 mb-6">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-[13px] font-semibold transition-colors cursor-pointer"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Try again
                </button>
            </div>
        </div>
    )
}
