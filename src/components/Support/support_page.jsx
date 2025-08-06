import { useState } from "react";
import FAQSection from "./FAQ";
import ContactForm from "./email";

export default function FAQ() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  return (
    <div className="bg-[#121212] text-white min-h-screen py-8 px-4 overflow-x-hidden">
      <h1 className="text-3xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h1>

      {/* Desktop View: FAQ + Contact side by side */}
      <div className="hidden md:flex flex-row gap-6 max-w-7xl mx-auto h-[80vh] overflow-hidden">
        <FAQSection
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
        />
        <ContactForm />
      </div>

      {/* Mobile View: FAQ above, Contact below */}
      <div className="flex flex-col gap-6 md:hidden max-w-7xl mx-auto">
        <FAQSection
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
        />
        <ContactForm />
      </div>
    </div>
  );
}