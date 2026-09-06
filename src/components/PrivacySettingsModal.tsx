import React, { useState } from 'react';
import { X, Download, Trash2, ShieldAlert, CheckCircle2, User, Database, Lock, AlertTriangle } from 'lucide-react';
import { UserProfile, JournalSession } from '../types';
import { exportAllSessionsToJSON } from '../utils/export';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  sessions: JournalSession[];
  onDeleteAccountAndData: () => Promise<void>;
  isGuest?: boolean;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  sessions,
  onDeleteAccountAndData,
  isGuest,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    exportAllSessionsToJSON(sessions, userProfile?.email || 'guest-user');
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAccountAndData();
      setDeleteSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Batch deletion failed:', err);
      setDeleteError(err.message || 'Failed to delete data. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="privacy-settings-modal"
        className="bg-white border border-stone-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-[#FAF9F7]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Privacy, Export & Account</h2>
              <p className="text-xs text-stone-500">Manage your private journal data sovereignty</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6 text-sm text-stone-700 overscroll-contain">
          {/* Account Profile Status */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-lg shrink-0">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || 'User'}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-stone-900 truncate">
                {userProfile?.displayName || 'Reflective Soul'}
              </h3>
              <p className="text-xs text-stone-500 truncate">{userProfile?.email || 'Authenticated User'}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Isolated Firestore
                </span>
                <span>&bull;</span>
                <span>{sessions.length} Saved Entries</span>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div>
            <h4 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-stone-600" />
              <span>Full Data Export</span>
            </h4>
            <p className="text-xs text-stone-500 mb-3 leading-relaxed">
              Download your complete archive of journal reflections, transcriptions, timestamps, and emotion tags in a clean JSON format.
            </p>
            <button
              id="export-all-json-btn"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export All Reflections (JSON)</span>
            </button>
          </div>

          {/* Danger Zone: Account & Data Deletion */}
          <div className="pt-4 border-t border-stone-200">
            <h4 className="font-semibold text-rose-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Delete Account & Erase All Data</span>
            </h4>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Irreversibly execute batch deletes across Cloud Firestore collections for your user ID (`users/{userProfile?.uid}` and all `entries`). Once erased, reflection histories cannot be recovered.
            </p>

            {!confirmDelete ? (
              <button
                id="initiate-delete-account-btn"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account & Data</span>
              </button>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <p className="text-xs font-medium text-rose-800">
                  Please type <strong className="font-bold underline">DELETE</strong> below to permanently erase your account and all reflection records:
                </p>
                <input
                  id="delete-confirm-input"
                  type="text"
                  placeholder="Type DELETE"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:border-rose-500"
                />

                {deleteError && (
                  <p className="text-xs text-rose-600 font-medium">{deleteError}</p>
                )}

                {deleteSuccess && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Account and data erased successfully.
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    id="confirm-delete-account-btn"
                    onClick={handleDeleteAll}
                    disabled={isDeleting || deleteSuccess}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? 'Erasing Cloud Data...' : 'Permanently Erase Everything'}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(false);
                      setDeleteConfirmationText('');
                      setDeleteError(null);
                    }}
                    disabled={isDeleting}
                    className="px-3 py-2 bg-white text-stone-600 hover:bg-stone-100 border border-stone-200 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
