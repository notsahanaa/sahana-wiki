"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useManageMode } from "./ManageModeContext";

export function SidebarActionBar() {
  const {
    active,
    selectedCount,
    selection,
    manifest,
    busy,
    error,
    addToCluster,
    removeFromCluster,
    createCluster,
    clear,
    toggle,
  } = useManageMode();

  const [popover, setPopover] = useState<"add" | "remove" | "new" | null>(null);
  useEffect(() => {
    if (!active) setPopover(null);
  }, [active]);
  useEffect(() => {
    if (selectedCount === 0 && popover === "remove") setPopover(null);
  }, [selectedCount, popover]);

  // Clusters that *all* currently-selected pages share — drives the Remove
  // popover. We only know membership client-side via the rendered sidebar
  // tree, so we recompute via DOM is too fragile; instead, we derive from a
  // data attribute on selected page rows. Simpler: we just call the API with
  // any cluster the user picks, and the API silently no-ops on pages that
  // don't have it. That keeps the popover the full manifest list.
  const removableClusters = useMemo(() => manifest, [manifest]);

  if (!active) return null;

  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-ink-muted bg-bg-subtle px-4 py-3 shadow-[0_-4px_12px_-8px_rgba(0,0,0,0.15)]">
      {error && (
        <div className="mb-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-[11px] text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
        <span>
          {selectedCount === 0
            ? "select concepts to manage"
            : `${selectedCount} selected`}
        </span>
        <button
          type="button"
          onClick={toggle}
          className="rounded px-1.5 py-0.5 font-heading uppercase tracking-wider hover:bg-ink-muted/40 hover:text-ink-primary"
        >
          done
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ActionButton
          disabled={selectedCount === 0 || busy}
          active={popover === "add"}
          onClick={() => setPopover((p) => (p === "add" ? null : "add"))}
        >
          add to cluster
        </ActionButton>
        <ActionButton
          disabled={selectedCount === 0 || busy}
          active={popover === "new"}
          onClick={() => setPopover((p) => (p === "new" ? null : "new"))}
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          new cluster
        </ActionButton>
        <ActionButton
          disabled={selectedCount === 0 || busy}
          active={popover === "remove"}
          onClick={() => setPopover((p) => (p === "remove" ? null : "remove"))}
        >
          remove from cluster
        </ActionButton>
        {selectedCount > 0 && (
          <ActionButton onClick={clear} disabled={busy}>
            clear
          </ActionButton>
        )}
      </div>

      {popover === "add" && (
        <ClusterPicker
          clusters={manifest}
          disabled={busy}
          emptyHint="No clusters in the manifest yet."
          onPick={async (slug) => {
            const ok = await addToCluster(slug);
            if (ok) setPopover(null);
          }}
        />
      )}
      {popover === "remove" && (
        <ClusterPicker
          clusters={removableClusters}
          disabled={busy}
          emptyHint="No clusters in the manifest yet."
          onPick={async (slug) => {
            const ok = await removeFromCluster(slug);
            if (ok) setPopover(null);
          }}
        />
      )}
      {popover === "new" && (
        <NewClusterForm
          disabled={busy}
          existing={manifest.map((c) => c.slug)}
          onCancel={() => setPopover(null)}
          onSubmit={async (input) => {
            const r = await createCluster(input);
            if (r.ok) setPopover(null);
          }}
        />
      )}

      <SelectionPreview selection={selection} />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded border px-2 py-1 text-[11px] uppercase leading-none tracking-wider transition",
        active
          ? "border-ink-primary bg-ink-primary text-bg-default"
          : "border-ink-muted text-ink-secondary hover:border-ink-tertiary hover:text-ink-primary",
        disabled && "cursor-not-allowed opacity-40 hover:border-ink-muted hover:text-ink-secondary",
      )}
    >
      {children}
    </button>
  );
}

