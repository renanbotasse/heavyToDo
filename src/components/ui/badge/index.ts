import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  "inline-flex items-center justify-center border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest font-tech w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground",
        outline:
          "bg-parchment text-ink",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
