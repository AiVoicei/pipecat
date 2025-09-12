import { cn } from '@/lib/utils';

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
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img 
        src="/logo.webp" 
        alt="AI Voicei"
        className={cn(sizeClasses[size], 'drop-shadow-lg')}
      />
      {showText && (
        <div className="text-right">
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
            textSizeClasses[size]
          )}>
            AI Voicei
          </h1>
          <p className="text-sm text-gray-600">
            השיחה החכמה בעברית
          </p>
        </div>
      )}
    </div>
  );
}