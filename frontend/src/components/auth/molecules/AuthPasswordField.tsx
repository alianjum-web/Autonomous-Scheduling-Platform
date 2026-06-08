import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AuthPasswordFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  autoComplete?: "current-password" | "new-password";
  placeholder?: string;
  labelExtra?: ReactNode;
  rules?: RegisterOptions<T, FieldPath<T>>;
}

export function AuthPasswordField<T extends FieldValues>({
  control,
  name,
  label,
  autoComplete = "current-password",
  placeholder = "••••••••",
  labelExtra,
  rules = { required: "Password is required" },
}: AuthPasswordFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <FormItem>
          <div className={labelExtra ? "flex items-center justify-between" : undefined}>
            <FormLabel>{label}</FormLabel>
            {labelExtra}
          </div>
          <FormControl>
            <Input type="password" autoComplete={autoComplete} placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
