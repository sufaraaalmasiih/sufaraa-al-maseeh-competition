"use client";

export function AudienceWaitingPlayersScreen() {
  return (
    <section className="competition-stage-screen competition-stage-screen--animated">
      <div className="competition-stage-screen__card glass-card-white audience-waiting-players">
        <span className="competition-stage-screen__badge competition-stage-screen__badge--blue">
          شاشة الجمهور
        </span>
        <h2 className="competition-stage-screen__title">بانتظار بدء المسابقة</h2>
        <p className="competition-stage-screen__subtitle">
          ستُعرض المراحل هنا فور بدء التشغيل من الميسّر.
        </p>
        <div className="competition-stage-screen__wait">
          <span aria-hidden className="competition-stage-screen__wait-pulse" />
          <p className="competition-stage-screen__wait-title">جاهزون للعرض</p>
          <p className="competition-stage-screen__wait-hint">لا حاجة لتسجيل الدخول</p>
        </div>
      </div>
    </section>
  );
}
