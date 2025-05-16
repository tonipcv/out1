import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'w-20 h-7',    // Mobile navigation size
  md: 'w-24 h-8',    // Desktop navigation size
  lg: 'w-32 h-10'    // Larger size if needed
};

export function Logo({ className, variant = 'dark', size = 'md' }: LogoProps) {
  return (
    <div className={`relative ${SIZES[size]} ${className || ''}`}>
      <Image
        src="/logo.png"
        alt="MED1 Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
} 