import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../../components/AdminLayout";

import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiX,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

const API_BASE_URL = "http://localhost:5000";

const EMPTY_FORM = {
  name: "",
  phone: "",
  department_id: "",
  username: "",
  password: "",
};

const ROWS_PER_PAGE = 5;

function StaffManagement() {
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // LOAD STAFF
  // =====================================================

  const loadStaff = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/staff`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load staff."
        );
      }

      setStaff(
        Array.isArray(data.staff)
          ? data.staff
          : Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error("Staff loading error:", err);

      setError(
        "Unable to load staff. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // LOAD DEPARTMENTS
  // =====================================================

  const loadDepartments = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/departments`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load departments."
        );
      }

      setDepartments(
        Array.isArray(data.departments)
          ? data.departments
          : Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Department loading error:",
        err
      );

      setError("Unable to load departments.");
    }
  };

  useEffect(() => {
    loadStaff();
    loadDepartments();
  }, []);

  // =====================================================
  // FORM
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAddForm = () => {
    setEditingStaff(null);
    setFormData(EMPTY_FORM);
    setMessage("");
    setError("");
    setShowForm(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditForm = (member) => {
    setEditingStaff(member);

    setFormData({
      name: member.name || "",
      phone: member.phone || "",
      department_id: member.department_id || "",
      username: member.username || "",
      password: "",
    });

    setMessage("");
    setError("");
    setShowForm(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    setShowForm(false);
    setEditingStaff(null);
    setFormData(EMPTY_FORM);
  };

  // =====================================================
  // REGISTER / UPDATE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const url = editingStaff
        ? `${API_BASE_URL}/api/staff/${editingStaff.staff_id}`
        : `${API_BASE_URL}/api/staff`;

      const method = editingStaff ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            (editingStaff
              ? "Failed to update staff."
              : "Failed to register staff.")
        );

        return;
      }

      setMessage(
        editingStaff
          ? "Staff details updated successfully."
          : "Staff registered successfully."
      );

      closeForm();

      await loadStaff();
    } catch (err) {
      console.error("Save staff error:", err);

      setError(
        "Unable to connect to the server."
      );
    }
  };

  // =====================================================
  // ACTIVATE / DEACTIVATE
  // =====================================================

  const handleStatusChange = async (member) => {
    const newStatus =
      member.status === "Active"
        ? "Inactive"
        : "Active";

    const actionText =
      newStatus === "Active"
        ? "activate"
        : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${member.name}?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/staff/${member.staff_id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to change staff status."
        );

        return;
      }

      setMessage(
        data.message ||
          "Staff status updated successfully."
      );

      await loadStaff();
    } catch (err) {
      console.error(
        "Status change error:",
        err
      );

      setError(
        "Unable to connect to the server."
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (member) => {
    const confirmed = window.confirm(
      `Delete ${member.name} permanently?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/staff/${member.staff_id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to delete staff."
        );

        return;
      }

      setMessage(
        data.message ||
          "Staff member deleted successfully."
      );

      await loadStaff();
    } catch (err) {
      console.error(
        "Delete staff error:",
        err
      );

      setError(
        "Unable to connect to the server."
      );
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredStaff = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) return staff;

    return staff.filter((member) => {
      return (
        member.staff_id
          ?.toLowerCase()
          .includes(text) ||
        member.name
          ?.toLowerCase()
          .includes(text) ||
        member.department_name
          ?.toLowerCase()
          .includes(text) ||
        member.phone
          ?.toLowerCase()
          .includes(text) ||
        member.username
          ?.toLowerCase()
          .includes(text)
      );
    });
  }, [staff, search]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStaff.length / ROWS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex =
    (currentPage - 1) * ROWS_PER_PAGE;

  const paginatedStaff = filteredStaff.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );

  const firstShown =
    filteredStaff.length === 0
      ? 0
      : startIndex + 1;

  const lastShown = Math.min(
    startIndex + ROWS_PER_PAGE,
    filteredStaff.length
  );

  const pageNumbers = [];

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {
    pageNumbers.push(page);
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <AdminLayout>
      <div className="min-w-0">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage registered staff members.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <FiPlus className="h-4 w-4" />
            Add Staff
          </button>

        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {message && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <FiUserCheck className="shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="shrink-0" />
            {error}
          </div>
        )}

        {/* =================================================
            TABLE CARD
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* SEARCH */}

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">

            <div className="relative w-full max-w-md">

              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search staff..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />

            </div>

            <button
              type="button"
              onClick={() => loadStaff(true)}
              disabled={refreshing}
              className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50"
              title="Refresh"
            >
              <FiRefreshCw
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            {loading ? (
              <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                <div className="flex items-center gap-3">
                  <FiRefreshCw className="animate-spin" />
                  Loading staff...
                </div>
              </div>
            ) : paginatedStaff.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <FiSearch className="h-6 w-6" />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  No staff found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try another search.
                </p>

              </div>
            ) : (
              <table className="w-full min-w-[760px]">

                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">

                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700">
                      ID
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700">
                      Name
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700">
                      Department
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {paginatedStaff.map(
                    (member) => (
                      <tr
                        key={
                          member.staff_id
                        }
                        className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/70"
                      >

                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {member.staff_id}
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                              {member.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <span className="text-sm font-semibold text-slate-800">
                              {member.name}
                            </span>

                          </div>

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {member.department_name ||
                            "—"}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`text-sm font-semibold ${
                              member.status ===
                              "Active"
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {member.status}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  member
                                )
                              }
                              title="Edit staff"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                            >
                              <FiEdit2 className="h-[18px] w-[18px]" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  member
                                )
                              }
                              title={
                                member.status ===
                                "Active"
                                  ? "Deactivate staff"
                                  : "Activate staff"
                              }
                              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                                member.status ===
                                "Active"
                                  ? "text-orange-500 hover:bg-orange-50"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                            >
                              {member.status ===
                              "Active" ? (
                                <FiUserX className="h-[18px] w-[18px]" />
                              ) : (
                                <FiUserCheck className="h-[18px] w-[18px]" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  member
                                )
                              }
                              title="Delete staff"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                            >
                              <FiTrash2 className="h-[18px] w-[18px]" />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </div>

          {/* PAGINATION */}

          {!loading &&
            filteredStaff.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {firstShown}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-slate-700">
                    {lastShown}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {filteredStaff.length}
                  </span>{" "}
                  staff
                </p>

                <div className="flex items-center gap-1">

                  <button
                    type="button"
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
                  >
                    <FiChevronLeft />
                  </button>

                  {pageNumbers.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium ${
                          currentPage ===
                          page
                            ? "border border-blue-200 bg-blue-50 text-blue-600"
                            : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
                  >
                    <FiChevronRight />
                  </button>

                </div>

              </div>
            )}

        </div>

      </div>

      {/* =====================================================
          REGISTER / EDIT DIALOG
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 px-4 py-6">

          <div className="w-full max-w-[620px] max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">

            {/* =================================================
                DIALOG HEADER
            ================================================= */}

            <div className="px-8 pb-2 pt-8 sm:px-10">

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-[25px] font-bold tracking-tight text-slate-900">
                    {editingStaff
                      ? "Edit Staff"
                      : "Register New Staff"}
                  </h2>

                  <p className="mt-1.5 text-sm text-slate-500">
                    {editingStaff
                      ? "Update staff account information."
                      : "Enter the staff member's information below."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <FiX className="h-5 w-5" />
                </button>

              </div>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="px-8 pb-8 pt-5 sm:px-10"
            >

              <div className="space-y-5">

                {/* FULL NAME */}

                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter full name"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-[15px] text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                {/* DEPARTMENT */}

                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                    Department
                  </label>

                  <select
                    name="department_id"
                    value={
                      formData.department_id
                    }
                    onChange={handleChange}
                    required
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-[15px] text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={
                            department.department_id
                          }
                          value={
                            department.department_id
                          }
                        >
                          {
                            department.department_name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Enter phone number"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-[15px] text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                {/* USERNAME */}

                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                    Username
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Enter username"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-[15px] text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingStaff}
                    placeholder={
                      editingStaff
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-[15px] text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />

                  {editingStaff && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Leave blank to keep the current
                      password.
                    </p>
                  )}
                </div>

              </div>

              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="mt-8 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeForm}
                  className="h-11 min-w-[110px] rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-11 min-w-[110px] rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  {editingStaff
                    ? "Save"
                    : "Save"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </AdminLayout>
  );
}

export default StaffManagement;
