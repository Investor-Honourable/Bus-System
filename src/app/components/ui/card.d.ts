import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  as?: React.ElementType;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean;
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean;
}

export interface CardActionProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export function Card({ className, ...props }: CardProps): React.ReactElement;
export function CardHeader({ className, ...props }: CardHeaderProps): React.ReactElement;
export function CardTitle({ className, ...props }: CardTitleProps): React.ReactElement;
export function CardDescription({ className, ...props }: CardDescriptionProps): React.ReactElement;
export function CardAction({ className, ...props }: CardActionProps): React.ReactElement;
export function CardContent({ className, ...props }: CardContentProps): React.ReactElement;
export function CardFooter({ className, ...props }: CardFooterProps): React.ReactElement;
