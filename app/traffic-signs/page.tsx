"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Papa from "papaparse";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Video,
} from "lucide-react";
import { ClimbingBoxLoader } from "react-spinners";
interface TrafficSign {
  id: string;
  name_english: string;
  name_hindi: string;
  meaning: string;
  hindi_meaning: string;
  explanation: string;
  real_life_example: string;
  color: string;
  shape: string;
  video_url: string | null;
  icon_url: string | null;
  created_at: string;
  sort_order?: number;
}
//
// Color detection function - detects dominant color in image
const getImageDominantColor = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData?.data;

        if (!data) {
          resolve("O"); // Other
          return;
        }

        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        // Sample pixels (every 10th pixel for speed)
        for (let i = 0; i < data.length; i += 40) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Determine color category
        if (r > 200 && g > 200 && b < 100) {
          resolve("Y"); // Yellow
        } else if (g > r && g > b && g > 100) {
          resolve("G"); // Green
        } else if (r > g && r > b && r > 100) {
          resolve("R"); // Red
        } else if (b > r && b > g && b > 100) {
          resolve("B"); // Blue
        } else if (r > 200 && g > 200 && b > 200) {
          resolve("W"); // White
        } else if (r < 100 && g < 100 && b < 100) {
          resolve("K"); // Black
        } else {
          resolve("O"); // Other/Mixed
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
//
export default function TrafficSignsPage() {
  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSign, setEditingSign] = useState<TrafficSign | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
  const [quickMediaSign, setQuickMediaSign] = useState<TrafficSign | null>(
    null
  );
  const [previewImages, setPreviewImages] = useState<
    {
      file: File;
      preview: string;
      colorCode: string;
      newName: string;
    }[]
  >([]);
  const [showPreview, setShowPreview] = useState(false);
  useEffect(() => {
    fetchSigns();
  }, []);

  const fetchSigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("traffic_signs")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching signs:", error);
    } else {
      setSigns(data || []);
    }
    setLoading(false);
  };
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const signsToInsert = results.data.map((row: any) => ({
          id: row.id,
          name_english: row.name_english,
          name_hindi: row.name_hindi,
          meaning: row.meaning,
          hindi_meaning: row.hindi_meaning,
          explanation: row.explanation,
          real_life_example: row.real_life_example,
          color: row.color || "",
          shape: row.shape || "",
          video_url: null,
          icon_url: null,
          sort_order: parseInt(row.sort_order) || 0,
        }));

        const { data, error } = await supabase
          .from("traffic_signs")
          .insert(signsToInsert);

        if (error) {
          alert("Error importing CSV: " + error.message);
        } else {
          alert(`Successfully imported ${signsToInsert.length} signs!`);
          fetchSigns();
        }
      },
      error: (error) => {
        alert("Error parsing CSV: " + error.message);
      },
    });
  };
  //
  const handleBulkImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);

    // Color counters
    const colorCounters: { [key: string]: number } = {
      Y: 1, // Yellow
      G: 1, // Green
      R: 1, // Red
      B: 1, // Blue
      W: 1, // White
      K: 1, // Black
      O: 1, // Other
    };

    const previews: {
      file: File;
      preview: string;
      colorCode: string;
      newName: string;
    }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check if it's an image
        if (!file.type.startsWith("image/")) {
          console.log(`Skipped ${file.name}: Not an image`);
          continue;
        }

        // Detect dominant color
        const colorCode = await getImageDominantColor(file);

        // Generate new name
        const counter = colorCounters[colorCode].toString().padStart(3, "0");
        const fileExt = file.name.split(".").pop();
        const newName = `${colorCode}${counter}.${fileExt}`;

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        previews.push({
          file,
          preview: previewUrl,
          colorCode,
          newName,
        });

        colorCounters[colorCode]++;
        console.log(
          `✅ Processed ${i + 1}/${files.length}: ${file.name} → ${newName}`
        );
      }

      setPreviewImages(previews);
      setShowPreview(true);
      setLoading(false);
    } catch (error: any) {
      alert("Error processing images: " + error.message);
      setLoading(false);
    }

    // Reset input
    e.target.value = "";
  };
  //
  const handleConfirmUpload = async () => {
    setShowPreview(false);
    setLoading(true);

    let successCount = 0;
    const uploadedFiles: {
      original: string;
      renamed: string;
      color: string;
    }[] = [];

    try {
      for (let i = 0; i < previewImages.length; i++) {
        const { file, newName, colorCode } = previewImages[i];

        // Upload to storage with new name
        const filePath = `library/${newName}`;

        const { error } = await supabase.storage
          .from("sign-icons")
          .upload(filePath, file, { upsert: true });

        if (error) {
          console.error(`Error uploading ${file.name}:`, error);
        } else {
          uploadedFiles.push({
            original: file.name,
            renamed: newName,
            color: colorCode,
          });
          successCount++;
          console.log(
            `✅ Uploaded ${i + 1}/${previewImages.length}: ${newName}`
          );
        }
      }

      // Cleanup preview URLs
      previewImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setPreviewImages([]);

      // Show summary
      console.table(uploadedFiles);
      alert(`✅ Successfully uploaded ${successCount} images to library!`);
      setLoading(false);
    } catch (error: any) {
      alert("Error during upload: " + error.message);
      setLoading(false);
    }
  };
  //

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sign?")) return;

    const { error } = await supabase
      .from("traffic_signs")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting sign: " + error.message);
    } else {
      fetchSigns();
    }
  };

  const handleEdit = (sign: TrafficSign) => {
    setEditingSign(sign);
    setIsFormOpen(true);
  };
  //
  const handleQuickMedia = (sign: TrafficSign) => {
    setQuickMediaSign(sign);
  };
  //
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSign(null);
    fetchSigns();
  };

  const filteredSigns = signs.filter(
    (sign) =>
      sign.name_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sign.name_hindi.includes(searchTerm) ||
      sign.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSigns = filteredSigns.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data?.session) {
      // Redirect to login
      window.location.href = "/auth/login";
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Traffic Signs
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredSigns.length}{" "}
                  {filteredSigns.length === 1 ? "sign" : "signs"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="px-6 py-3 border border-gray-300 text-sm font-medium hover:border-gray-900 transition-colors">
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
              <label className="px-6 py-3 border border-gray-300 text-sm font-medium hover:border-gray-900 transition-colors">
                Bulk Upload Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBulkImageUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setIsMediaManagerOpen(true)}
                className="px-8 py-3 border border-gray-300 text-sm font-medium hover:border-gray-900 transition-colors"
              >
                Manage Media
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                New Sign
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-1 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, meaning, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Signs Grid */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <ClimbingBoxLoader color="#6366f1" loading={loading} size={15} />
            </div>
          </div>
        ) : currentSigns.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">No signs found</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {currentSigns.map((sign) => (
                <div
                  key={sign.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 overflow-hidden group"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                    {sign.icon_url ? (
                      <img
                        src={sign.icon_url}
                        alt={sign.name_english}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                        <span className="text-xs text-gray-400">No image</span>
                      </div>
                    )}
                    {sign.video_url && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <Video className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {sign.name_english}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3 truncate">
                      {sign.name_hindi}
                    </p>

                    {/* Actions */}
                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleQuickMedia(sign)}
                        className="w-full flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        Media
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(sign)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(sign.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredSigns.length)} of{" "}
                  {filteredSigns.length}
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

      {isFormOpen && <SignForm sign={editingSign} onClose={handleFormClose} />}
      {isMediaManagerOpen && (
        <MediaManager
          onClose={() => {
            setIsMediaManagerOpen(false);
            fetchSigns();
          }}
        />
      )}
      {quickMediaSign && (
        <QuickMediaUpload
          sign={quickMediaSign}
          onClose={() => {
            setQuickMediaSign(null);
            fetchSigns();
          }}
        />
      )}
      {showPreview && (
        <ImagePreviewModal
          images={previewImages}
          onConfirm={handleConfirmUpload}
          onCancel={() => {
            setShowPreview(false);
            previewImages.forEach((img) => URL.revokeObjectURL(img.preview));
            setPreviewImages([]);
          }}
        />
      )}
    </div>
  );
}

