import { useForm } from "react-hook-form";
import { UserDataProps } from "./Profile";
import { z } from "zod";
import { nameUpdateSchema } from "../schema/profileTypes";
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
import { updateUserName } from "@/action/profileHandler";
import toast from "react-hot-toast";

export const UserProfile = ({
  userData,
}: {
  userData: UserDataProps;
}) => {
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof nameUpdateSchema>>({
    resolver: zodResolver(nameUpdateSchema),
    defaultValues: {
      email: userData.data.user.email,
      name: userData.data.user.name,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  console.log(userData.data!.user.name);

  const onSubmit = (values: z.infer<typeof nameUpdateSchema>) => {
    startTransition(() => {
      updateUserName({ name: values.name })
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
                    defaultValue={userData.data.user.email}
                    disabled={isPending}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </Field>

                {/* name Field */}
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
                    defaultValue={userData.data.user.name}
                    disabled={isPending}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.name.message}
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
            Update
          </Button>
        </form>
      </Card>
    </div>
  );
};
