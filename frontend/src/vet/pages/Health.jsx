import React, { useEffect, useState } from "react";
import {
  addHealthMetricByVet,
  getVetPetsMetrics,  // Now returns DTO with pet info
  getActivePetAlerts,
  resolveHealthAlert
} from "../../api/api";
import { 
  Plus, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Weight, 
  Moon, 
  Activity, 
  Utensils, 
  Heart, 
  TrendingUp,
  Clock,
  User,
  Thermometer,
  HeartPulse,
  Wind,
  Stethoscope,
  Dog,
  Cat
} from "lucide-react";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const severityStyle = {
  HIGH: "bg-red-50 text-red-800 shadow-sm",
  MEDIUM: "bg-amber-50 text-amber-800 shadow-sm",
  LOW: "bg-emerald-50 text-emerald-800 shadow-sm"
};

const metricIcons = {
  weight: <Weight className="text-purple-600" size={20} />,
  temperature: <Thermometer className="text-red-600" size={20} />,
  pulse: <HeartPulse className="text-pink-600" size={20} />,
  respirationRate: <Wind className="text-blue-600" size={20} />,
  sleepHours: <Moon className="text-blue-600" size={20} />,
  activityLevel: <Activity className="text-green-600" size={20} />,
  appetiteLevel: <Utensils className="text-amber-600" size={20} />,
  stressLevel: <Heart className="text-pink-600" size={20} />
};

const getPetIcon = (species) => {
  switch (species?.toLowerCase()) {
    case 'dog':
      return <Dog className="text-amber-600" size={16} />;
    case 'cat':
      return <Cat className="text-gray-600" size={16} />;
    default:
      return <Dog className="text-gray-400" size={16} />;
  }
};

