"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export default function AdminPropertyEditForm({
  property,
  onSaved,
}: {
  property: any;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: property.title || "",
    description: property.description || "",
    price: property.price ?? 0,
    type: property.type || "HOUSE",
    listingType: property.listingType || "SALE",
    bedrooms: property.bedrooms ?? "",
    bathrooms: property.bathrooms ?? "",
    area: property.area ?? 0,
    address: property.address || "",
    contactPhone: property.contactPhone || "",
  });

  const save = async () => {
    try {
      setSaving(true);
      await axios.put(
        `/api/admin/properties/${property.id}`,
        {
          title: form.title,
          description: form.description,
          price: Number(form.price),
          type: form.type,
          listingType: form.listingType,
          bedrooms: form.bedrooms === "" ? null : Number(form.bedrooms),
          bathrooms: form.bathrooms === "" ? null : Number(form.bathrooms),
          area: Number(form.area),
          address: form.address,
          contactPhone: form.contactPhone || null,
        },
        { headers: { "x-admin-auth": "true" } }
      );
      toast.success("Property details saved — ready to assign an agent");
      onSaved();
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to save property";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    opts?: { type?: string; rows?: number }
  ) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      {opts?.rows ? (
        <textarea
          rows={opts.rows}
          value={String(form[key])}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      ) : (
        <input
          type={opts?.type || "text"}
          value={String(form[key])}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      )}
    </div>
  );

  return (
    <div className="p-6 border-t border-gray-200">
      <h2 className="text-lg font-semibold mb-1">Edit property details</h2>
      <p className="text-sm text-gray-500 mb-4">
        Review and correct every field before assigning an agent for verification.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{field("Title", "title")}</div>
        <div className="sm:col-span-2">{field("Description", "description", { rows: 4 })}</div>
        {field("Price (PKR)", "price", { type: "number" })}
        {field("Area (sq ft)", "area", { type: "number" })}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Listing type
          </label>
          <select
            value={form.listingType}
            onChange={(e) => setForm((f) => ({ ...f, listingType: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="SALE">Sale</option>
            <option value="RENTAL">Rental</option>
          </select>
        </div>
        {field("Bedrooms", "bedrooms", { type: "number" })}
        {field("Bathrooms", "bathrooms", { type: "number" })}
        <div className="sm:col-span-2">{field("Address", "address")}</div>
        {field("Contact phone", "contactPhone")}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save details (prepare for agent)"}
      </button>
    </div>
  );
}
