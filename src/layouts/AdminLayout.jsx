import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  LogOut,
  Images,
  ListTree,
  TicketPercent,
  Receipt,
  Activity,
  Sparkles,
  ChevronDown,
  IndianRupee,
  BookOpen,
  FileText,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import PujavedaLogo from "../components/common/PujavedaLogo";

const links = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "Products", to: "/products", icon: Package },
  { label: "Categories", to: "/categories", icon: Tags },
  { label: "Subcategories", to: "/subcategories", icon: ListTree },
  { label: "Banners", to: "/banners", icon: Images },
  { label: "Promotional Sections", to: "/promotional-sections", icon: Sparkles },
  { label: "Orders", to: "/orders", icon: ShoppingBag },
  { label: "Earnings", to: "/earnings", icon: IndianRupee },
  { label: "Customers", to: "/customers", icon: Users },
  { label: "Coupons", to: "/coupons", icon: TicketPercent },
  { label: "Blog", to: "/blog", icon: BookOpen },
  { label: "Tax & Fees", to: "/tax-fees", icon: Receipt },
  { label: "Legal Pages", to: "/legal-pages", icon: FileText },
  { label: "Audit Logs", to: "/audit-logs", icon: Activity },
];

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  return (
    <div className="min-h-screen bg-[#FAF6F0] lg:flex">
      {/* Sidebar Navigation */}
      <aside className="flex w-full flex-col bg-[#2D0A10] text-[#FAF5ED] lg:fixed lg:inset-y-0 lg:w-64 border-r border-[#3E0F16]">
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-[#3E0F16] px-4 bg-[#25080D]">
          <div className="rounded-xl bg-[#FFFDF9] px-2.5 py-1.5 shadow-xs">
            <PujavedaLogo size="sm" />
          </div>
        </div>

        {/* Navigation Menu with comfortable readability and hidden scrollbar */}
        <nav
          className="flex gap-1 overflow-x-auto p-2.5 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:p-3 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="hidden lg:block mb-1.5 px-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#DA9B26]">
              Store Management
            </p>
          </div>

          {links.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-bold tracking-wide transition ${
                  isActive
                    ? "bg-[#5C0F17] text-[#FFFDF9] border-l-4 border-[#DA9B26] shadow-md"
                    : "text-[#D8C7B8] hover:bg-[#3D0A10] hover:text-[#FFFDF9]"
                }`
              }
            >
              <Icon size={18} className="text-[#DA9B26] shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="flex min-h-[76px] items-center justify-between border-b border-[#E8DDCE] bg-white px-5 sm:px-8 relative z-20">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#DA9B26]" />
              <p className="text-[11px] font-black uppercase tracking-wider text-[#756255]">
                PUJAVEDA Admin Console
              </p>
            </div>
            <p className="text-sm font-extrabold text-[#2D1C13]">
              Welcome, {user?.name || "Administrator"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* User Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full p-1 pl-2 pr-3 border border-[#DA9B26]/40 bg-[#FAF5ED] hover:bg-[#F3E9DA] transition text-left"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                id="admin-profile-menu-button"
              >
                <div className="h-8 w-8 rounded-full bg-[#5C0F17] text-[#FAF5ED] flex items-center justify-center font-bold text-xs shadow-sm">
                  {initial}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-xs font-bold text-[#2D1C13] leading-tight truncate max-w-[120px]">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-[#756255] leading-tight">Admin</p>
                </div>
                <ChevronDown size={14} className="text-[#756255]" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-[#E8DDCE] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                  aria-labelledby="admin-profile-menu-button"
                >
                  <div className="px-4 py-3 border-b border-[#E8DDCE]/60">
                    <p className="text-xs font-black text-[#2D1C13] truncate">
                      {user?.name || "Administrator"}
                    </p>
                    <p className="text-xs text-[#756255] truncate font-mono mt-0.5">
                      {user?.email || "admin@pujaveda.com"}
                    </p>
                  </div>

                  <div className="p-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                      role="menuitem"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Child Pages Viewport */}
        <main className="p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
