"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<"label"> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("form-label", required && "form-label-required", className)}
    {...props}
  >
    {children}
  </label>
));
Label.displayName = "Label";

export { Label };
