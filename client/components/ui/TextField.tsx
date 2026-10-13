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
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 invalid:border-red-500";

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
