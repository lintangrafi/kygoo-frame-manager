import Link from "next/link";
import { FrameList } from "@/components/frames/FrameList";
import { Plus } from "lucide-react";

export default function FramesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl font-black italic text-espresso tracking-tight">
            Katalog Frame
          </h2>
          <p className="mt-1 text-mahogany/40 text-sm">
            Kelola koleksi frame untuk dicetak
          </p>
        </div>
        <Link
          href="/staff/frames/new"
          className="inline-flex items-center gap-2 bg-espresso text-cream px-5 py-3 rounded-xl text-sm font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/5 hover:shadow-xl hover:shadow-espresso/10"
        >
          <Plus className="w-4 h-4" />
          Upload Frame
        </Link>
      </div>
      <FrameList />
    </div>
  );
}
