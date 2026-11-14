import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { 
  Users as UsersIcon, 
  Plus, 
  Shield, 
  UserPlus, 
  Trash2, 
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface RosterUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  lastActive: string;
}

export default function Users() {
  const { addNotification, logActivity } = useStore();

  // Roster Local state
  const [usersList, setUsersList] = useState<RosterUser[]>([
    { id: 'u1', name: 'Atul Gupta', email: 'admin@atulglass.com', role: 'admin', status: 'active', lastActive: 'Just Now' },
    { id: 'u2', name: 'Rajesh Sharma', email: 'staff@atulglass.com', role: 'staff', status: 'active', lastActive: '2 hours ago' },
    { id: 'u3', name: 'Amit Verma', email: 'amit@atulglass.com', role: 'staff', status: 'active', lastActive: 'Yesterday' },
    { id: 'u4', name: 'Sanjay Rawat', email: 'sanjay@atulglass.com', role: 'staff', status: 'inactive', lastActive: '5 days ago' },
  ]);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Add User Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');

  // Matrix Permissions
  const rolePermissions = {
    admin: { stockIn: true, stockOut: true, auditReconcile: true, manageUsers: true, configSettings: true },
    staff: { stockIn: true, stockOut: true, auditReconcile: false, manageUsers: false, configSettings: false },
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newUser: RosterUser = {
      id: `u_${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: 'active',
      lastActive: 'Never',
    };

    setUsersList(prev => [...prev, newUser]);
    setIsAddOpen(false);
    
    setNewName('');
    setNewEmail('');
    setNewRole('staff');

    addNotification('success', 'User Invited', `Sent credentials invitation to ${newEmail}`);
    logActivity(`Added new user roster: ${newName} (${newRole})`, 'Users');
  };

  const handleToggleStatus = (id: string, name: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        logActivity(`${nextStatus === 'active' ? 'Activated' : 'Deactivated'} user: ${name}`, 'Users');
        addNotification('info', 'Status Changed', `User ${name} status modified to ${nextStatus}.`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleResetPassword = (email: string) => {
    addNotification('success', 'Password Reset Sent', `Sent reset password token to ${email}`);
    logActivity(`Initiated password reset for: ${email}`, 'Users');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">User Roster & Access Rights</h2>
          <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold font-medium">Manage warehouse operators. Audit active shop staff credentials and roles.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-indigo-650 hover:bg-indigo-755 text-white font-bold text-xs px-4 py-2.5 rounded-lg active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Add User Account
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Roster list */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="shadow-sm flex-1 flex flex-col">
            <div className="overflow-x-auto text-xs flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 font-semibold select-none whitespace-nowrap">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Designated Role</th>
                    <th className="p-4">Last Activity</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium text-zinc-700 dark:text-zinc-305">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10">
                      <td className="p-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{usr.name}</td>
                      <td className="p-4 whitespace-nowrap">{usr.email}</td>
                      <td className="p-4 font-mono font-bold capitalize whitespace-nowrap">{usr.role}</td>
                      <td className="p-4 text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{usr.lastActive}</td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          usr.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {usr.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleResetPassword(usr.email)}
                            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-1 rounded transition-colors"
                            title="Reset Password"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleStatus(usr.id, usr.name)}
                            className="text-zinc-500 hover:text-zinc-750 transition-colors"
                            title={usr.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {usr.status === 'active' ? (
                              <ToggleRight className="h-5.5 w-5.5 text-indigo-600" />
                            ) : (
                              <ToggleLeft className="h-5.5 w-5.5 text-zinc-450" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Role Matrix */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
              <CardTitle className="text-sm font-black flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Shield className="h-4.5 w-4.5 text-indigo-500" />
                Access Control Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs font-bold flex-1">
              <div className="space-y-4">
                {/* Admin permissions block */}
                <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2">
                  <span className="text-zinc-850 dark:text-zinc-205 flex items-center gap-1">
                    <Shield className="h-4 w-4 text-indigo-500 shrink-0" />
                    Admin Access (Full Control)
                  </span>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-5 space-y-1">
                    <p className="flex justify-between"><span>Stock Check In/Out:</span> <span className="text-emerald-500">Allowed ✓</span></p>
                    <p className="flex justify-between"><span>Reconcile Ledger Discrepancies:</span> <span className="text-emerald-500">Allowed ✓</span></p>
                    <p className="flex justify-between"><span>System Configuration/Audit:</span> <span className="text-emerald-500">Allowed ✓</span></p>
                  </div>
                </div>

                {/* Staff permissions block */}
                <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-855 space-y-2">
                  <span className="text-zinc-850 dark:text-zinc-205 flex items-center gap-1">
                    <UsersIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                    Staff Access (Inventory operations only)
                  </span>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-505 pl-5 space-y-1">
                    <p className="flex justify-between"><span>Stock Check In/Out:</span> <span className="text-emerald-500">Allowed ✓</span></p>
                    <p className="flex justify-between"><span>Reconcile Ledger Discrepancies:</span> <span className="text-red-500">Denied ✕</span></p>
                    <p className="flex justify-between"><span>System Configuration/Audit:</span> <span className="text-red-500">Denied ✕</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ADD USER DIALOG */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Invite Staff Member">
        <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Harish Rawat"
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="e.g., harish@atulglass.com"
              value={newEmail} 
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Assigned Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none font-bold"
            >
              <option value="staff">Staff Operator (Read/Write Stocks)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-650 hover:bg-indigo-755 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md shadow-indigo-600/10"
          >
            Invite Account
          </button>
        </form>
      </Dialog>
    </div>
  );
}
