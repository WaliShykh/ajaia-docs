"use client";
import { ChevronDown } from "lucide-react";
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as RACSelect,
  SelectValue,
  type Key,
} from "react-aria-components";
import { cx } from "@/client/utils/cx";

type Option<K extends string> = { id: K; label: string; description?: string };

export function Select<K extends string>({
  label,
  hideLabel,
  options,
  value,
  onChange,
  isDisabled,
  className,
}: {
  label: string;
  hideLabel?: boolean;
  options: readonly Option<K>[];
  value: K;
  onChange: (value: K) => void;
  isDisabled?: boolean;
  className?: string;
}) {
  return (
    <RACSelect
      selectedKey={value}
      onSelectionChange={(k: Key | null) => k != null && onChange(k as K)}
      isDisabled={isDisabled}
      aria-label={hideLabel ? label : undefined}
      className={cx("flex flex-col gap-1", className)}
    >
      {!hideLabel && <Label className="text-sm font-medium text-slate-700">{label}</Label>}
      <Button className="flex h-9 items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
        <SelectValue>{({ selectedText }) => selectedText}</SelectValue>
        <ChevronDown aria-hidden className="size-4 text-slate-500" />
      </Button>
      <Popover className="min-w-(--trigger-width) rounded-md border border-slate-200 bg-white p-1 shadow-lg outline-none">
        <ListBox className="outline-none">
          {options.map((o) => (
            <ListBoxItem
              key={o.id}
              id={o.id}
              textValue={o.label}
              className="cursor-default rounded px-2 py-1.5 text-sm outline-none focus:bg-blue-50 selected:font-medium"
            >
              <div>{o.label}</div>
              {o.description && <div className="text-xs text-slate-500">{o.description}</div>}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </RACSelect>
  );
}
