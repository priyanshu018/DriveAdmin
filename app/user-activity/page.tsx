"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Calendar,
  User,
} from "lucide-react";
import { ClimbingBoxLoader } from "react-spinners";
interface UserActivity {
  id: string;
  user_id: string | null;
  type: string;
  details: string | null;
  created_at: string;
}

interface User {
  user_id: string;
  display_name?: string;
}

export default function UserActivityPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<UserActivity | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();
  useEffect(() => {
    fetchActivities();
    fetchActivityTypes();
    fetchUsers();
  }, []);
  //

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth/login");
      }
    });
  }, [router]);
  //
  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_activity")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching activities:", error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const fetchActivityTypes = async () => {
    const { data } = await supabase.from("user_activity").select("type");

    if (data) {
      const types = [...new Set(data.map((item) => item.type))];
      setActivityTypes(types);
    }
  };

  const fetchUsers = async () => {
    const { data: activityData } = await supabase
      .from("user_activity")
      .select("user_id")
      .not("user_id", "is", null);

    if (activityData) {
      const uniqueUserIds = [
        ...new Set(activityData.map((item) => item.user_id)),
      ];

      const { data: userData, error } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", uniqueUserIds);

      if (error) {
        console.error("Error fetching users:", error);
        setUsers(uniqueUserIds.map((id) => ({ user_id: id as string })));
      } else if (userData) {
        setUsers(
          userData.map((user) => ({
            user_id: user.id,
            display_name: user.name || user.email || user.id,
          }))
        );
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    const { error } = await supabase
      .from("user_activity")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting activity: " + error.message);
    } else {
      fetchActivities();
    }
  };

  const handleEdit = (activity: UserActivity) => {
    setEditingActivity(activity);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingActivity(null);
    fetchActivities();
    fetchActivityTypes();
    fetchUsers();
  };

  const filteredActivities = activities.filter((activity) => {
    const typeMatch = filterType === "all" || activity.type === filterType;
    const userMatch = filterUser === "all" || activity.user_id === filterUser;
    return typeMatch && userMatch;
  });

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterUser]);

  const getUserDisplayName = (userId: string | null) => {
    if (!userId) return "—";
    const user = users.find((u) => u.user_id === userId);
    return user?.display_name || userId.substring(0, 8) + "...";
  };

  const getActivityTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      login: "bg-green-100 text-green-700",
      logout: "bg-gray-100 text-gray-700",
      sign_learned: "bg-blue-100 text-blue-700",
      quiz_completed: "bg-purple-100 text-purple-700",
      default: "bg-gray-100 text-gray-600",
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                User Activity
              </h1>
              <p className="text-sm text-gray-500">
                {filteredActivities.length}{" "}
                {filteredActivities.length === 1 ? "activity" : "activities"}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.display_name || user.user_id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(filterType !== "all" || filterUser !== "all") && (
            <button
              onClick={() => {
                setFilterType("all");
                setFilterUser("all");
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Activity Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <ClimbingBoxLoader color="#6366f1" loading={loading} size={15} />
            </div>
          </div>
        ) : currentActivities.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">No activities found</p>
              {(filterType !== "all" || filterUser !== "all") && (
                <button
                  onClick={() => {
                    setFilterType("all");
                    setFilterUser("all");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear filters to see all activities
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentActivities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getActivityTypeColor(
                              activity.type
                            )}`}
                          >
                            {activity.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {getUserDisplayName(activity.user_id)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                          {activity.details || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(activity.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(activity.id)}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredActivities.length)} of{" "}
                  {filteredActivities.length}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className="px-2 py-2 text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isFormOpen && (
        <ActivityForm activity={editingActivity} onClose={handleFormClose} />
      )}
    </div>
  );
}

function ActivityForm({
  activity,
  onClose,
}: {
  activity: UserActivity | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    user_id: activity?.user_id || "",
    type: activity?.type || "",
    details: activity?.details || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      ...formData,
      user_id: formData.user_id || null,
      details: formData.details || null,
    };

    if (activity) {
      const { error } = await supabase
        .from("user_activity")
        .update(dataToSave)
        .eq("id", activity.id);

      if (error) {
        alert("Error updating activity: " + error.message);
      } else {
        onClose();
      }
    } else {
      const { error } = await supabase
        .from("user_activity")
        .insert([dataToSave]);

      if (error) {
        alert("Error creating activity: " + error.message);
      } else {
        onClose();
      }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {activity ? "Edit Activity" : "New Activity"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., login, logout, sign_learned"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={formData.user_id}
              onChange={(e) =>
                setFormData({ ...formData, user_id: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="UUID (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Details
            </label>
            <textarea
              value={formData.details}
              onChange={(e) =>
                setFormData({ ...formData, details: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Additional information (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving
                ? "Saving..."
                : activity
                ? "Update Activity"
                : "Create Activity"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
