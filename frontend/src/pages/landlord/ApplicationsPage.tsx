import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { propertiesApi, rentalsApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Property, RentalApplication } from "../../types";
import toast from "react-hot-toast";

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [updatingApplication, setUpdatingApplication] = useState<string | null>(null);

  useEffect(() => {
    propertiesApi.myListings()
      .then((result) => {
        setProperties(result.results);
        if (result.results.length) setSelectedPropertyId(result.results[0].id);
      })
      .catch(() => toast.error("Unable to load your listings."))
      .finally(() => setLoadingProperties(false));
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) {
      setApplications([]);
      return;
    }

    setLoadingApplications(true);
    rentalsApi.getApplicationsForProperty(selectedPropertyId)
      .then(setApplications)
      .catch(() => toast.error("Unable to load applications."))
      .finally(() => setLoadingApplications(false));
  }, [selectedPropertyId]);

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    setUpdatingApplication(applicationId);
    try {
      const updated = await rentalsApi.updateApplicationStatus(applicationId, status);
      setApplications((current) => current.map((app) => app.id === applicationId ? updated : app));
      toast.success(`Application ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "updated"}.`);
    } catch {
      toast.error("Unable to update application status.");
    } finally {
      setUpdatingApplication(null);
    }
  };

  const selectedProperty = properties.find((property) => property.id === selectedPropertyId);

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="bg-hero-gradient text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate("/landlord/dashboard")}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-primary-200 text-sm">Landlord Applications</p>
              <h1 className="text-2xl sm:text-3xl font-bold">Manage Rental Requests</h1>
            </div>
            <Link to="/landlord/appointments" className="btn-outline">
              View Appointments
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-surface-900 text-lg">Property Selector</h2>
              <p className="text-surface-500 text-sm">Choose a listing to view its tenant applications.</p>
            </div>
            <div>
              {loadingProperties ? (
                <div className="text-surface-500">Loading listings…</div>
              ) : properties.length === 0 ? (
                <Link to="/landlord/add-property" className="btn-primary">
                  Add your first listing
                </Link>
              ) : (
                <select className="select" value={selectedPropertyId}
                  onChange={(event) => setSelectedPropertyId(event.target.value)}>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>{property.title}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-surface-900">Applications</h2>
              <p className="text-surface-500 text-sm">
                {selectedProperty ? `Requests for ${selectedProperty.title}` : "Select a property to view applications."}
              </p>
            </div>
            <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-surface-600">
              {applications.length} total
            </span>
          </div>

          {loadingApplications ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-2xl bg-surface-100 animate-pulse" />
              ))}
            </div>
          ) : selectedPropertyId && applications.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              No applications have been submitted yet for this property.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-surface-900">Applicant ID: {application.seeker_id}</p>
                      <p className="text-surface-500 text-sm">Applied: {new Date(application.applied_at).toLocaleDateString()}</p>
                      <p className="text-surface-600 text-sm">Move-in date: {application.move_in_date ?? "Flexible"}</p>
                    </div>
                    <span className={`badge-${application.application_status === "approved" ? "green" : application.application_status === "rejected" ? "maroon" : "amber"} capitalize`}> {application.application_status} </span>
                  </div>

                  {application.message ? (
                    <p className="mt-4 text-surface-600">"{application.message}"</p>
                  ) : null}

                  {application.application_status === "pending" ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button disabled={updatingApplication === application.id}
                        onClick={() => handleUpdateStatus(application.id, "approved")}
                        className="btn-primary gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button disabled={updatingApplication === application.id}
                        onClick={() => handleUpdateStatus(application.id, "rejected")}
                        className="btn-ghost gap-2">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
