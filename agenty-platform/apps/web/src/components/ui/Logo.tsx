import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl'
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const { isHebrew } = useLanguage();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/logo.webp"
        alt="AI Voicei"
        width={96}
        height={96}
        className={cn(sizeClasses[size], 'drop-shadow-lg')}
      />
      {showText && (
        <div className="text-right">
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent',
            textSizeClasses[size]
          )}>
            AI Voicei
          </h1>
          <p className="text-sm text-gray-600">
            {isHebrew ? 'השיחה החכמה בעברית' : 'Smart conversation in Hebrew'}
          </p>
        </div>
      )}
    </div>
  );
}