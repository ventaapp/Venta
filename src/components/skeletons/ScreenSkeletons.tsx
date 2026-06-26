import { BottomNavSkeleton, VanteSkeleton } from './VanteSkeleton';

export function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      <div className="w-full max-w-[430px] px-6 flex flex-col items-center gap-6">
        <VanteSkeleton className="h-8 w-32 rounded-full" />
        <VanteSkeleton className="h-64 w-64 rounded-3xl" />
        <VanteSkeleton className="h-4 w-48 rounded-full" />
        <VanteSkeleton className="h-4 w-36 rounded-full" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ withBottomNav = true }: { withBottomNav?: boolean }) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-12 pb-4 bg-black">
        <div className="flex gap-2">
          <VanteSkeleton className="h-9 w-20 rounded-full" />
          <VanteSkeleton className="h-9 w-28 rounded-full" />
        </div>
        <VanteSkeleton className="h-9 w-9 rounded-full" />
      </div>
      <div className="px-5 pb-24 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <VanteSkeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2">
              <VanteSkeleton className="h-4 w-28" />
              <VanteSkeleton className="h-3 w-20" />
            </div>
          </div>
          <VanteSkeleton className="h-7 w-20 rounded-full" />
        </div>
        <VanteSkeleton className="h-4 w-full max-w-[260px]" />
        <VanteSkeleton className="w-full aspect-[4/5] rounded-3xl" />
        <div className="flex justify-center">
          <VanteSkeleton className="h-11 w-36 rounded-full" />
        </div>
      </div>
      {withBottomNav ? <BottomNavSkeleton /> : null}
    </div>
  );
}

export function GarageSkeleton({ withNav = true }: { withNav?: boolean }) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-start justify-between px-5 pt-12 pb-4">
        <VanteSkeleton className="h-7 w-48" />
        <div className="flex gap-2">
          <VanteSkeleton className="h-9 w-9 rounded-full" />
          <VanteSkeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="flex-1 px-5 pb-32 space-y-6">
        <div className="flex items-center gap-3">
          <VanteSkeleton className="h-[52px] w-[52px] rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <VanteSkeleton className="h-4 w-32" />
            <VanteSkeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <VanteSkeleton className="h-4 w-20" />
          <VanteSkeleton className="h-4 w-full max-w-[280px]" />
        </div>
        <VanteSkeleton className="h-24 w-full rounded-2xl" />
        <div className="flex items-center gap-3 py-2">
          <VanteSkeleton className="h-px flex-1" />
          <VanteSkeleton className="h-9 w-28 rounded-full" />
          <VanteSkeleton className="h-px flex-1" />
        </div>
        <div className="flex gap-2">
          <VanteSkeleton className="h-9 w-24 rounded-full" />
          <VanteSkeleton className="h-9 w-20 rounded-full" />
          <VanteSkeleton className="h-9 w-24 rounded-full" />
        </div>
        <VanteSkeleton className="h-72 w-full rounded-2xl" />
      </div>
      {withNav ? <BottomNavSkeleton /> : null}
    </div>
  );
}

export function PublicGarageSkeleton() {
  return <GarageSkeleton withNav />;
}

export function PlusOneSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="flex items-start justify-between gap-4 px-5 pt-12 pb-5">
        <div className="flex-1 space-y-3">
          <VanteSkeleton className="h-7 w-36" />
          <VanteSkeleton className="h-3 w-full max-w-[240px]" />
          <VanteSkeleton className="h-3 w-52" />
        </div>
        <VanteSkeleton className="h-14 w-14 rounded-xl shrink-0" />
      </header>
      <div className="flex-1 px-5 pb-2">
        <VanteSkeleton
          className="w-full rounded-2xl"
          style={{ height: 'calc(100dvh - 280px)', minHeight: '420px' }}
        />
      </div>
      <BottomNavSkeleton />
    </div>
  );
}

