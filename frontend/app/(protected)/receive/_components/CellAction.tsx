import { Button } from "@/components/ui/button";
import { ReceiveColumnsType } from "./columns";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";

interface CellActionProps {
  data: ReceiveColumnsType;
  token: string | null;
}

const passwordSchema = z.object({
  password: z.string().min(6, {
    message: "Password should be at least 6 characters long",
  }),
});

export const CellAction = ({ data, token }: CellActionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
  const onClickHandler = () => {
    handleToggle();
  };

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3001/api/file/retrieve",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shared_id: data.file_id,
            password: values.password,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to retrieve file",
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", data.file_name); // You can set a specific filename here
      document.body.appendChild(link);
      link.click();
      link.remove();
      form.reset();
      handleToggle();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong!";
      toast.error(errorMessage);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center">
      <Button size="icon" variant="outline" onClick={onClickHandler}>
        <DownloadIcon className="h-4 w-4" />
      </Button>
      <Dialog modal open={isOpen} onOpenChange={handleToggle}>
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle>File Password</DialogTitle>
          </DialogHeader>
          <Separator />
          {/* <Form {...form}> */}
          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel
                      htmlFor="email"
                      className="font-semibold"
                    >
                      File Password
                    </FieldLabel>
                    <Input
                      enablePasswordToggle
                      disabled={isLoading}
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
              <Button isLoading={isLoading} className="w-full">
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
