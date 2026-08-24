import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .nf-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          font-family: 'Inter', Arial, sans-serif;
          overflow: hidden;
          position: relative;
        }
        .nf-orb1 {
          position: absolute; top: -120px; right: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%);
          pointer-events: none;
        }
        .nf-orb2 {
          position: absolute; bottom: -100px; left: -60px;
          width: 350px; height: 350px; border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .nf-card {
          position: relative;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 64px 48px;
          max-width: 520px;
          width: 90%;
          text-align: center;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          animation: fadeInUp 0.6s ease both;
        }
        .nf-icon {
          font-size: 72px;
          animation: float 3s ease-in-out infinite;
          display: block;
          margin-bottom: 20px;
        }
        .nf-code {
          font-size: 96px;
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(90deg, #818cf8, #c084fc, #f472b6, #818cf8);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
          margin-bottom: 8px;
        }
        .nf-title {
          font-size: 22px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 12px;
        }
        .nf-desc {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .nf-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .nf-btn-primary {
          padding: 12px 28px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
        }
        .nf-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.6);
        }
        .nf-btn-secondary {
          padding: 12px 28px;
          background: rgba(255,255,255,0.08);
          color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s, transform 0.2s;
        }
        .nf-btn-secondary:hover {
          background: rgba(255,255,255,0.14);
          transform: translateY(-2px);
        }
        .nf-divider {
          width: 48px; height: 3px;
          background: linear-gradient(90deg, #6366f1, #c084fc);
          border-radius: 2px;
          margin: 0 auto 24px;
        }
      `}</style>
      <div className="nf-root">
        <div className="nf-orb1" />
        <div className="nf-orb2" />
        <div className="nf-card">
          <span className="nf-icon">🏥</span>
          <div className="nf-code">404</div>
          <div className="nf-divider" />
          <h1 className="nf-title">Page Not Found</h1>
          <p className="nf-desc">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.<br />
            Please check the URL or navigate back to the dashboard.
          </p>
          <div className="nf-actions">
            <Link href="/hms/dashboard" className="nf-btn-primary">Go to Dashboard</Link>
            <Link href="/hms/billing" className="nf-btn-secondary">Go to Billing</Link>
          </div>
        </div>
      </div>
    </>
  )
}
