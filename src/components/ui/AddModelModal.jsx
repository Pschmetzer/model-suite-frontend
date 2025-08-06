import React, { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import SearchInput from "./SearchInput";
import Avatar from "./Avatar";

const AddModelModal = ({
  open,
  onClose,
  onAdd,
  onSearch,
  searchLoading,
  searchResults = [],
  selectedUser,
  setSelectedUser,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="px-6 pb-6">
        <SearchInput
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder="Search for models..."
        />
        <div className="mb-6 max-h-48 overflow-y-auto">
          {searchLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?._id === user._id
                    ? "bg-blue-600/80"
                    : "hover:bg-blue-600/30"
                }`}
              >
                <Avatar
                  src={user.profilePhoto}
                  alt={user.fullName}
                  fallback={user.fullName?.[0] || "U"}
                  className="w-10 h-10 mr-3 border-2 border-blue-600 shadow"
                />
                <span className="text-white font-medium">{user.fullName}</span>
              </div>
            ))
          )}
          {searchResults.length === 0 && !searchLoading && (
            <div className="text-gray-400 text-center py-4">
              {searchQuery ? "No users found" : ""}
            </div>
          )}
        </div>
        <Button
          onClick={() => onAdd(selectedUser)}
          disabled={!selectedUser}
          className="w-full py-3 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
        >
          Add Model
        </Button>
      </div>
    </Modal>
  );
};

export default AddModelModal;
