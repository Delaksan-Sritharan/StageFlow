"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import QRCode from "react-qr-code";

import {
  createInvitation,
  type InviteParticipantFormState,
} from "@/app/session/[id]/actions";
import type { SpeakerRole } from "@/types";

const initialState: InviteParticipantFormState = {
  errors: {},
};

const roles: SpeakerRole[] = ["Speaker", "Evaluator"];

type InviteParticipantFormProps = {
  sessionId: string;
};

function SubmitButton({
  mode,
  label,
}: {
  mode: "email" | "link";
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="inviteMode"
      value={mode}
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export function InviteParticipantForm({
  sessionId,
}: InviteParticipantFormProps) {
  const inviteForSession = createInvitation.bind(null, sessionId);
  const [state, formAction] = useActionState(inviteForSession, initialState);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrCodeContainerRef = useRef<HTMLDivElement | null>(null);
  const inviteLink =
    typeof window !== "undefined" && state.inviteLink?.startsWith("/")
      ? `${window.location.origin}${state.inviteLink}`
      : state.inviteLink;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  const handleCopyInviteLink = async () => {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  };

  const handleDownloadQrCode = async () => {
    const svg = qrCodeContainerRef.current?.querySelector("svg");

    if (!svg || !inviteLink) {
      return;
    }

    setIsDownloading(true);

    try {
      const serializer = new XMLSerializer();
      const svgMarkup = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = window.URL.createObjectURL(svgBlob);
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Failed to load QR image."));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      const size = 336;
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas is not available.");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "stageflow-invite-qr.png";
      link.click();

      window.URL.revokeObjectURL(svgUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="invitedEmail"
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Participant email
        </label>
        <input
          id="invitedEmail"
          name="invitedEmail"
          type="email"
          placeholder="participant@example.com"
          className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
        />
        <p className="text-xs leading-6 text-black/48">
          Use email invites for a named participant, or leave this empty and
          generate a shareable invite link.
        </p>
        {state.errors?.invitedEmail ? (
          <p className="text-sm text-rose-600">{state.errors.invitedEmail}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="role"
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue="Speaker"
          className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 focus:border-black/30"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {state.errors?.role ? (
          <p className="text-sm text-rose-600">{state.errors.role}</p>
        ) : null}
      </div>

      {state.errors?.form ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.errors.form}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}

      {inviteLink ? (
        <div className="rounded-3xl border border-black/8 bg-white/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-black">Invite link</p>
            <div className="flex items-center gap-3">
              {copied ? (
                <p className="text-sm font-semibold text-emerald-700">
                  Copied!
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleDownloadQrCode}
                disabled={isDownloading}
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors duration-200 hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isDownloading ? "Preparing PNG..." : "Download QR Code"}
              </button>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Copy Invite Link
              </button>
            </div>
          </div>
          <div className="mt-5 flex justify-center">
            <div
              ref={qrCodeContainerRef}
              className="flex flex-col items-center gap-3 rounded-3xl border border-black/8 bg-white p-4 text-center shadow-[0_12px_40px_rgba(15,23,42,0.05)]"
            >
              <QRCode value={inviteLink} size={168} />
              <p className="text-xs leading-6 text-black/52">
                Scan to open the invite link
              </p>
            </div>
          </div>
          <p className="mt-2 break-all text-sm leading-7 text-black/68">
            {inviteLink}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <SubmitButton mode="email" label="Save email invite" />
        <SubmitButton mode="link" label="Generate invite link" />
      </div>
    </form>
  );
}
