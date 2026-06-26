import { cn } from '@/lib/utils';

type VanteSkeletonProps = React.ComponentProps<'div'>;

export function VanteSkeleton({ className, ...props }: VanteSkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[#1a1a1a]', className)}
      {...props}
    />
  );
}

export function BottomNavSkeleton() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner flex items-center justify-between px-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-center min-h-[50px] gap-1.5 py-2">
            <VanteSkeleton className="h-[18px] w-[18px] rounded-md bg-[#2c2c2e]" />
            <VanteSkeleton className="h-2 w-9 rounded-full bg-[#2c2c2e]" />
          </div>
        ))}
      </div>
    </nav>
  );
}
