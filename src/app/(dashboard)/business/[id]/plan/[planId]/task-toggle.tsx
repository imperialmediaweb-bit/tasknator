"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

export function TaskToggle({ taskId, initialCompleted }: { taskId: string; initialCompleted: boolean }) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newVal = !completed;
    setCompleted(newVal); // optimistic
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newVal }),
      });
      if (!res.ok) setCompleted(!newVal); // revert on error
    } catch {
      setCompleted(!newVal);
    }
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading} className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110 active:scale-95">
      {completed ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      ) : (
        <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400 transition-colors" />
      )}
    </button>
  );
}
