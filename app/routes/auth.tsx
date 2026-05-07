import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";

import { Shell } from "~/components/resumer/Shell";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumer — Sign in" },
  { name: "description", content: "Log in to start the journey." },
];

export default function Auth() {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next = location.search.split("next=")[1] || "/";
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next);
  }, [auth.isAuthenticated, next]);

  return (
    <Shell showFooter={false}>
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-bar">
            <span>/ Access</span>
            <span>Standing by</span>
          </div>
          <div className="auth-body">
            <h1>
              Welcome <span className="muted">back.</span>
            </h1>
            <p>
              Sign in to upload résumés, view analyses, and read your detailed
              feedback.
            </p>

            {isLoading ? (
              <button className="btn-primary lg" disabled>
                Signing you in…
                <ArrowRight size={15} strokeWidth={1.75} />
              </button>
            ) : auth.isAuthenticated ? (
              <button className="btn-primary lg" onClick={auth.signOut}>
                Sign out
                <ArrowRight size={15} strokeWidth={1.75} />
              </button>
            ) : (
              <button className="btn-primary lg" onClick={auth.signIn}>
                Sign in with Puter
                <ArrowRight size={15} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </main>
    </Shell>
  );
}
