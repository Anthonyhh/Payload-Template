import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-xl glow transition-all duration-300',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105',
        outline:
          'border border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-all duration-300',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:scale-105',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient:
          'bg-gradient-to-r from-orange to-orange-light text-white hover:from-orange/90 hover:to-orange-light/90 hover:scale-105 hover:shadow-xl glow-orange animate-gradient relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:transition-transform before:duration-700 hover:before:translate-x-full',
        glass:
          'glass backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 hover:scale-105 hover:shadow-xl',
        neon: 'bg-black border-2 border-primary text-primary hover:bg-primary hover:text-black hover:scale-105 hover:shadow-xl glow text-glow transition-all duration-300',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-9 px-4 py-2 text-xs',
        lg: 'h-14 px-8 py-4 text-base',
        xl: 'h-16 px-12 py-5 text-lg',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
