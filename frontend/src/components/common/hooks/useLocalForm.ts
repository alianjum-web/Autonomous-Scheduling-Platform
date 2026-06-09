"use client";

import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
} from "react-hook-form";

/**
 * React Hook Form for screen-local state via `defaultValues`.
 * The form owns field values until submit or reset — no external sync.
 * When state lives in Redux, URL, or parent props, use `useReduxForm` instead.
 */
export function useLocalForm<T extends FieldValues>(
  defaultValues: DefaultValues<T>,
  options?: Omit<UseFormProps<T>, "defaultValues">,
) {
  return useForm<T>({
    defaultValues,
    mode: "onChange",
    ...options,
  });
}
