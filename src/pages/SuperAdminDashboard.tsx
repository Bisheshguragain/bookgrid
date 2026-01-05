import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  isSuperAdmin,
  getMRR,
  getUserStatistics,
  getRevenueStatistics,
  getAllUsers,
  getInactiveUsers,
  getPaymentHistory,
  getDeletionNotices,
  updateUserPlan,
  updateUserStatus,
  processInactiveAccounts,
  cancelDeletionNotice,
  sendDeletionNotice,
} from '../services/superadminService';
import type {
  MRRStats,
  UserStatistics,
  RevenueStatistics,
  SuperAdminUser,
  InactiveUser,
  PaymentHistory,
  AccountDeletionNotice,
} from '../lib/database.types';

// New imports for contact submissions
import {
  getContactSubmissions,
  updateContactSubmissionStatus,
} from '../services/contactSubmissionsService';
import type { ContactSubmission } from '../services/contactSubmissionsService';

type TabType = 'overview' | 'users' | 'payments' | 'inactive' | 'deletions' | 'contacts';

export function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Analytics State
  const [mrr, setMRR] = useState<MRRStats | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStatistics | null>(null);
  
  // Users State
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  
  // Payments State
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  
  // Inactive Users State
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  
  // Deletion Notices State
  const [deletionNotices, setDeletionNotices] = useState<AccountDeletionNotice[]>([]);

  // Contacts State
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [contactsPage, setContactsPage] = useState(1);

  const [processingAction, setProcessingAction] = useState(false);

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      if (!user?.id) {
        navigate('/login');
        return;
      }

      const isAdmin = await isSuperAdmin(user.id);
      
      if (!isAdmin) {
        navigate('/app/dashboard');
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [user, navigate]);

  // Load data based on active tab
  useEffect(() => {
    if (!authorized) {
      return;
    }

    const loadData = async () => {
      try {
        if (activeTab === 'overview') {
          const [mrrData, statsData, revenueData] = await Promise.all([
            getMRR(),
            getUserStatistics(),
            getRevenueStatistics(),
          ]);
          setMRR(mrrData);
          setUserStats(statsData);
          setRevenueStats(revenueData);
        } else if (activeTab === 'users') {
          const { users: usersData, total } = await getAllUsers(usersPage, 50);
          setUsers(usersData);
          setUsersTotal(total);
        } else if (activeTab === 'payments') {
          const { payments: paymentsData, total } = await getPaymentHistory(paymentsPage, 50);
          setPayments(paymentsData);
          setPaymentsTotal(total);
        } else if (activeTab === 'inactive') {
          const inactiveData = await getInactiveUsers(90);
          setInactiveUsers(inactiveData);
        } else if (activeTab === 'deletions') {
          const noticesData = await getDeletionNotices('sent');
          setDeletionNotices(noticesData);
        } else if (activeTab === 'contacts') {
          const submissions = await getContactSubmissions(50, contactsPage);
          setContacts(submissions);
        }
      } catch (error) {
        console.error('Error loading superadmin data:', error);
        alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    loadData();
  }, [authorized, activeTab, usersPage, paymentsPage, contactsPage]);

  const handleUpdatePlan = async (userId: string, plan: 'free' | 'pro' | 'business') => {
    if (!window.confirm(`Are you sure you want to change this user's plan to ${plan.toUpperCase()}?`)) {
      return;
    }

    setProcessingAction(true);
    try {
      await updateUserPlan(userId, plan);
      // Reload users
      const { users: usersData, total } = await getAllUsers(usersPage, 50);
      setUsers(usersData);
      setUsersTotal(total);
      alert('Plan updated successfully!');
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'active' | 'inactive') => {
    if (!window.confirm(`Are you sure you want to mark this user as ${status}?`)) {
      return;
    }

    setProcessingAction(true);
    try {
      await updateUserStatus(userId, status);
      // Reload users
      const { users: usersData, total } = await getAllUsers(usersPage, 50);
      setUsers(usersData);
      setUsersTotal(total);
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSendDeletionNotice = async (userId: string, daysInactive: number) => {
    if (!window.confirm('Send deletion notice to this user? They will have 7 days to log in.')) {
      return;
    }

    setProcessingAction(true);
    try {
      await sendDeletionNotice(userId, 'inactivity', `Account inactive for ${daysInactive} days`, daysInactive);
      alert('Deletion notice sent successfully!');
      // Reload inactive users
      const inactiveData = await getInactiveUsers(90);
      setInactiveUsers(inactiveData);
    } catch (error) {
      console.error('Error sending deletion notice:', error);
      alert('Failed to send deletion notice');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelDeletion = async (userId: string) => {
    if (!window.confirm('Cancel deletion notice for this user?')) {
      return;
    }

    setProcessingAction(true);
    try {
      await cancelDeletionNotice(userId);
      alert('Deletion cancelled successfully!');
      // Reload deletion notices
      const noticesData = await getDeletionNotices('sent');
      setDeletionNotices(noticesData);
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      alert('Failed to cancel deletion');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleProcessInactive = async () => {
    if (!window.confirm('Process all inactive accounts? This will send deletion notices and delete accounts as scheduled.')) {
      return;
    }

    setProcessingAction(true);
    try {
      const result = await processInactiveAccounts();
      alert(`Processed successfully!\nNotices sent: ${result.notices_sent}\nAccounts deleted: ${result.accounts_deleted}`);
      // Reload data
      const inactiveData = await getInactiveUsers(90);
      setInactiveUsers(inactiveData);
      const noticesData = await getDeletionNotices('sent');
      setDeletionNotices(noticesData);
    } catch (error) {
      console.error('Error processing inactive accounts:', error);
      alert('Failed to process inactive accounts');
    } finally {
      setProcessingAction(false);
    }
  };

  // Contacts actions
  const handleMarkContactStatus = async (id: string, status: 'read' | 'archived') => {
    if (!window.confirm(`Mark this submission as ${status}?`)) return;
    setProcessingAction(true);
    try {
      await updateContactSubmissionStatus(id, status);
      const updated = await getContactSubmissions(50, contactsPage);
      setContacts(updated);
      alert('Status updated');
    } catch (err) {
      console.error('Failed updating contact status', err);
      alert('Failed to update status');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">🔐 Superadmin Dashboard</h1>
        <p className="text-red-100 text-base sm:text-lg">
          Complete system overview and management
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100">
        <div className="flex flex-wrap gap-2 p-4 border-b-2 border-gray-100">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'users', label: '👥 Users', icon: '👥' },
            { id: 'payments', label: '💰 Payments', icon: '💰' },
            { id: 'inactive', label: '⚠️ Inactive', icon: '⚠️' },
            { id: 'deletions', label: '🗑️ Deletions', icon: '🗑️' },
            { id: 'contacts', label: '📥 Contacts', icon: '📥' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* MRR Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={() => setActiveTab('payments')}
                  role="button"
                  tabIndex={0}
                >
                  <h3 className="text-sm font-semibold text-green-700 uppercase mb-2">Total MRR</h3>
                  <p className="text-3xl font-bold text-green-900">
                    £{mrr?.total_mrr?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-green-600 mt-2">Click to view payments →</p>
                </div>
                <div 
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={() => setActiveTab('payments')}
                  role="button"
                  tabIndex={0}
                >
                  <h3 className="text-sm font-semibold text-purple-700 uppercase mb-2">Pro MRR</h3>
                  <p className="text-3xl font-bold text-purple-900">
                    £{mrr?.pro_mrr?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-purple-600 mt-2">Click to view payments →</p>
                </div>
                <div 
                  className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border-2 border-amber-200 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={() => setActiveTab('payments')}
                  role="button"
                  tabIndex={0}
                >
                  <h3 className="text-sm font-semibold text-amber-700 uppercase mb-2">Business MRR</h3>
                  <p className="text-3xl font-bold text-amber-900">
                    £{mrr?.business_mrr?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-amber-600 mt-2">Click to view payments →</p>
                </div>
              </div>

              {/* User Stats */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">User Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard 
                    label="Total Users" 
                    value={userStats?.total_users || 0} 
                    color="blue" 
                    onClick={() => setActiveTab('users')}
                  />
                  <StatCard 
                    label="Active" 
                    value={userStats?.active_users || 0} 
                    color="green" 
                    onClick={() => setActiveTab('users')}
                  />
                  <StatCard 
                    label="Free" 
                    value={userStats?.free_users || 0} 
                    color="gray" 
                    onClick={() => setActiveTab('users')}
                  />
                  <StatCard 
                    label="Pro" 
                    value={userStats?.pro_users || 0} 
                    color="purple" 
                    onClick={() => setActiveTab('users')}
                  />
                  <StatCard 
                    label="Business" 
                    value={userStats?.business_users || 0} 
                    color="amber" 
                    onClick={() => setActiveTab('users')}
                  />
                  <StatCard 
                    label="Inactive" 
                    value={userStats?.inactive_users || 0} 
                    color="red" 
                    onClick={() => setActiveTab('inactive')}
                  />
                </div>
              </div>

              {/* Revenue Stats */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    label="Total Revenue" 
                    value={`£${revenueStats?.total_revenue?.toFixed(2) || '0.00'}`} 
                    color="green" 
                    onClick={() => setActiveTab('payments')}
                  />
                  <StatCard 
                    label="This Month" 
                    value={`£${revenueStats?.revenue_this_month?.toFixed(2) || '0.00'}`} 
                    color="blue" 
                    onClick={() => setActiveTab('payments')}
                  />
                  <StatCard 
                    label="This Week" 
                    value={`£${revenueStats?.revenue_this_week?.toFixed(2) || '0.00'}`} 
                    color="purple" 
                    onClick={() => setActiveTab('payments')}
                  />
                  <StatCard 
                    label="Today" 
                    value={`£${revenueStats?.revenue_today?.toFixed(2) || '0.00'}`} 
                    color="amber" 
                    onClick={() => setActiveTab('payments')}
                  />
                </div>
              </div>

              {/* Signups */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">New Signups</h2>
                <div className="grid grid-cols-3 gap-4">
                  <StatCard 
                    label="Today" 
                    value={userStats?.users_today || 0} 
                    color="green" 
                    onClick={() => setActiveTab('users')}
                  />
                  <StatCard 
                    label="This Week" 
                    value={userStats?.users_this_week || 0} 
                    color="blue" 
                    onClick={() => setActiveTab('users')}
                  />
                  <StatCard 
                    label="This Month" 
                    value={userStats?.users_this_month || 0} 
                    color="purple" 
                    onClick={() => setActiveTab('users')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersTable
              users={users}
              total={usersTotal}
              page={usersPage}
              onPageChange={setUsersPage}
              onUpdatePlan={handleUpdatePlan}
              onUpdateStatus={handleUpdateStatus}
              processing={processingAction}
            />
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <PaymentsTable
              payments={payments}
              total={paymentsTotal}
              page={paymentsPage}
              onPageChange={setPaymentsPage}
            />
          )}

          {/* Inactive Users Tab */}
          {activeTab === 'inactive' && (
            <InactiveUsersTable
              users={inactiveUsers}
              onSendNotice={handleSendDeletionNotice}
              onProcess={handleProcessInactive}
              processing={processingAction}
            />
          )}

          {/* Deletions Tab */}
          {activeTab === 'deletions' && (
            <DeletionNoticesTable
              notices={deletionNotices}
              onCancel={handleCancelDeletion}
              processing={processingAction}
            />
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Contact Form Submissions</h2>
              {contacts.length === 0 ? (
                <p className="text-gray-600">No submissions found.</p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((c) => (
                    <div key={c.id} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
                          <div className="text-lg font-semibold text-gray-900">{c.name} <span className="text-sm text-gray-500">• {c.email}</span></div>
                          <div className="text-sm text-purple-600 font-medium">{c.subject}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${c.status === 'new' ? 'bg-yellow-100 text-yellow-800' : c.status === 'read' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{c.status.toUpperCase()}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleMarkContactStatus(c.id, 'read')} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Mark Read</button>
                            <button onClick={() => handleMarkContactStatus(c.id, 'archived')} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">Archive</button>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-gray-700 whitespace-pre-line">{c.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ 
  label, 
  value, 
  color, 
  onClick 
}: { 
  label: string; 
  value: string | number; 
  color: string;
  onClick?: () => void;
}) {
  const colors = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
    green: 'from-green-50 to-green-100 border-green-200 text-green-900',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-900',
    amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-900',
    red: 'from-red-50 to-red-100 border-red-200 text-red-900',
    gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-900',
  };

  const baseClasses = `bg-gradient-to-br ${colors[color as keyof typeof colors]} rounded-xl p-4 border-2`;
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200' : '';

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <p className="text-xs font-semibold uppercase mb-1 opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function UsersTable({ 
  users, 
  total, 
  page, 
  onPageChange, 
  onUpdatePlan, 
  onUpdateStatus, 
  processing 
}: {
  users: SuperAdminUser[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onUpdatePlan: (userId: string, plan: 'free' | 'pro' | 'business') => void;
  onUpdateStatus: (userId: string, status: 'active' | 'inactive') => void;
  processing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">All Users ({total})</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Plan</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Activity</th>
              <th className="px-4 py-3 text-left font-semibold">Stats</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold">{user.full_name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.subscription_plan}
                    onChange={(e) => onUpdatePlan(user.user_id, e.target.value as any)}
                    disabled={processing}
                    className="text-xs px-2 py-1 border rounded"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.account_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.account_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div>Last: {new Date(user.last_active_at).toLocaleDateString()}</div>
                  <div className="text-gray-500">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div>{user.total_event_types} events</div>
                  <div>{user.total_bookings} bookings</div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onUpdateStatus(user.user_id, user.account_status === 'active' ? 'inactive' : 'active')}
                    disabled={processing}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={users.length < 50}
          className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function PaymentsTable({ 
  payments, 
  total, 
  page, 
  onPageChange 
}: {
  payments: PaymentHistory[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Payment History ({total})</h2>

      {payments.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payment History</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No payments have been recorded yet. Payments will appear here when users make purchases or upgrade their plans.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Stripe ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">
                      {new Date(payment.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {payment.plan_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        payment.payment_status === 'succeeded' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {payment.stripe_payment_id || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={payments.length < 50}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function InactiveUsersTable({ 
  users, 
  onSendNotice, 
  onProcess, 
  processing 
}: {
  users: InactiveUser[];
  onSendNotice: (userId: string, daysInactive: number) => void;
  onProcess: () => void;
  processing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Inactive Users (90+ days)</h2>
        {users.length > 0 && (
          <button
            onClick={onProcess}
            disabled={processing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Process All Inactive'}
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">All Users Are Active</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Great news! There are no users who have been inactive for 90+ days. Users who haven't logged in for 90 days or more will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Plan</th>
                <th className="px-4 py-3 text-left font-semibold">Last Active</th>
                <th className="px-4 py-3 text-left font-semibold">Days Inactive</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold">{user.full_name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-semibold">
                      {user.subscription_plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(user.last_active_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.days_inactive >= 90 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.days_inactive} days
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onSendNotice(user.user_id, user.days_inactive)}
                      disabled={processing}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded disabled:opacity-50"
                    >
                      Send Notice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeletionNoticesTable({ 
  notices, 
  onCancel, 
  processing 
}: {
  notices: AccountDeletionNotice[];
  onCancel: (userId: string) => void;
  processing: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Pending Account Deletions</h2>

      {notices.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Deletions</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            There are no accounts scheduled for deletion at this time. Deletion notices sent to inactive users will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">User ID</th>
                <th className="px-4 py-3 text-left font-semibold">Reason</th>
                <th className="px-4 py-3 text-left font-semibold">Notice Sent</th>
                <th className="px-4 py-3 text-left font-semibold">Scheduled Deletion</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono">{notice.user_id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 text-xs">{notice.reason}</td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(notice.notice_sent_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(notice.scheduled_deletion_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onCancel(notice.user_id)}
                      disabled={processing}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded disabled:opacity-50"
                    >
                      Cancel Deletion
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
