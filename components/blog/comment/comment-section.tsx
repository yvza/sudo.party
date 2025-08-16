"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type MembershipSlug = "public" | "sgbcode" | "sudopartypass";
const rankBySlug: Record<MembershipSlug, number> = { public: 1, sgbcode: 2, sudopartypass: 3 };

type Me = {
  authenticated: boolean;
  address: string | null;
  membership: { slug: MembershipSlug; name: string; rank: number } | null;
};

type Comment = {
  id: number;
  slug: string;
  authorAddress: string;
  body: string;
  createdAt: number; // unix seconds
  parentId: number | null;
};

export default function CommentSection({
  slug,
  requiredSlug = "public",
}: {
  slug: string;
  requiredSlug?: MembershipSlug;
}) {
  const qc = useQueryClient();

  // who am i?
  const me = useQuery<Me>({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await fetch("/api/me", { cache: "no-store" });
      return r.json();
    },
  });

  const requiredRank = rankBySlug[requiredSlug] ?? 1;
  const userRank = me.data?.membership?.rank ?? 0;
  const canComment = Boolean(me.data?.authenticated && userRank >= requiredRank);

  // comments (loaded only if eligible)
  const comments = useQuery<{ comments: Comment[] }>({
    queryKey: ["comments", slug],
    queryFn: async () => {
      const r = await fetch(`/api/comments/${encodeURIComponent(slug)}`, { cache: "no-store" });
      return r.json();
    },
    enabled: canComment,
  });

  const [text, setText] = useState("");

  const add = useMutation({
    mutationFn: async (payload: { body: string }) => {
      const r = await fetch(`/api/comments/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e?.error || `HTTP ${r.status}`);
      }
      return r.json();
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", slug] });
    },
  });

  if (me.isLoading) return null;

  // Not logged in
  if (me.isSuccess && !me.data?.authenticated) {
    return (
      <Card className="mt-10">
        <CardHeader><CardTitle>Join the discussion</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm opacity-80">Sign in to view and post comments.</p>
          <div className="mt-4">
            <Button asChild><a href="/auth">Sign in</a></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Logged in but not eligible
  if (me.isSuccess && me.data?.authenticated && !canComment) {
    return (
      <Card className="mt-10">
        <CardHeader><CardTitle>Comments for members</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm opacity-80">Your membership doesn’t include comments for this post.</p>
          <div className="mt-4">
            <Button asChild variant="secondary"><a href="/shop">Upgrade membership</a></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-10">
      <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {/* List */}
        <div className="space-y-4">
          {comments.data?.comments?.length ? (
            comments.data.comments.map((c) => (
              <div key={c.id} className="rounded-2xl border p-4">
                <div className="text-xs opacity-70">
                  {shorten(c.authorAddress)} · {formatTime(c.createdAt)}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm">{c.body}</div>
              </div>
            ))
          ) : (
            <p className="text-sm opacity-70">Be the first to comment.</p>
          )}
        </div>

        {/* Form */}
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            add.mutate({ body: text.trim() });
          }}
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write something helpful…"
          />
          <div className="flex items-center gap-3">
            <Button className="cursor-pointer" type="submit" disabled={add.isPending || !text.trim()}>
              {add.isPending ? "Posting…" : "Post"}
            </Button>
            {add.isError ? (
              <span className="text-sm text-red-500">{String(add.error?.message)}</span>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function shorten(addr?: string | null) {
  if (!addr) return "unknown";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
function formatTime(unixSec: number) {
  const d = new Date(unixSec * 1000);
  return d.toLocaleString();
}
