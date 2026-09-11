import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import { Eye, EyeOff } from "lucide-react";

function Input({
  className,
  type,
  enablePasswordToggle,
  ...props
}: React.ComponentProps<"input"> & {
  enablePasswordToggle?: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const currentType = enablePasswordToggle
    ? showPassword
      ? "text"
      : "password"
    : type;

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };
  return (
    <div className="relative w-full">
      <InputPrimitive
        type={currentType}
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className,
        )}
        {...props}
      />
      {enablePasswordToggle && (
        <button
          type="button"
          onClick={handleTogglePassword}
          className="absolute inset-y-0 right-3 flex items-center text-sm focus:outline-none"
        >
          {showPassword ? <Eye /> : <EyeOff />}
        </button>
      )}
    </div>
  );
}

export { Input };
