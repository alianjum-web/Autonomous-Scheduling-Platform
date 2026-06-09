"use client";

import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";

/**
 * React Hook Form synced from external state (Redux, URL, parent props) via `values`.
 * Pass a stable object reference — memoize when building from selectors, e.g.
 * `useMemo(() => ({ email }), [email])`.
 * For screen-local forms, use `useLocalForm` with `defaultValues` instead.
 */
export function useReduxForm<T extends FieldValues>(
  values: T,
  options?: Omit<UseFormProps<T>, "values">,
): UseFormReturn<T> {
  return useForm<T>({
    values,
    mode: "onChange",
    ...options,
  });
}