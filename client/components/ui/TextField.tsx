"use client";
import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as RACTextField,
  type TextFieldProps,
} from "react-aria-components";
import { cx } from "@/client/utils/cx";

export const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 invalid:border-red-500";

export function TextField({
  label,
  description,
  placeholder,
  className,
  ...props
}: TextFieldProps & { label: string; description?: string; placeholder?: string; className?: string }) {
  return (
    <RACTextField {...props} className={cx("flex flex-col gap-1", className)}>
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <Input className={inputClass} placeholder={placeholder} />
      {description && <Text slot="description" className="text-xs text-slate-500">{description}</Text>}
      <FieldError className="text-xs text-red-600" />
    </RACTextField>
  );
}
