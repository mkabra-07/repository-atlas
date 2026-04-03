"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton({ owner, name }: { owner: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="button-secondary"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const response = await fetch(`/api/repos/${owner}/${name}/refresh`, {
            method: "POST",
          });
          const payload = await response.json();
          if (response.ok && payload.route) {
            router.push(payload.route);
          }
        });
      }}
      type="button"
    >
      {isPending ? "Refreshing..." : "Refresh analysis"}
    </button>
  );
}

