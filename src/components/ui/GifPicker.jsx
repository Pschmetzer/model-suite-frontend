import React, { useState, useEffect, useCallback } from "react";
import { Search, Image, Smile } from "lucide-react";

const GifStickerPicker = ({
  onSelect,
  apiKey = "AIzaSyC_k20Kf7H31wvjbwnmePo_uUspwQ4aEsA", // You can set your Tenor API key here
  className = "",
  width = 320,
  height = 400,
}) => {
  const [activeTab, setActiveTab] = useState("gifs");
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch from Tenor API
  const fetchTenorContent = useCallback(
    async (query, contentType) => {
      if (!apiKey) {
        setError("API key not provided");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const searchTerm =
          query || (contentType === "gifs" ? "shocked" : "funny");
        const endpoint = "search";

        const mediaFilter =
          contentType === "stickers"
            ? "gif_transparent,webp_transparent"
            : "minimal";

        const extraParams =
          contentType === "stickers" ? "&searchfilter=sticker" : "";

        const url = `https://tenor.googleapis.com/v2/${endpoint}?q=${encodeURIComponent(
          searchTerm,
        )}&key=${apiKey}&limit=50&media_filter=${mediaFilter}${extraParams}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        const formattedResults =
          data.results
            ?.map((item) => {
              let url, preview;

              if (contentType === "stickers") {
                // Prefer transparent, static sticker-like content
                url =
                  item.media_formats.gif_transparent?.url ||
                  item.media_formats.webp_transparent?.url;
                preview =
                  item.media_formats.tinygif_transparent?.url ||
                  item.media_formats.gif_transparent?.url ||
                  item.media_formats.webp_transparent?.url;
              } else {
                // For GIFs
                url =
                  item.media_formats.gif?.url || item.media_formats.mp4?.url;
                preview =
                  item.media_formats.tinygif?.url ||
                  item.media_formats.gif?.url;
              }

              return {
                id: item.id,
                url,
                preview,
                title: item.content_description || item.title || "Untitled",
                width: item.media_formats.gif?.dims?.[0] || 200,
                height: item.media_formats.gif?.dims?.[1] || 200,
                hasTransparency: contentType === "stickers",
              };
            })
            .filter((item) => item.url && item.preview) || [];

        if (contentType === "gifs") {
          setGifs(formattedResults);
        } else {
          setStickers(formattedResults);
        }
      } catch (err) {
        setError(err.message);
        console.error("Tenor API Error:", err);
      } finally {
        setLoading(false);
      }
    },
    [apiKey],
  );

  // Load trending content on mount
  useEffect(() => {
    if (apiKey) {
      fetchTenorContent("", "gifs");
      fetchTenorContent("", "stickers");
    }
  }, [apiKey, fetchTenorContent]);

  // Handle search
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (apiKey) {
        fetchTenorContent(query, activeTab);
      }
    },
    [activeTab, apiKey, fetchTenorContent],
  );

  // Handle item selection
  const handleSelect = (item) => {
    onSelect({
      id: item.id,
      url: item.url,
      name: item.url.split("/").pop(),
      title: item.title,
      type: activeTab === "gifs" ? "image/gif" : "image/sticker",
      width: item.width,
      height: item.height,
    });
  };

  const currentItems = activeTab === "gifs" ? gifs : stickers;

  return (
    <div
      className={`bg-[#1f1f1f] border border-[#1f1f1f] rounded-xl shadow-lg overflow-hidden flex flex-col ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Tabs */}
      <div className="border-b bg-[#1f1f1f]">
        <div className="flex">
          <button
            onClick={() => setActiveTab("gifs")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === "gifs"
                ? "text-indigo-400 border-b-2 border-indigo-500 bg-[#0a0a0a]"
                : "bg-[#1f1f1f] hover:text-white hover:bg-[#181818]"
            }`}
          >
            <Image size={16} />
            GIFs
          </button>
          <button
            onClick={() => setActiveTab("stickers")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === "stickers"
                ? "text-indigo-400 border-b-2 border-indigo-500 bg-[#0a0a0a]"
                : "text-slate-400 hover:text-white hover:bg-[#1f1f1f]"
            }`}
          >
            <Smile size={16} />
            Stickers
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#1f1f1f]">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={16}
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md text-sm bg-[#1f1f1f] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2">
        {!apiKey ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm text-center">
            <div>
              <Image className="mx-auto mb-2 opacity-50" size={32} />
              <p>API key not set</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400 text-sm text-center">
            <div>
              <p>Error: {error}</p>
              <button
                onClick={() => handleSearch(searchQuery)}
                className="mt-2 text-indigo-400 hover:text-indigo-200 underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {currentItems.length === 0 ? (
              <div className="col-span-2 text-center text-gray-500 text-sm py-8">
                No {activeTab} found
              </div>
            ) : (
              currentItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  title={item.title}
                  className="rounded-md min-h-[100px] overflow-hidden border border-gray-700 hover:border-indigo-400 transition-all bg-slate-800 hover:scale-[1.025] active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <img
                    src={item.preview}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GifStickerPicker;
