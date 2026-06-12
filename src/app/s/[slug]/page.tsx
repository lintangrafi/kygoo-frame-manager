"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PinGate } from "@/components/session/PinGate";
import { CustomerDashboard } from "@/components/session/CustomerDashboard";
import { Gallery } from "@/components/session/Gallery";

type Step = "pin" | "dashboard" | "gallery";

interface SessionInfo {
  sessionId: string;
  customerName: string;
  status: string;
  photoCount: number;
}

export default function SessionPageClient() {
  const params = useParams();
  const slug = params.slug as string;
  const [step, setStep] = useState<Step>("pin");
  const [session, setSession] = useState<SessionInfo | null>(null);

  function handlePinSuccess(info: SessionInfo) {
    setSession(info);
    setStep("dashboard");
  }

  function handleEnterGallery() {
    setStep("gallery");
  }

  function handleBackToDashboard() {
    setStep("dashboard");
  }

  if (step === "gallery" && session) {
    return (
      <div className="relative">
        <button
          onClick={handleBackToDashboard}
          className="fixed top-4 left-4 z-50 bg-cream-card text-mahogany px-4 py-2 rounded-xl text-xs font-bold border border-amber/10 shadow-md hover:shadow-lg transition-all duration-200"
        >
          ← Kembali
        </button>
        <Gallery sessionId={session.sessionId} slug={slug} status={session.status} />
      </div>
    );
  }

  if (step === "dashboard" && session) {
    return (
      <CustomerDashboard
        customerName={session.customerName}
        sessionId={session.sessionId}
        slug={slug}
        status={session.status}
        photoCount={session.photoCount}
        onEnter={handleEnterGallery}
      />
    );
  }

  return <PinGate slug={slug} onSuccess={handlePinSuccess} />;
}
