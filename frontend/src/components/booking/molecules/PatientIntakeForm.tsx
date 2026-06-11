import type { UseFormReturn } from "react-hook-form";

import { AuthErrorBanner } from "@/components/auth/atoms/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/atoms/AuthSubmitButton";
import { AuthLayout } from "@/components/auth/layout/AuthLayout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PatientIntake } from "@/lib/booking/guestVisit";
import type { PublicClinic } from "@/lib/booking/publicClinicApi";

interface PatientIntakeFormProps {
  clinic: PublicClinic;
  form: UseFormReturn<PatientIntake>;
  submitError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  showChiefComplaint?: boolean;
}

export function PatientIntakeForm({
  clinic,
  form,
  submitError,
  submitting,
  onSubmit,
  title = "Patient intake",
  subtitle = `Tell ${clinic.name} why you're visiting. No account required.`,
  submitLabel = "Continue",
  showChiefComplaint = true,
}: PatientIntakeFormProps) {
  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            rules={{ required: "Full name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            rules={{ required: "Phone number is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            rules={{ required: "Email is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {showChiefComplaint ? (
            <FormField
              control={form.control}
              name="chiefComplaint"
              rules={{ required: "Please describe your reason for visit" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for visit</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Follow-up on knee pain, need a morning appointment this week"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {submitError ? <AuthErrorBanner message={submitError} /> : null}

          <AuthSubmitButton loading={submitting} loadingLabel="Saving…">
            {submitLabel}
          </AuthSubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
