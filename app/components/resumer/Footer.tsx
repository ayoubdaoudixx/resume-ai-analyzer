export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img src="/resumer-white.png" alt="Resummary" className="footer-logo" />
        <h2 className="footer-mark">
          Make it{" "}
          <span className="muted footer-mark-tail">
            <img
              src="/resumer-grey.png"
              alt=""
              aria-hidden="true"
              className="footer-mark-r"
            />ead.
          </span>
        </h2>
        <div className="footer-grid">
          <div>
            <h5>Resummary</h5>
            <p
              style={{
                fontSize: 14,
                color: "var(--ink-5)",
                margin: 0,
                maxWidth: "32ch",
                lineHeight: 1.55,
              }}
            >
              Resume intelligence for engineers, designers, and operators who
              want every word to land.
            </p>
          </div>
          <div>
            <h5>Product</h5>
            <ul>
              <li><a href="#">Analyze</a></li>
              <li><a href="#">Job match</a></li>
              <li><a href="#">Templates</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Methodology</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>
          <div>
            <h5>Connect</h5>
            <ul>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">LinkedIn</a></li>
              <li><a href="#">Newsletter</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Resummary</span>
          <span>SOC 2 · ISO‑27001</span>
        </div>
      </div>
    </footer>
  );
}
