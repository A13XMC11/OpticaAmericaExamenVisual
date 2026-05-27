"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tags, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Tag {
  id: string;
  nombre: string;
  color: string;
}

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const TAGS_DEFAULT: Tag[] = [
  { id: "new-1", nombre: "Diabético", color: "#EF4444" },
  { id: "new-2", nombre: "Menor de edad", color: "#F59E0B" },
  { id: "new-3", nombre: "Alta graduación", color: "#8B5CF6" },
  { id: "new-4", nombre: "Pendiente de gafas", color: "#3B82F6" },
];

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/tags");
  if (!res.ok) return TAGS_DEFAULT;
  const json = await res.json();
  return json.data ?? [];
}

export function TagSelector({ selectedIds, onChange }: TagSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  }

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color + "40" }}
            className="border text-xs"
          >
            {tag.nombre}
            <button
              type="button"
              onClick={() => toggle(tag.id)}
              className="ml-1 hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium hover:bg-muted">
            <Tags className="h-3 w-3" />
            Agregar etiqueta
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-100"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.nombre}</span>
                  {selectedIds.includes(tag.id) && (
                    <span className="ml-auto text-xs text-green-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