const Health = () => {
  const userId = localStorage.getItem("userId");
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petId, setPetId] = useState("");
  const [metrics, setMetrics] = useState([]);
  const [allPetMetrics, setAllPetMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    weight: "",
    temperature: "",
    pulse: "",
    respirationRate: "",
    stressLevel: "",
    activityLevel: "",
    appetiteLevel: "",
    sleepHours: "",
    notes: ""
  });

  // Load all metrics for pets under vet's care using the new DTO endpoint
  useEffect(() => {
    const loadVetPetsMetrics = async () => {
      setIsLoading(true);
      try {
        // Use the new endpoint that returns DTO with pet info
        const response = await getVetPetsMetrics(userId);
        const allMetrics = response.data || [];
        
        console.log("Vet pets metrics DTO:", allMetrics); // For debugging
        
        // Extract unique pets from DTO (now has petId, petName, petSpecies)
        const uniquePets = [];
        const petIds = new Set();
        
        allMetrics.forEach(metric => {
          if (metric.petId && !petIds.has(metric.petId)) {
            petIds.add(metric.petId);
            uniquePets.push({
              id: metric.petId,
              name: metric.petName,
              species: metric.petSpecies
            });
          }
        });
        
        setPets(uniquePets);
        
        // Group metrics by pet using petId from DTO
        const metricsMap = {};
        uniquePets.forEach(pet => {
          const petMetrics = allMetrics.filter(m => m.petId === pet.id);
          metricsMap[pet.id] = petMetrics;
        });
        
        setAllPetMetrics(metricsMap);
        
      } catch (error) {
        toast.error("Failed to load pet health data");
        console.error("Error loading vet pets metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVetPetsMetrics();
  }, [userId]);

  // When pet selection changes, filter metrics and load alerts
  useEffect(() => {
    if (!petId) {
      setSelectedPet(null);
      setMetrics([]);
      setAlerts([]);
      return;
    }

    const loadPetData = async () => {
      setIsLoading(true);
      try {
        const pet = pets.find(p => p.id === petId);
        setSelectedPet(pet);
        
        // Get metrics for selected pet from already loaded data
        const petMetrics = allPetMetrics[petId] || [];
        setMetrics(petMetrics);
        
        // Load alerts for selected pet
        const alertsRes = await getActivePetAlerts(petId);
        setAlerts(alertsRes.data || []);
        
      } catch (error) {
        toast.error("Failed to load pet alerts");
        console.error("Error loading pet data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPetData();
  }, [petId, pets, allPetMetrics]);

  // Load all alerts for all pets when viewing "All Pets"
  useEffect(() => {
    const loadAllAlerts = async () => {
      if (!petId && pets.length > 0) {
        setIsLoading(true);
        try {
          // Load alerts for all pets
          const allAlerts = [];
          for (const pet of pets) {
            const alertsRes = await getActivePetAlerts(pet.id);
            if (alertsRes.data) {
              // Add pet name to each alert for display
              const alertsWithPetInfo = alertsRes.data.map(alert => ({
                ...alert,
                petName: pet.name
              }));
              allAlerts.push(...alertsWithPetInfo);
            }
          }
          setAlerts(allAlerts);
        } catch (error) {
          console.error("Error loading all alerts:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAllAlerts();
  }, [petId, pets]);

  const addMetric = async () => {
    if (!petId) {
      toast.warning("Please select a pet first");
      return;
    }

    // Validate required fields
    const requiredFields = ['weight', 'stressLevel', 'activityLevel', 'appetiteLevel', 'sleepHours'];
    const emptyFields = requiredFields.filter(field => !form[field]);
    
    if (emptyFields.length > 0) {
      toast.error(`Please fill in: ${emptyFields.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      await addHealthMetricByVet(petId, {
        weight: Number(form.weight),
        temperature: form.temperature ? Number(form.temperature) : null,
        pulse: form.pulse ? Number(form.pulse) : null,
        respirationRate: form.respirationRate ? Number(form.respirationRate) : null,
        stressLevel: Number(form.stressLevel),
        activityLevel: Number(form.activityLevel),
        appetiteLevel: Number(form.appetiteLevel),
        sleepHours: Number(form.sleepHours),
        notes: form.notes
      });

      toast.success("✅ Clinical metric added successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Refresh ALL data by calling the vet endpoint again
      const response = await getVetPetsMetrics(userId);
      const allMetrics = response.data || [];
      
      // Update unique pets list from DTO
      const uniquePets = [];
      const petIdsSet = new Set();
      
      allMetrics.forEach(metric => {
        if (metric.petId && !petIdsSet.has(metric.petId)) {
          petIdsSet.add(metric.petId);
          uniquePets.push({
            id: metric.petId,
            name: metric.petName,
            species: metric.petSpecies
          });
        }
      });
      
      setPets(uniquePets);
      
      // Update metrics map
      const metricsMap = {};
      uniquePets.forEach(pet => {
        const petMetrics = allMetrics.filter(m => m.petId === pet.id);
        metricsMap[pet.id] = petMetrics;
      });
      
      setAllPetMetrics(metricsMap);
      
      // Update current pet's metrics
      setMetrics(metricsMap[petId] || []);
      
      // Load alerts for current pet
      const alertsRes = await getActivePetAlerts(petId);
      setAlerts(alertsRes.data || []);

      setShowAdd(false);
      setForm({
        weight: "",
        temperature: "",
        pulse: "",
        respirationRate: "",
        stressLevel: "",
        activityLevel: "",
        appetiteLevel: "",
        sleepHours: "",
        notes: ""
      });

    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Failed to add health metric';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAlert = async (id) => {
    try {
      await resolveHealthAlert(id);
      
      // Refresh alerts
      if (petId) {
        // If viewing specific pet, reload its alerts
        const res = await getActivePetAlerts(petId);
        setAlerts(res.data || []);
      } else {
        // If viewing all pets, reload all alerts
        const allAlerts = [];
        for (const pet of pets) {
          const alertsRes = await getActivePetAlerts(pet.id);
          if (alertsRes.data) {
            const alertsWithPetInfo = alertsRes.data.map(alert => ({
              ...alert,
              petName: pet.name
            }));
            allAlerts.push(...alertsWithPetInfo);
          }
        }
        setAlerts(allAlerts);
      }
      
      toast.success("Alert resolved successfully");
    } catch (error) {
      toast.error("Failed to resolve alert");
    }
  };

  // Decide what to show - use the DTO data
  const displayedMetrics = petId
    ? metrics
    : Object.values(allPetMetrics).flat();

  // Chart data - only show if we have data
  const chartData = displayedMetrics
    .filter(m => m.date) // Filter out metrics without date
    .map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      }),
      timestamp: new Date(m.date).getTime(),
      weight: m.weight,
      temperature: m.temperature,
      sleep: m.sleepHours,
      activity: m.activityLevel,
      appetite: m.appetiteLevel,
      stress: m.stressLevel,
      pulse: m.pulse,
      respiration: m.respirationRate
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-7); // Last 7 entries

  // Get latest metric for quick overview
  const latestMetric = displayedMetrics[0];

  // Render metric card
  const MetricCard = ({ icon, label, value, unit = "", color = "gray" }) => (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-2 rounded-lg bg-gray-50 mb-2">
        {icon}
      </div>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className={`text-xl font-bold mt-1 text-${color}-600`}>
        {value !== null && value !== undefined ? value : 'N/A'}
        {value !== null && value !== undefined && unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </span>
    </div>
  );

  if (isLoading && pets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clinical data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Stethoscope className="text-purple-600" />
            Clinical Health Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage health metrics for pets under your care
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pet Selector */}
          <div className="relative">
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="px-4 py-2.5 pl-4 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="">All Pets ({pets.length})</option>
              {pets.map(p => (
                <option key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    {getPetIcon(p.species)}
                    {p.name} ({p.species})
                  </div>
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg 
                className="h-5 w-5 text-gray-400" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          </div>

          <button
            onClick={() => {
              if (!petId) {
                toast.warning("Please select a pet first");
                return;
              }
              setShowAdd(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus size={18} /> Add Clinical Metric
          </button>
        </div>
      </div>

      {/* Show message if no pets */}
      {pets.length === 0 && !isLoading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Stethoscope size={64} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Pets Under Your Care
          </h3>
          <p className="text-gray-500 mb-4">
            You don't have any approved or completed appointments with pets yet.
          </p>
          <p className="text-sm text-gray-400">
            Health metrics will appear here once you have consultations with pets.
          </p>
        </div>
      )}

      {/* Quick Stats Overview - Only show if we have a pet selected */}
      {latestMetric && petId && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <MetricCard
            icon={metricIcons.weight}
            label="Weight"
            value={latestMetric.weight}
            unit="kg"
            color="purple"
          />
          <MetricCard
            icon={metricIcons.temperature}
            label="Temperature"
            value={latestMetric.temperature}
            unit="°C"
            color="red"
          />
          <MetricCard
            icon={metricIcons.pulse}
            label="Pulse"
            value={latestMetric.pulse}
            unit="BPM"
            color="pink"
          />
          <MetricCard
            icon={metricIcons.respirationRate}
            label="Respiration"
            value={latestMetric.respirationRate}
            unit="bpm"
            color="blue"
          />
          <MetricCard
            icon={metricIcons.sleepHours}
            label="Sleep"
            value={latestMetric.sleepHours}
            unit="hrs"
            color="blue"
          />
        </div>
      )}

      {/* Alerts Section - Show alerts for selected pet or all pets */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              Active Health Alerts ({alerts.length})
              {selectedPet && ` for ${selectedPet.name}`}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(a => (
              <div
                key={a.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl ${severityStyle[a.severity]}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      a.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                      a.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="font-semibold text-gray-900">{a.alertType}</span>
                    {!petId && a.petName && (
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {a.petName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{a.message}</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(a.createdAt).toLocaleDateString()}
                    {!petId && a.petName && ` • Pet: ${a.petName}`}
                  </p>
                </div>

                <button
                  onClick={() => resolveAlert(a.id)}
                  className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors duration-200"
                >
                  <CheckCircle size={16} /> Mark Resolved
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section - Only show if we have chart data */}
      {chartData.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-purple-600" />
                Clinical Health Trends
                {selectedPet && <span className="text-purple-600 ml-2">for {selectedPet.name}</span>}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Visual trends to understand pet's health over time
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vital Signs Chart */}
            <div className="h-72">
              <p className="font-medium mb-4 text-gray-700 flex items-center gap-2">
                <Thermometer size={18} className="text-red-600" />
                <HeartPulse size={18} className="text-pink-600" />
                Vital Signs
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#dc2626"
                    strokeWidth={3}
                    name="Temp (°C)"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pulse"
                    stroke="#db2777"
                    strokeWidth={3}
                    name="Pulse (BPM)"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="respiration"
                    stroke="#2563eb"
                    strokeWidth={3}
                    name="Respiration"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Weight & Activity Chart */}
            <div className="h-72">
              <p className="font-medium mb-4 text-gray-700 flex items-center gap-2">
                <Weight size={18} className="text-purple-600" />
                <Activity size={18} className="text-green-600" />
                Weight & Activity
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    name="Weight (kg)"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activity"
                    stroke="#16a34a"
                    strokeWidth={3}
                    name="Activity Level"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    stroke="#ec4899"
                    strokeWidth={3}
                    name="Stress Level"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Health History */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Health History {selectedPet ? `- ${selectedPet.name}` : `(All ${displayedMetrics.length} records)`}
          </h2>
          <span className="text-sm text-gray-500">
            {displayedMetrics.length} record{displayedMetrics.length !== 1 ? 's' : ''}
          </span>
        </div>

        {displayedMetrics.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Stethoscope size={48} className="mx-auto opacity-50" />
            </div>
            <p className="text-gray-500 text-lg">
              No health records found
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {petId ? 'Add a health metric for this pet' : 'Select a pet to view health records'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedMetrics.map(m => (
              <div
                key={m.id}
                className="p-5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Clock size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">
                          {new Date(m.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        {!petId && (
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                            {getPetIcon(m.petSpecies)}
                            {m.petName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <User size={12} />
                        Recorded by: {m.recordedBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-purple-600">
                      {m.weight}kg
                    </span>
                    <p className="text-xs text-gray-500">Weight</p>
                  </div>
                </div>

                {/* Horizontal Metric Bars */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      {metricIcons.weight}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="font-semibold">{m.weight}kg</p>
                    </div>
                  </div>

                  {m.temperature && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        {metricIcons.temperature}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Temperature</p>
                        <p className="font-semibold">{m.temperature}°C</p>
                      </div>
                    </div>
                  )}

                  {m.pulse && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        {metricIcons.pulse}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pulse</p>
                        <p className="font-semibold">{m.pulse} BPM</p>
                      </div>
                    </div>
                  )}

                  {m.respirationRate && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {metricIcons.respirationRate}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Respiration</p>
                        <p className="font-semibold">{m.respirationRate} bpm</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      {metricIcons.activityLevel}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Activity</p>
                      <p className="font-semibold">{m.activityLevel}/10</p>
                    </div>
                  </div>
                </div>

                {m.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Clinical Notes</p>
                    <p className="text-sm text-gray-700">{m.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Metric Modal - Same as before */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Add Clinical Health Metric
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Complete health tracking for {selectedPet?.name}
                </p>
              </div>
              <button 
                onClick={() => setShowAdd(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { 
                  key: 'weight', 
                  label: 'Weight', 
                  placeholder: 'Enter weight in kg',
                  icon: <Weight size={18} />,
                  type: 'number',
                  step: '0.1',
                  min: '0',
                  required: true
                },
                { 
                  key: 'temperature', 
                  label: 'Temperature', 
                  placeholder: 'Enter temperature in °C',
                  icon: <Thermometer size={18} />,
                  type: 'number',
                  step: '0.1',
                  min: '0',
                  required: false
                },
                { 
                  key: 'pulse', 
                  label: 'Pulse Rate', 
                  placeholder: 'Enter pulse in BPM',
                  icon: <HeartPulse size={18} />,
                  type: 'number',
                  min: '0',
                  required: false
                },
                { 
                  key: 'respirationRate', 
                  label: 'Respiration Rate', 
                  placeholder: 'Enter breaths per minute',
                  icon: <Wind size={18} />,
                  type: 'number',
                  min: '0',
                  required: false
                },
                { 
                  key: 'stressLevel', 
                  label: 'Stress Level', 
                  placeholder: '1 = calm, 10 = stressed',
                  icon: <Heart size={18} />,
                  type: 'range',
                  min: '1',
                  max: '10',
                  required: true
                },
                { 
                  key: 'activityLevel', 
                  label: 'Activity Level', 
                  placeholder: '1 = inactive, 10 = very active',
                  icon: <Activity size={18} />,
                  type: 'range',
                  min: '1',
                  max: '10',
                  required: true
                },
                { 
                  key: 'appetiteLevel', 
                  label: 'Appetite Level', 
                  placeholder: '1 = poor, 10 = excellent',
                  icon: <Utensils size={18} />,
                  type: 'range',
                  min: '1',
                  max: '10',
                  required: true
                },
                { 
                  key: 'sleepHours', 
                  label: 'Sleep Hours', 
                  placeholder: 'Hours slept today',
                  icon: <Moon size={18} />,
                  type: 'number',
                  step: '0.5',
                  min: '0',
                  max: '24',
                  required: true
                },
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      {field.icon}
                      <span>{field.label}</span>
                      {field.type === 'range' && (
                        <span className="ml-auto text-sm font-semibold text-purple-600">
                          {form[field.key] || '5'}/10
                        </span>
                      )}
                    </div>
                  </label>
                  
                  {field.type === 'range' ? (
                    <>
                      <input
                        type="range"
                        value={form[field.key] || 5}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        min={field.min}
                        max={field.max}
                        step="1"
                        required={field.required}
                      />
                      <div className="flex justify-between text-xs text-gray-500 px-1">
                        <span>Low ({field.min})</span>
                        <span>High ({field.max})</span>
                      </div>
                    </>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Clinical Notes
                </label>
                <textarea
                  placeholder="Enter clinical observations, diagnosis, or recommendations..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={addMetric}
                disabled={isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </span>
                ) : 'Save Clinical Metric'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Health;