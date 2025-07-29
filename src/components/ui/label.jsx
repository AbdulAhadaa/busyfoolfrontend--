import * as React from "react"
import { cn } from "@/lib/utils"

export const Label = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-gray-700", className)}
      {...props}
    />
  )
})
Label.displayName = "Label"
