import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AuthEmailFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  rules?: RegisterOptions<T, FieldPath<T>>;
}

export function AuthEmailField<T extends FieldValues>({
  control,
  name,
  label = "Email",
  placeholder = "you@clinic.com",
  disabled,
  rules = { required: "Email is required" },
}: AuthEmailFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="email"
              autoComplete="email"
              placeholder={placeholder}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
