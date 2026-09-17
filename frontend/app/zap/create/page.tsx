"use client";

import { BACKEND_URL } from "@/app/config";
import { Appbar } from "@/components/Appbar";
import { Input } from "@/components/Input";
import { ZapCell } from "@/components/ZapCell";
import { LinkButton } from "@/components/buttons/LinkButton";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function useAvailableActionsAndTriggers() {
  const [availableActions, setAvailableActions] = useState([]);
  const [availableTriggers, setAvailableTriggers] = useState([]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/trigger/available`)
      .then((x) => setAvailableTriggers(x.data.availableTriggers));

    axios
      .get(`${BACKEND_URL}/api/v1/action/available`)
      .then((x) => setAvailableActions(x.data.availableActions));
  }, []);

  return {
    availableActions,
    availableTriggers,
  };
}

export default function CreateZapPage() {
  const router = useRouter();
  const { availableActions, availableTriggers } =
    useAvailableActionsAndTriggers();
  const [selectedTrigger, setSelectedTrigger] = useState<{
    id: string;
    name: string;
  }>();

  const [selectedActions, setSelectedActions] = useState<
    {
      index: number;
      availableActionId: string;
      availableActionName: string;
      metadata: any;
    }[]
  >([]);
  const [selectedModalIndex, setSelectedModalIndex] = useState<null | number>(
    null,
  );
  const publishDisabled =
    !selectedTrigger?.id ||
    selectedActions.length === 0 ||
    selectedActions.some((action) => !action.availableActionId);

  return (
    <div>
      <Appbar />
      <div className="flex justify-end bg-slate-200 p-4">
        <span
          title={
            publishDisabled
              ? "Add at least 1 trigger and 1 action to enable Publish"
              : ""
          }
        >
          <PrimaryButton
            disabled={publishDisabled}
            onClick={async () => {
              if (!selectedTrigger?.id) {
                return;
              }

              const generatedName = selectedActions.length
                ? `${selectedTrigger.name} to ${selectedActions
                    .map((action) => action.availableActionName)
                    .join(" and ")}`
                : undefined;

              const response = await axios.post(
                `${BACKEND_URL}/api/v1/zap/create`,
                {
                  triggerTypeId: selectedTrigger.id,
                  triggerMetadata: {},
                  actions: selectedActions.map((a) => ({
                    actionTypeId: a.availableActionId,
                    actionMetadata: a.metadata,
                  })),
                  name: generatedName,
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                },
              );

              router.push("/dashboard");
            }}
          >
            Publish
          </PrimaryButton>
        </span>
      </div>
      <div className="w-full min-h-screen bg-slate-200 flex flex-col justify-center">
        <div className="flex justify-center w-full">
          <ZapCell
            onClick={() => {
              setSelectedModalIndex(1);
            }}
            name={selectedTrigger?.name ? selectedTrigger.name : "Trigger"}
            index={1}
          />
        </div>
        <div className="w-full pt-2 pb-2">
          {selectedActions.map((action, index) => (
            <div key={action.index} className="pt-2 flex justify-center">
              {" "}
              <ZapCell
                onClick={() => {
                  setSelectedModalIndex(action.index);
                }}
                name={
                  action.availableActionName
                    ? action.availableActionName
                    : "Action"
                }
                index={action.index}
              />{" "}
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <div>
            <PrimaryButton
              onClick={() => {
                setSelectedActions((a) => [
                  ...a,
                  {
                    index: a.length + 2,
                    availableActionId: "",
                    availableActionName: "",
                    metadata: {},
                  },
                ]);
              }}
            >
              <div className="text-2xl">+</div>
            </PrimaryButton>
          </div>
        </div>
      </div>
      {selectedModalIndex && (
        <Modal
          availableItems={
            selectedModalIndex === 1 ? availableTriggers : availableActions
          }
          onSelect={(
            props: null | { name: string; id: string; metadata: any },
          ) => {
            if (props === null) {
              setSelectedModalIndex(null);
              return;
            }
            if (selectedModalIndex === 1) {
              setSelectedTrigger({
                id: props.id,
                name: props.name,
              });
            } else {
              setSelectedActions((a) => {
                let newActions = [...a];
                newActions[selectedModalIndex - 2] = {
                  index: selectedModalIndex,
                  availableActionId: props.id,
                  availableActionName: props.name,
                  metadata: props.metadata,
                };
                return newActions;
              });
            }
            setSelectedModalIndex(null);
          }}
          index={selectedModalIndex}
          selectedActions={selectedActions}
        />
      )}
    </div>
  );
}

function Modal({
  index,
  onSelect,
  availableItems,
  selectedActions,
}: {
  index: number;
  onSelect: (props: null | { name: string; id: string; metadata: any }) => void;
  availableItems: { id: string; name: string; image: string }[];
  selectedActions: {
    index: number;
    availableActionId: string;
    availableActionName: string;
    metadata: any;
  }[];
}) {
  const [step, setStep] = useState(0);
  const [selectedAction, setSelectedAction] = useState<{
    id: string;
    name: string;
  }>();
  const isTrigger = index === 1;
  const currentActionPosition = Math.max(index - 2, 0);

  return (
    <div className="fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-slate-100 bg-opacity-70 flex">
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow ">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t ">
            <div className="text-xl">
              Select {index === 1 ? "Trigger" : "Action"}
            </div>
            <button
              onClick={() => {
                onSelect(null);
              }}
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              data-modal-hide="default-modal"
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <div className="p-4 md:p-5 space-y-4">
            {step === 1 && selectedAction?.name === "email" && (
              <EmailSelector
                currentActionPosition={currentActionPosition}
                setMetadata={(metadata) => {
                  onSelect({
                    ...selectedAction,
                    metadata,
                  });
                }}
              />
            )}

            {step === 1 && selectedAction?.name === "ai_summary" && (
              <AISelector
                currentActionPosition={currentActionPosition}
                setMetadata={(metadata) => {
                  onSelect({
                    ...selectedAction,
                    metadata,
                  });
                }}
              />
            )}

            {step === 1 && selectedAction?.name === "openai" && (
              <AISelector
                currentActionPosition={currentActionPosition}
                setMetadata={(metadata) => {
                  onSelect({
                    ...selectedAction,
                    metadata,
                  });
                }}
              />
            )}

            {step === 1 && selectedAction?.name === "solana_send" && (
              <SolanaSelector
                setMetadata={(metadata) => {
                  onSelect({
                    ...selectedAction,
                    metadata,
                  });
                }}
              />
            )}

            {step === 0 && (
              <div>
                {availableItems.map(({ id, name }) => {
                  return (
                    <div
                      key={id}
                      onClick={() => {
                        if (isTrigger) {
                          onSelect({
                            id,
                            name,
                            metadata: {},
                          });
                        } else {
                          setStep((s) => s + 1);
                          setSelectedAction({
                            id,
                            name,
                          });
                        }
                      }}
                      className="flex border p-4 cursor-pointer hover:bg-slate-100"
                    >
                      <div className="flex flex-col justify-center">{name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const BASE_TEMPLATE_TOKENS = [
  { label: "Trigger → Name", value: "{trigger.name}" },
  { label: "Trigger → Email", value: "{trigger.email}" },
  { label: "Trigger → Comment", value: "{trigger.comment}" },
  { label: "Trigger → Subject", value: "{trigger.subject}" },
  { label: "Trigger → Message", value: "{trigger.message}" },
  { label: "Trigger → Repository name", value: "{trigger.repository.name}" },
  {
    label: "Trigger → Repository full name",
    value: "{trigger.repository.full_name}",
  },
  { label: "Trigger → PR title", value: "{trigger.pull_request.title}" },
  { label: "Trigger → PR number", value: "{trigger.pull_request.number}" },
  { label: "Trigger → Sender login", value: "{trigger.sender.login}" },
  { label: "Trigger → Action", value: "{trigger.action}" },
];

function buildTemplateTokens(currentActionPosition: number) {
  const previousStepTokens = Array.from(
    { length: currentActionPosition },
    (_, index) => ({
      label: `Step ${index} output`,
      value: `{steps.${index}.output}`,
    }),
  );

  return [...BASE_TEMPLATE_TOKENS, ...previousStepTokens];
}

function TemplateTokenMenu({
  onInsert,
  currentActionPosition,
}: {
  onInsert: (token: string) => void;
  currentActionPosition: number;
}) {
  const tokens = buildTemplateTokens(currentActionPosition);

  return (
    <div className="mt-2 border border-slate-300 rounded-md bg-white p-2 shadow-sm max-h-40 overflow-y-auto">
      <div className="text-xs font-medium text-slate-500 mb-2">
        Available variables
      </div>
      <div className="space-y-1">
        {tokens.map((token) => (
          <button
            key={token.value}
            type="button"
            className="block w-full text-left px-2 py-1 rounded hover:bg-slate-100 text-sm text-slate-700"
            onClick={() => onInsert(token.value)}
          >
            {token.label}:{" "}
            <span className="font-mono text-xs">{token.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmailSelector({
  setMetadata,
  currentActionPosition,
}: {
  setMetadata: (params: any) => void;
  currentActionPosition: number;
}) {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [showToTokens, setShowToTokens] = useState(false);
  const [showSubjectTokens, setShowSubjectTokens] = useState(false);
  const [showBodyTokens, setShowBodyTokens] = useState(false);

  const insertToken = (token: string, target: "to" | "subject" | "body") => {
    if (target === "to") {
      setEmail((prev) => `${prev}${prev ? " " : ""}${token}`);
      setShowToTokens(false);
      return;
    }
    if (target === "subject") {
      setSubject((prev) => `${prev}${prev ? " " : ""}${token}`);
      setShowSubjectTokens(false);
      return;
    }
    setBody((prev) => `${prev}${prev ? " " : ""}${token}`);
    setShowBodyTokens(false);
  };

  const validateEmail = (emailStr: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(emailStr) || /\{[^}]+\}/.test(emailStr);
  };

  return (
    <div>
      <Input
        label={"To"}
        type={"text"}
        placeholder="To (e.g. user@gmail.com or {trigger.email})"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError("");
        }}
      ></Input>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          className="border border-slate-300 rounded px-2 py-2 text-xs text-slate-700 bg-white"
          onClick={() => {
            setShowSubjectTokens(false);
            setShowBodyTokens(false);
            setShowToTokens((prev) => !prev);
          }}
        >
          Add variable
        </button>
      </div>
      {showToTokens && (
        <TemplateTokenMenu
          currentActionPosition={currentActionPosition}
          onInsert={(token) => insertToken(token, "to")}
        />
      )}

      <div className="pt-2">
        <div className="text-sm pb-1 pt-2">
          * <label>Subject</label>
        </div>
        <input
          className="border rounded px-4 py-2 w-full border-black"
          value={subject}
          placeholder="Subject"
          onChange={(e) => setSubject(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="border border-slate-300 rounded px-2 py-2 text-xs text-slate-700 bg-white"
            onClick={() => {
              setShowBodyTokens(false);
              setShowSubjectTokens((prev) => !prev);
            }}
          >
            Add variable
          </button>
        </div>
        {showSubjectTokens && (
          <TemplateTokenMenu
            currentActionPosition={currentActionPosition}
            onInsert={(token) => insertToken(token, "subject")}
          />
        )}
      </div>

      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}

      <div className="pt-2">
        <div className="text-sm pb-1 pt-2">
          * <label>Body</label>
        </div>
        <textarea
          className="border rounded px-4 py-2 w-full border-black min-h-[90px]"
          value={body}
          placeholder="Body"
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="border border-slate-300 rounded px-2 py-2 text-xs text-slate-700 bg-white"
            onClick={() => {
              setShowSubjectTokens(false);
              setShowBodyTokens((prev) => !prev);
            }}
          >
            Insert variable
          </button>
        </div>
        {showBodyTokens && (
          <TemplateTokenMenu
            currentActionPosition={currentActionPosition}
            onInsert={(token) => insertToken(token, "body")}
          />
        )}
      </div>

      <div className="pt-2">
        <PrimaryButton
          onClick={() => {
            if (!validateEmail(email)) {
              setError("Please enter a valid email address.");
              return;
            }
            setMetadata({
              email,
              subject,
              body,
            });
          }}
        >
          Submit
        </PrimaryButton>
      </div>
    </div>
  );
}

function AISelector({
  setMetadata,
  currentActionPosition,
}: {
  setMetadata: (params: any) => void;
  currentActionPosition: number;
}) {
  const [prompt, setPrompt] = useState("");
  const [showTokens, setShowTokens] = useState(false);

  const insertToken = (token: string) => {
    setPrompt((prev) => `${prev}${prev ? " " : ""}${token}`);
  };

  return (
    <div>
      <div className="text-sm pb-1 pt-2">
        * <label>Prompt</label>
      </div>
      <div className="flex gap-2">
        <textarea
          className="border rounded px-4 py-2 w-full border-black min-h-[90px]"
          value={prompt}
          placeholder="e.g. Summarize this commit message: {trigger.pull_request.title}"
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          className="border border-slate-300 rounded px-2 py-2 text-xs text-slate-700 bg-white"
          onClick={() => setShowTokens((prev) => !prev)}
        >
          Add variable
        </button>
      </div>
      {showTokens && (
        <TemplateTokenMenu
          currentActionPosition={currentActionPosition}
          onInsert={insertToken}
        />
      )}
      <div className="pt-4">
        <PrimaryButton
          onClick={() => {
            setMetadata({
              prompt,
            });
          }}
        >
          Submit
        </PrimaryButton>
      </div>
    </div>
  );
}

function SolanaSelector({
  setMetadata,
}: {
  setMetadata: (params: any) => void;
}) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  return (
    <div>
      <Input
        label={"To"}
        type={"text"}
        placeholder="To"
        onChange={(e) => setAddress(e.target.value)}
      ></Input>
      <Input
        label={"Amount"}
        type={"text"}
        placeholder="To"
        onChange={(e) => setAmount(e.target.value)}
      ></Input>
      <div className="pt-4">
        <PrimaryButton
          onClick={() => {
            setMetadata({
              amount,
              address,
            });
          }}
        >
          Submit
        </PrimaryButton>
      </div>
    </div>
  );
}
