import { useForm } from "react-hook-form";
import { z } from "zod";
import { passwordChangeSchema } from "../schema/profileTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "../ui/field";
import { Input } from "../ui/input";
import { useTransition } from "react";
import { Button } from "../ui/button";
import { updateUserPassword } from "@/action/profileHandler";
import toast from "react-hot-toast";

export const PasswordChange = () => {
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      new_password_confirm: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = (values: z.infer<typeof passwordChangeSchema>) => {
    startTransition(() => {
      updateUserPassword(values)
        .then((res) => {
          if (res.status === 400) {
            toast.error(res.message);
          }

          if (res.status == "success") {
            toast.success(`User name update successful!`);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    });
  };

  return (
    <div className="p-4">
      <span className="text-center font-bold">Update User Name</span>
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
                {/* old password*/}
                <Field>
                  <FieldLabel
                    htmlFor="old_password"
                    className="font-semibold"
                  >
                    Old Password
                  </FieldLabel>
                  <Input
                    id="old_password"
                    type="password"
                    placeholder="john.doe@example.com"
                    disabled={isPending}
                    enablePasswordToggle
                    {...register("old_password")}
                  />
                  {errors.old_password && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.old_password.message}
                    </p>
                  )}
                </Field>

                {/* New password */}
                <Field>
                  <FieldLabel
                    htmlFor="new_password"
                    className="font-semibold"
                  >
                    New password
                  </FieldLabel>
                  <Input
                    id="new_password"
                    type="text"
                    placeholder="******"
                    disabled={isPending}
                    enablePasswordToggle
                    {...register("new_password")}
                  />
                  {errors.new_password && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.new_password.message}
                    </p>
                  )}
                </Field>
                {/* Confirm New password */}
                <Field>
                  <FieldLabel
                    htmlFor="confirm_new_password"
                    className="font-semibold"
                  >
                    Confirm New password
                  </FieldLabel>
                  <Input
                    id="confirm_new_password"
                    type="text"
                    placeholder="******"
                    disabled={isPending}
                    enablePasswordToggle
                    {...register("new_password_confirm")}
                  />
                  {errors.new_password_confirm && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.new_password_confirm.message}
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
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
};
