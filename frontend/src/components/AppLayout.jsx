import React from "react";
import logo from "../assets/logo.png";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { ChevronDown, Cookie, LogOut, Menu, SquareMenu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getMe } from "../api/auth";
import { appLayoutStyles as css } from "../utils/dummystyle";
import Cookies from "js-cookie";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
  { to: "/services", label: "Services" },
  { to: "/availability", label: "Availability" },
  { to: "/booking", label: "Booking" },
  { to: "/payments", label: "Payments" },
];

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const hastoken = Boolean(Cookies.get("token"));
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handelClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handelClickOutside);
    return () => document.removeEventListener("mousedown", handelClickOutside);
  }, []);
  useEffect(() => {
    if (hastoken) {
      getMe()
        .then(({ data }) => setUser(data?.user))
        .catch(() => {});
    }
  }, [hastoken]);

  const logout = () => {
    Cookies.remove("token");
    navigate("/login");
  };
  const displayName = user?.businessName || user?.name || "My Business";
  const avatarInitial = displayName.slice(0, 1).toUpperCase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={css.container}>
      {/* header */}
      <header className={css.header}>
        <div className={css.headerInner}>
          <Link to="/" className={css.logoLink}>
            <img src={logo} className={css.logoImg} alt="logo" />
          </Link>
          <span className={css.logoText}>BookMe</span>
          {/* navigation */}
          <nav className={css.navDesktop}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? css.navLinkActive : css.navLinkInactive
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* right Section */}
          <div className={css.rightSection}>
            {hastoken ? (
              <div className={css.accountMenu} ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={css.avatarButton}
                >
                  <div className={css.avatarCircle}>{avatarInitial}</div>
                  <span className={css.displayName}>{displayName}</span>
                  <ChevronDown
                    className={
                      dropdownOpen
                        ? `${css.chevron}${css.chevronOpen}`
                        : css.chevron
                    }
                  />
                </button>
                {dropdownOpen && (
                  <div className={css.dropdown}>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className={css.logoutButton}
                    >
                      <LogOut className={css.logoutIcon} />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className={css.loginLink}>
                Log in
              </Link>
            )}
            {/* mobile menu button */}
            <button
              type="button"
              className={css.mobileMenuButton}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className={css.srOnly}>Open main menu</span>
              {mobileMenuOpen ? (
                <X className={css.mobileMenuIcon} aria-hidden="true" />
              ) : (
                <SquareMenu
                  className={css.mobileMenuIcon}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>

        {/* mobile nav menu */}
        {mobileMenuOpen && (
          <div className={css.mobileNav}>
            <div className={css.mobileNavInner}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? css.mobileNavLinkActive
                      : css.mobileNavLinkInactive
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>
      {/* main body */}
      <main className={css.main}>{children}</main>

      {/* footer */}
      <footer className={css.footerBrandSection}>
        <div className={css.footerCard}>
          <div className={css.footerCardTop}>
            <div className={css.footerBrandMark}>
              <img src={logo} alt="logo" className={css.footerMiniLogo} />
              <span className={css.footerBrandName}>BookMe</span>
               </div>
               
               
              <span className={css.footerCopyright}>
                © 2026 BookMe.All rights reserved
              </span>
              <div className={css.footerLinks}>
                <Link to="/privacy" className={css.footerLink}>
                  Privacy Policy
                </Link>
                <span className={css.footerSeparator}>.</span>
                <Link to="/terms" className={css.footerLink}>
                  Terms of services
                </Link>
              </div>
           
          </div>
        </div>
        <div className={css.footerWatermarkWrapper}>
          <div className={css.footerLogoWatermark}>BookMe</div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
