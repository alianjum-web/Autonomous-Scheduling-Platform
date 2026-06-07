"use client";

import { useForm, type FieldValues, type UseFormProps } from "react-hook-form";

/** React Hook Form instance synced from Redux via the `values` option. */
export function useReduxForm<T extends FieldValues>(
  values: T,
  options?: Omit<UseFormProps<T>, "values">,
) {
  return useForm<T>({
    values,
    mode: "onChange",
    ...options,
  });
}
