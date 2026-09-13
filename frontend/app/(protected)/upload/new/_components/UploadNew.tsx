"use client";

import { searchEmail } from "@/action/fileHandler";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL;

const emailFormSchema = z.object({
  recipient_email: z
    .string()
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  expiration_date: z
    .date()
    .refine(
      (val) => val >= new Date(new Date().setHours(0, 0, 0, 0)),
      "Expiration date must be in the future",
    ),
  fileUpload: z
    .instanceof(File, { message: "Please select a file" })
    .refine(
      (file) =>
        file &&
        [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "application/pdf",
        ].includes(file.type),
      "Only images (jpg, jpeg, png) and PDF files are allowed",
    )
    .refine((file) => file && file.size <= 4 * 1024 * 1024, {
      message: "File size must be less than or equal to 4MB",
    }),
});

export const UploadNew = ({ token }: { token?: string }) => {
  const [emailSuggestions, setEmailSuggestions] = useState<
    { email: string }[]
  >([]);
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const tomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const form = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      recipient_email: "",
      password: "",
      expiration_date: tomorrowDate(),
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
  } = form;

  const recipient_email = useWatch({
    control,
    name: "recipient_email",
  });
  const password = useWatch({ control, name: "password" });
  const expirationDate = useWatch({
    control,
    name: "expiration_date",
  });

  const isFormFilled = Boolean(
    recipient_email && password && expirationDate,
  );

  useEffect(() => {
    const fetchEmailSuggestions = async (query: string) => {
      if (!query || query.length < 2) {
        setEmailSuggestions([]);
        return;
      }
      setIsFetchingEmails(true);
      try {
        const response = await searchEmail(query);
        setEmailSuggestions(response?.emails || []);
      } catch (error) {
        console.error("Failed to fetch email suggestions:", error);
      } finally {
        setIsFetchingEmails(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      if (recipient_email) {
        fetchEmailSuggestions(recipient_email);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [recipient_email]);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue("fileUpload", file, { shouldValidate: true });
    }
  };

  const onSubmit = async (
    values: z.infer<typeof emailFormSchema>,
  ) => {
    setIsPending(true);
    const formData = new FormData();

    formData.append("recipient_email", values.recipient_email);
    formData.append("password", values.password);
    formData.append(
      "expiration_date",
      values.expiration_date.toISOString(),
    );
    formData.append("fileUpload", values.fileUpload);

    try {
      const response = await fetch(
        `http://localhost:3001/api/file/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();
      if (result.status === "success") {
        toast.success(result.message);
        router.push("/upload");
      } else {
        console.log(result.message);
        toast.error(result.message || "Upload failed");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to connect to the backend server.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Upload new File</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-4">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldGroup>
              {/* Recipient Email with Autocomplete Dropdown */}
              <Field className="relative">
                <FieldLabel>Recipient Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  disabled={isPending}
                  {...register("recipient_email")}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  autoComplete="off"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions &&
                  (emailSuggestions.length > 0 ||
                    isFetchingEmails) && (
                    <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-48 overflow-y-auto">
                      {isFetchingEmails ? (
                        <div className="p-2 text-xs text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />{" "}
                          Searching...
                        </div>
                      ) : (
                        emailSuggestions.map((item) => (
                          <div
                            key={item.email}
                            className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            onMouseDown={() => {
                              setValue(
                                "recipient_email",
                                item.email,
                                {
                                  shouldValidate: true,
                                },
                              );
                              setShowSuggestions(false);
                            }}
                          >
                            {item.email}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                {errors.recipient_email && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {errors.recipient_email.message}
                  </p>
                )}
              </Field>

              {/* Password */}
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="******"
                  disabled={isPending}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </Field>

              {/* Expiration Date */}
              <Field>
                <FieldLabel>Expiration Date</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full pl-3 text-left font-normal flex justify-between items-center"
                      >
                        {expirationDate &&
                        isValid(new Date(expirationDate)) ? (
                          format(new Date(expirationDate), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    }
                  />
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Controller
                      control={control}
                      name="expiration_date"
                      render={({ field }) => (
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <
                            new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        />
                      )}
                    />
                  </PopoverContent>
                </Popover>
                {errors.expiration_date && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {errors.expiration_date.message}
                  </p>
                )}
              </Field>

              {/* File Upload */}
              <Field>
                <FieldLabel>File Upload</FieldLabel>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                  disabled={!isFormFilled || isPending}
                />
                {errors.fileUpload && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {errors.fileUpload.message}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Uploading..." : "Upload File"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
