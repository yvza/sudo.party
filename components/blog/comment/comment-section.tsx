"use client";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_COMMENT_CHARS = 500;

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

type CommentNode = Comment & { children: CommentNode[] };

// ES5-safe: surrogate-pair aware code point counter
function countGraphemes(input: string): number {
  let n = 0;
  for (let i = 0; i < input.length; i++, n++) {
    const c = input.charCodeAt(i);
    // if this is a high surrogate and next is a low surrogate, skip the next code unit
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < input.length) {
      const d = input.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) i++;
    }
  }
  return n;
}

function sliceGraphemes(input: string, max: number): string {
  let out = "";
  let taken = 0;
  for (let i = 0; i < input.length && taken < max; i++, taken++) {
    const c = input.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < input.length) {
      const d = input.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        out += input[i] + input[i + 1];
        i++; // consume surrogate pair
        continue;
      }
    }
    out += input[i];
  }
  return out;
}

export default function CommentSection({
  slug,
  requiredSlug = "public",
  maxDepth = 6, // safety cap to avoid extreme nesting
}: {
  slug: string;
  requiredSlug?: MembershipSlug;
  maxDepth?: number;
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

  // comments (only when eligible)
  const comments = useQuery<{ comments: Comment[] }>({
    queryKey: ["comments", slug],
    queryFn: async () => {
      const r = await fetch(`/api/comments/${encodeURIComponent(slug)}`, { cache: "no-store" });
      return r.json();
    },
    enabled: canComment,
  });

  // mutation for new comment or reply
  const add = useMutation({
    mutationFn: async (payload: { body: string; parentId?: number | null }) => {
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
      qc.invalidateQueries({ queryKey: ["comments", slug] });
    },
  });

  // build a tree from the flat list
  const tree = useMemo<CommentNode[]>(() => {
    const list = comments.data?.comments ?? [];
    const nodes: CommentNode[] = list.map((c) => ({ ...c, children: [] }));
    const byId = new Map<number, CommentNode>(nodes.map((n) => [n.id, n]));
    const roots: CommentNode[] = [];
    for (const n of nodes) {
      if (n.parentId && byId.has(n.parentId)) {
        byId.get(n.parentId)!.children.push(n);
      } else {
        roots.push(n);
      }
    }
    return roots;
  }, [comments.data]);

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
        {/* List (threaded) */}
        <Thread
          nodes={tree}
          depth={0}
          canReply={canComment}
          maxDepth={maxDepth}
          onReply={(parentId, body) => add.mutate({ body, parentId })}
        />

        {/* Top-level composer */}
        <ReplyComposer
          disabled={!canComment || add.isPending}
          placeholder="Write a comment…"
          onSubmit={(body) => add.mutate({ body, parentId: null })}
        />
        {add.isError ? <div className="text-sm text-red-500">{String(add.error?.message)}</div> : null}
      </CardContent>
    </Card>
  );
}

/** Recursive thread renderer */
function Thread({
  nodes,
  depth,
  canReply,
  maxDepth,
  onReply,
}: {
  nodes: CommentNode[];
  depth: number;
  canReply: boolean;
  maxDepth: number;
  onReply: (parentId: number, body: string) => void;
}) {
  if (!nodes.length) return null;

  return (
    <div className={depth === 0 ? "space-y-4" : "space-y-4"}>
      {nodes.map((n) => (
        <CommentItem
          key={n.id}
          node={n}
          depth={depth}
          canReply={canReply}
          maxDepth={maxDepth}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

function CommentItem({
  node,
  depth,
  canReply,
  maxDepth,
  onReply,
}: {
  node: CommentNode;
  depth: number;
  canReply: boolean;
  maxDepth: number;
  onReply: (parentId: number, body: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        className="rounded-2xl border p-4"
        style={{ marginLeft: depth * 16 }} // 16px indent per level
      >
        <div className="text-xs opacity-70">
          {shorten(node.authorAddress)} · {formatTime(node.createdAt)}
        </div>
        <div className="mt-2 whitespace-pre-wrap text-sm">{node.body}</div>

        {/* Reply CTA */}
        {canReply && depth < maxDepth && (
          <div className="mt-3">
            {!open ? (
              <Button className="cursor-pointer" size="sm" variant="secondary" onClick={() => setOpen(true)}>
                Reply
              </Button>
            ) : (
              <ReplyComposer
                autoFocus
                placeholder="Write a reply…"
                onCancel={() => setOpen(false)}
                onSubmit={(body) => {
                  onReply(node.id, body);
                  setOpen(false);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {node.children?.length ? (
        <Thread
          nodes={node.children}
          depth={depth + 1}
          canReply={canReply}
          maxDepth={maxDepth}
          onReply={onReply}
        />
      ) : null}
    </div>
  );
}

/** Small reply composer used for top-level and nested replies */
function ReplyComposer({
  disabled,
  autoFocus,
  placeholder,
  onCancel,
  onSubmit,
}: {
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  onCancel?: () => void;
  onSubmit: (body: string) => void;
}) {
  const [text, setText] = useState("");
  const count = countGraphemes(text);
  const over = count > MAX_COMMENT_CHARS;
  const canPost = !disabled && !over && text.trim().length > 0;

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const body = text.trim();
        if (!body || over) return;
        onSubmit(body);
        setText("");
      }}
    >
      <Textarea
        value={text}
        onChange={(e) => setText(sliceGraphemes(e.target.value, MAX_COMMENT_CHARS))}
        placeholder={placeholder ?? "Write something helpful…"}
        autoFocus={autoFocus}
        disabled={disabled}
      />
      <div className="flex items-center justify-between text-xs">
        <span className={over ? "text-red-500" : "opacity-70"}>
          {count} / {MAX_COMMENT_CHARS}
        </span>
        {over ? <span className="text-red-500">Too long</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <Button className="cursor-pointer" type="submit" disabled={!canPost}>
          Post
        </Button>
        {onCancel ? (
          <Button className="cursor-pointer" type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
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
