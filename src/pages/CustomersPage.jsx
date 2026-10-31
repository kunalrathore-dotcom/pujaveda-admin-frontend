import { useEffect, useState } from "react";
import { Search, Mail, Phone, Users } from "lucide-react";
import { api } from "../services/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const data = await api.get(`/admin/customers${query}`);
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Customers fetch error:", err);
      setError(err.message || "Failed to load customers from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCustomers();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Registered customer accounts and aggregated purchasing profiles
          </p>
        </div>

        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          Database Records
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="mt-6 flex max-w-sm items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 focus-within:border-[#5C0F17]">
        <Search size={18} className="text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </form>

      <section className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
          </div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Customer</th>
                  <th className="px-5 py-4 font-bold">Contact</th>
                  <th className="px-5 py-4 font-bold">Orders Placed</th>
                  <th className="px-5 py-4 font-bold">Total Spent</th>
                  <th className="px-5 py-4 font-bold">Joined Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {customers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-neutral-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-[#5C0F17]">
                          {cust.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">{cust.name}</p>
                          <p className="text-xs text-neutral-400 font-mono">{cust._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-neutral-600">
                      <p className="flex items-center gap-1.5"><Mail size={13} className="text-neutral-400" /> {cust.email}</p>
                      {cust.phone && cust.phone !== "—" && (
                        <p className="mt-1 flex items-center gap-1.5"><Phone size={13} className="text-neutral-400" /> {cust.phone}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-neutral-800">
                      {cust.orders} order(s)
                    </td>
                    <td className="px-5 py-4 font-bold text-neutral-900">
                      ₹{Number(cust.spent).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-xs text-neutral-500">
                      {new Date(cust.joined).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto text-neutral-300" />
            <h3 className="mt-3 text-base font-bold text-neutral-700">No registered customers yet</h3>
            <p className="mt-1 text-xs text-neutral-400">
              When customers sign up on the storefront, their accounts will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
