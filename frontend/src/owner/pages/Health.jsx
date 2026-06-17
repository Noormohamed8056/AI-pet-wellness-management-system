import { useEffect, useState } from "react";
import {
  addHealthMetricByOwner,
  getPetHealthMetrics,
  getActivePetAlerts,
  resolveHealthAlert
} from "../../api/api";

import api from "../../api/api";
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
  ChevronDown 
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
  sleepHours: <Moon className="text-blue-600" size={20} />,
  activityLevel: <Activity className="text-green-600" size={20} />,
  appetiteLevel: <Utensils className="text-amber-600" size={20} />,
  stressLevel: <Heart className="text-pink-600" size={20} />
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
    stressLevel: "",
    activityLevel: "",
    appetiteLevel: "",
    sleepHours: "",
    notes: ""
  });

  // Load pets + all metrics initially
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const petsRes = await api.get(`/pets/user/${userId}`);
        setPets(petsRes.data);

        const metricsMap = {};
        for (const p of petsRes.data) {
          const res = await getPetHealthMetrics(p.id);
          metricsMap[p.id] = res.data;
        }
        setAllPetMetrics(metricsMap);
      } catch (error) {
        toast.error("Failed to load pet data");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Load selected pet metrics + alerts
  useEffect(() => {
    if (!petId) {
      setSelectedPet(null);
      return;
    }

    const loadPetData = async () => {
      setIsLoading(true);
      try {
        const [metricsRes, alertsRes] = await Promise.all([
          getPetHealthMetrics(petId),
          getActivePetAlerts(petId)
        ]);
        
        setMetrics(metricsRes.data);
        setAlerts(alertsRes.data);
        
        // Find the selected pet for display
        const pet = pets.find(p => p.id === petId);
        setSelectedPet(pet);
      } catch (error) {
        toast.error("Failed to load pet health data");
      } finally {
        setIsLoading(false);
      }
    };

    loadPetData();
  }, [petId, pets]);

  const addMetric = async () => {
    if (!petId) {
      toast.warning("Please select a pet first");
      return;
    }

    // Validate form
    const requiredFields = ['weight', 'stressLevel', 'activityLevel', 'appetiteLevel', 'sleepHours'];
    const emptyFields = requiredFields.filter(field => !form[field]);
    
    if (emptyFields.length > 0) {
      toast.error(`Please fill in: ${emptyFields.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      await addHealthMetricByOwner(petId, {
        weight: Number(form.weight),
        stressLevel: Number(form.stressLevel),
        activityLevel: Number(form.activityLevel),
        appetiteLevel: Number(form.appetiteLevel),
        sleepHours: Number(form.sleepHours),
        notes: form.notes
      });

      toast.success("✅ Health metric added successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Refresh data
      const [m, a] = await Promise.all([
        getPetHealthMetrics(petId),
        getActivePetAlerts(petId)
      ]);
      
      setMetrics(m.data);
      setAlerts(a.data);

      setAllPetMetrics(prev => ({
        ...prev,
        [petId]: m.data
      }));

      setShowAdd(false);
      setForm({
        weight: "",
        stressLevel: "",
        activityLevel: "",
        appetiteLevel: "",
        sleepHours: "",
        notes: ""
      });

    } catch (error) {
      toast.error("Failed to add health metric");
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAlert = async (id) => {
    try {
      await resolveHealthAlert(id);
      const res = await getActivePetAlerts(petId);
      setAlerts(res.data);
      toast.success("Alert resolved successfully");
    } catch (error) {
      toast.error("Failed to resolve alert");
    }
  };

  // Decide what to show
  const displayedMetrics = petId
    ? metrics
    : Object.values(allPetMetrics).flat();

  // Chart data
const chartData = displayedMetrics
  .map(m => {
    const date = new Date(m.date);
    return {
      // Use shorter date format
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      fullDate: date,
      timestamp: date.getTime(),
      weight: m.weight,
      sleep: m.sleepHours,
      activity: m.activityLevel,
      appetite: m.appetiteLevel,
      stress: m.stressLevel
    };
  })
  .sort((a, b) => a.timestamp - b.timestamp)
  // Limit to last 7 data points for better visibility
  .slice(-7);


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
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </span>
    </div>
  );

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header with Pet Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Health Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track daily wellness and long-term health trends
            {selectedPet && (
              <span className="ml-2 font-medium text-purple-600">
                for {selectedPet.name}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className=" px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent pl-5"
          >
            <option value="">All Pets</option>
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

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
            <Plus size={18} /> Add Metric
          </button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      {latestMetric && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            icon={metricIcons.weight}
            label="Weight"
            value={latestMetric.weight}
            unit="kg"
            color="purple"
          />
          <MetricCard
            icon={metricIcons.sleepHours}
            label="Sleep"
            value={latestMetric.sleepHours}
            unit="hrs"
            color="blue"
          />
          <MetricCard
            icon={metricIcons.activityLevel}
            label="Activity"
            value={latestMetric.activityLevel}
            unit="/10"
            color="green"
          />
          <MetricCard
            icon={metricIcons.appetiteLevel}
            label="Appetite"
            value={latestMetric.appetiteLevel}
            unit="/10"
            color="amber"
          />
          <MetricCard
            icon={metricIcons.stressLevel}
            label="Stress"
            value={latestMetric.stressLevel}
            unit="/10"
            color="pink"
          />
        </div>
      )}
{alerts.length > 0 && (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <AlertTriangle className="text-red-500" size={24} />
      <h2 className="text-xl font-semibold text-gray-800">
        Active Health Alerts ({alerts.length})
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
            </div>
            <p className="text-sm text-gray-700 mt-1">{a.message}</p>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Clock size={12} />
              {new Date(a.createdAt).toLocaleDateString()}
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

      {/* Charts Section */}
{/* Charts Section */}
{chartData.length > 1 && (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="text-purple-600" />
          Health Insights & Trends
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Showing last {chartData.length} entries for better visibility
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Weight Chart */}
      <div className="h-72">
        <p className="font-medium mb-4 text-gray-700 flex items-center gap-2">
          <Weight size={18} />
          Weight Trend (kg)
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
              interval={0} // Show all ticks
              angle={-30}
              textAnchor="end"
              height={40}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              domain={['dataMin - 1', 'dataMax + 1']}
              allowDecimals={true}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
                padding: '8px 12px'
              }}
              formatter={(value, name) => {
                if (name === 'weight') return [`${value} kg`, 'Weight'];
                return [value, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Weight"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep & Activity Chart */}
      <div className="h-72">
        <p className="font-medium mb-4 text-gray-700 flex items-center gap-2">
          <Moon size={18} className="text-blue-600" />
          <Activity size={18} className="text-green-600" />
          Sleep & Activity Levels
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
              interval={0} // Show all ticks
              angle={-30}
              textAnchor="end"
              height={40}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              domain={[0, 10]}
              allowDecimals={true}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
                padding: '8px 12px'
              }}
              formatter={(value, name) => {
                const labels = {
                  'sleep': 'Sleep Hours',
                  'activity': 'Activity Level'
                };
                return [`${value}/10`, labels[name] || name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Line
              type="monotone"
              dataKey="sleep"
              stroke="#2563eb"
              strokeWidth={3}
              name="Sleep"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="activity"
              stroke="#16a34a"
              strokeWidth={3}
              name="Activity"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Optional: Add a data summary table for better readability */}
    {chartData.length > 0 && (
      <div className="mt-8 border-t pt-6">
        <h3 className="font-medium text-gray-700 mb-4">Recent Health Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Weight</th>
                <th className="px-4 py-2 text-left">Sleep</th>
                <th className="px-4 py-2 text-left">Activity</th>
                <th className="px-4 py-2 text-left">Appetite</th>
                <th className="px-4 py-2 text-left">Stress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chartData.slice().reverse().map((data, index) => (
                <tr key={index} className="text-sm hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">{data.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <Weight size={12} className="text-purple-600" />
                      </div>
                      {data.weight.toFixed(1)} kg
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Moon size={12} className="text-blue-600" />
                      </div>
                      {data.sleep}/10
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Activity size={12} className="text-green-600" />
                      </div>
                      {data.activity}/10
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                        <Utensils size={12} className="text-amber-600" />
                      </div>
                      {data.appetite}/10
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                        <Heart size={12} className="text-pink-600" />
                      </div>
                      {data.stress}/10
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
)}

      {/* Health History - Horizontal Cards */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Health History
          </h2>
          <span className="text-sm text-gray-500">
            {displayedMetrics.length} records
          </span>
        </div>

        {displayedMetrics.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Weight size={48} className="mx-auto opacity-50" />
            </div>
            <p className="text-gray-500 text-lg">
              No health records yet 🐾
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Add your first health metric to start tracking
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
                      <p className="font-semibold text-gray-800">
                        {new Date(m.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <User size={12} />
                        {m.recordedBy}
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      {metricIcons.weight}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="font-semibold">{m.weight}kg</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {metricIcons.sleepHours}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Sleep</p>
                      <p className="font-semibold">{m.sleepHours}h</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      {metricIcons.activityLevel}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Activity</p>
                      <p className="font-semibold">{m.activityLevel}/10</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      {metricIcons.appetiteLevel}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Appetite</p>
                      <p className="font-semibold">{m.appetiteLevel}/10</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      {metricIcons.stressLevel}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stress</p>
                      <p className="font-semibold">{m.stressLevel}/10</p>
                    </div>
                  </div>
                </div>

                {m.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{m.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Metric Modal */}
{/* Add Metric Modal */}
{showAdd && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            Add Health Metric
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Daily health tracking for {selectedPet?.name}
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
            min: '0'
          },
          { 
            key: 'stressLevel', 
            label: 'Stress Level', 
            placeholder: '1 = calm, 10 = stressed',
            icon: <Heart size={18} />,
            type: 'range',
            min: '1',
            max: '10'
          },
          { 
            key: 'activityLevel', 
            label: 'Activity Level', 
            placeholder: '1 = inactive, 10 = very active',
            icon: <Activity size={18} />,
            type: 'range',
            min: '1',
            max: '10'
          },
          { 
            key: 'appetiteLevel', 
            label: 'Appetite Level', 
            placeholder: '1 = poor, 10 = excellent',
            icon: <Utensils size={18} />,
            type: 'range',
            min: '1',
            max: '10'
          },
          { 
            key: 'sleepHours', 
            label: 'Sleep Hours', 
            placeholder: 'Hours slept today',
            icon: <Moon size={18} />,
            type: 'number',
            step: '0.5',
            min: '0',
            max: '24'
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
              />
            )}
          </div>
        ))}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            placeholder="Any observations or concerns..."
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
          ) : 'Save Metric'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Health;