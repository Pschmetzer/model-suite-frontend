// components/FAQSection.jsx
import { useState, useEffect } from "react";
import FAQCard from "./FAQCard";
import faqsData from "./faqs.json";

export default function FAQSection({
  search,
  setSearch,
  category,
  setCategory,
}) {
  const categories = [
    "All",
    ...Array.from(new Set(faqsData.map((faq) => faq.category))),
  ];

  const top5FAQs = [...faqsData]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const [filtered, setFiltered] = useState(faqsData);

  useEffect(() => {
    const filteredFAQs = faqsData.filter(
      (faq) =>
        (category === "All" || faq.category === category) &&
        faq.question.toLowerCase().includes(search.toLowerCase()),
    );
    setFiltered(filteredFAQs);
  }, [search, category]);

  const groupedFAQs = filtered.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <div className="w-full md:w-2/3 flex flex-col gap-4 overflow-y-auto pr-2">
      {/* Category Filter */}
      <div className="bg-[#1e1e1e] p-4 rounded-md">
        <h3 className="font-semibold mb-3 text-white">Browse by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-3 py-1 rounded-md text-sm transition ${
                category === cat
                  ? "bg-white text-black"
                  : "bg-[#333] hover:bg-[#444] text-white"
              }`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search FAQs..."
        className="w-full bg-[#1e1e1e] border border-gray-600 p-2 rounded-md text-white placeholder-gray-400"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FAQ List */}
      <div className="space-y-2 overflow-y-auto max-h-[45vh] pr-2">
        {category === "All" && search === "" && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3">Top 5 Most Asked</h3>
            <div className="space-y-4">
              {top5FAQs.map((faq, idx) => (
                <FAQCard
                  key={`top-${idx}`}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center">No FAQs found.</p>
        ) : category === "All" ? (
          Object.entries(groupedFAQs).map(([cat, faqs]) => (
            <div key={cat} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{cat}</h3>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <FAQCard
                    key={`${cat}-${idx}`}
                    question={faq.question}
                    answer={faq.answer}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-4">
            {filtered.map((faq, idx) => (
              <FAQCard key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        )}
      </div>

      {/* Contact Support CTA */}
      <div className="mt-4">
        <p className="mb-2 text-sm text-gray-400">Still need help?</p>
        <button className="border rounded px-4 py-2 bg-[#333] hover:bg-[#444] text-sm text-white">
          Contact Support
        </button>
      </div>
    </div>
  );
}