function SignForm({
  sign,
  onClose,
}: {
  sign: TrafficSign | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    id: sign?.id || "",
    name_english: sign?.name_english || "",
    name_hindi: sign?.name_hindi || "",
    meaning: sign?.meaning || "",
    hindi_meaning: sign?.hindi_meaning || "",
    explanation: sign?.explanation || "",
    real_life_example: sign?.real_life_example || "",
    color: sign?.color || "",
    shape: sign?.shape || "",
    video_url: sign?.video_url || "",
    icon_url: sign?.icon_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    sign?.icon_url || null
  );
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<string[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sign-icons")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("sign-icons")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      setFormData({ ...formData, icon_url: publicUrl });
      setImagePreview(publicUrl);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("Error uploading image: " + error.message);
    } finally {
      setUploading(false);
    }
  };
  //
  const fetchLibraryImages = async () => {
    setLoadingLibrary(true);
    try {
      const { data, error } = await supabase.storage
        .from("sign-icons")
        .list("library", {
          limit: 1000,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) throw error;

      if (data) {
        const imageUrls = data
          .filter((file) => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map((file) => {
            const { data: urlData } = supabase.storage
              .from("sign-icons")
              .getPublicUrl(`library/${file.name}`);
            return urlData.publicUrl;
          });

        setLibraryImages(imageUrls);
      }
    } catch (error: any) {
      console.error("Error fetching library images:", error);
      alert("Error loading image library: " + error.message);
    } finally {
      setLoadingLibrary(false);
    }
  };
  //

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (sign) {
      const { error } = await supabase
        .from("traffic_signs")
        .update(formData)
        .eq("id", sign.id);

      if (error) {
        alert("Error updating sign: " + error.message);
      } else {
        onClose();
      }
    } else {
      const { error } = await supabase.from("traffic_signs").insert([formData]);

      if (error) {
        alert("Error creating sign: " + error.message);
      } else {
        onClose();
      }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {sign ? "Edit Sign" : "New Sign"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!sign}
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              placeholder="unique-sign-id"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sign Image <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {uploading ? "Uploading..." : "Upload new"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowImageLibrary(true);
                  fetchLibraryImages();
                }}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Choose from library
                  </span>
                </div>
              </button>

              {imagePreview && (
                <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute top-1 right-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG or GIF (max 5MB)
            </p>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                English Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name_english}
                onChange={(e) =>
                  setFormData({ ...formData, name_english: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Stop Sign"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hindi Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name_hindi}
                onChange={(e) =>
                  setFormData({ ...formData, name_hindi: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="रुकें"
              />
            </div>
          </div>

          {/* Meanings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meaning <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.meaning}
                onChange={(e) =>
                  setFormData({ ...formData, meaning: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="What this sign means..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hindi Meaning <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.hindi_meaning}
                onChange={(e) =>
                  setFormData({ ...formData, hindi_meaning: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="इस चिन्ह का अर्थ..."
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.explanation}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Detailed explanation of the sign..."
            />
          </div>

          {/* Real Life Example */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Real Life Example <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.real_life_example}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  real_life_example: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Example of where you'd see this sign..."
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Video className="w-4 h-4 text-gray-500" />
              Video URL
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) =>
                setFormData({ ...formData, video_url: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : sign ? "Update Sign" : "Create Sign"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        {showImageLibrary && (
          <ImageLibraryModal
            images={libraryImages}
            loading={loadingLibrary}
            onSelect={(imageUrl) => {
              setFormData({ ...formData, icon_url: imageUrl });
              setImagePreview(imageUrl);
              setShowImageLibrary(false);
            }}
            onClose={() => setShowImageLibrary(false)}
          />
        )}
      </div>
    </div>
  );
}
//
function ImageLibraryModal({
  images,
  loading,
  onSelect,
  onClose,
}: {
  images: string[];
  loading: boolean;
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Image Library
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select an image from your uploaded library
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <ClimbingBoxLoader color="#6366f1" loading={loading} size={15} />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No images in library</p>
              <p className="text-sm text-gray-400">
                Upload images using the "📁 Bulk Upload Images" button
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((imageUrl, index) => {
                const fileName = imageUrl.split("/").pop() || "";
                const isSelected = selectedImage === imageUrl;

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(imageUrl)}
                    className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-200 shadow-lg"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-50 flex items-center justify-center p-3">
                      <img
                        src={imageUrl}
                        alt={fileName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* File Name */}
                    <div
                      className={`p-2 ${
                        isSelected ? "bg-blue-50" : "bg-white"
                      }`}
                    >
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {fileName}
                      </p>
                    </div>

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-6 h-6 text-blue-600 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedImage) {
                onSelect(selectedImage);
                onClose();
              }
            }}
            disabled={!selectedImage}
            className="flex-1 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {selectedImage ? "Select Image" : "Choose an image"}
          </button>
        </div>
      </div>
    </div>
  );
}
//
function MediaManager({ onClose }: { onClose: () => void }) {
  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [selectedSignId, setSelectedSignId] = useState<string | null>(null);
  const [libraryImages, setLibraryImages] = useState<string[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  useEffect(() => {
    fetchAllSigns();
  }, []);

  const fetchAllSigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("traffic_signs")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching signs:", error);
    } else {
      setSigns(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (signId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setUploadingId(signId);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${signId}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("sign-icons")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("sign-icons")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("traffic_signs")
        .update({ icon_url: urlData.publicUrl })
        .eq("id", signId);

      if (updateError) throw updateError;

      fetchAllSigns();
    } catch (error: any) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploadingId(null);
    }

    const fetchLibraryImages = async () => {
      setLoadingLibrary(true);
      try {
        const { data, error } = await supabase.storage
          .from("sign-icons")
          .list("library", {
            limit: 1000,
            sortBy: { column: "name", order: "asc" },
          });

        if (error) throw error;

        if (data) {
          const imageUrls = data
            .filter((file) => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
            .map((file) => {
              const { data: urlData } = supabase.storage
                .from("sign-icons")
                .getPublicUrl(`library/${file.name}`);
              return urlData.publicUrl;
            });

          setLibraryImages(imageUrls);
        }
      } catch (error: any) {
        console.error("Error fetching library images:", error);
        alert("Error loading image library: " + error.message);
      } finally {
        setLoadingLibrary(false);
      }
    };
  };

  const handleUpdateSign = async (
    signId: string,
    field: string,
    value: string | number
  ) => {
    setSavingId(signId);

    const { error } = await supabase
      .from("traffic_signs")
      .update({ [field]: value })
      .eq("id", signId);

    if (error) {
      alert("Error updating sign: " + error.message);
    } else {
      fetchAllSigns();
    }

    setSavingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Media & Sorting
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload images and add video URLs for traffic signs
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <ClimbingBoxLoader color="#6366f1" loading={loading} size={15} />
            </div>
          ) : (
            <div className="space-y-4">
              {signs.map((sign) => (
                <div
                  key={sign.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex gap-4">
                    {/* Image Section */}
                    <div className="shrink-0">
                      <div className="w-32 h-32 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                        {sign.icon_url ? (
                          <img
                            src={sign.icon_url}
                            alt={sign.name_english}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        )}
                      </div>
                      <label className="mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        <Upload className="w-3 h-3" />
                        {uploadingId === sign.id ? "Uploading..." : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(sign.id, file);
                          }}
                          disabled={uploadingId === sign.id}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Details Section */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {sign.name_english}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {sign.name_hindi}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {sign.id}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Video URL */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Video URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              defaultValue={sign.video_url || ""}
                              onBlur={(e) => {
                                if (e.target.value !== sign.video_url) {
                                  handleUpdateSign(
                                    sign.id,
                                    "video_url",
                                    e.target.value
                                  );
                                }
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://youtube.com/watch?v=..."
                            />
                            {sign.video_url && (
                              <a
                                href={sign.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                <Video className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Sort Order */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Sort Order
                          </label>
                          <input
                            type="number"
                            defaultValue={sign.sort_order || 0}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              if (value !== sign.sort_order) {
                                handleUpdateSign(sign.id, "sort_order", value);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {savingId === sign.id && (
                        <p className="text-xs text-green-600">Saving...</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
function QuickMediaUpload({
  sign,
  onClose,
}: {
  sign: TrafficSign;
  onClose: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    sign.icon_url || null
  );
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<string[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${sign.id}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("sign-icons")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("sign-icons")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("traffic_signs")
        .update({ icon_url: publicUrl })
        .eq("id", sign.id);

      if (updateError) throw updateError;

      setImagePreview(publicUrl);
      alert("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("Error uploading image: " + error.message);
    } finally {
      setUploading(false);
    }
  };
  const fetchLibraryImages = async () => {
    setLoadingLibrary(true);
    try {
      const { data, error } = await supabase.storage
        .from("sign-icons")
        .list("library", {
          limit: 1000,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) throw error;

      if (data) {
        const imageUrls = data
          .filter((file) => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map((file) => {
            const { data: urlData } = supabase.storage
              .from("sign-icons")
              .getPublicUrl(`library/${file.name}`);
            return urlData.publicUrl;
          });

        setLibraryImages(imageUrls);
      }
    } catch (error: any) {
      console.error("Error fetching library images:", error);
      alert("Error loading image library: " + error.message);
    } finally {
      setLoadingLibrary(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Image
            </h2>
            <p className="text-sm text-gray-500 mt-1">{sign.name_english}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={sign.name_english}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <ImageIcon className="w-16 h-16 text-gray-300" />
              )}
            </div>

            <div className="w-full flex gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload New"}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowImageLibrary(true);
                  fetchLibraryImages();
                }}
                className="flex-1"
              >
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  From Library
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG or GIF (max 5MB)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
        {showImageLibrary && (
          <ImageLibraryModal
            images={libraryImages}
            loading={loadingLibrary}
            onSelect={async (imageUrl) => {
              setShowImageLibrary(false);
              setUploading(true);

              try {
                const { error } = await supabase
                  .from("traffic_signs")
                  .update({ icon_url: imageUrl })
                  .eq("id", sign.id);

                if (error) throw error;

                setImagePreview(imageUrl);
                alert("Image assigned successfully!");
              } catch (error: any) {
                console.error("Error assigning image:", error);
                alert("Error assigning image: " + error.message);
              } finally {
                setUploading(false);
              }
            }}
            onClose={() => setShowImageLibrary(false)}
          />
        )}
      </div>
    </div>
  );
}
function ImagePreviewModal({
  images,
  onConfirm,
  onCancel,
}: {
  images: { file: File; preview: string; colorCode: string; newName: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const colorLabels: { [key: string]: { name: string; bg: string } } = {
    Y: { name: "Yellow", bg: "bg-yellow-100 text-yellow-800" },
    G: { name: "Green", bg: "bg-green-100 text-green-800" },
    R: { name: "Red", bg: "bg-red-100 text-red-800" },
    B: { name: "Blue", bg: "bg-blue-100 text-blue-800" },
    W: { name: "White", bg: "bg-gray-100 text-gray-800" },
    K: { name: "Black", bg: "bg-gray-800 text-white" },
    O: { name: "Other", bg: "bg-purple-100 text-purple-800" },
  };

  const colorCounts = images.reduce((acc, img) => {
    acc[img.colorCode] = (acc[img.colorCode] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Preview Images Before Upload
          </h2>
          <p className="text-sm text-gray-600">
            Review {images.length} images and their auto-generated names
          </p>

          {/* Color Summary */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(colorCounts).map(([code, count]) => (
              <span
                key={code}
                className={`px-3 py-1 rounded-full text-xs font-medium ${colorLabels[code].bg}`}
              >
                {colorLabels[code].name}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-white flex items-center justify-center p-4">
                  <img
                    src={img.preview}
                    alt={img.file.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="p-3 space-y-2">
                  {/* Color Badge */}
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      colorLabels[img.colorCode].bg
                    }`}
                  >
                    {colorLabels[img.colorCode].name}
                  </span>

                  {/* Original Name */}
                  <div>
                    <p className="text-xs text-gray-500">Original:</p>
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {img.file.name}
                    </p>
                  </div>

                  {/* New Name */}
                  <div>
                    <p className="text-xs text-gray-500">New Name:</p>
                    <p className="text-xs font-bold text-green-600 truncate">
                      {img.newName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirm & Upload {images.length} Images
          </button>
        </div>
      </div>
    </div>
  );
}
