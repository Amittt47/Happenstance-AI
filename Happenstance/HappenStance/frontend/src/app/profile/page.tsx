"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import {
  getStoredUser,
  getToken,
  clearSession,
  type AuthUser,
  api,
  type Profile,
} from "@/lib/api";
import { TagInput } from "@/components/profile/TagInput";
import { VisibilitySelector, type VisibilityOption } from "@/components/profile/VisibilitySelector";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";

// Backend validation constraints from ProfileController.java
const MAX_HEADLINE_LENGTH = 120;
const MAX_BIO_LENGTH = 1000;
const MAX_LOCATION_LENGTH = 120;
const MAX_INDUSTRY_LENGTH = 100;
const MAX_LIST_ITEMS = 30;
const MAX_LIST_ITEM_LENGTH = 60;

const POPULAR_SKILLS = [
  "TypeScript",
  "React",
  "Next.js",
  "Python",
  "Java",
  "Spring Boot",
  "Distributed Systems",
  "Graph Theory",
  "Machine Learning",
  "Docker",
  "Kubernetes",
  "Tailwind CSS",
  "MongoDB",
  "PostgreSQL",
  "GraphQL",
];

const POPULAR_INTERESTS = [
  "Artificial Intelligence",
  "Open Source",
  "Mentorship",
  "System Design",
  "Startups",
  "Cloud Architecture",
  "Deep Learning",
  "Agentic AI",
  "Career Growth",
  "Tech Leadership",
];

interface FormState {
  headline: string;
  bio: string;
  location: string;
  industry: string;
  skills: string[];
  interests: string[];
  visibility: VisibilityOption;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>({
    headline: "",
    bio: "",
    location: "",
    industry: "",
    skills: [],
    interests: [],
    visibility: "PUBLIC",
  });

  // Calculate profile completeness score (0-100%)
  const { completenessPercent, nextSuggestion } = useMemo(() => {
    let score = 0;
    const suggestions: string[] = [];

    // Display Name (Account)
    if (user?.displayName) score += 15;

    // Headline
    if (form.headline.trim()) {
      score += 20;
    } else {
      suggestions.push("Add a professional headline");
    }

    // Bio
    if (form.bio.trim()) {
      score += 20;
    } else {
      suggestions.push("Add a short bio / about section");
    }

    // Location & Industry
    if (form.location.trim()) score += 10;
    else suggestions.push("Add your location");

    if (form.industry.trim()) score += 10;
    else suggestions.push("Add your industry");

    // Skills
    if (form.skills.length >= 3) {
      score += 15;
    } else if (form.skills.length > 0) {
      score += 10;
      suggestions.push("Add at least 3 skills for better matchmaking");
    } else {
      suggestions.push("Add your core skills");
    }

    // Interests
    if (form.interests.length > 0) {
      score += 10;
    } else {
      suggestions.push("Add professional interests");
    }

    return {
      completenessPercent: Math.min(100, score),
      nextSuggestion: suggestions[0],
    };
  }, [user, form]);