function ClusterPicker({
  clusters,
  onPick,
  disabled,
  emptyHint,
}: {
  clusters: { slug: string; title: string; description: string }[];
  onPick: (slug: string) => void;
  disabled?: boolean;
  emptyHint: string;
}) {
  if (clusters.length === 0) {
    return (
      <div className="mt-2 rounded border border-dashed border-ink-muted px-2 py-1.5 text-[11px] text-ink-tertiary">
        {emptyHint}
      </div>
    );
  }
  return (
    <ul className="mt-2 flex max-h-48 flex-col gap-px overflow-y-auto rounded border border-ink-muted bg-bg-default">
      {clusters.map((c) => (
        <li key={c.slug}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(c.slug)}
            title={c.description}
            className="block w-full truncate px-2 py-1 text-left text-xs text-ink-secondary transition hover:bg-bg-subtle hover:text-ink-primary disabled:opacity-50"
          >
            <span className="font-heading text-[10px] uppercase tracking-wider text-ink-tertiary">
              {c.slug}
            </span>{" "}
            <span>{c.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NewClusterForm({
  onSubmit,
  onCancel,
  existing,
  disabled,
}: {
  onSubmit: (input: {
    slug: string;
    title: string;
    description: string;
  }) => void;
  onCancel: () => void;
  existing: string[];
  disabled?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched.current) {
      setSlug(suggestSlug(value));
    }
  }

  const slugInvalid =
    slug.length > 0 && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const slugTaken = existing.includes(slug);
  const canSubmit =
    !disabled && slug.length > 0 && !slugInvalid && !slugTaken && title.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ slug, title: title.trim(), description: description.trim() });
      }}
      className="mt-2 flex flex-col gap-1.5 rounded border border-ink-muted bg-bg-default p-2"
    >
      <label className="flex flex-col gap-0.5">
        <span className="font-heading text-[10px] uppercase tracking-wider text-ink-tertiary">
          title
        </span>
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="rounded border border-ink-muted bg-bg-default px-1.5 py-0.5 text-xs text-ink-primary outline-none focus:border-ink-tertiary"
          placeholder="e.g. Tooling"
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="font-heading text-[10px] uppercase tracking-wider text-ink-tertiary">
          slug
        </span>
        <input
          value={slug}
          onChange={(e) => {
            slugTouched.current = true;
            setSlug(e.target.value);
          }}
          className={cn(
            "rounded border bg-bg-default px-1.5 py-0.5 font-mono text-xs text-ink-primary outline-none",
            slugInvalid || slugTaken
              ? "border-red-400 focus:border-red-500"
              : "border-ink-muted focus:border-ink-tertiary",
          )}
          placeholder="e.g. tooling"
        />
        {slugInvalid && (
          <span className="text-[10px] text-red-600">
            slug must be lowercase kebab-case
          </span>
        )}
        {!slugInvalid && slugTaken && (
          <span className="text-[10px] text-red-600">slug already exists</span>
        )}
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="font-heading text-[10px] uppercase tracking-wider text-ink-tertiary">
          description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded border border-ink-muted bg-bg-default px-1.5 py-0.5 text-xs text-ink-primary outline-none focus:border-ink-tertiary"
          placeholder="One sentence on what unifies this cluster."
        />
      </label>
      <div className="mt-1 flex justify-end gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center rounded p-1 text-ink-tertiary hover:bg-ink-muted/40 hover:text-ink-primary"
          aria-label="cancel"
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] uppercase tracking-wider transition",
            canSubmit
              ? "border-ink-primary bg-ink-primary text-bg-default"
              : "cursor-not-allowed border-ink-muted text-ink-tertiary",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
          create
        </button>
      </div>
    </form>
  );
}

function SelectionPreview({ selection }: { selection: Record<string, string[]> }) {
  const keys = Object.keys(selection);
  if (keys.length === 0) return null;
  return (
    <div className="mt-2 max-h-20 overflow-y-auto text-[10px] text-ink-tertiary">
      {keys.map((k) => (
        <div key={k} className="truncate font-mono">
          {k}
        </div>
      ))}
    </div>
  );
}

function suggestSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
