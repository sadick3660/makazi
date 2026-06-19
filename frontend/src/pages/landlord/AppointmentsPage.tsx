import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, CheckCircle2, XCircle } from "lucide-react";
import { propertiesApi, rentalsApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Property, Appointment } from "../../types";
import toast from "react-hot-toast";

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [updatingAppointment, setUpdatingAppointment] = useState<string | null>(null);

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
      setAppointments([]);
      return;
    }

    setLoadingAppointments(true);
    rentalsApi.getAppointmentsForProperty(selectedPropertyId)
      .then(setAppointments)
      .catch(() => toast.error("Unable to load appointments."))
      .finally(() => setLoadingAppointments(false));
  }, [selectedPropertyId]);

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    setUpdatingAppointment(appointmentId);
    try {
      const updated = await rentalsApi.updateAppointmentStatus(appointmentId, status);
      setAppointments((current) => current.map((appointment) => appointment.id === appointmentId ? updated : appointment));
      toast.success(`Appointment ${status === "completed" ? "marked completed" : status === "cancelled" ? "cancelled" : "updated"}.`);
    } catch {
      toast.error("Unable to update appointment status.");
    } finally {
      setUpdatingAppointment(null);
    }
  };

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
              <p className="text-primary-200 text-sm">Landlord Appointments</p>
              <h1 className="text-2xl sm:text-3xl font-bold">View Property Visits</h1>
            </div>
            <Link to="/landlord/applications" className="btn-outline">
              View Applications
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-surface-900 text-lg">Choose a Listing</h2>
              <p className="text-surface-500 text-sm">Select the property to see scheduled visits.</p>
            </div>
            <div>
              {loadingProperties ? (
                <div className="text-surface-500">Loading listings…</div>
              ) : properties.length === 0 ? (
                <Link to="/landlord/add-property" className="btn-primary">
                  Add a property
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
              <h2 className="font-semibold text-surface-900">Appointments</h2>
              <p className="text-surface-500 text-sm">Scheduled viewings for your selected listing.</p>
            </div>
            <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-surface-600">
              {appointments.length} appointments
            </span>
          </div>

          {loadingAppointments ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-2xl bg-surface-100 animate-pulse" />
              ))}
            </div>
          ) : selectedPropertyId && appointments.length === 0 ? (
            <div className="text-center py-12 text-surface-500">No appointments scheduled yet for this property.</div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-surface-900">Seeker ID: {appointment.seeker_id}</p>
                      <p className="text-surface-500 text-sm"><CalendarDays className="inline w-4 h-4 mr-1" /> {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleString() : "TBD"}</p>
                      <p className="text-surface-600 text-sm"><Clock3 className="inline w-4 h-4 mr-1" /> Status: {appointment.status}</p>
                    </div>
                    <span className={`badge-${appointment.status === "completed" ? "green" : appointment.status === "cancelled" ? "maroon" : "amber"} capitalize`}> {appointment.status} </span>
                  </div>

                  {appointment.notes ? (
                    <p className="mt-4 text-surface-600">"{appointment.notes}"</p>
                  ) : null}

                  {appointment.status === "scheduled" ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button disabled={updatingAppointment === appointment.id}
                        onClick={() => handleUpdateStatus(appointment.id, "completed")}
                        className="btn-primary gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Mark Completed
                      </button>
                      <button disabled={updatingAppointment === appointment.id}
                        onClick={() => handleUpdateStatus(appointment.id, "cancelled")}
                        className="btn-ghost gap-2">
                        <XCircle className="w-4 h-4" /> Cancel
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
