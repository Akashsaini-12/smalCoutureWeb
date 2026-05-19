import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  adminUpdateSiteLogo,
  fetchSiteLogoPublic,
  uploadImageToCloudinary,
} from "../../redux/actions";

export default function SiteBrandingAdminSection() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchSiteLogoPublic()
      .then((res) => {
        if (!mounted) return;
        setLogoUrl(String(res?.logoUrl || "").trim());
      })
      .catch(() => {
        if (!mounted) return;
        setLogoUrl("");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const uploadAndSave = async () => {
    if (!file) {
      toast.error("Please select a logo image");
      return;
    }
    setSaving(true);
    try {
      const url = await uploadImageToCloudinary(file);
      const updated = await adminUpdateSiteLogo(url);
      setLogoUrl(String(updated?.logoUrl || url || "").trim());
      toast.success("Logo updated");
      setFile(null);
    } catch (e) {
      toast.error(e?.message || "Failed to update logo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Branding</div>
          <div className="section-desc">Update header logo from admin</div>
        </div>
      </div>

      <div
        className="table-wrap"
        style={{ padding: 14, display: "grid", gap: 12, maxWidth: 680 }}
      >
        <div style={{ fontWeight: 900, color: "#0f172a" }}>Header logo</div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)
              }
              disabled={saving}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={uploadAndSave}
              disabled={saving}
            >
              {saving ? "Uploading..." : "Upload & save"}
            </button>
            {logoUrl ? (
              <a
                className="btn btn-ghost"
                href={logoUrl}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                Open logo
              </a>
            ) : null}
          </div>

          <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>
            {loading ? "Loading current logo..." : logoUrl ? "Current logo preview:" : "No logo set yet (fallback logo will be used)."}
          </div>

          {logoUrl ? (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 110,
              }}
            >
              <img
                src={logoUrl}
                alt="Site logo"
                style={{ maxHeight: 72, maxWidth: "100%", objectFit: "contain" }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

