"use client";

import { Appbar } from "@/components/Appbar";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/app/config";

interface ZapRun {
  id: string;
  zapId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "PUBLISHED";
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

interface ZapDetails {
  id: string;
  name?: string;
  trigger?: {
    id: string;
    type?: {
      name: string;
      image?: string;
    };
  };
  actions?: {
    id: string;
    sortingOrder: number;
    type?: {
      name: string;
      image?: string;
    };
  }[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  RUNNING: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  PUBLISHED: "bg-violet-100 text-violet-700 border-violet-200",
};

export default function ZapDetailPage() {
  const router = useRouter();
  const params = useParams();
  const zapId = typeof params?.zapId === "string" ? params.zapId : "";

  const [zap, setZap] = useState<ZapDetails | null>(null);
  const [zapRuns, setZapRuns] = useState<ZapRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!zapId) {
      setLoading(false);
      setError("Zap not found.");
      return;
    }

    const fetchZapData = async () => {
      try {
        setLoading(true);
        const [zapResponse, runsResponse] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/v1/zap/${zapId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/v1/zap/zapRuns/${zapId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setZap(zapResponse.data);
        const runs = runsResponse.data?.zapRuns ?? [];
        setZapRuns(runs);
        setSelectedRunId(runs[0]?.id ?? null);
      } catch {
        setError("Could not load zap details.");
      } finally {
        setLoading(false);
      }
    };

    fetchZapData();
  }, [router, zapId]);

  const selectedRun = useMemo(
    () => zapRuns.find((run) => run.id === selectedRunId) ?? zapRuns[0] ?? null,
    [selectedRunId, zapRuns],
  );

  if (loading) {
    return (
      <div>
        <Appbar />
        <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
          Loading zap run history...
        </div>
      </div>
    );
  }

  if (error || !zap) {
    return (
      <div>
        <Appbar />
        <div className="flex min-h-[60vh] items-center justify-center text-red-500">
          {error ?? "Zap not found."}
        </div>
      </div>
    );
  }

  const triggerName = zap.trigger?.type?.name ?? "Trigger";
  const actionNames = (zap.actions ?? []).map(
    (action) => action.type?.name ?? "Action",
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Appbar />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="w-80 shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-lg font-semibold text-slate-900">Zap runs</div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-3">
            {zapRuns.length === 0 ? (
              <div className="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No runs yet for this zap.
              </div>
            ) : (
              zapRuns.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedRunId(run.id)}
                  className={`mb-3 w-full rounded-xl border p-3 text-left transition ${
                    selectedRun?.id === run.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        statusColors[run.status] ??
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs opacity-80">
                    Run ID: {run.id.slice(0, 8)}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Zap
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {zap.name ?? "Untitled Zap"}
              </h1>
            </div>

            {selectedRun && (
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  statusColors[selectedRun.status] ??
                  "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {selectedRun.status}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Trigger
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {triggerName}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Actions
              </div>
              <div className="flex flex-wrap gap-2">
                {actionNames.length === 0 ? (
                  <span className="text-slate-500">No actions configured</span>
                ) : (
                  actionNames.map((name, index) => (
                    <span
                      key={`${name}-${index}`}
                      className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-700"
                    >
                      {name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
              Selected run details
            </div>

            {selectedRun ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-white p-3">
                  <span className="text-slate-500">Run ID</span>
                  <span className="font-medium text-slate-900">
                    {selectedRun.id}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white p-3">
                  <span className="text-slate-500">Created</span>
                  <span className="font-medium text-slate-900">
                    {new Date(selectedRun.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white p-3">
                  <span className="text-slate-500">Status</span>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                      statusColors[selectedRun.status] ??
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {selectedRun.status}
                  </span>
                </div>

                {selectedRun.metadata && (
                  <div className="rounded-lg bg-white p-3">
                    <div className="mb-2 text-sm font-medium text-slate-700">
                      Metadata
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">
                      {JSON.stringify(selectedRun.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500">
                Choose a run from the left to inspect details.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
