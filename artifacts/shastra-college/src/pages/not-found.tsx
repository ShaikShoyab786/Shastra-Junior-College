import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#f5f7fb] p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-[#0B3472]/5">
        <AlertCircle className="h-9 w-9 text-[#E3212B]" />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-[#0B3472]">That page is not here.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">This route is reserved for a future part of the college site.</p>
      </div>
    </div>
  );
}