  // Track unsaved modifications by comparing form with stored profile
  const hasUnsavedChanges = useMemo(() => {
    if (!profile) return false;
    if ((profile.headline || "") !== form.headline) return true;
    if ((profile.bio || "") !== form.bio) return true;
    if ((profile.location || "") !== form.location) return true;
    if ((profile.industry || "") !== form.industry) return true;
    if ((profile.visibility || "PUBLIC") !== form.visibility) return true;

    // Compare skills array
    const savedSkills = profile.skills || [];
    if (savedSkills.length !== form.skills.length) return true;
    if (savedSkills.some((s, idx) => s !== form.skills[idx])) return true;

    // Compare interests array
    const savedInterests = profile.interests || [];
    if (savedInterests.length !== form.interests.length) return true;
    if (savedInterests.some((i, idx) => i !== form.interests[idx])) return true;

    return false;
  }, [profile, form]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const p = await api.me();
      setProfile(p);
      setForm({
        headline: p.headline || "",
        bio: p.bio || "",
        location: p.location || "",
        industry: p.industry || "",
        skills: p.skills || [],
        interests: p.interests || [],
        visibility: (p.visibility as VisibilityOption) || "PUBLIC",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load profile.";
      setFetchError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const stored = getStoredUser();
    const token = getToken();

    if (!stored || !token) {
      router.push("/login");
      return;
    }

    setUser(stored);
    void loadProfile();
  }, [router, loadProfile]);

  const handleDiscardChanges = () => {
    if (!profile) return;
    setForm({
      headline: profile.headline || "",
      bio: profile.bio || "",
      location: profile.location || "",
      industry: profile.industry || "",
      skills: profile.skills || [],
      interests: profile.interests || [],
      visibility: (profile.visibility as VisibilityOption) || "PUBLIC",
    });
    setFieldErrors({});
    toast("Unsaved changes discarded.", "info");
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (form.headline.length > MAX_HEADLINE_LENGTH) {
      errors.headline = `Headline cannot exceed ${MAX_HEADLINE_LENGTH} characters.`;
    }

    if (form.bio.length > MAX_BIO_LENGTH) {
      errors.bio = `Bio cannot exceed ${MAX_BIO_LENGTH} characters.`;
    }

    if (form.location.length > MAX_LOCATION_LENGTH) {
      errors.location = `Location cannot exceed ${MAX_LOCATION_LENGTH} characters.`;
    }

    if (form.industry.length > MAX_INDUSTRY_LENGTH) {
      errors.industry = `Industry cannot exceed ${MAX_INDUSTRY_LENGTH} characters.`;
    }

    if (form.skills.length > MAX_LIST_ITEMS) {
      errors.skills = `Skills cannot contain more than ${MAX_LIST_ITEMS} items.`;
    }

    if (form.interests.length > MAX_LIST_ITEMS) {
      errors.interests = `Interests cannot contain more than ${MAX_LIST_ITEMS} items.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast("Please fix the validation errors before saving.", "error");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await api.updateProfile({
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        industry: form.industry.trim(),
        skills: form.skills,
        interests: form.interests,
        visibility: form.visibility,
      });

      // Update canonical profile state on success
      setProfile(updated);
      setSaveSuccess(true);
      toast("Profile updated successfully!", "success");

      // Auto-hide success alert after 4 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      // PRESERVE FORM DATA: Do NOT reset or discard form state here!
      const message =
        err instanceof Error ? err.message : "Failed to update profile.";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      <Navbar user={user} activeTab="profile" onLogout={handleLogout} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
        {/* Profile Header Banner & Overview */}
        <ProfileHeaderCard
          user={user}
          profile={profile}
          completenessPercent={completenessPercent}
          nextSuggestion={nextSuggestion}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Backend Offline / Fetch Error Notice */}
        {fetchError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-red-900">
                Could not retrieve latest profile from backend
              </p>
              <p className="text-xs text-red-700 mt-0.5">{fetchError}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProfile}
              className="text-xs bg-white text-red-800 border-red-300 hover:bg-red-50"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                ✓
              </span>
              <div>
                <p className="font-bold text-emerald-950">
                  Profile updated successfully!
                </p>
                <p className="text-xs text-emerald-700">
                  Your updated headline, skills, and details are now visible to your network.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccess(false)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Edit Profile Form Card */}
        <Card>
          <CardHeader
            title="Edit Profile Information"
            subtitle="Keep your professional headline, bio, skills, and industry up to date to get relevant connection recommendations."
            action={
              hasUnsavedChanges ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 hidden sm:inline-flex">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved edits
                  </span>
                  <Button
                    type="button"
                    variant="quiet"
                    size="sm"
                    onClick={handleDiscardChanges}
                    className="text-xs text-[#64748B] hover:text-[#0F172A]"
                  >
                    Discard
                  </Button>
                </div>
              ) : null
            }
          />

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-[#64748B]">
                Loading your profile details...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
              {/* Account Identity (Read-Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.displayName || "Member"}
                    className="w-full px-3.5 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-sm text-[#475569] cursor-not-allowed font-medium"
                  />
                  <span className="text-[10px] text-[#94A3B8] mt-1 block">
                    Account name registered with HappenStance
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full px-3.5 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-sm text-[#475569] cursor-not-allowed font-medium"
                  />
                  <span className="text-[10px] text-[#94A3B8] mt-1 block">
                    Verified primary login address
                  </span>
                </div>
              </div>

              {/* Headline */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                    Professional Headline
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      form.headline.length > MAX_HEADLINE_LENGTH
                        ? "text-[#DC2626] font-bold"
                        : "text-[#94A3B8]"
                    }`}
                  >
                    {form.headline.length} / {MAX_HEADLINE_LENGTH}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={MAX_HEADLINE_LENGTH}
                  value={form.headline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, headline: e.target.value }))
                  }
                  placeholder="e.g. Distributed Systems Engineer | Researcher in Graph AI & Agent Networks"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] transition-colors ${
                    fieldErrors.headline
                      ? "border-[#DC2626] focus:ring-[#DC2626]"
                      : "border-[#CBD5E1]"
                  }`}
                />
                {fieldErrors.headline ? (
                  <p className="text-xs text-[#DC2626] mt-1 font-medium">
                    {fieldErrors.headline}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Appears directly below your name across recommendations, member discovery, and connection requests.
                  </p>
                )}
              </div>

              {/* Location & Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                      Location
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        form.location.length > MAX_LOCATION_LENGTH
                          ? "text-[#DC2626] font-bold"
                          : "text-[#94A3B8]"
                      }`}
                    >
                      {form.location.length} / {MAX_LOCATION_LENGTH}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={MAX_LOCATION_LENGTH}
                    value={form.location}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="e.g. San Francisco, CA or Bengaluru, India"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] ${
                      fieldErrors.location
                        ? "border-[#DC2626] focus:ring-[#DC2626]"
                        : "border-[#CBD5E1]"
                    }`}
                  />
                  {fieldErrors.location && (
                    <p className="text-xs text-[#DC2626] mt-1">
                      {fieldErrors.location}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                      Industry
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        form.industry.length > MAX_INDUSTRY_LENGTH
                          ? "text-[#DC2626] font-bold"
                          : "text-[#94A3B8]"
                      }`}
                    >
                      {form.industry.length} / {MAX_INDUSTRY_LENGTH}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={MAX_INDUSTRY_LENGTH}
                    value={form.industry}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, industry: e.target.value }))
                    }
                    placeholder="e.g. Artificial Intelligence, Software Engineering, Cloud"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] ${
                      fieldErrors.industry
                        ? "border-[#DC2626] focus:ring-[#DC2626]"
                        : "border-[#CBD5E1]"
                    }`}
                  />
                  {fieldErrors.industry && (
                    <p className="text-xs text-[#DC2626] mt-1">
                      {fieldErrors.industry}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio / Summary */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                    About / Professional Bio
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      form.bio.length > MAX_BIO_LENGTH
                        ? "text-[#DC2626] font-bold"
                        : "text-[#94A3B8]"
                    }`}
                  >
                    {form.bio.length} / {MAX_BIO_LENGTH}
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={MAX_BIO_LENGTH}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Share a concise overview of your background, experience, key achievements, and the types of people or collaborations you are looking to find on HappenStance..."
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] leading-relaxed ${
                    fieldErrors.bio
                      ? "border-[#DC2626] focus:ring-[#DC2626]"
                      : "border-[#CBD5E1]"
                  }`}
                />
                {fieldErrors.bio ? (
                  <p className="text-xs text-[#DC2626] mt-1">
                    {fieldErrors.bio}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#64748B] mt-1">
                    A well-written summary helps potential connections understand your work and conversation starters.
                  </p>
                )}
              </div>

              {/* Skills Tag Input */}
              <div className="pt-2">
                <TagInput
                  label="Skills & Core Competencies"
                  helperText={`(Max ${MAX_LIST_ITEMS} skills, max ${MAX_LIST_ITEM_LENGTH} chars each)`}
                  items={form.skills}
                  onChange={(newSkills) =>
                    setForm((prev) => ({ ...prev, skills: newSkills }))
                  }
                  placeholder="e.g. Distributed Systems, Python, Next.js (press Enter or comma)"
                  maxItems={MAX_LIST_ITEMS}
                  maxItemLength={MAX_LIST_ITEM_LENGTH}
                  variant="primary"
                  suggestions={POPULAR_SKILLS}
                />
                {fieldErrors.skills && (
                  <p className="text-xs text-[#DC2626] mt-1">
                    {fieldErrors.skills}
                  </p>
                )}
              </div>

              {/* Interests Tag Input */}
              <div className="pt-2">
                <TagInput
                  label="Interests & Collaboration Areas"
                  helperText={`(Max ${MAX_LIST_ITEMS} interests, max ${MAX_LIST_ITEM_LENGTH} chars each)`}
                  items={form.interests}
                  onChange={(newInterests) =>
                    setForm((prev) => ({ ...prev, interests: newInterests }))
                  }
                  placeholder="e.g. Graph Neural Networks, Open Source, Mentorship (press Enter or comma)"
                  maxItems={MAX_LIST_ITEMS}
                  maxItemLength={MAX_LIST_ITEM_LENGTH}
                  variant="secondary"
                  suggestions={POPULAR_INTERESTS}
                />
                {fieldErrors.interests && (
                  <p className="text-xs text-[#DC2626] mt-1">
                    {fieldErrors.interests}
                  </p>
                )}
              </div>

              {/* Visibility Selector */}
              <div className="pt-2">
                <VisibilitySelector
                  value={form.visibility}
                  onChange={(newVisibility) =>
                    setForm((prev) => ({ ...prev, visibility: newVisibility }))
                  }
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-6 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[#64748B] order-2 sm:order-1">
                  {hasUnsavedChanges ? (
                    <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      You have unsaved edits
                    </span>
                  ) : (
                    <span>All changes saved to your HappenStance profile.</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                  {hasUnsavedChanges && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      disabled={saving}
                      onClick={handleDiscardChanges}
                      className="flex-1 sm:flex-initial"
                    >
                      Discard
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={saving}
                    className="flex-1 sm:flex-initial min-w-[160px]"
                  >
                    Save Profile Changes
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Card>
      </main>

      {/* Floating Sticky Save Bar (surfaces when scrolled down with unsaved changes) */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#CBD5E1] shadow-xl py-3 px-4 sm:px-8 transition-transform duration-300">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                  Unsaved changes on your profile
                </p>
                <p className="text-[11px] text-[#64748B] hidden sm:block truncate">
                  Don&apos;t forget to save before leaving this page.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                disabled={saving}
                onClick={handleDiscardChanges}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                Discard
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={saving}
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                className="text-xs min-w-[120px]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
