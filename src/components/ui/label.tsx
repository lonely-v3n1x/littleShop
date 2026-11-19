import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Plain <label> (no Radix Label dep, Frozen Core §0.7: no new dependencies).
 * shadcn's peer styling is preserved; 16px base prevents iOS zoom-on-focus in
 * the checkout form, where callers drop it to text-sm only at md+.
 */
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
