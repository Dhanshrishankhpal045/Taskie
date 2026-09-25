import {
  BarChart3,
  CheckSquare,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings as SettingsIcon,
  UserRound,
  X,
} from "lucide-react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Meetings",
      path: "/meetings",
      icon: FileText,
    },
    {
      label: "Tasks",
      path: "/tasks",
      icon: CheckSquare,
    },
    {
      label: "History",
      path: "/history",
      icon: Clock3,
    },
  ];

  const secondaryNavItems = [
    {
      label: "Profile",
      path: "/profile",
      icon: UserRound,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={`app-sidebar ${
          mobileMenuOpen
            ? "app-sidebar-mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <BarChart3 size={20} />
          </div>

          <div className="sidebar-brand-text">
            <h1>Taskie</h1>
            <span>
              Meeting Intelligence
            </span>
          </div>

          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <p className="sidebar-section-title">
              Workspace
            </p>

            <nav className="sidebar-nav">
              {navItems.map(
                ({
                  label,
                  path,
                  icon: Icon,
                }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={
                      closeMobileMenu
                    }
                    className={({ isActive }) =>
                      `sidebar-nav-link ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                )
              )}
            </nav>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-section-title">
              Account
            </p>

            <nav className="sidebar-nav">
              {secondaryNavItems.map(
                ({
                  label,
                  path,
                  icon: Icon,
                }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={
                      closeMobileMenu
                    }
                    className={({ isActive }) =>
                      `sidebar-nav-link ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                )
              )}
            </nav>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.email || ""}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="topbar-title">
              <span>
                Welcome back,
              </span>

              <strong>
                {user?.name || "User"}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="topbar-new-meeting"
            onClick={() =>
              navigate("/meetings/new")
            }
          >
            <Plus size={17} />
            <span>New Meeting</span>
          </button>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;