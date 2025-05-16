import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
};

export function Logo({ className, variant = 'dark', size = 'md' }: LogoProps) {
  return (
    <div className={`relative ${SIZES[size]} ${className || ''}`}>
      <Image
        src="/logo.png"
        alt="Logo"
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-contain"
        quality={90}
      />
    </div>
  );
} 