"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ClimbingBoxLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  Award,
  Target,
  Flame,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Calendar,
  Plus,
} from "lucide-react";

interface UserProgress {
  user_id: string;
  learned_signs: number;
  tests_completed: number;
  best_score: number;
  streak: number;
  favorites: number;
  updated_at: string;
  user_name?: string;
}

export default function UserProgressPage() {
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLearnedSigns: 0,
    totalTestsCompleted: 0,
    avgScore: 0,
  });

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth/login");
      }
    });
  }, [router]);
  const fetchProgress = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("user_progress")
      .select(
        `
        *,
        users:user_id (
          name
        )
      `
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching progress:", error);
    } else {
      const mappedData =
        data?.map((progress: any) => ({
          ...progress,
          user_name: progress.users?.name || null,
        })) || [];
      setProgressList(mappedData);
      calculateStats(mappedData);
    }
    setLoading(false);
  };

  const calculateStats = (data: UserProgress[]) => {
    const totalUsers = data.length;
    const totalLearnedSigns = data.reduce((sum, p) => sum + p.learned_signs, 0);
    const totalTestsCompleted = data.reduce(
      (sum, p) => sum + p.tests_completed,
      0
    );
    const avgScore =
      totalUsers > 0
        ? Math.round(
            data.reduce((sum, p) => sum + p.best_score, 0) / totalUsers
          )
        : 0;

    setStats({
      totalUsers,
      totalLearnedSigns,
      totalTestsCompleted,
      avgScore,
    });
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user progress?")) return;

    const { error } = await supabase
      .from("user_progress")
      .delete()
      .eq("user_id", userId);

    if (error) {
      alert("Error deleting progress: " + error.message);
    } else {
      fetchProgress();
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    fetchProgress();
  };

  const totalPages = Math.ceil(progressList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProgress = progressList.slice(startIndex, endIndex);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  User Progress
                </h1>
                <p className="text-sm text-gray-500">
                  {progressList.length}{" "}
                  {progressList.length === 1 ? "user" : "users"} tracked
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase">
                Total Users
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats.totalUsers}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase">
                Signs Learned
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats.totalLearnedSigns}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase">
                Tests Completed
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats.totalTestsCompleted}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase">
                Avg Score
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats.avgScore}%
            </div>
          </div>
        </div>

        {/* Progress Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <ClimbingBoxLoader color="#6366f1" loading={loading} size={15} />
            </div>
          </div>
        ) : currentProgress.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">No user progress found</p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Create first progress entry
              </button>
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
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Learned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Best Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Streak
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Favorites
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProgress.map((progress) => (
                      <tr
                        key={progress.user_id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {progress.user_name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700">
                              {progress.learned_signs}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-gray-700">
                              {progress.tests_completed}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-semibold ${getScoreColor(
                              progress.best_score
                            )}`}
                          >
                            {progress.best_score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">
                              {progress.streak}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-700">
                              {progress.favorites}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(progress.updated_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(progress.user_id)}
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
                  {Math.min(endIndex, progressList.length)} of{" "}
                  {progressList.length}
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

      {isFormOpen && <ProgressForm onClose={handleFormClose} />}
    </div>
  );
}

function ProgressForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    user_id: "",
    learned_signs: 0,
    tests_completed: 0,
    best_score: 0,
    streak: 0,
    favorites: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("user_progress").insert([formData]);

    if (error) {
      alert("Error creating progress: " + error.message);
    } else {
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            New User Progress
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
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.user_id}
              onChange={(e) =>
                setFormData({ ...formData, user_id: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter UUID"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 text-green-500" />
                Learned Signs
              </label>
              <input
                type="number"
                min="0"
                value={formData.learned_signs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    learned_signs: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4 text-purple-500" />
                Tests Completed
              </label>
              <input
                type="number"
                min="0"
                value={formData.tests_completed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tests_completed: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Best Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.best_score}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    best_score: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Streak
              </label>
              <input
                type="number"
                min="0"
                value={formData.streak}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    streak: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Heart className="w-4 h-4 text-red-500" />
              Favorites
            </label>
            <input
              type="number"
              min="0"
              value={formData.favorites}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  favorites: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Creating..." : "Create Progress"}
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
