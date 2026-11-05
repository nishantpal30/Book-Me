import { useEffect, useState } from "react";
import p6Image from "../assets/P6.png";
import C1 from "../assets/icons/C1.png";
import C2 from "../assets/icons/C2.png";
import C3 from "../assets/icons/C3.png";
import C4 from "../assets/icons/C4.png";
import C5 from "../assets/icons/C5.png";
import C6 from "../assets/icons/C6.png";
import C7 from "../assets/icons/C7.png";
import C8 from "../assets/icons/C8.png";
import AppLayout from "../components/AppLayout";
import { useToast } from "../context/ToastContext";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../api/services";
import { getMe } from "../api/auth";
import {
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  IndianRupee,
  FileText,
  Layers,
  QrCode,
  Share2,
} from "lucide-react";
import { servicesPageStyles as s } from "../utils/dummystyle";

const ICON_MAP = {
  "C1.png": C1,
  "C2.png": C2,
  "C3.png": C3,
  "C4.png": C4,
  "C5.png": C5,
  "C6.png": C6,
  "C7.png": C7,
  "C8.png": C8,
};

const emptyForm = {
  name: "",
  duration: 30,
  price: 0,
  description: "",
  icon: "C1.png",
};

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [businessSlug, setBusinessSlug] = useState("");
  const [qrService, setQrService] = useState(null);
  const [shareMessage, setShareMessage] = useState("");

  const showToast = useToast();

  const applyServices = (items) => {
    setServices(items || []);
  };

  const loadServices = async () => {
    try {
      const { data } = await listServices();

      applyServices(data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load services");
    }
  };

  useEffect(() => {
    loadServices();
    getMe()
      .then(({ data }) => setBusinessSlug(data.user?.slug || ""))
      .catch((error) => setMessage(error.response?.data?.message || "Could not load your booking link"));
  }, []);

  const serviceBookingLink = (service) => (
    `${window.location.origin}/book/${businessSlug}?service=${encodeURIComponent(service._id)}`
  );
  const qrImageUrl = (service) => (
    `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(serviceBookingLink(service))}`
  );
  const shareBookingLink = async () => {
    if (!qrService) return;
    const url = serviceBookingLink(qrService);
    try {
      if (navigator.share) {
        await navigator.share({ title: `Book ${qrService.name}`, url });
        setShareMessage("Booking link shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Booking link copied");
      }
    } catch (error) {
      if (error.name !== "AbortError") setShareMessage("Could not share this booking link");
    }
  };

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        price: Number(form.price),
      };

      if (editingId) {
        await updateService(editingId, payload);
      } else {
        await createService(payload);
      }

      setForm(emptyForm);
      setEditingId("");

      showToast(
        editingId
          ? "Service updated successfully"
          : "Service added successfully",
      );

      loadServices();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Could not save service",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleService = async (service) => {
    await updateService(service._id, {
      isActive: !service.isActive,
    });
    loadServices();
  };

  const startEditing = (service) => {
    setEditingId(service._id);
    setForm({
      name: service.name,
      duration: service.duration,
      price: service.price,
      description: service.description,
      icon: service.icon || "C1.png",
    });
    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId("");
    setForm(emptyForm);
    setMessage("");
  };

  const confirmDelete = (service) => {
    setDeleteConfirm(service);
  };

 const executeDelete = async () => {
  if (!deleteConfirm) return;

  const serviceToDelete = deleteConfirm;

  try {
    setLoading(true);

    await deleteService(serviceToDelete._id);

    // Optimistic UI update
    setServices((prev) =>
      prev.filter((s) => s._id !== serviceToDelete._id)
    );

    if (editingId === serviceToDelete._id) {
      cancelEditing();
    }

    setDeleteConfirm(null);                      // close modal first
    showToast("Service deleted successfully");   // then toast
  } catch (error) {
    console.error("Delete service error:", error);
    showToast(
      error.response?.data?.message || "Could not delete service",
      "error",
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <AppLayout>
      {/* LEFT: Form */}
      <section>
        <div className={s.headerRow}>
          <div>
            <p className={s.pageLabel}>Services</p>
            <h1 className={s.mainHeading}>
              Shape what customers can{" "}
              <span className={s.gradientText}>book.</span>
            </h1>
            <p className={s.subText}>
              Add each appointment type with a duration and price. Active
              services appear on your public booking page.
            </p>
          </div>
          <div className={s.illustrationContainer}>
            <img
              src={p6Image}
              alt="Illustration"
              className={s.illustrationImg}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className={s.formCard}>
          <h3 className={s.formTitle}>
            <Plus className={s.formTitleIcon} />
            {editingId ? "Edit service" : "Add new service"}
          </h3>

          <div className={s.formGrid}>
            <label className={s.inputLabel}>
              Service name
              <div className={s.inputWrapper}>
                <Layers className={s.inputIcon} />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={s.textInput}
                  placeholder="Consultation"
                />
              </div>
            </label>

            <div className={s.durationPriceGrid}>
              <label className={s.inputLabel}>
                Duration
                <div className={s.inputWrapper}>
                  <Clock className={s.inputIcon} />
                  <select
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    className={s.selectInput}
                  >
                    {[15, 30, 45, 60, 90, 120].map((value) => (
                      <option key={value} value={value}>
                        {value} minutes
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className={s.inputLabel}>
                Price
                <div className={s.inputWrapper}>
                  <IndianRupee className={s.inputIcon} />
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    className={s.priceInput}
                  />
                </div>
              </label>
            </div>

            <label className={s.inputLabel}>
              Description
              <div className={s.textareaWrapper}>
                <FileText className={s.textareaIcon} />
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  className={s.textareaInput}
                  placeholder="A short customer-facing description"
                />
              </div>
            </label>

            <label className={s.inputLabel}>
              Service Icon
              <div className={s.iconGrid}>
                {Object.keys(ICON_MAP).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, icon: iconName }))
                    }
                    className={
                      form.icon === iconName
                        ? s.iconBtnActive
                        : s.iconBtnInactive
                    }
                  >
                    <img
                      src={ICON_MAP[iconName]}
                      alt="Service Icon"
                      className={s.iconImg}
                    />
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className={s.formActions}>
            <button type="submit" disabled={loading} className={s.submitButton}>
              <Save className={s.submitIcon} />
              {loading
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add service"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEditing}
                className={s.cancelButton}
              >
                <X className={s.cancelIcon} />
                Cancel
              </button>
            )}
          </div>

          {message && <p className={s.message}>{message}</p>}
        </form>
      </section>

      {/* RIGHT: Service list */}
      <section className={s.rightSection}>
        <h2 className={s.rightTitle}>
          <Layers className={s.rightTitleIcon} />
          Your services
        </h2>

        <div className={s.serviceList}>
          {services.length === 0 && (
            <div className={s.emptyState}>
              <Layers className={s.emptyIcon} />
              <p className={s.emptyText}>No services yet.</p>
            </div>
          )}

          {services.map((service) => (
            <article key={service._id} className={s.serviceCard}>
              <div className={s.serviceCardInner}>
                <div className={s.serviceInfoRow}>
                  <div className={s.serviceIconContainer}>
                    <img
                      src={ICON_MAP[service.icon || "C1.png"]}
                      alt={service.name}
                      className={s.serviceIconImg}
                    />
                  </div>

                  <div className={s.serviceTextBlock}>
                    <h3 className={s.serviceName}>{service.name}</h3>
                    <p className={s.serviceDetail}>
                      {service.duration} min · ₹
                      {Number(service.price).toLocaleString()}
                    </p>
                    {service.description && (
                      <p className={s.serviceDesc}>{service.description}</p>
                    )}
                  </div>
                </div>

                <div className={s.serviceActions}>
                  <button
                    type="button"
                    onClick={() => toggleService(service)}
                    className={
                      service.isActive
                        ? s.visibilityBadgeActive
                        : s.visibilityBadgeInactive
                    }
                  >
                    {service.isActive ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    {service.isActive ? "Active" : "Hidden"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setQrService(service); setShareMessage(""); }}
                    disabled={!businessSlug || !service.isActive}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
                    aria-label={`Share ${service.name} booking QR code`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Share
                  </button>

                  <button
                    type="button"
                    onClick={() => startEditing(service)}
                    className={s.editButton}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => confirmDelete(service)}
                    className={s.deleteButton}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {qrService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setQrService(null)}>
          <section
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-qr-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <QrCode className="h-6 w-6" />
            </div>
            <h2 id="service-qr-title" className="mt-3 text-lg font-bold text-slate-900">Share {qrService.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Customers can scan this code to open the booking page for this service.</p>
            <img
              src={qrImageUrl(qrService)}
              alt={`QR code for booking ${qrService.name}`}
              className="mx-auto mt-4 h-56 w-56 rounded-lg border border-slate-200 bg-white p-2"
            />
            <a href={qrImageUrl(qrService)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-violet-700 underline">
              Open or save QR image
            </a>
            <a href={serviceBookingLink(qrService)} target="_blank" rel="noreferrer" className="mt-3 block break-all text-xs text-violet-700 underline">
              {serviceBookingLink(qrService)}
            </a>
            {shareMessage && <p className="mt-2 text-sm text-slate-600" role="status">{shareMessage}</p>}
            <div className="mt-5 flex justify-center gap-3">
              <button type="button" onClick={() => setQrService(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Close</button>
              <button type="button" onClick={shareBookingLink} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
                <Share2 className="h-4 w-4" /> Share link
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Delete Service
              </h2>

              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-700">
                  {deleteConfirm.name}
                </span>
                ? Existing bookings will remain, but customers will no longer be
                able to book this service. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Deleting..." : "Delete Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ServicesPage;
