import { useCallback, useEffect, useMemo, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { useAuth } from '../context/useAuth';
import { useTenant } from '../context/TenantContext';
import {
  fetchTenantUsersMap,
  getTenantUserByUid,
  getTenantUserControlByUid,
  upsertTenantUserControlMap,
  upsertTenantUserMap,
} from '../lib/backendStore';
import { replaceTenantAvatar } from '../lib/avatarStorage';
import { User } from 'lucide-react';
import ImageStudio from '../components/common/ImageStudio';
import { getCroppedImg } from '../lib/imageStudioUtils';
import { getRuntimePlatform, PLATFORM_ELECTRON } from '../lib/runtimePlatform';
import {
  DESKTOP_WALLPAPERS,
  DESKTOP_APPEARANCE_EVENT,
  readDesktopAppearance,
  saveDesktopAppearance,
} from '../lib/mobileAppearance';

const inputClass =
  'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-ring)]';
const AVATAR_OUTPUT_SIZE = 512;
const AVATAR_MAX_BYTES = 180 * 1024;
const avatarFilterMap = {
  natural: { label: 'Natural', css: 'none', canvas: 'none' },
  warm: { label: 'Warm', css: 'saturate(1.1) contrast(1.04)', canvas: 'saturate(110%) contrast(104%)' },
  cool: { label: 'Cool', css: 'saturate(0.95) contrast(1.05)', canvas: 'saturate(95%) contrast(105%) hue-rotate(6deg)' },
  mono: { label: 'Mono', css: 'grayscale(1) contrast(1.08)', canvas: 'grayscale(100%) contrast(108%)' },
};

const toPublicProfile = (item) => ({
  uid: item.uid,
  displayName: item.displayName || 'User',
  role: item.role || 'Staff',
  publicProfile: item.publicProfile === true,
  headline: item.headline || '',
  bio: item.bio || '',
  selfIntro: item.selfIntro || '',
  socials: {
    linkedin: item.socials?.linkedin || '',
    instagram: item.socials?.instagram || '',
    website: item.socials?.website || '',
  },
  education: item.education || '',
  workExperience: item.workExperience || '',
  emergencyContact: {
    name: item.emergencyContact?.name || '',
    relation: item.emergencyContact?.relation || '',
    mobile: item.emergencyContact?.mobile || '',
  },
  medicalInfo: {
    bloodGroup: item.medicalInfo?.bloodGroup || '',
    notes: item.medicalInfo?.notes || '',
  },
  avatar: item.photoURL || item.avatar || '/avatar.png',
});

const ProfilePage = () => {
  const { tenantId } = useTenant();
  const { user, patchSessionUser } = useAuth();
  const runtimePlatform = getRuntimePlatform();
  const isElectronDesktop = runtimePlatform === PLATFORM_ELECTRON;
  const [profiles, setProfiles] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [flashVisible, setFlashVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState(null);
  const [avatarRawUrl, setAvatarRawUrl] = useState('');
  const [avatarSourceUrl, setAvatarSourceUrl] = useState(user?.photoURL || '/avatar.png');
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [avatarFilter, setAvatarFilter] = useState('natural');
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
    setAvatarDirty(true);
  }, []);

  const setRotationWrapper = (val) => {
    setAvatarRotation(val);
    setAvatarDirty(true);
  };
  const [form, setForm] = useState({
    displayName: user?.displayName || 'User',
    headline: '',
    bio: '',
    selfIntro: '',
    linkedin: '',
    instagram: '',
    website: '',
    education: '',
    workExperience: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactMobile: '',
    bloodGroup: '',
    medicalNotes: '',
    publicProfile: true,
    flashEnabled: true,
    flashDurationSec: 3,
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [desktopAppearance, setDesktopAppearance] = useState(() => readDesktopAppearance());

  useEffect(() => {
    if (!isElectronDesktop) return undefined;
    const sync = () => setDesktopAppearance(readDesktopAppearance());
    window.addEventListener('storage', sync);
    window.addEventListener(DESKTOP_APPEARANCE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(DESKTOP_APPEARANCE_EVENT, sync);
    };
  }, [isElectronDesktop]);

  const updateDesktopAppearance = (patch) => {
    const next = saveDesktopAppearance({ ...desktopAppearance, ...patch });
    setDesktopAppearance(next);
  };

  const onDesktopWallpaperUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (!result.startsWith('data:image/')) return;
      updateDesktopAppearance({ mode: 'custom', customWallpaperUrl: result });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!avatarRawUrl || !avatarRawUrl.startsWith('blob:')) return () => { };
    return () => {
      URL.revokeObjectURL(avatarRawUrl);
    };
  }, [avatarRawUrl]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    Promise.all([fetchTenantUsersMap(tenantId), getTenantUserControlByUid(tenantId, user.uid)]).then(
      ([usersResult, prefsResult]) => {
        if (!active) return;

        const nextProfiles = usersResult.ok
          ? usersResult.rows.map((item) => toPublicProfile(item))
          : [];
        setProfiles(nextProfiles);

        const mine = nextProfiles.find((item) => item.uid === user.uid);
        const flashEnabled = prefsResult.data?.notificationRules?.flash !== false;
        const flashDurationSec = Math.max(
          1,
          Math.round(Number(prefsResult.data?.notificationRules?.flashDurationMs || 3000) / 1000),
        );

        if (mine) {
          const profileAvatar = mine.avatar || user.photoURL || '/avatar.png';
          setAvatarSourceUrl(profileAvatar);
          setAvatarRawUrl('');
          setAvatarZoom(1);
          setAvatarRotation(0);
          setAvatarFilter('natural');
          setAvatarDirty(false);
          setCroppedAreaPixels(null);
          const initialForm = {
            displayName: mine.displayName || user.displayName,
            headline: mine.headline || '',
            bio: mine.bio || '',
            selfIntro: mine.selfIntro || '',
            linkedin: mine.socials?.linkedin || '',
            instagram: mine.socials?.instagram || '',
            website: mine.socials?.website || '',
            education: mine.education || '',
            workExperience: mine.workExperience || '',
            emergencyContactName: mine.emergencyContact?.name || '',
            emergencyContactRelation: mine.emergencyContact?.relation || '',
            emergencyContactMobile: mine.emergencyContact?.mobile || '',
            bloodGroup: mine.medicalInfo?.bloodGroup || '',
            medicalNotes: mine.medicalNotes || mine.medicalInfo?.notes || '',
            publicProfile: mine.publicProfile === true,
            flashEnabled,
            flashDurationSec,
          };
          setForm(initialForm);
          setOriginalForm(initialForm);
          return;
        }

        setAvatarSourceUrl(user.photoURL || '/avatar.png');
        setAvatarRawUrl('');
        setAvatarZoom(1);
        setAvatarRotation(0);
        setAvatarFilter('natural');
        setAvatarDirty(false);
        setCroppedAreaPixels(null);
        setForm((prev) => ({
          ...prev,
          flashEnabled,
          flashDurationSec,
        }));
      },
    );

    return () => {
      active = false;
    };
  }, [tenantId, user?.uid, user?.displayName, user?.photoURL]);

  const publicProfiles = useMemo(
    () => profiles.filter((item) => item.publicProfile === true),
    [profiles],
  );

  const onAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSaveMessage('Select a valid image file.');
      return;
    }

    try {
      const nextUrl = URL.createObjectURL(file);
      setAvatarRawUrl(nextUrl);
      setAvatarSourceUrl(nextUrl);
      setAvatarZoom(1);
      setAvatarRotation(0);
      setAvatarFilter('natural');
      setAvatarDirty(true);
      setCroppedAreaPixels(null);
      setSaveMessage('Avatar ready. Click Save Profile to upload.');
    } catch {
      setSaveMessage('Unable to read image file.');
    }
  };

  const onAvatarReset = () => {
    setAvatarRawUrl('');
    setAvatarSourceUrl(user.photoURL || '/avatar.png');
    setAvatarZoom(1);
    setAvatarRotation(0);
    setAvatarFilter('natural');
    setAvatarDirty(false);
    setCroppedAreaPixels(null);
    setSaveMessage('Avatar edit cleared.');
  };

  const onSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    let photoURL = user.photoURL || '/avatar.png';
    if (avatarDirty && avatarRawUrl && croppedAreaPixels) {
      try {
        const blob = await getCroppedImg(
          avatarRawUrl,
          croppedAreaPixels,
          avatarRotation,
          avatarFilter,
          AVATAR_OUTPUT_SIZE,
          AVATAR_MAX_BYTES
        );
        const avatarResult = await replaceTenantAvatar({
          tenantId,
          uid: user.uid,
          oldPhotoUrl: user.photoURL || '',
          fileBlob: blob,
        });
        if (!avatarResult.ok) {
          setSaveMessage(avatarResult.error || 'Avatar upload failed.');
          setIsSaving(false);
          return;
        }
        photoURL = avatarResult.photoURL;
        setAvatarSourceUrl(photoURL);
        setAvatarRawUrl('');
        setAvatarDirty(false);
        setCroppedAreaPixels(null);
      } catch (error) {
        setSaveMessage(error?.message || 'Avatar processing failed.');
        setIsSaving(false);
        return;
      }
    }

    const payload = {
      uid: user.uid,
      displayName: form.displayName.trim() || user.displayName,
      role: user.role,
      publicProfile: form.publicProfile,
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      selfIntro: form.selfIntro.trim(),
      socials: {
        linkedin: form.linkedin.trim(),
        instagram: form.instagram.trim(),
        website: form.website.trim(),
      },
      education: form.education.trim(),
      workExperience: form.workExperience.trim(),
      emergencyContact: {
        name: form.emergencyContactName.trim(),
        relation: form.emergencyContactRelation.trim(),
        mobile: form.emergencyContactMobile.trim(),
      },
      medicalInfo: {
        bloodGroup: form.bloodGroup.trim(),
        notes: form.medicalNotes.trim(),
      },
      photoURL,
      email: user.email || '',
      status: user.status || 'Active',
    };

    const profileResult = await upsertTenantUserMap(tenantId, user.uid, payload);
    if (!profileResult.ok) {
      setSaveMessage(profileResult.error || 'Failed to save profile.');
      setIsSaving(false);
      return;
    }

    const prefs = await getTenantUserControlByUid(tenantId, user.uid);
    const currentRules = prefs.data?.notificationRules || {};
    const controlResult = await upsertTenantUserControlMap(tenantId, user.uid, {
      accessOverrides: prefs.data?.accessOverrides || {},
      notificationRules: {
        ...currentRules,
        flash: form.flashEnabled,
        flashDurationMs: Number(form.flashDurationSec || 3) * 1000,
      },
    });
    if (!controlResult.ok) {
      setSaveMessage(controlResult.error || 'Profile saved but notification settings failed.');
      setIsSaving(false);
      return;
    }

    const usersResult = await fetchTenantUsersMap(tenantId);
    if (usersResult.ok) {
      setProfiles(usersResult.rows.map((item) => toPublicProfile(item)));
    }

    patchSessionUser({
      displayName: payload.displayName,
      photoURL: payload.photoURL,
    });

    setOriginalForm({ ...form });
    setIsEditing(false);
    setSaveMessage('Profile and notification settings updated.');
    setIsSaving(false);
  };

  const onChangePassword = async () => {
    setPasswordError('');
    setPasswordMessage('');

    // Strict Validation: uppercase, lowercase, number, special char, min 8
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongRegex.test(passwordForm.newPassword)) {
      setPasswordError('New password must be at least 8 characters, include an uppercase, lowercase, number, and special character.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);

    // Verify user document exists (safeguard)
    const userDocRes = await getTenantUserByUid(tenantId, user.uid);
    if (!userDocRes.ok || !userDocRes.data) {
      setPasswordError('Failed to verify user account.');
      setIsChangingPassword(false);
      return;
    }

    // BYPASS: Intentionally ignoring old password check as requested for direct override.

    // Update the password
    const result = await upsertTenantUserMap(tenantId, user.uid, { password: passwordForm.newPassword });
    setIsChangingPassword(false);

    if (result.ok) {
      setPasswordMessage('Password updated successfully.');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordError('Failed to update password.');
    }
  };
  const onCancel = () => {
    if (originalForm) {
      setForm(originalForm);
    }
    setIsEditing(false);
    onAvatarReset();
  };

  if (!user) return null;

  const onPreviewFlash = () => {
    if (!form.flashEnabled) {
      setSaveMessage('Flash popup is disabled. Enable it first.');
      return;
    }

    const duration = Math.max(1000, Math.min(60000, Number(form.flashDurationSec || 3) * 1000));
    setFlashVisible(true);
    window.setTimeout(() => {
      setFlashVisible(false);
    }, duration);
  };

  return (
    <>
      <PageShell
        title="Profile"
        subtitle="Customize your own public profile. Portal users can view only profiles marked public."
        icon={User}
      >
        {isElectronDesktop ? (
          <section className="mb-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 sm:p-5">
            <h2 className="font-title text-xl text-[var(--c-text)]">Desktop Wallpaper</h2>
            <p className="mt-1 text-sm text-[var(--c-muted)]">Set desktop preset or upload your own wallpaper (device local only).</p>
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--c-muted)]">Preset</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DESKTOP_WALLPAPERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateDesktopAppearance({ wallpaper: item.id, mode: 'preset' })}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${desktopAppearance.mode === 'preset' && desktopAppearance.wallpaper === item.id
                        ? 'bg-[var(--c-accent)] text-white'
                        : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-semibold text-[var(--c-text)]">
                Upload Custom
                <input type="file" accept="image/*" onChange={onDesktopWallpaperUpload} className="hidden" />
              </label>
              {desktopAppearance.mode === 'custom' ? (
                <button
                  type="button"
                  onClick={() => updateDesktopAppearance({ mode: 'preset', customWallpaperUrl: '' })}
                  className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-semibold text-[var(--c-text)]"
                >
                  Use Preset
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-title text-xl text-[var(--c-text)]">My Public Profile</h2>
                <p className="mt-1 text-sm text-[var(--c-muted)]">This controls what others can see inside the portal.</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2 text-sm font-semibold text-[var(--c-text)] transition hover:bg-[var(--c-surface)]"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="mt-6">
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[var(--c-surface)] bg-[var(--c-surface)] shadow-sm">
                      <img
                        src={avatarSourceUrl || '/avatar.png'}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-bold text-[var(--c-text)]">{form.displayName}</h3>
                      <p className="text-sm text-[var(--c-accent)]">{form.headline || user.role || 'Staff'}</p>
                      <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                        {form.publicProfile ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase dark:bg-emerald-900/30 dark:text-emerald-400">
                            Public
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold tracking-wider text-[var(--c-muted)] uppercase">Self Intro</p>
                      <p className="text-sm text-[var(--c-text)] leading-relaxed">{form.selfIntro || 'No introduction provided.'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold tracking-wider text-[var(--c-muted)] uppercase">Bio / Summary</p>
                      <p className="text-sm text-[var(--c-text)] leading-relaxed">{form.bio || 'No bio provided.'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold tracking-wider text-[var(--c-muted)] uppercase">Education</p>
                      <p className="text-sm text-[var(--c-text)] whitespace-pre-wrap">{form.education || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold tracking-wider text-[var(--c-muted)] uppercase">Work Experience</p>
                      <p className="text-sm text-[var(--c-text)] whitespace-pre-wrap">{form.workExperience || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
                    <h4 className="text-xs font-bold tracking-wider text-[var(--c-muted)] uppercase">Social & Links</h4>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--c-text)]">
                        <span className="text-xs text-[var(--c-muted)]">LI:</span>
                        <span className="truncate">{form.linkedin || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--c-text)]">
                        <span className="text-xs text-[var(--c-muted)]">IG:</span>
                        <span className="truncate">{form.instagram || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--c-text)]">
                        <span className="text-xs text(--c-muted)">WS:</span>
                        <span className="truncate">{form.website || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  <ImageStudio
                    sourceUrl={avatarSourceUrl}
                    onReset={onAvatarReset}
                    zoom={avatarZoom}
                    setZoom={setAvatarZoom}
                    rotation={avatarRotation}
                    setRotation={setRotationWrapper}
                    filter={avatarFilter}
                    setFilter={setAvatarFilter}
                    filterMap={avatarFilterMap}
                    onFileChange={onAvatarFileChange}
                    onCropComplete={onCropComplete}
                    title="Smart Avatar Studio"
                    workspaceHeightClass="h-[260px] sm:h-[300px] lg:h-[340px]"
                    tip="Tip: Use direct interaction to zoom and pan. Changes are saved with the profile."
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-[var(--c-muted)]">
                      Display Name
                      <input
                        className={inputClass}
                        value={form.displayName}
                        onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                        placeholder="Your display name"
                      />
                    </label>

                    <label className="text-sm text-[var(--c-muted)]">
                      Headline
                      <input
                        className={inputClass}
                        value={form.headline}
                        onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))}
                        placeholder="Role headline shown in portal"
                      />
                    </label>
                  </div>

                  <label className="text-sm text-[var(--c-muted)]">
                    Self Intro
                    <textarea
                      className={inputClass}
                      value={form.selfIntro}
                      rows={2}
                      onChange={(event) => setForm((prev) => ({ ...prev, selfIntro: event.target.value }))}
                      placeholder="Short self introduction"
                    />
                  </label>

                  <label className="text-sm text-[var(--c-muted)]">
                    Bio / Summary
                    <textarea
                      className={inputClass}
                      value={form.bio}
                      rows={3}
                      onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                      placeholder="Short profile summary"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-sm text-[var(--c-muted)]">
                      LinkedIn
                      <input
                        className={inputClass}
                        value={form.linkedin}
                        onChange={(event) => setForm((prev) => ({ ...prev, linkedin: event.target.value }))}
                        placeholder="LinkedIn URL"
                      />
                    </label>
                    <label className="text-sm text-[var(--c-muted)]">
                      Instagram
                      <input
                        className={inputClass}
                        value={form.instagram}
                        onChange={(event) => setForm((prev) => ({ ...prev, instagram: event.target.value }))}
                        placeholder="Instagram URL"
                      />
                    </label>
                    <label className="text-sm text-[var(--c-muted)]">
                      Website
                      <input
                        className={inputClass}
                        value={form.website}
                        onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
                        placeholder="Website URL"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-[var(--c-muted)]">
                      Education
                      <textarea
                        className={inputClass}
                        value={form.education}
                        rows={2}
                        onChange={(event) => setForm((prev) => ({ ...prev, education: event.target.value }))}
                        placeholder="Degrees, certifications..."
                      />
                    </label>
                    <label className="text-sm text-[var(--c-muted)]">
                      Work Experience
                      <textarea
                        className={inputClass}
                        value={form.workExperience}
                        rows={2}
                        onChange={(event) => setForm((prev) => ({ ...prev, workExperience: event.target.value }))}
                        placeholder="Years and relevant experience..."
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
                    <p className="text-sm font-bold text-[var(--c-text)]">Emergency & Medical</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="text-[10px] font-bold text-[var(--c-muted)] uppercase">
                        Contact Name
                        <input
                          className={inputClass}
                          value={form.emergencyContactName}
                          onChange={(event) => setForm((prev) => ({ ...prev, emergencyContactName: event.target.value }))}
                          placeholder="Name"
                        />
                      </label>
                      <label className="text-[10px] font-bold text-[var(--c-muted)] uppercase">
                        Relation
                        <input
                          className={inputClass}
                          value={form.emergencyContactRelation}
                          onChange={(event) => setForm((prev) => ({ ...prev, emergencyContactRelation: event.target.value }))}
                          placeholder="Relation"
                        />
                      </label>
                      <label className="text-[10px] font-bold text-[var(--c-muted)] uppercase">
                        Mobile
                        <input
                          className={inputClass}
                          value={form.emergencyContactMobile}
                          onChange={(event) => setForm((prev) => ({ ...prev, emergencyContactMobile: event.target.value }))}
                          placeholder="Mobile"
                        />
                      </label>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]">
                      <label className="text-[10px] font-bold text-[var(--c-muted)] uppercase">
                        Blood Group
                        <input
                          className={inputClass}
                          value={form.bloodGroup}
                          onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
                          placeholder="A+, O-..."
                        />
                      </label>
                      <label className="text-[10px] font-bold text-[var(--c-muted)] uppercase">
                        Medical Notes
                        <input
                          className={inputClass}
                          value={form.medicalNotes}
                          onChange={(event) => setForm((prev) => ({ ...prev, medicalNotes: event.target.value }))}
                          placeholder="Allergies, conditions..."
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${form.publicProfile ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                      <p className="text-sm font-bold text-[var(--c-text)]">Public Profile Visibility</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, publicProfile: !prev.publicProfile }))}
                      className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${form.publicProfile
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                    >
                      {form.publicProfile ? 'VISIBLE' : 'HIDDEN'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
                    <p className="text-sm font-bold text-[var(--c-text)]">Flash Notification Rules</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2">
                        <p className="text-xs font-semibold text-[var(--c-text)]">Status</p>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, flashEnabled: !prev.flashEnabled }))}
                          className={`rounded-lg px-3 py-1 text-[10px] font-bold transition ${form.flashEnabled
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                            }`}
                        >
                          {form.flashEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>
                      <label className="text-[10px] font-bold text-[var(--c-muted)] uppercase">
                        Display Time (sec)
                        <input
                          className="mt-1 block w-full rounded-lg border-none bg-[var(--c-surface)] px-3 py-2 text-xs text-[var(--c-text)] focus:ring-0"
                          value={form.flashDurationSec}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              flashDurationSec: Number(String(event.target.value).replace(/\D/g, '') || 3),
                            }))
                          }
                          placeholder="3"
                          inputMode="numeric"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onPreviewFlash}
                        className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-[10px] font-bold text-[var(--c-text)] transition hover:bg-[var(--c-panel)]"
                      >
                        Preview Popup
                      </button>
                      <p className="text-[10px] text-[var(--c-muted)] italic">
                        Popups appear at the top-right of your screen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t border-[var(--c-border)] pt-5">
                    <button
                      type="button"
                      onClick={onSave}
                      disabled={isSaving}
                      className="rounded-xl bg-[var(--c-accent)] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:opacity-60"
                    >
                      {isSaving ? 'Processing...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={isSaving}
                      className="rounded-xl border border-[var(--c-border)] bg-transparent px-6 py-2.5 text-sm font-bold text-[var(--c-text)] transition hover:bg-[var(--c-panel)]"
                    >
                      Cancel
                    </button>
                    {saveMessage ? <p className="text-xs font-medium text-[var(--c-accent)] animate-pulse">{saveMessage}</p> : null}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-[var(--c-border)] pt-6">
              <h3 className="font-title text-lg text-[var(--c-text)]">Security & Password</h3>
              <p className="mt-1 text-sm text-[var(--c-muted)]">Update your password using a highly secure combination.</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold tracking-wider text-[var(--c-muted)] uppercase">New Password</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Minimum 8 characters, highly secure"
                    />
                    <p className="text-[10px] text-[var(--c-muted)] leading-tight">Must contain uppercase, lowercase, number, and symbol.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold tracking-wider text-[var(--c-muted)] uppercase">Confirm New Password</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Re-type new password"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onChangePassword}
                      disabled={isChangingPassword}
                      className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-5 py-2 text-sm font-semibold text-[var(--c-text)] transition hover:bg-[var(--c-surface)] hover:text-white disabled:opacity-50"
                    >
                      {isChangingPassword ? 'Saving...' : 'Update Password'}
                    </button>
                    {passwordError && <p className="text-xs font-bold text-rose-500">{passwordError}</p>}
                    {passwordMessage && <p className="text-xs font-bold text-emerald-500 animate-in slide-in-from-left-2">{passwordMessage}</p>}
                  </div>
                </div>
              </div>
            </div>

          </section>
          <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 sm:p-5">
            <h2 className="font-title text-xl text-[var(--c-text)]">Portal Public Profiles</h2>
            <p className="mt-1 text-sm text-[var(--c-muted)]">Other users can view these profiles inside portal.</p>

            <div className="mt-4 space-y-2">
              {publicProfiles.map((item) => (
                <article
                  key={item.uid}
                  className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar || '/avatar.png'}
                      alt={item.displayName}
                      className="h-10 w-10 rounded-full border border-[var(--c-border)] object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--c-text)]">{item.displayName}</p>
                      <p className="text-xs text-[var(--c-muted)]">{item.headline || item.role}</p>
                    </div>
                  </div>
                  {item.bio ? <p className="mt-2 text-sm text-[var(--c-muted)]">{item.bio}</p> : null}
                  {item.selfIntro ? (
                    <p className="mt-2 text-sm text-[var(--c-muted)]">
                      <span className="font-semibold text-[var(--c-text)]">Intro: </span>
                      {item.selfIntro}
                    </p>
                  ) : null}
                  {item.education ? (
                    <p className="mt-2 text-sm text-[var(--c-muted)]">
                      <span className="font-semibold text-[var(--c-text)]">Education: </span>
                      {item.education}
                    </p>
                  ) : null}
                  {item.workExperience ? (
                    <p className="mt-2 text-sm text-[var(--c-muted)]">
                      <span className="font-semibold text-[var(--c-text)]">Work Experience: </span>
                      {item.workExperience}
                    </p>
                  ) : null}
                  {item.socials?.linkedin || item.socials?.instagram || item.socials?.website ? (
                    <div className="mt-2 text-sm text-[var(--c-muted)]">
                      <p className="font-semibold text-[var(--c-text)]">Social Media</p>
                      {item.socials?.linkedin ? <p>LinkedIn: {item.socials.linkedin}</p> : null}
                      {item.socials?.instagram ? <p>Instagram: {item.socials.instagram}</p> : null}
                      {item.socials?.website ? <p>Website: {item.socials.website}</p> : null}
                    </div>
                  ) : null}
                  {item.emergencyContact?.name || item.emergencyContact?.mobile ? (
                    <div className="mt-2 text-sm text-[var(--c-muted)]">
                      <p className="font-semibold text-[var(--c-text)]">Emergency Contact</p>
                      {item.emergencyContact?.name ? <p>Name: {item.emergencyContact.name}</p> : null}
                      {item.emergencyContact?.relation ? <p>Relation: {item.emergencyContact.relation}</p> : null}
                      {item.emergencyContact?.mobile ? <p>Mobile: {item.emergencyContact.mobile}</p> : null}
                    </div>
                  ) : null}
                  {item.medicalInfo?.bloodGroup || item.medicalInfo?.notes ? (
                    <div className="mt-2 text-sm text-[var(--c-muted)]">
                      <p className="font-semibold text-[var(--c-text)]">Medical Info</p>
                      {item.medicalInfo?.bloodGroup ? <p>Blood Group: {item.medicalInfo.bloodGroup}</p> : null}
                      {item.medicalInfo?.notes ? <p>Notes: {item.medicalInfo.notes}</p> : null}
                    </div>
                  ) : null}
                </article>
              ))}
              {publicProfiles.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-3 text-sm text-[var(--c-muted)]">
                  No public profiles available.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </PageShell>
      {flashVisible && (
        <div className="fixed right-4 top-24 z-50 rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg dark:bg-emerald-900/40 dark:text-emerald-300">
          Flash notification preview is enabled.
        </div>
      )}
    </>
  );
};

export default ProfilePage;

