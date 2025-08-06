import React, { useRef, useState, useEffect } from "react";
import { FaImage, FaPlus, FaSearchPlus, FaTrash } from "react-icons/fa";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Modal from "../ui/Modal";

function SortableImage({ id, url, onRemove, onPreview, editable }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group cursor-grab"
    >
      <img
        src={
          url.startsWith("http")
            ? url
            : `${import.meta.env.VITE_API_BASE_URL}/${url.replace(/^\/+/, "")}`
        }
        alt="Gallery"
        className="w-full aspect-square object-cover transition-transform duration-200 group-hover:scale-110"
        onClick={onPreview}
        style={{ cursor: "pointer" }}
      />
      {editable && (
        <>
          <button
            type="button"
            onClick={onPreview}
            className="absolute bottom-2 left-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Preview gallery image"
          >
            <FaSearchPlus />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove gallery image"
          >
            <FaTrash />
          </button>
        </>
      )}
    </div>
  );
}

export default function Gallery({ images, onChange, editable, onDirtyChange }) {
  const inputRef = useRef();
  const [lastSavedImages, setLastSavedImages] = useState(images);
  const [dirty, setDirty] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const isSame =
      images.length === lastSavedImages.length &&
      images.every(
        (img, i) =>
          img.url === lastSavedImages[i]?.url &&
          img.order === lastSavedImages[i]?.order,
      );
    setDirty(!isSame);
    if (onDirtyChange) onDirtyChange(!isSame);
  }, [images, lastSavedImages, onDirtyChange]);

  const handleUpload = async (files) => {
    for (const file of files) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        alert("Only JPEG/PNG allowed");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        continue;
      }
      try {
        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        const form = new FormData();
        form.append("image", file);
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/profile/portfolio-image`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          },
        );
        if (!res.ok) throw new Error("Failed to upload image");
        const data = await res.json();
        const newArr = [...images, { url: data.url, order: images.length }];
        onChange(newArr);
        // dirty state will be set by useEffect
      } catch (err) {
        alert("Image upload failed");
      }
    }
  };

  const handleDelete = (index) => {
    const newArr = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));
    onChange(newArr);
    // dirty state will be set by useEffect
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img) => img.url === active.id);
      const newIndex = images.findIndex((img) => img.url === over.id);
      const newArr = arrayMove(images, oldIndex, newIndex).map((img, i) => ({
        ...img,
        order: i,
      }));
      onChange(newArr);
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl p-4 md:p-6 mt-6 md:mt-8">
      {editable && (
        <>
          <div className="flex flex-col items-center justify-center w-full mb-4 md:mb-6">
            <div className="text-xs text-gray-300 mb-2">
              JPG/PNG only, max 5MB
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors mb-3 md:mb-4 text-sm md:text-base"
              onClick={() => inputRef.current?.click()}
            >
              <FaPlus /> Add Images
            </button>
            <input
              type="file"
              id="gallery-upload"
              multiple
              accept="image/jpeg,image/png"
              ref={inputRef}
              onChange={(e) => handleUpload(Array.from(e.target.files))}
              className="hidden"
            />
          </div>
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.url)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 bg-gray-800/40 backdrop-blur rounded-2xl p-4 md:p-8">
                {images.map((img, index) => (
                  <SortableImage
                    key={img.url}
                    id={img.url}
                    url={img.url}
                    onRemove={() => handleDelete(index)}
                    onPreview={() => openLightbox(index)}
                    editable={editable}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
      {!editable && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 bg-gray-800/40 backdrop-blur rounded-2xl p-4 md:p-8">
          {images.map((img, index) => (
            <div
              key={img.url}
              className="relative group rounded-xl overflow-hidden border border-gray-700 bg-gray-800/60 backdrop-blur transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
            >
              <img
                src={
                  img.url.startsWith("http")
                    ? img.url
                    : `${import.meta.env.VITE_API_BASE_URL}/${img.url.replace(/^\/+/, "")}`
                }
                alt={`Gallery Image ${index + 1}`}
                className="w-full aspect-square object-cover transition-transform duration-200 group-hover:scale-110"
                onClick={() => openLightbox(index)}
                style={{ cursor: "pointer" }}
              />
            </div>
          ))}
        </div>
      )}
      <Modal open={lightboxOpen} onClose={closeLightbox}>
        <div className="flex flex-col items-center justify-center p-4">
          <img
            src={
              images[lightboxIndex]?.url?.startsWith("http")
                ? images[lightboxIndex]?.url
                : `${import.meta.env.VITE_API_BASE_URL}/${images[lightboxIndex]?.url?.replace(/^\/+/, "")}`
            }
            alt="Preview"
            className="max-w-[80vw] max-h-[70vh] rounded-lg shadow-lg"
          />
          <div className="flex justify-between w-full mt-4">
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded-lg mr-2 disabled:opacity-50"
              onClick={() => setLightboxIndex((i) => Math.max(0, i - 1))}
              disabled={lightboxIndex === 0}
            >
              Previous
            </button>
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded-lg ml-2 disabled:opacity-50"
              onClick={() =>
                setLightboxIndex((i) => Math.min(images.length - 1, i + 1))
              }
              disabled={lightboxIndex === images.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
