"use client";

import { useTransition } from "react";
import { z } from "zod";
import { regsiterSchema } from "../schema/authType";
import { AuthCard } from "./AuthCard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { RegisterApi } from "@/action/authHandler";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

type RegisterFormValues = z.infer<typeof regsiterSchema>;

export const RegsiterForm = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(regsiterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      passwordConfirm: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = (values: RegisterFormValues) => {
    startTransition(() => {
      RegisterApi(values)
        .then((response) => {
          if (response.status === 400) {
            toast.error(response.message);
          }

          if (response.status == "success") {
            toast.success(
              `${response.message}, Redirecting to login....`,
            );
            router.push("/login");
            form.reset();
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
      headerLabel="Create an Account"
      backButtonHref="/login"
      backButtonLabel="Already have an account?"
      className="w-150"
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Sign up</CardTitle>
          <CardDescription>
            Enter your details below to register a new account.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-5"
        >
          <FieldSet>
            <FieldGroup>
              <div className="flex flex-col flex-wrap gap-4">
                {/* Name Field */}
                <div className="flex-1">
                  <Field>
                    <FieldLabel
                      htmlFor="name"
                      className="font-semibold"
                    >
                      Name
                    </FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      disabled={isPending}
                      {...register("name")}
                    />
                    {errors.email && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </Field>
                </div>
                {/* Email Field */}
                <div className="flex-1">
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
                </div>
                <div className="flex flex-row flex-wrap gap-4">
                  {/* Password Field */}
                  <div className="flex-1">
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
                  </div>
                  {/* Password Field */}
                  <div className="flex-1">
                    <Field>
                      <FieldLabel
                        htmlFor="passwordConfirm"
                        className="font-semibold"
                      >
                        Confirm Password
                      </FieldLabel>
                      <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="******"
                        disabled={isPending}
                        enablePasswordToggle
                        {...register("passwordConfirm")}
                      />
                      {errors.passwordConfirm && (
                        <p className="text-sm font-medium text-destructive">
                          {errors.passwordConfirm.message}
                        </p>
                      )}
                    </Field>
                  </div>
                </div>
              </div>
            </FieldGroup>
          </FieldSet>
          <Button
            type="submit"
            isLoading={isPending}
            className="w-full cursor-pointer"
          >
            Create an account
          </Button>
        </form>
      </Card>
    </AuthCard>
  );
};
