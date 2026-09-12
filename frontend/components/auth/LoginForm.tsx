"use client";

import { useTransition } from "react";
import { AuthCard } from "./AuthCard";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginSchema } from "../schema/authType";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FieldLabel,
} from "../ui/field";
import { Button } from "../ui/button";
import { LoginApi } from "@/action/authHandler";
import toast from "react-hot-toast";

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = (values: LoginFormValues) => {
    startTransition(() => {
      LoginApi(values)
        .then((response) => {
          if (response?.error) {
            toast.error(response.error);
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("Something went wrong");
        });
    });
  };

  return (
    <AuthCard
      headerLabel="Welcome Back"
      backButtonHref="/register"
      backButtonLabel="Don't have account?"
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your details below to log into your account.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 p-5"
        >
          <div className="space-y-4">
            <FieldSet>
              <FieldGroup>
                {/* Email Field */}
                <Field>
                  <FieldLabel
                    htmlFor="email"
                    className="font-semibold"
                  >
                    Email
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    disabled={isPending}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </Field>

                {/* Password Field */}
                <Field>
                  <FieldLabel
                    htmlFor="password"
                    className="font-semibold"
                  >
                    Password
                  </FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="******"
                    disabled={isPending}
                    enablePasswordToggle
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>
          <Button
            type="submit"
            isLoading={isPending}
            className="w-full cursor-pointer"
          >
            Login
          </Button>
        </form>
      </Card>
    </AuthCard>
  );
};
