import React from 'react';
import { X, Image as ImageIcon, CheckCircle, ShieldAlert } from 'lucide-react';

interface ReferenceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceViewerModal: React.FC<ReferenceViewerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Original UI Reference Comparison</h2>
              <p className="text-xs text-slate-500">Provided mock-up compared against active implementation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src="/assets/aistudio/image_bee697e9.png"
              alt="Original UI Design Reference"
              className="w-full h-auto object-contain max-h-[460px] mx-auto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                Faithfully Replicated UI Features
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-slate-700">
                <li>Split screen: Vector security illustration on left, vibrant royal blue card on right</li>
                <li>Bold "Welcome!" title typography</li>
                <li>3 Rounded pill input fields with user, email, and lock icons</li>
                <li>4-bar horizontal yellow password strength indicator</li>
                <li>Dual pill action buttons: Orange "Create account" + outlined "Sign in"</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Corporate Email Domain Rule Implemented
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-slate-700">
                <li>Blocks free consumer email providers (@gmail.com, @yahoo.com, etc.)</li>
                <li>Accepts only company Google Workspace / corporate custom domains</li>
                <li>Real-time inline feedback indicating permitted vs blocked domain status</li>
                <li>1-click scenario test buttons to verify blocked vs allowed behavior immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
