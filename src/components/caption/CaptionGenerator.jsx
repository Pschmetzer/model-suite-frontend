import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Wand2,
  Copy,
  CopyCheck,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  RotateCcw,
  Plus,
} from "lucide-react";
import {
  generateCaptions,
  setSelectedStyle,
  setCaptionCount,
  clearErrors,
  clearCurrentMedia,
} from "../../globalstate/captionSlice.jsx";
import Button from "../ui/Button.jsx";

const CaptionGenerator = () => {
  const dispatch = useDispatch();
  const {
    currentMedia,
    generatedCaptions,
    isGenerating,
    generateError,
    selectedStyle,
    captionCount,
  } = useSelector((state) => state.caption);

  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const prevGeneratingRef = useRef(false);

  // Show success toast when captions are freshly generated
  useEffect(() => {
    // Only show toast when we just finished generating (was generating, now not generating, and have captions)
    if (
      prevGeneratingRef.current &&
      !isGenerating &&
      generatedCaptions.length > 0 &&
      !generateError
    ) {
      toast.success(
        `🎉 Generated ${generatedCaptions.length} caption${
          generatedCaptions.length > 1 ? "s" : ""
        } successfully!`,
      );
    }
    prevGeneratingRef.current = isGenerating;
  }, [isGenerating, generatedCaptions.length, generateError]);

  const styles = [
    { value: "professional", label: "Professional", icon: "💼" },
    { value: "casual", label: "Casual", icon: "😊" },
    { value: "creative", label: "Creative", icon: "🎨" },
    { value: "trendy", label: "Trendy", icon: "✨" },
  ];

  const handleGenerate = async () => {
    if (!currentMedia?.mediaUrl) return;

    dispatch(clearErrors());
    dispatch(
      generateCaptions({
        mediaUrl: currentMedia.mediaUrl,
        captionCount,
        style: selectedStyle,
      }),
    );
  };

  const handleCopyCaption = async (caption, index) => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedIndex(index);
      toast.success("Caption copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Failed to copy caption:", error);
      toast.error("Failed to copy caption");
    }
  };

  const handleCopyAll = async () => {
    try {
      const allCaptions = generatedCaptions.join("\n\n");
      await navigator.clipboard.writeText(allCaptions);
      setCopiedAll(true);
      toast.success("All captions copied to clipboard!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (error) {
      console.error("Failed to copy all captions:", error);
      toast.error("Failed to copy captions");
    }
  };

  const handleRetry = () => {
    handleGenerate();
  };

  const handleGenerateNext = () => {
    // Clear current media and generated captions to start fresh
    dispatch(clearCurrentMedia());
    toast.success("Ready for new media! Upload your next image or video.");
  };

  if (!currentMedia) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Ready to Generate Captions
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Upload an image or video to get started with AI-powered caption
          generation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
          Caption Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caption Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => dispatch(setSelectedStyle(style.value))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedStyle === style.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>{style.icon}</span>
                    <span>{style.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Caption Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Captions
            </label>
            <select
              value={captionCount}
              onChange={(e) =>
                dispatch(setCaptionCount(parseInt(e.target.value)))
              }
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} caption{num > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !currentMedia?.mediaUrl}
          className="w-full flex items-center justify-center"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>Generating Captions...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              <span>Generate Captions</span>
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {generateError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Caption Generation Failed
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {generateError}
              </p>
            </div>
            <Button
              onClick={handleRetry}
              variant="ghost"
              size="sm"
              className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/30"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Generated Captions */}
      {generatedCaptions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-green-600" />
              Generated Captions
            </h3>
            <Button
              onClick={handleCopyAll}
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-white dark:text-green-400 hover:bg-green-600 border-green-600 flex items-center transition-all duration-200"
            >
              {copiedAll ? (
                <>
                  <CopyCheck className="w-4 h-4 mr-2" />
                  <span>Copied All!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  <span>Copy All</span>
                </>
              )}
            </Button>
          </div>

          {/* Caption List */}
          <div className="space-y-3">
            {generatedCaptions.map((caption, index) => (
              <div
                key={index}
                className="group relative p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {/* Caption Number */}
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center mt-0.5">
                    {index + 1}
                  </div>

                  <div className="flex-1 flex items-start justify-between">
                    <p className="text-gray-900 dark:text-white leading-relaxed pr-4 flex-1">
                      {caption}
                    </p>
                    <Button
                      onClick={() => handleCopyCaption(caption, index)}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white hover:bg-blue-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-blue-600 flex-shrink-0"
                    >
                      {copiedIndex === index ? (
                        <CopyCheck className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Usage Tips */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Pro tip:</strong> Copy your favorite caption and paste
              it into your social media post. You can also edit the caption
              after copying to customize it further.
            </p>
          </div>

          {/* Generate for Next Media Button - Moved to bottom */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleGenerateNext}
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white border-blue-600 hover:border-blue-700 px-8 py-3 text-base font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Generate for Next Media</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptionGenerator;
