import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowUpRight, Bell, Menu, Search, X } from "lucide-react";

const navItems: Array<[string, string]> = [
  ["/", "Home"],
  ["/upload", "Analyze"],
  ["/jobs", "Jobs"],
];

export function Brand() {
  return (
    <Link to="/" className="brand">
      <img src="/resumer-black.png" alt="" className="brand-logo" />
      <span>Resummary</span>
      <span className="brand-tag">v3</span>
    </Link>
  );
}

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    if (href === "/upload") return path.startsWith("/upload") || path.startsWith("/resume");
    return path.startsWith(href);
  };

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <Brand />
        </div>
        <nav className="nav">
          {navItems.map(([href, label]) => (
            <Link
              key={href}
              to={href}
              className={isActive(href) ? "active" : ""}
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="topbar-right">
          <button className="icon-btn topbar-desktop-only" type="button" title="Search">
            <Search size={15} strokeWidth={1.75} />
          </button>
          <button className="icon-btn topbar-desktop-only" type="button" title="Notifications">
            <Bell size={15} strokeWidth={1.75} />
          </button>
          <button
            className="cta-pill topbar-desktop-only"
            type="button"
            onClick={() => navigate("/upload")}
          >
            <span className="dot" />
            New analysis
            <ArrowUpRight size={13} strokeWidth={1.75} />
          </button>
          <button
            className="icon-btn topbar-mobile-only"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <X size={16} strokeWidth={1.75} />
            ) : (
              <Menu size={16} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer — hidden via CSS at desktop sizes */}
      <div
        className={`mobile-drawer ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
        />
        <div className="mobile-drawer-panel" role="dialog" aria-modal="true">
          <nav className="mobile-nav">
            {navItems.map(([href, label]) => (
              <Link
                key={href}
                to={href}
                className={`mobile-nav-link ${isActive(href) ? "active" : ""}`}
              >
                <span>{label}</span>
                <ArrowUpRight size={16} strokeWidth={1.75} />
              </Link>
            ))}
          </nav>

          <button
            className="cta-pill mobile-cta"
            type="button"
            onClick={() => {
              setMenuOpen(false);
              navigate("/upload");
            }}
          >
            <span className="dot" />
            New analysis
            <ArrowUpRight size={13} strokeWidth={1.75} />
          </button>

          <div className="mobile-drawer-foot">
            <span className="mono">v3 · Soft launch</span>
            <span className="mono">SOC 2 · ISO‑27001</span>
          </div>
        </div>
      </div>
    </>
  );
}
