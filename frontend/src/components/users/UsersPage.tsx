import { Edit, Plus, Search, Shield, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import { useDeleteUser, useToggleUserStatus, useUsers } from "../../hooks/useUsers";
import type { SortConfig, User } from "../../types";
import type { UserTableData } from "../../types/users.types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Table from "../ui/Table";
import UserForm from "./UserForm";

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "ADMIN" | "MANAGER" | "STAFF">("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "username", order: "asc" });

  const {
    state: { user: currentUser }
  } = useContext(AppContext) as { state: { user: User } };

  const {
    data: usersResponse,
    isLoading,
    refetch
  } = useUsers({
    limit: 100,
    enabled: currentUser?.role === "ADMIN"
  });

  const users = useMemo(() => usersResponse?.users || [], [usersResponse?.users]);

  // Mutations
  const deleteUserMutation = useDeleteUser();
  const toggleUserStatusMutation = useToggleUserStatus();

  const filteredData = useMemo(() => {
    const filtered = users.filter(user => {
      // Search filter - search by username and email only
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const usernameMatch = user.username.toLowerCase().includes(searchLower);
        const emailMatch = (user.email || "").toLowerCase().includes(searchLower);
        if (!usernameMatch && !emailMatch) {
          return false;
        }
      }

      // Role filter
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[sortConfig.field];
      const bValue = (b as unknown as Record<string, unknown>)[sortConfig.field];

      if (aValue != null && bValue != null) {
        if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sortConfig]);

  // Redirect if not admin
  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "ADMIN", label: "Administrator" },
    { value: "MANAGER", label: "Manager" },
    { value: "STAFF", label: "Staff" }
  ];

  const statusOptions = [
    { value: "all", label: "All Users" },
    { value: "active", label: "Active Only" },
    { value: "inactive", label: "Inactive Only" }
  ];

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const handleToggleStatus = async (user: User) => {
    // Prevent users from deactivating themselves
    if (user.id === currentUser.id) {
      alert("You cannot deactivate your own account");
      return;
    }

    const action = user.isActive ? "deactivate" : "activate";
    try {
      const response = await toggleUserStatusMutation.mutateAsync({
        id: user.id,
        isActive: !user.isActive
      });

      if (response.success) {
        // Success handled by React Query cache invalidation
      } else {
        alert(response.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert(`An error occurred while trying to ${action} the user`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    // Prevent users from deleting themselves
    if (user.id === currentUser.id) {
      alert("You cannot delete your own account");
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete user "${user.username}"?\n\nThis will remove the user from the database completely and cannot be undone.\n\nNote: If this user has associated records (sections managed, stock entries, etc.), the deletion will fail.`)) {
      try {
        const response = await deleteUserMutation.mutateAsync(user.id);

        if (response.success) {
          // Success handled by React Query cache invalidation
        } else {
          alert(response.message || "Failed to delete user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred while trying to delete the user");
      }
    }
  };

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const adminCount = users.filter(u => u.role === "ADMIN").length;
  const managerCount = users.filter(u => u.role === "MANAGER").length;
  const staffCount = users.filter(u => u.role === "STAFF").length;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "MANAGER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "STAFF":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const columns = [
    {
      key: "username",
      title: "User",
      sortable: true,
      render: (item: UserTableData) => {
        const user = item as User;
        const initials = user.username?.[0]?.toUpperCase() || "U";

        return (
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full text-white text-sm font-semibold">{initials}</div>
            {/* <div> */}
            <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
            {/* </div> */}
          </div>
        );
      }
    },
    {
      key: "role",
      title: "Role",
      sortable: true,
      render: (item: UserTableData) => {
        const user = item as User;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>{user.role}</span>;
      }
    },
    {
      key: "isActive",
      title: "Status",
      render: (item: UserTableData) => {
        const user = item as User;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"}`}>{user.isActive ? "Active" : "Inactive"}</span>;
      }
    },
    {
      key: "createdAt",
      title: "Created",
      sortable: true,
      render: (item: UserTableData) => {
        const user = item as User;
        return user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-";
      }
    },
    {
      key: "actions",
      title: "Actions",
      render: (item: UserTableData) => {
        const user = item as User;
        return (
          <div className="flex space-x-2">
            <Button size="sm" variant="ghost" onClick={() => setEditingUser(user)} leftIcon={<Edit className="w-3 h-3" />}>
              Edit
            </Button>

            <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(user)} leftIcon={user.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />} className={user.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"} disabled={user.id === currentUser.id}>
              {user.isActive ? "Deactivate" : "Activate"}
            </Button>

            <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(user)} leftIcon={<Trash2 className="w-3 h-3" />} className="text-red-600 hover:text-red-700" disabled={user.id === currentUser.id}>
              Delete
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system users and their permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create User
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Users</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Administrators</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{adminCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Managers</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{managerCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">{staffCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search by username or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          <Select options={roleOptions} value={roleFilter} onChange={e => setRoleFilter(e.target.value as "" | "ADMIN" | "MANAGER" | "STAFF")} placeholder="Filter by role" />

          <Select options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value as "all" | "active" | "inactive")} placeholder="Filter by status" />

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredData.length} of {totalUsers} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <Table data={filteredData as UserTableData[]} columns={columns} loading={isLoading} emptyMessage="No users found" sortConfig={sortConfig} onSort={handleSort} />
      </div>

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User" size="lg">
        <UserForm
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User" size="lg">
        {editingUser && (
          <UserForm
            initialData={editingUser}
            onSuccess={() => {
              setEditingUser(null);
              refetch();
            }}
            onCancel={() => setEditingUser(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;
