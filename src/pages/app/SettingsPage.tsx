import { useRef, useState, useSyncExternalStore } from 'react';
import { Camera, Pencil } from 'lucide-react';
import { getUser } from '../../lib/auth';
import {
  getProfile,
  getDisplayAvatarUrl,
  readAvatarFile,
  subscribeProfile,
  updateProfile,
  validateAvatarFile,
  validateNickname,
} from '../../lib/profileStore';
import UserAvatar from '../../components/app/UserAvatar';

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return digits || '未绑定';
}

export default function SettingsPage() {
  const profile = useSyncExternalStore(subscribeProfile, getProfile, getProfile);
  const user = getUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(''), 3000);
  };

  const handlePickAvatar = async (file: File) => {
    const fileError = validateAvatarFile(file);
    if (fileError) {
      showMessage(fileError, 'error');
      return;
    }
    try {
      const dataUrl = await readAvatarFile(file);
      const result = updateProfile({
        nickname: profile.nickname,
        avatarUrl: dataUrl,
        isDefaultAvatar: false,
      });
      if (!result.ok) {
        showMessage(result.error, 'error');
        return;
      }
      showMessage('头像已更新', 'success');
    } catch {
      showMessage('头像上传失败，请稍后重试', 'error');
    }
  };

  const startEditNickname = () => {
    setNicknameDraft(profile.nickname);
    setEditingNickname(true);
  };

  const saveNickname = () => {
    const trimmed = nicknameDraft.trim();
    if (trimmed === profile.nickname) {
      setEditingNickname(false);
      return;
    }
    const error = validateNickname(trimmed);
    if (error) {
      showMessage(error, 'error');
      return;
    }
    const result = updateProfile({ nickname: trimmed });
    if (!result.ok) {
      showMessage(result.error, 'error');
      return;
    }
    setEditingNickname(false);
    showMessage('昵称已更新', 'success');
  };

  const cancelEditNickname = () => {
    setNicknameDraft(profile.nickname);
    setEditingNickname(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">设置</h1>
      </div>

      {message && (
        <p
          className={`text-xs px-3 py-2 border max-w-xl ${
            messageType === 'error'
              ? 'text-red-800 bg-red-50 border-red-200'
              : 'text-emerald-800 bg-emerald-50 border-emerald-200'
          }`}
        >
          {message}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">个人资料</h2>
        <div className="bg-white border border-black/8 p-5 sm:p-6 max-w-xl">
          <div className="flex items-start gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-16 h-16 shrink-0 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              aria-label="更换头像"
            >
              <UserAvatar profile={profile} size="md" className="w-full h-full" />
              <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePickAvatar(file);
                e.target.value = '';
              }}
            />

            <div className="min-w-0 flex-1 pt-1 space-y-2">
              {editingNickname ? (
                <input
                  type="text"
                  value={nicknameDraft}
                  maxLength={20}
                  autoFocus
                  onChange={(e) => setNicknameDraft(e.target.value)}
                  onBlur={saveNickname}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveNickname();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEditNickname();
                    }
                  }}
                  className="w-full border border-black/20 px-2 py-1 text-sm font-medium focus:outline-none focus:border-black/40"
                />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-medium truncate">{profile.nickname}</p>
                  <button
                    type="button"
                    onClick={startEditNickname}
                    className="shrink-0 p-1 text-black/40 hover:text-black transition-colors"
                    aria-label="编辑昵称"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-black/45">{formatPhone(user.phone)}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
