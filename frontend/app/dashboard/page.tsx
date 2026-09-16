"use client";
import { Appbar } from "@/components/Appbar";
import { DarkButton } from "@/components/buttons/DarkButton";
import axios from "axios";
import { useEffect, useState } from "react";
import { BACKEND_URL, HOOKS_URL } from "../config";
import { LinkButton } from "@/components/buttons/LinkButton";
import { useRouter } from "next/navigation";

interface Zap {
  id: string;
  triggerId: string;
  userId: number;
  actions: {
    id: string;
    zapId: string;
    actionId: string;
    sortingOrder: number;
    type: {
      id: string;
      name: string;
      image: string;
    };
  }[];
  trigger: {
    id: string;
    zapId: string;
    triggerId: string;
    type: {
      id: string;
      name: string;
      image: string;
    };
  };
}

function useZaps() {
  const [loading, setLoading] = useState(true);
  const [zaps, setZaps] = useState<Zap[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZaps = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/v1/zap`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setZaps(res.data);
      } catch {
        setError("Could not load your Zaps.");
      } finally {
        setLoading(false);
      }
    };

    fetchZaps();
  }, []);

  return {
    loading,
    zaps,
    error,
  };
}

export default function DashboardPage() {
  const { loading, zaps, error } = useZaps();
  const router = useRouter();

  return (
    <div>
      <Appbar />
      <div className="flex justify-center pt-8">
        {/* Expanded container width to fit long urls comfortably */}
        <div className="max-w-6xl w-full px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="text-2xl font-bold">My Zaps</div>
            <DarkButton
              onClick={() => {
                router.push("/zap/create");
              }}
            >
              Create
            </DarkButton>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center pt-8">Loading...</div>
      ) : error ? (
        <div className="flex justify-center pt-8 text-red-500">{error}</div>
      ) : (
        <div className="flex justify-center">
          <ZapTable zaps={zaps} />
        </div>
      )}
    </div>
  );
}

function ZapTable({ zaps }: { zaps: Zap[] }) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="px-8 max-w-6xl w-full">
      {/* 
        Using a 7-column grid layout:
        Col 1: Name (1 span)
        Col 2: ID (1 span)
        Col 3: Created at (1 span)
        Cols 4-5: Webhook URL (2 spans so the full URL is visible)
        Col 6: Action / Go button (1 span)
      */}
      <div className="grid grid-cols-6 gap-4 font-semibold text-gray-700 border-b pb-3 items-center">
        <div>Name</div>
        <div>ID</div>
        <div>Created at</div>
        <div className="col-span-2">Webhook URL</div>
        <div>Action</div>
      </div>

      {/* Table Rows */}
      {zaps.map((z) => {
        const webhookUrl = `${HOOKS_URL}/hooks/catch/1/${z.id}`;

        return (
          <div
            key={z.id}
            className="grid grid-cols-6 gap-4 items-center border-b py-4"
          >
            {/* Column 1: Trigger & Action Icons */}
            <div className="flex items-center space-x-1">
              {z.trigger?.type?.image && (
                <img
                  src={z.trigger.type.image}
                  className="w-[30px] h-[30px] rounded-full"
                  alt="Trigger"
                />
              )}
              {z.actions?.map((x, index) => (
                <img
                  key={x.id || index}
                  src={x.type?.image}
                  className="w-[30px] h-[30px] rounded-full"
                  alt="Action"
                />
              ))}
            </div>

            {/* Column 2: ID */}
            <div className="text-sm text-gray-600 truncate" title={z.id}>
              {z.id}
            </div>

            {/* Column 3: Created At */}
            <div className="text-sm text-gray-600">Nov 13, 2023</div>

            {/* Columns 4 & 5: Webhook URL with Input + Copy Button */}
            <div className="col-span-2 flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1.5 w-full text-gray-600 focus:outline-none"
              />
              <button
                onClick={() => handleCopy(webhookUrl, z.id)}
                className="bg-gray-200 hover:bg-gray-300 text-xs px-3 py-1.5 rounded text-gray-700 font-medium whitespace-nowrap transition-colors"
              >
                {copiedId === z.id ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Column 6: Action Button (Go) perfectly aligned */}
            <div>
              <LinkButton
                onClick={() => {
                  router.push("/zap/" + z.id);
                }}
              >
                Go
              </LinkButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