export function BadgesSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col pb-[88px]">
      <header className="px-5 pt-12 pb-2">
        <VanteSkeleton className="h-8 w-28" />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <VanteSkeleton className="h-[240px] w-[240px] rounded-full" />
        <VanteSkeleton className="h-6 w-36 mt-6" />
        <VanteSkeleton className="h-4 w-24 mt-2" />
        <VanteSkeleton className="h-12 w-full max-w-[320px] rounded-full mt-5" />
      </div>
      <div className="px-5 pb-6">
        <VanteSkeleton className="h-14 w-full rounded-2xl" />
      </div>
      <BottomNavSkeleton />
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        <VanteSkeleton className="h-7 w-32" />
      </div>
      <div className="flex-1 px-5 pb-32 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <VanteSkeleton key={i} className="h-16 w-full rounded-full" />
        ))}
      </div>
      <BottomNavSkeleton />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="px-5 pt-12 pb-6">
        <VanteSkeleton className="h-7 w-24 mb-6" />
        <VanteSkeleton className="h-4 w-48" />
      </div>
      <div className="flex-1 px-5 pb-32 space-y-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3.5">
            <VanteSkeleton className="h-7 w-7 rounded-full shrink-0" />
            <VanteSkeleton className="h-4 flex-1 max-w-[180px]" />
            <VanteSkeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>
      <BottomNavSkeleton />
    </div>
  );
}

export function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-6 pt-16 pb-10">
      <VanteSkeleton className="h-64 w-full max-w-[340px] rounded-3xl mb-10" />
      <VanteSkeleton className="h-12 w-full max-w-[340px] rounded-xl mb-3" />
      <VanteSkeleton className="h-12 w-full max-w-[340px] rounded-xl mb-3" />
      <VanteSkeleton className="h-12 w-full max-w-[340px] rounded-full" />
    </div>
  );
}

export function OnboardingFormSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="min-h-screen bg-black flex flex-col px-6 pt-16">
      <VanteSkeleton className="h-8 w-56 mb-4" />
      <VanteSkeleton className="h-4 w-full max-w-[300px] mb-10" />
      <div className="flex-1 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <VanteSkeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
      <div className="pb-10 flex justify-end">
        <VanteSkeleton className="h-14 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function UploadSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col px-6 pt-16">
      <VanteSkeleton className="h-8 w-64 mb-4" />
      <VanteSkeleton className="h-4 w-full max-w-[320px] mb-8" />
      <div className="grid grid-cols-2 gap-3 flex-1 pb-24">
        {Array.from({ length: 4 }).map((_, i) => (
          <VanteSkeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function VehicleSpecsSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col px-6 pt-20">
      <VanteSkeleton className="h-9 w-full max-w-[300px] mb-3" />
      <VanteSkeleton className="h-4 w-full max-w-[340px] mb-8" />
      <div className="flex gap-3 mb-8">
        <VanteSkeleton className="h-10 w-24 rounded-full" />
        <VanteSkeleton className="h-10 w-28 rounded-full" />
        <VanteSkeleton className="h-10 w-32 rounded-full" />
      </div>
      <VanteSkeleton className="h-[180px] w-full rounded-2xl mb-auto" />
      <div className="flex justify-between items-end pb-8">
        <VanteSkeleton className="h-9 w-32 rounded-full" />
        <VanteSkeleton className="h-14 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ShareGarageSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="pt-24 px-6 text-center shrink-0 space-y-4">
        <VanteSkeleton className="h-7 w-48 mx-auto" />
        <VanteSkeleton className="h-4 w-64 mx-auto" />
      </div>
      <div className="px-6 mt-10 flex-1 pb-24">
        <VanteSkeleton className="w-full aspect-[4/5] rounded-2xl" />
        <VanteSkeleton className="h-12 w-full rounded-full mt-6" />
      </div>
      <BottomNavSkeleton />
    </div>
  );
}
