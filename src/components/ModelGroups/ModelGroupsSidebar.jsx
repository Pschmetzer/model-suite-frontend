import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { ChevronDown, ChevronRight, Plus, Users } from "lucide-react";

const ModelGroupsSidebar = () => {
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [models, setModels] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const token = useSelector((state) => state.auth?.token);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchGroups();
    fetchModels();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${baseUrl}/agency/model-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setGroups(response.data.groups);
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${baseUrl}/agency/agency-models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModels(response.data.data.models || []);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const handleAddToGroup = async (modelId, groupId) => {
    try {
      const response = await axios.put(
        `${baseUrl}/agency/model-group-assignment`,
        { modelId, groupId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setAssignments(response.data.assignments);
        fetchGroups(); // Refresh groups after adding
      }
    } catch (error) {
      console.error("Error adding model to group:", error);
    }
  };

  const toggleGroup = (groupId) => {
    setSelectedGroup(selectedGroup === groupId ? null : groupId);
  };

  const getModelsInGroup = (groupId) => {
    return models.filter((model) => assignments[model._id] === groupId);
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center space-x-2">
                {selectedGroup === group.id ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
                <span className="font-medium">{group.name}</span>
                <span className="text-sm text-gray-500">
                  ({getModelsInGroup(group.id).length})
                </span>
              </div>
            </div>

            {selectedGroup === group.id && (
              <div className="ml-6 space-y-2">
                {getModelsInGroup(group.id).map((model) => (
                  <div
                    key={model._id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {model.profilePhoto ? (
                      <img
                        src={model.profilePhoto}
                        alt={model.fullName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <Users size={20} />
                    )}
                    <span>{model.fullName || model.username}</span>
                  </div>
                ))}

                {/* Simple dropdown to add models to group */}
                <div className="p-2">
                  <select
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddToGroup(e.target.value, group.id);
                        e.target.value = ""; // Reset select
                      }
                    }}
                  >
                    <option value="">Add model to group...</option>
                    {models
                      .filter(
                        (model) =>
                          !assignments[model._id] ||
                          assignments[model._id] !== group.id,
                      )
                      .map((model) => (
                        <option key={model._id} value={model._id}>
                          {model.fullName || model.username}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelGroupsSidebar;
