import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  ListTree,
  RefreshCw,
} from "lucide-react";
import { categoryService } from "../services/categoryService";

const MIN_NAME = 2;
const MAX_NAME = 60;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#5C0F17] focus:ring-2 focus:ring-[#5C0F17]/10";

const normalizeName = (value) =>
  value.trim().replace(/\s+/g, " ");

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SubcategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewTab, setViewTab] = useState("active"); // "active" | "trash"
  const [selectedItems, setSelectedItems] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editing, setEditing] = useState(null);
  const [actionId, setActionId] = useState(null);

  const [form, setForm] = useState({
    categoryId: "",
    name: "",
  });

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await categoryService.getAll({ isDeleted: "all" });
      setCategories(result);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load subcategories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subcategories = useMemo(
    () =>
      categories.flatMap((category) => {
        const catId = category._id || category.id;
        return (category.subcategories || []).map((subcategory) => {
          const subId = subcategory._id || subcategory.id;
          return {
            ...subcategory,
            id: subId,
            _id: subId,
            categoryId: catId,
            categoryName: category.name,
          };
        });
      }),
    [categories],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subcategories.filter((subcategory) => {
      const isTrashMatch = viewTab === "trash" ? subcategory.isDeleted === true : subcategory.isDeleted !== true;

      const matchesSearch =
        subcategory.name.toLowerCase().includes(query) ||
        subcategory.categoryName.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        subcategory.categoryId === categoryFilter;

      return isTrashMatch && matchesSearch && matchesCategory;
    });
  }, [subcategories, search, categoryFilter, viewTab]);

  const openForm = (subcategory = null) => {
    setEditing(subcategory);
    setForm({
      categoryId: subcategory?.categoryId || (categories[0] ? (categories[0]._id || categories[0].id) : ""),
      name: subcategory?.name || "",
    });
    setError("");
    setNotice("");
    setActionId(null);
    setModalOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setError("");
  };

  const validateForm = () => {
    const name = normalizeName(form.name);

    if (!form.categoryId) {
      return "Please select a parent category.";
    }

    if (!categories.some((category) => (category._id || category.id) === form.categoryId)) {
      return "Selected category is invalid. Please select again.";
    }

    if (name.length < MIN_NAME || name.length > MAX_NAME) {
      return `Name must be between ${MIN_NAME} and ${MAX_NAME} characters.`;
    }

    if (!/^[\p{L}\p{N}][\p{L}\p{N}\s&'().-]*$/u.test(name)) {
      return "Use letters, numbers, spaces and basic punctuation only.";
    }

    const targetCategory = categories.find(
      (category) => (category._id || category.id) === form.categoryId,
    );

    const duplicate = (targetCategory?.subcategories || []).some(
      (subcategory) =>
        subcategory.name.trim().toLowerCase() === name.toLowerCase() &&
        !(
          editing &&
          editing.categoryId === form.categoryId &&
          (subcategory._id || subcategory.id) === (editing._id || editing.id)
        ),
    );

    if (duplicate) {
      return "This subcategory already exists in the selected category.";
    }

    return "";
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const name = normalizeName(form.name);
    setSaving(true);

    try {
      if (editing) {
        const subId = editing._id || editing.id;
        if (editing.categoryId !== form.categoryId) {
          // Move the subcategory: delete from old, add to new
          await categoryService.removeSubcategory(
            editing.categoryId,
            subId,
          );

          try {
            await categoryService.createSubcategory(
              form.categoryId,
              { name },
            );
          } catch (moveError) {
            await categoryService.createSubcategory(
              editing.categoryId,
              { name: editing.name },
            );
            throw moveError;
          }
        } else {
          await categoryService.updateSubcategory(
            form.categoryId,
            subId,
            { name },
          );
        }

        setNotice("Subcategory updated successfully.");
      } else {
        await categoryService.createSubcategory(
          form.categoryId,
          { name },
        );
        setNotice("Subcategory created successfully.");
      }

      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message || "Unable to save subcategory.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (subcategory) => {
    const confirmed = window.confirm(
      `Delete "${subcategory.name}" from "${subcategory.categoryName}"?`,
    );

    if (!confirmed) return;

    setActionId(null);
    setError("");
    setNotice("");

    try {
      const subId = subcategory._id || subcategory.id;
      await categoryService.removeSubcategory(
        subcategory.categoryId,
        subId,
      );

      setNotice("Subcategory deleted successfully.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete subcategory.");
    }
  };


  const restore = async (subcategory) => {
    setActionId(null);
    setError("");
    setNotice("");

    try {
      const subId = subcategory._id || subcategory.id;
      await categoryService.restoreSubcategory(
        subcategory.categoryId,
        subId,
      );

      setNotice("Subcategory restored successfully.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to restore subcategory.");
    }
  };

  const handleBulkTrash = async (itemsToTrash) => {
    if (!itemsToTrash || itemsToTrash.length === 0) return;
    if (!window.confirm(`Move ${itemsToTrash.length} subcategory(ies) to trash? (You can restore them anytime from the Trash tab)`)) return;

    try {
      setLoading(true);
      await categoryService.bulkTrashSubcategories(itemsToTrash);
      setNotice(`${itemsToTrash.length} subcategory(ies) moved to trash successfully.`);
      setSelectedItems([]);
      setTimeout(() => setNotice(""), 3500);
      await load();
    } catch (err) {
      setError(err.message || "Failed to move subcategories to trash.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRestore = async (itemsToRestore) => {
    if (!itemsToRestore || itemsToRestore.length === 0) return;
    if (!window.confirm(`Restore ${itemsToRestore.length} subcategory(ies) back to active catalog?`)) return;

    try {
      setLoading(true);
      await categoryService.bulkRestoreSubcategories(itemsToRestore);
      setNotice(`${itemsToRestore.length} subcategory(ies) restored successfully.`);
      setSelectedItems([]);
      setTimeout(() => setNotice(""), 3500);
      await load();
    } catch (err) {
      setError(err.message || "Failed to restore subcategories.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-neutral-900">
      {/* Page heading */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            Subcategories
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage subcategories under their parent categories.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 px-4 py-2 text-right">
          <span className="text-xl font-bold text-[#5C0F17]">
            {subcategories.length}
          </span>
          <span className="ml-2 text-xs text-neutral-500">
            Total Subcategories
          </span>
        </div>
      </section>

      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {notice}
        </p>
      )}

      {error && !modalOpen && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}


      {/* Active vs Trash tabs */}
      <div className="flex rounded-xl bg-[#FAF5ED] p-1 border border-[#EEDBC5] w-fit">
        <button
          type="button"
          onClick={() => { setViewTab("active"); setSelectedItems([]); }}
          className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
            viewTab === "active"
              ? "bg-[#5C0F17] text-white shadow-xs"
              : "text-[#2D1C13]/70 hover:text-[#5C0F17]"
          }`}
        >
          Active Subcategories
        </button>
        <button
          type="button"
          onClick={() => { setViewTab("trash"); setSelectedItems([]); }}
          className={`rounded-lg px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
            viewTab === "trash"
              ? "bg-red-700 text-white shadow-xs"
              : "text-[#2D1C13]/70 hover:text-red-700"
          }`}
        >
          <Trash2 size={13} /> Trash / Deleted Items
        </button>
      </div>

      {/* Search, category filter and add button */}
      <section className="overflow-visible rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subcategory by name..."
              aria-label="Search subcategories"
              maxLength={100}
              className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#5C0F17]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#5C0F17]"
          >
            <option value="all">All categories</option>
            {categories.map((category) => {
              const catId = category._id || category.id;
              return (
                <option key={catId} value={catId}>
                  {category.name}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            disabled={categories.length === 0}
            onClick={() => openForm()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#4A0D15] disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            <Plus size={17} />
            Add Subcategory
          </button>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh subcategories"
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {categories.length === 0 && !loading && (
          <div className="p-5 text-sm text-amber-700">
            Create a category first. You can then add subcategories under it.
          </div>
        )}

        {loading ? (
          <p className="p-12 text-center text-sm text-neutral-500">
            Loading subcategories...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                <tr>
                  <th className="px-5 py-4">S.No.</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Icon</th>
                  <th className="px-5 py-4">Subcategory Name</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Created Date &amp; Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200">
                {filtered.map((subcategory, index) => {
                  const subId = subcategory._id || subcategory.id;
                  return (
                    <tr
                      key={`${subcategory.categoryId}-${subId}`}
                      className="transition hover:bg-rose-50/40"
                    >
                      <td className="px-5 py-4 font-semibold">
                        {index + 1}
                      </td>

                      <td className="relative px-5 py-3">
                        <button
                          type="button"
                          aria-expanded={actionId === subId}
                          onClick={() =>
                            setActionId(
                              actionId === subId ? null : subId,
                            )
                          }
                          className="flex items-center gap-2 rounded-lg bg-[#5C0F17] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4A0D15]"
                        >
                          Action
                          <ChevronDown
                            size={14}
                            className={
                              actionId === subId ? "rotate-180" : ""
                            }
                          />
                        </button>

                        {actionId === subId && (
                          <div className="absolute left-5 top-[calc(100%-4px)] z-20 w-40 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setViewItem(subcategory);
                                setActionId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-rose-50"
                            >
                              <Eye size={15} />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => openForm(subcategory)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-rose-50"
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => remove(subcategory)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-[#5C0F17]">
                          <ListTree size={19} />
                        </span>
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {subcategory.name}
                      </td>

                      <td className="px-5 py-4 font-bold uppercase text-[#5C0F17]">
                        {subcategory.categoryName}
                      </td>

                      <td className="px-5 py-4 text-xs text-neutral-500">
                        {formatDate(subcategory.createdAt)}
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <ListTree
                        size={30}
                        className="mx-auto text-neutral-300"
                      />
                      <p className="mt-3 font-bold">
                        No subcategories found
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        Try a different search or add a subcategory.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-neutral-200 px-5 py-3 text-xs text-neutral-500">
          Showing {filtered.length} of {subcategories.length} subcategories
        </div>
      </section>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeForm();
            }
          }}
        >
          <form
            onSubmit={save}
            noValidate
            className="my-auto w-full max-w-lg space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">
                  {editing ? "Edit Subcategory" : "Add Subcategory"}
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Select the parent category before saving.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeForm}
                aria-label="Close form"
                className="rounded-lg p-2 transition hover:bg-neutral-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div>
              <label
                htmlFor="parent-category"
                className="text-sm font-semibold"
              >
                Parent Category *
              </label>

              <select
                id="parent-category"
                required
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Select category</option>
                {categories.map((category) => {
                  const catId = category._id || category.id;
                  return (
                    <option key={catId} value={catId}>
                      {category.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="subcategory-name"
                  className="text-sm font-semibold"
                >
                  Subcategory Name *
                </label>

                <span className="text-xs text-neutral-400">
                  {form.name.length}/{MAX_NAME}
                </span>
              </div>

              <input
                id="subcategory-name"
                required
                minLength={MIN_NAME}
                maxLength={MAX_NAME}
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
                  setError("");
                }}
                placeholder="Enter subcategory name (e.g. Brass Diyas, Incense Sticks)"
                className={inputClass}
                aria-describedby="subcategory-name-help"
              />

              <p
                id="subcategory-name-help"
                className="mt-1.5 text-xs text-neutral-500"
              >
                {MIN_NAME}–{MAX_NAME} characters. Duplicate names within the
                same category are not allowed.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={closeForm}
                className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold transition hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || categories.length === 0}
                className="rounded-xl bg-[#5C0F17] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#4A0D15] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Create Subcategory"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View modal */}
      {viewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subcategory-details-title"
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id="subcategory-details-title"
                className="text-lg font-black"
              >
                Subcategory Details
              </h2>

              <button
                type="button"
                onClick={() => setViewItem(null)}
                aria-label="Close details"
                className="rounded-lg p-2 transition hover:bg-neutral-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-neutral-500">Subcategory Name</p>
                <p className="mt-1 font-bold">{viewItem.name}</p>
              </div>

              <div>
                <p className="text-neutral-500">Parent Category</p>
                <p className="mt-1 font-bold text-[#5C0F17]">
                  {viewItem.categoryName}
                </p>
              </div>

              <div>
                <p className="text-neutral-500">Subcategory ID</p>
                <p className="mt-1 break-all font-medium">{viewItem._id || viewItem.id}</p>
              </div>

              <div>
                <p className="text-neutral-500">Created Date &amp; Time</p>
                <p className="mt-1 font-medium">
                  {formatDate(viewItem.createdAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewItem(null)}
              className="mt-6 w-full rounded-xl bg-[#5C0F17] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#4A0D15]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}