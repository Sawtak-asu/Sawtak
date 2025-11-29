import { cn } from '@/lib/utils'

export const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('text-2xl font-bold', className)}>
            Sawtak
        </div>
    )
}

export const LogoIcon = ({ className }: { className?: string }) => {
    return (
        <div className={cn('text-2xl font-bold', className)}>
            S
        </div>
    )
}

export const LogoStroke = ({ className }: { className?: string }) => {
    return null
}