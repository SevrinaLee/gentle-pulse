"use client";

const MOODS = ["😩", "😐", "🤯", "😮", "😊"];

export function MoodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (mood: string) => void;
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Mood">
      {MOODS.map((mood) => (
        <button
          key={mood}
          type="button"
          role="radio"
          aria-checked={value === mood}
          onClick={() => onChange(mood)}
          className={`text-2xl w-11 h-11 rounded-full flex items-center justify-center transition ${
            value === mood
              ? "bg-rose-gold/30 ring-2 ring-rose-gold"
              : "bg-surface hover:bg-subtle ring-1 ring-indigo-deep/10"
          }`}
        >
          {mood}
        </button>
      ))}
    </div>
  );
}
