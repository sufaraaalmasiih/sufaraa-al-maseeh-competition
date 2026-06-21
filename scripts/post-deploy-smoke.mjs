#!/usr/bin/env node
/**
 * اختبار دخان بعد النشر — يضرب مسارات الخادم الحسّاسة على الموقع المنشور ويتأكّد
 * أنّها لا ترجع 500. الغرض الأساسي: التقاط أي تكرار لخطأ تحميل firebase-admin
 * (مثل ERR_REQUIRE_ESM في jose) الذي لا تكشفه `tsc` ولا `vitest`، لأنّه يظهر فقط
 * في وقت تشغيل الدوال على Vercel.
 *
 * الاستخدام:
 *   node scripts/post-deploy-smoke.mjs                 # الموقع الإنتاجي الافتراضي
 *   node scripts/post-deploy-smoke.mjs https://my-preview.vercel.app
 *
 * يخرج برمز 1 إذا فشل أي فحص (مناسب لـ CI / خطوة ما بعد النشر).
 */

const BASE =
  process.argv[2] ||
  process.env.SMOKE_BASE_URL ||
  "https://sufaraa-al-maseeh-competition.vercel.app";

/**
 * كل مسار إدارة يستورد firebase-admin. بلا توكن يجب أن يردّ 401 (وحدة المسار حُمّلت
 * والـSDK تهيّأ ثم رفض الطلب) — وليس 500 (انهيار عند تحميل الوحدة).
 */
const CHECKS = [
  { path: "/api/admin/delete-team", method: "POST", expect: [401], forbid: [500] },
  { path: "/api/admin/update-team-credentials", method: "POST", expect: [401], forbid: [500] },
  { path: "/api/admin/delete-coach", method: "POST", expect: [401], forbid: [500] },
  { path: "/api/admin/delete-staff", method: "POST", expect: [401], forbid: [500] },
  // Cloudinary مضبوط ⇒ 401 (توكن ناقص)، وليس 503 (غير مضبوط).
  { path: "/api/team-logo/upload", method: "POST", expect: [401], forbid: [500, 503] },
];

async function hit({ path, method }) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
  });
  return res.status;
}

const main = async () => {
  console.log(`Smoke test against: ${BASE}\n`);
  let failed = 0;
  for (const check of CHECKS) {
    let status;
    try {
      status = await hit(check);
    } catch (error) {
      console.log(`✗ ${check.path} — request failed: ${error.message}`);
      failed += 1;
      continue;
    }
    const forbidden = check.forbid.includes(status);
    const ok = check.expect.includes(status) && !forbidden;
    console.log(
      `${ok ? "✓" : "✗"} ${check.method} ${check.path} -> ${status}` +
        (forbidden ? "  (FORBIDDEN — server-side crash/misconfig!)" : ""),
    );
    if (!ok) failed += 1;
  }
  console.log("");
  if (failed > 0) {
    console.error(`Smoke test FAILED: ${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log("Smoke test passed ✅");
};

main();
