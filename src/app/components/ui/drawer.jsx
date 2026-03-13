"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "./utils.js";

const Drawer = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Root
    ref={ref}
    className={cn("overflow-hidden", className)}
    {...props}
  />
));
Drawer.displayName = "Drawer";

const DrawerTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Trigger
    ref={ref}
    className={cn("", className)}
    {...props}
  />
));
DrawerTrigger.displayName = "DrawerTrigger";

const DrawerPortal = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Portal
    ref={ref}
    className={cn("", className)}
    {...props}
  />
));
DrawerPortal.displayName = "DrawerPortal";

const DrawerClose = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
      className
    )}
    {...props}
  />
));
DrawerClose.displayName = "DrawerClose";

const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

const DrawerContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-full w-3/4 border-r bg-background sm:max-w-sm flex flex-col",
          className
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
);
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
