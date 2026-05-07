import { Link, useLocation, useNavigate } from "react-router";
import { ArrowUpRight, Bell, Search } from "lucide-react";

const navItems: Array<[string, string]> = [
  ["/", "Home"],
  ["/upload", "Analyze"],
  ["/jobs", "Jobs"],
];

export function Brand() {
  return (
    <Link to="/" className="brand">
      <img src="/resumer-black.png" alt="" className="brand-logo" />
      <span>Resumer</span>
      <span className="brand-tag">v3</span>
    </Link>
  );
}

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    if (href === "/upload") return path.startsWith("/upload") || path.startsWith("/resume");
    return path.startsWith(href);
  };

  return (
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
        <button className="icon-btn" type="button" title="Search">
          <Search size={15} strokeWidth={1.75} />
        </button>
        <button className="icon-btn" type="button" title="Notifications">
          <Bell size={15} strokeWidth={1.75} />
        </button>
        <button
          className="cta-pill"
          type="button"
          onClick={() => navigate("/upload")}
        >
          <span className="dot" />
          New analysis
          <ArrowUpRight size={13} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
