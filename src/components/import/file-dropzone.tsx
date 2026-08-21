"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropzone({ onFile }: { onFile: (file: File) => void }) {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 px-6 cursor-pointer transition-colors text-center",
        dragActive ? "border-brand bg-brand/5" : "border-border hover:border-primary/30 hover:bg-muted/40"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center size-11 rounded-full transition-colors",
          dragActive ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
        )}
      >
        <UploadCloud className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium">Drop your CSV here</p>
        <p className="text-xs text-muted-foreground mt-1">
          or{" "}
          <span className="text-primary font-medium underline underline-offset-2">browse files</span>
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground">Supports .csv files up to 10MB</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
