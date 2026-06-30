"use client";

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

// Generic fetch wrapper with error handling
async function fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============= Frames API =============

export function useFrames() {
  return useQuery({
    queryKey: ["frames"],
    queryFn: () => fetchWithError<any[]>("/api/frames"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFrame(id: string) {
  return useQuery({
    queryKey: ["frames", id],
    queryFn: () => fetchWithError<any>(`/api/frames/${id}`),
    enabled: !!id,
  });
}

export function useCreateFrame() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/frames", {
        method: "POST",
        body: data,
      });
      if (!res.ok) throw new Error("Failed to create frame");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frames"] });
      toast.success("Frame berhasil dibuat!");
    },
    onError: (error: Error) => {
      toast.error("Gagal membuat frame", error.message);
    },
  });
}

export function useUpdateFrame() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; category?: string; additionalFee?: number; isActive?: boolean }) =>
      fetchWithError(`/api/frames/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["frames"] });
      queryClient.invalidateQueries({ queryKey: ["frames", variables.id] });
      toast.success("Frame berhasil diupdate!");
    },
    onError: (error: Error) => {
      toast.error("Gagal update frame", error.message);
    },
  });
}

export function useDeleteFrame() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: string) =>
      fetchWithError(`/api/frames/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frames"] });
      toast.success("Frame berhasil dihapus!");
    },
    onError: (error: Error) => {
      toast.error("Gagal hapus frame", error.message);
    },
  });
}

// ============= Sessions API =============

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetchWithError<any[]>("/api/sessions"),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["sessions", id],
    queryFn: () => fetchWithError<any>(`/api/sessions/${id}`),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: { customerName: string; slug?: string }) =>
      fetchWithError<any>("/api/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Sesi berhasil dibuat!");
      router.push(`/staff/sessions/${session.id}`);
    },
    onError: (error: Error) => {
      toast.error("Gagal membuat sesi", error.message);
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; basePrice?: number }) =>
      fetchWithError(`/api/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", variables.id] });
      toast.success("Sesi berhasil diupdate!");
    },
    onError: (error: Error) => {
      toast.error("Gagal update sesi", error.message);
    },
  });
}

// ============= Compositions API =============

export function useCompositions(sessionId: string) {
  return useQuery({
    queryKey: ["compositions", sessionId],
    queryFn: () => fetchWithError<any[]>(`/api/sessions/${sessionId}/compositions`),
    enabled: !!sessionId,
  });
}

export function useComposition(id: string) {
  return useQuery({
    queryKey: ["compositions", id],
    queryFn: async () => {
      const res = await fetch(`/api/compositions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch composition");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateComposition() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ sessionId, frameId, slug }: { sessionId: string; frameId: string; slug: string }) => {
      const res = await fetch(`/api/sessions/${sessionId}/compositions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create composition");
      }
      return { ...(await res.json()), slug };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["compositions", data.sessionId] });
      router.push(`/s/${data.slug}/editor/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error("Gagal membuat komposisi", error.message);
    },
  });
}

export function useUpdateComposition() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; allocations?: any[]; status?: string }) =>
      fetchWithError(`/api/compositions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["compositions", variables.id] });
    },
    onError: (error: Error) => {
      toast.error("Gagal menyimpan", error.message);
    },
  });
}

export function useDeleteComposition() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ sessionId, compId }: { sessionId: string; compId: string }) =>
      fetchWithError(`/api/sessions/${sessionId}/compositions?compId=${compId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["compositions", variables.sessionId] });
      toast.success("Komposisi berhasil dihapus!");
    },
    onError: (error: Error) => {
      toast.error("Gagal hapus komposisi", error.message);
    },
  });
}

// ============= Photos API =============

export function usePhotos(sessionId: string) {
  return useQuery({
    queryKey: ["photos", sessionId],
    queryFn: () => fetchWithError<any[]>(`/api/sessions/${sessionId}/photos`),
    enabled: !!sessionId,
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ sessionId, file }: { sessionId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/sessions/${sessionId}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload photo");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["photos", variables.sessionId] });
    },
    onError: (error: Error) => {
      toast.error("Gagal upload foto", error.message);
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ sessionId, photoId }: { sessionId: string; photoId: string }) =>
      fetchWithError(`/api/sessions/${sessionId}/photos?photoId=${photoId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["photos", variables.sessionId] });
      toast.success("Foto berhasil dihapus!");
    },
    onError: (error: Error) => {
      toast.error("Gagal hapus foto", error.message);
    },
  });
}

// ============= Frame Slots API =============

export function useFrameSlots(frameId: string) {
  return useQuery({
    queryKey: ["frameSlots", frameId],
    queryFn: () => fetchWithError<any[]>(`/api/frames/${frameId}/slots`),
    enabled: !!frameId,
  });
}

export function useUpdateFrameSlots() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ frameId, slots }: { frameId: string; slots: any[] }) =>
      fetchWithError(`/api/frames/${frameId}/slots`, {
        method: "POST",
        body: JSON.stringify({ slots }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["frameSlots", variables.frameId] });
      toast.success("Slot berhasil disimpan!");
    },
    onError: (error: Error) => {
      toast.error("Gagal menyimpan slot", error.message);
    },
  });
}

// ============= Preview/Export API =============

export function useGenerateExport() {
  const toast = useToast();

  return useMutation({
    mutationFn: async (compositionId: string) => {
      const res = await fetch(`/api/compositions/${compositionId}/export`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate export");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Export berhasil!");
    },
    onError: (error: Error) => {
      toast.error("Gagal generate export", error.message);
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (compositionId: string) =>
      fetchWithError(`/api/compositions/${compositionId}/submit`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Dikirim untuk review!");
    },
    onError: (error: Error) => {
      toast.error("Gagal submit", error.message);
    },
  });
}

export function useApproveComposition() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (compositionId: string) =>
      fetchWithError(`/api/compositions/${compositionId}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compositions"] });
      toast.success("Komposisi disetujui!");
    },
    onError: (error: Error) => {
      toast.error("Gagal approve", error.message);
    },
  });
}

export function useFinalizeComposition() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (compositionId: string) =>
      fetchWithError(`/api/compositions/${compositionId}/finalize`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compositions"] });
      toast.success("Komposisi difinalisasi!");
    },
    onError: (error: Error) => {
      toast.error("Gagal finalisasi", error.message);
    },
  });
}
