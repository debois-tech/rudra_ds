export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] relative overflow-hidden">
            {/* Subtle ambient background shapes — amber/gold tones matching brand */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-amber-100/40 blur-3xl" />
                <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-amber-50/50 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-slate-100/50 blur-3xl" />
            </div>

            {/* Minimal grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
                    backgroundSize: '64px 64px',
                }}
            />

            <div className="relative z-10 w-full max-w-[400px] px-5">
                {children}

                {/* Bottom brand mark */}
                <p className="text-center text-[11px] text-slate-400 mt-8 tracking-wide">
                    Powered by <span className="font-semibold text-green-600">deboistech</span>
                </p>
            </div>
        </div>
    )
}
