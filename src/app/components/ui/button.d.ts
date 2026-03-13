import { VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

// CVA buttonVariants type declaration
type ButtonVariantProps = VariantProps<{
  variant: {
    default: string;
    destructive: string;
    outline: string;
    secondary: string;
    ghost: string;
    link: string;
  };
  size: {
    default: string;
    sm: string;
    lg: string;
    icon: string;
  };
}>;

declare const buttonVariants: (options?: ButtonVariantProps & { className?: string }) => string;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean;
}

declare const Button: React.ForwardRefExoticComponent<ButtonProps>;

export { Button, buttonVariants };
