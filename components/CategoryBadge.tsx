import type { FrictionTag } from "@/lib/types";

export function CategoryBadge({ tag }: { tag: FrictionTag | null }) {
  if (!tag) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
        Tagging pending
      </span>
    );
  }

  if (!tag.category) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
        AI tagging pending
      </span>
    );
  }

  const uncertain = (tag.category_confidence ?? 1) < 0.7;

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-rose-gold-light text-indigo-deep">
      {tag.category}
      {uncertain && (
        <span title="AI uncertain about this tag" className="opacity-70">
          ?
        </span>
      )}
    </span>
  );
}
