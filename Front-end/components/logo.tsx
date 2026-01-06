import { cn } from '@/lib/utils'
import icon from '@/public/icon.png';
import Image from 'next/image';
export const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('text-2xl font-bold flex items-center gap-2 ', className)}>
            <Image src={icon} alt="Logo" className='size-8' width={32} height={32} />
            Sawtak
        </div>
    )
}

export const LogoIcon = ({ className }: { className?: string }) => {
    return (
        <div className={cn('text-2xl font-bold', className)}>
            <Image src={icon} alt="Logo" className='size-8' width={32} height={32} />
        </div>
    )
}

export const LogoStroke = ({ className }: { className?: string }) => {
    return null
}