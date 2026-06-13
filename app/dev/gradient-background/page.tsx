import {
  BRAND_BLUE_GRADIENTS,
  GradientBackground,
} from "@/components/ui/gradient-background";

export default function GradientBackgroundDemoPage() {
  return (
    <GradientBackground
      gradients={BRAND_BLUE_GRADIENTS}
      className="flex min-h-screen items-center justify-center"
    >
      <div className="space-y-6 px-4 text-center text-white">
        <h1 className="text-4xl font-extrabold md:text-5xl">
          خلفية متدرجة #2882BF
        </h1>
      </div>
    </GradientBackground>
  );
}
