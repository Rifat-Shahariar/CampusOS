import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a student account on CampusOS",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-muted/20">
      <RegisterForm />
    </div>
  );
}
