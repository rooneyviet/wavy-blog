"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/actions/auth";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white subscribe-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 h-auto"
      disabled={pending}
    >
      {pending ? "Logging in..." : "Log In"}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(login, undefined);
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  useEffect(() => {
    if (state?.user && state?.access_token) {
      setSession(state.user, state.access_token);
      router.push("/"); // Redirect to homepage on successful login
    }
  }, [state, setSession, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50"
          role="alert"
        >
          {state.error}
        </div>
      )}
      <div>
        <Label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address
        </Label>
        <div className="relative flex items-center">
          <span className="material-icons absolute left-0 pl-3 text-gray-400 pointer-events-none">
            email
          </span>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-3 h-auto placeholder:text-gray-400"
            required
          />
        </div>
      </div>
      <div>
        <Label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </Label>
        <div className="relative flex items-center">
          <span className="material-icons absolute left-0 pl-3 text-gray-400 pointer-events-none">
            lock
          </span>
          <Input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-3 h-auto placeholder:text-gray-400"
            required
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Checkbox
            id="remember-me"
            name="remember-me"
            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
          />
          <Label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-gray-900"
          >
            Remember me
          </Label>
        </div>
        <div className="text-sm">
          <Link
            href="#"
            className="font-medium text-pink-600 hover:text-pink-500"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
