import type { UseFormReturn } from "react-hook-form";

import { AuthBackButton } from "@/components/auth/atoms/AuthBackButton";
import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import type { CreateClinicFormValues } from "@/components/auth/hooks/useOnboarding";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface OnboardingCreateClinicFormProps {
  form: UseFormReturn<CreateClinicFormValues>;
  submitError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function OnboardingCreateClinicForm({
  form,
  submitError,
  submitting,
  onSubmit,
  onBack,
}: OnboardingCreateClinicFormProps) {
  return (
    <AuthLayout
      title="Create your clinic workspace"
      subtitle="You become clinic owner (admin). Patients book at /book/your-slug — they never join this workspace."
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="clinicName"
            rules={{ required: "Clinic name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clinic name</FormLabel>
                <FormControl>
                  <Input placeholder="Harbor Medical Group" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clinicSlug"
            rules={{ required: "Workspace URL is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Public booking slug</FormLabel>
                <FormControl>
                  <div className="flex items-center rounded-md border border-input bg-background shadow-xs">
                    <span className="px-3 text-sm text-muted-foreground">/book/</span>
                    <Input className="border-0 shadow-none focus-visible:ring-0" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {submitError ? <AuthErrorBanner message={submitError} /> : null}

          <AuthSubmitButton loading={submitting} loadingLabel="Creating workspace…">
            Create clinic workspace
          </AuthSubmitButton>
          <AuthBackButton onClick={onBack} />
        </form>
      </Form>
    </AuthLayout>
  );
}
