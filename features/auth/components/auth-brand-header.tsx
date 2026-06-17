import { BrandLogoMark } from "@/components/competition/brand-logo-mark";

export function AuthBrandHeader() {
  return (
    <header className="auth-portal-brand">
      <div className="auth-portal-brand__logo-wrap">
        <BrandLogoMark className="auth-portal-brand__logo" size="xl" />
      </div>
      <h1 className="auth-portal-brand__title">سفراء المسيح</h1>
      <p className="auth-portal-brand__slogan">نحيا بالكلمة... ونشهد للحق</p>
    </header>
  );
}
