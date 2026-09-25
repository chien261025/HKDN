import React, { useState } from 'react';
import { X, User, KeyRound, Laptop, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthSession } from '../../auth/types';
import { ProfileInfoTab } from './profile/ProfileInfoTab';
import { ChangePasswordTab } from './profile/ChangePasswordTab';
import { ActiveSessionsTab } from './profile/ActiveSessionsTab';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AuthSession;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'CHANGE_PASSWORD' | 'SESSIONS'>('INFO');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const initials = session.fullName
    ? session.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
    : 'TK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 relative max-h-[88vh] flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-sm shadow-sm border border-indigo-200">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-wide">
                  {session.fullName || 'Người dùng WMS'}
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                @{session.username} • {session.email || `${session.username}@smartwms.vn`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-sm font-bold px-5 pt-2 flex-wrap shrink-0">
          <button
            onClick={() => {
              setActiveTab('INFO');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'INFO'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ Sơ Cá Nhân</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('CHANGE_PASSWORD');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'CHANGE_PASSWORD'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi Mật Khẩu</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('SESSIONS');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'SESSIONS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Thiết Bị Đăng Nhập</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs sm:text-sm shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs sm:text-sm shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Tab Contents */}
        <div className="overflow-y-auto flex-1">
          {activeTab === 'INFO' && <ProfileInfoTab session={session} />}
          {activeTab === 'CHANGE_PASSWORD' && (
            <ChangePasswordTab
              username={session.username}
              onSuccess={(msg) => {
                setSuccessMessage(msg);
                setErrorMessage(null);
              }}
              onError={(msg) => {
                setErrorMessage(msg);
                setSuccessMessage(null);
              }}
            />
          )}
          {activeTab === 'SESSIONS' && (
            <ActiveSessionsTab
              onSuccess={(msg) => {
                setSuccessMessage(msg);
                setErrorMessage(null);
              }}
              onError={(msg) => {
                setErrorMessage(msg);
                setSuccessMessage(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

