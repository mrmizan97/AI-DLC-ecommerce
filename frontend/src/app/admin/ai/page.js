"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, Send, Star, ChevronLeft, ChevronRight, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const TABS = [
  { id: "sentiment", label: "Sentiment Analysis" },
  { id: "recommendations", label: "Product Recommendations" },
  { id: "bulk", label: "Bulk Sentiment" },
];

function SentimentBadge({ sentiment }) {
  const map = {
    positive: "bg-green-100 text-green-700 border-green-200",
    negative: "bg-red-100 text-red-700 border-red-200",
    neutral: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  const s = (sentiment || "").toLowerCase();
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border capitalize ${map[s] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {s || "Unknown"}
    </span>
  );
}

function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence || 0) * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Confidence</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminAIPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sentiment");

  // --- Tab 1: Sentiment Analysis ---
  const [reviewText, setReviewText] = useState("");
  const [sentimentResult, setSentimentResult] = useState(null);
  const [analyzingText, setAnalyzingText] = useState(false);

  // --- Tab 2: Product Recommendations ---
  const [userId, setUserId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);

  // --- Tab 3: Bulk Sentiment ---
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const reviewsFetched = useRef(false);

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/");
  }, [user, router]);

  useEffect(() => {
    if (activeTab === "bulk" && !reviewsFetched.current) {
      reviewsFetched.current = true;
      fetchReviews(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "bulk") fetchReviews(reviewPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPage]);

  // ---- Tab 1: Single Sentiment ----
  async function handleAnalyzeSentiment(e) {
    e.preventDefault();
    if (!reviewText.trim()) { toast.error("Please enter review text"); return; }
    setAnalyzingText(true);
    setSentimentResult(null);
    try {
      const r = await api.post("/ai/sentiment", { review_text: reviewText.trim() });
      setSentimentResult(r.data.data || r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Sentiment analysis failed");
    } finally {
      setAnalyzingText(false);
    }
  }

  // ---- Tab 2: Recommendations ----
  async function handleGetRecommendations(e) {
    e.preventDefault();
    setLoadingRec(true);
    setRecommendations([]);
    try {
      const params = userId.trim() ? `?user_id=${encodeURIComponent(userId.trim())}` : "";
      const r = await api.get(`/ai/recommendations${params}`);
      setRecommendations(r.data.data || r.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get recommendations");
    } finally {
      setLoadingRec(false);
    }
  }

  // ---- Tab 3: Bulk Sentiment ----
  async function fetchReviews(pg) {
    setReviewsLoading(true);
    try {
      const r = await api.get(`/reviews?page=${pg}&limit=10`);
      setReviews(r.data.data || []);
      setReviewPagination(r.data.pagination || { total: 0, page: pg, totalPages: 1 });
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  }

  function toggleReview(id) {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    const allIds = reviews.map((r) => r.id);
    const allSelected = allIds.every((id) => selectedReviews.includes(id));
    if (allSelected) {
      setSelectedReviews((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedReviews((prev) => [...new Set([...prev, ...allIds])]);
    }
  }

  async function handleBulkAnalyze() {
    if (selectedReviews.length === 0) { toast.error("Select at least one review"); return; }
    setBulkLoading(true);
    setBulkResults([]);
    try {
      const r = await api.post("/ai/sentiment/bulk", { review_ids: selectedReviews });
      setBulkResults(r.data.data || r.data || []);
      toast.success(`Analyzed ${selectedReviews.length} reviews`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk analysis failed");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Brain size={24} className="text-orange-500" /> AI Tools
      </h1>

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================== TAB 1: Sentiment Analysis ================== */}
      {activeTab === "sentiment" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg border shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Analyze Review Sentiment</h2>
            <form onSubmit={handleAnalyzeSentiment} className="space-y-3">
              <textarea
                rows={5}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Paste a customer review text here to analyze its sentiment…"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
              <button
                type="submit"
                disabled={analyzingText}
                className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium text-sm"
              >
                <Send size={16} />
                {analyzingText ? "Analyzing…" : "Analyze Sentiment"}
              </button>
            </form>
          </div>

          {sentimentResult && (
            <div className="bg-white rounded-lg border shadow p-5 space-y-4">
              <h3 className="font-semibold text-gray-700">Analysis Result</h3>

              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sentiment</p>
                  <SentimentBadge sentiment={sentimentResult.sentiment} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <ConfidenceBar confidence={sentimentResult.confidence} />
                </div>
              </div>

              {sentimentResult.summary && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Summary</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{sentimentResult.summary}</p>
                </div>
              )}

              {sentimentResult.themes?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Themes Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {sentimentResult.themes.map((theme, i) => (
                      <span key={i} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sentimentResult.keywords?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sentimentResult.keywords.map((kw, i) => (
                      <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================== TAB 2: Recommendations ================== */}
      {activeTab === "recommendations" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg border shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Get Product Recommendations</h2>
            <form onSubmit={handleGetRecommendations} className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID (optional — uses logged-in user)"
                className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={loadingRec}
                className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium text-sm"
              >
                <Brain size={16} />
                {loadingRec ? "Loading…" : "Get Recommendations"}
              </button>
            </form>
          </div>

          {loadingRec && (
            <div className="text-center py-12 text-gray-400">
              <Brain size={36} className="mx-auto mb-3 animate-pulse" />
              <p>Generating recommendations…</p>
            </div>
          )}

          {!loadingRec && recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Recommended Products ({recommendations.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {recommendations.map((product, i) => (
                  <div key={product.id || i} className="bg-white rounded-lg border shadow overflow-hidden hover:shadow-md transition-shadow">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover" />
                    )}
                    {!product.image_url && (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-2xl font-bold">
                        {(product.name || "P").charAt(0)}
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-medium text-sm text-gray-800 line-clamp-2">{product.name}</p>
                      <p className="text-orange-600 font-bold mt-1">${parseFloat(product.price || 0).toFixed(2)}</p>
                      {product.score != null && (
                        <p className="text-xs text-gray-400 mt-0.5">Score: {product.score.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingRec && recommendations.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Star size={36} className="mx-auto mb-2 opacity-30" />
              <p>Click "Get Recommendations" to see personalized product suggestions.</p>
            </div>
          )}
        </div>
      )}

      {/* ================== TAB 3: Bulk Sentiment ================== */}
      {activeTab === "bulk" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg border shadow overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold text-gray-800">
                Select Reviews to Analyze
                {selectedReviews.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-orange-600">({selectedReviews.length} selected)</span>
                )}
              </h2>
              <button
                onClick={handleBulkAnalyze}
                disabled={bulkLoading || selectedReviews.length === 0}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 font-medium"
              >
                <Brain size={16} />
                {bulkLoading ? "Analyzing…" : `Analyze Selected (${selectedReviews.length})`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        onChange={toggleAll}
                        checked={reviews.length > 0 && reviews.every((r) => selectedReviews.includes(r.id))}
                        className="w-4 h-4 accent-orange-500"
                      />
                    </th>
                    <th className="p-3">Product</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Review</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading reviews…</td></tr>
                  ) : reviews.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">No reviews found.</td></tr>
                  ) : reviews.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-t cursor-pointer hover:bg-orange-50 transition-colors ${
                        selectedReviews.includes(r.id) ? "bg-orange-50" : idx % 2 === 1 ? "bg-gray-50" : ""
                      }`}
                      onClick={() => toggleReview(r.id)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(r.id)}
                          onChange={() => toggleReview(r.id)}
                          className="w-4 h-4 accent-orange-500"
                        />
                      </td>
                      <td className="p-3 font-medium text-xs">{r.product?.name || "—"}</td>
                      <td className="p-3 text-xs text-gray-600">{r.user?.name || "—"}</td>
                      <td className="p-3 max-w-[200px]">
                        <p className="truncate text-xs text-gray-700" title={r.comment}>
                          {r.comment || <span className="text-gray-400 italic">No comment</span>}
                        </p>
                      </td>
                      <td className="p-3 text-xs">{r.rating ? `${r.rating}/5` : "—"}</td>
                      <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(r.created_at || r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Review Pagination */}
            <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
              <span className="text-gray-500">
                {reviewPagination.total} reviews total
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={reviewPage <= 1}
                  onClick={() => setReviewPage(reviewPage - 1)}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 text-gray-600">
                  {reviewPage} / {reviewPagination.totalPages || 1}
                </span>
                <button
                  disabled={reviewPage >= (reviewPagination.totalPages || 1)}
                  onClick={() => setReviewPage(reviewPage + 1)}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Results */}
          {bulkResults.length > 0 && (
            <div className="bg-white rounded-lg border shadow overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800">Bulk Analysis Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="p-3">Review Text</th>
                      <th className="p-3">Sentiment</th>
                      <th className="p-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResults.map((result, i) => (
                      <tr key={result.review_id || i} className={`border-t ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                        <td className="p-3 max-w-[280px]">
                          <p className="truncate text-xs text-gray-700" title={result.review_text}>
                            {result.review_text || result.text || "—"}
                          </p>
                        </td>
                        <td className="p-3">
                          <SentimentBadge sentiment={result.sentiment} />
                        </td>
                        <td className="p-3 w-48">
                          <ConfidenceBar confidence={result.confidence} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
