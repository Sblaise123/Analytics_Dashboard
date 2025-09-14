import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { User, BarChart3, TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Target, Download, LogOut, Menu, X, AlertCircle } from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface MetricData {
  name: string;
  value: number;
  change: number;
  change_type: 'increase' | 'decrease';
}

interface ChartDataPoint {
  date: string;
  value: number;
  category?: string;
}

interface ChartData {
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: ChartDataPoint[];
}

interface DashboardData {
  metrics: MetricData[];
  charts: ChartData[];
}

interface ApiError {
  detail: string;
  status?: number;
}

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/v1',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
    },
    DASHBOARD: '/dashboard',
    ANALYTICS: '/analytics/detailed',
    REPORTS: '/reports/export',
  },
} as const;

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', 
  '#EF4444', '#8B5CF6', '#06B6D4'
] as const;

const DEMO_ACCOUNTS = [
  { email: 'admin@example.com', password: 'secret', role: 'Admin' },
  { email: 'manager@example.com', password: 'secret', role: 'Manager' },
  { email: 'analyst@example.com', password: 'secret', role: 'Analyst' },
  { email: 'viewer@example.com', password: 'secret', role: 'Viewer' },
] as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// =============================================================================
// API SERVICE
// =============================================================================

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setToken(token: string | null): void {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: 'An unexpected error occurred' 
      }));
      throw new ApiError(error.detail || 'Request failed', response.status);
    }

    return response.json();
  }

  public async login(email: string, password: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  public async register(userData: {
    email: string;
    password: string;
    full_name: string;
    role?: UserRole;
  }) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  public async getCurrentUser() {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.ME);
  }

  public async getDashboardData(): Promise<DashboardData> {
    return this.request(API_CONFIG.ENDPOINTS.DASHBOARD);
  }

  public async getDetailedAnalytics(): Promise<DashboardData> {
    return this.request(API_CONFIG.ENDPOINTS.ANALYTICS);
  }

  public async exportReport(reportData: {
    report_type: string;
    date_range: Record<string, string>;
    format: string;
  }) {
    return this.request(API_CONFIG.ENDPOINTS.REPORTS, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }
}

const apiService = ApiService.getInstance();

// =============================================================================
// AUTHENTICATION CONTEXT
// =============================================================================

interface AuthContextValue {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  authState: { user: null, token: null, isAuthenticated: false, isLoading: false },
  login: async () => {},
  logout: () => {},
  hasPermission: () => false,
});

// =============================================================================
// PERMISSION SYSTEM
// =============================================================================

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  viewer: ['dashboard:read'],
  analyst: ['dashboard:read', 'analytics:read'],
  manager: ['dashboard:read', 'analytics:read', 'reports:export'],
  admin: ['dashboard:read', 'analytics:read', 'reports:export', 'users:manage'],
};

const checkPermission = (role: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        apiService.setToken(parsed.token);
        return { ...parsed, isLoading: false };
      } catch {
        return { user: null, token: null, isAuthenticated: false, isLoading: false };
      }
    }
    return { user: null, token: null, isAuthenticated: false, isLoading: false };
  });

  const updateAuthState = useCallback((newState: Partial<AuthState>) => {
    setAuthState(prev => {
      const updated = { ...prev, ...newState };
      localStorage.setItem('auth', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await apiService.login(email, password);
      apiService.setToken(response.access_token);
      
      updateAuthState({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [updateAuthState]);

  const logout = useCallback(() => {
    apiService.setToken(null);
    localStorage.removeItem('auth');
    setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    return authState.user ? checkPermission(authState.user.role, permission) : false;
  }, [authState.user]);

  const contextValue = useMemo(() => ({
    authState,
    login,
    logout,
    hasPermission,
  }), [authState, login, logout, hasPermission]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

const useApi = <T,>(
  apiCall: () => Promise<T>,
  dependencies: React.DependencyList = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};

// =============================================================================
// UI COMPONENTS
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`} />
    </div>
  );
};

const ErrorMessage: React.FC<{ 
  message: string; 
  onDismiss?: () => void; 
  type?: 'error' | 'warning' | 'info';
}> = ({ message, onDismiss, type = 'error' }) => {
  const typeClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`border rounded-md p-4 mb-4 ${typeClasses[type]}`}>
      <div className="flex justify-between items-start">
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-sm hover:underline"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// METRIC CARD COMPONENT
// =============================================================================

const MetricCard = memo<{ metric: MetricData }>(({ metric }) => {
  const getIcon = useCallback((name: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'total revenue': <DollarSign className="h-6 w-6" />,
      'daily revenue': <DollarSign className="h-6 w-6" />,
      'active users': <Users className="h-6 w-6" />,
      'user demographics': <Users className="h-6 w-6" />,
      'conversion rate': <Target className="h-6 w-6" />,
      'avg. order value': <ShoppingCart className="h-6 w-6" />,
    };

    return iconMap[name.toLowerCase()] || <BarChart3 className="h-6 w-6" />;
  }, []);

  const formatValue = useCallback((value: number, name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('revenue') || lowerName.includes('value')) {
      return formatCurrency(value);
    } else if (lowerName.includes('rate')) {
      return formatPercentage(value);
    }
    return formatNumber(value);
  }, []);

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-gray-400">
              {getIcon(metric.name)}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {metric.name}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {formatValue(metric.value, metric.name)}
                </div>
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  metric.change_type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change_type === 'increase' ? (
                    <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                  ) : (
                    <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                  )}
                  <span className="ml-1">
                    {formatPercentage(Math.abs(metric.change))}
                  </span>
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

// =============================================================================
// CHART COMPONENTS
// =============================================================================

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
    <div className="h-80">
      {children}
    </div>
  </div>
);

const CustomChart = memo<{ chart: ChartData }>(({ chart }) => {
  const renderChart = useCallback(() => {
    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={CHART_COLORS[0]} 
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Sales']} />
              <Legend />
              <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => 
                  `${category}: ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatNumber(value), 'Users']} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="flex items-center justify-center h-full text-gray-500">Unsupported chart type</div>;
    }
  }, [chart]);

  return (
    <ChartContainer title={chart.title}>
      {renderChart()}
    </ChartContainer>
  );
});

CustomChart.displayName = 'CustomChart';

// =============================================================================
// HEADER COMPONENT
// =============================================================================

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { authState, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">{authState.user?.full_name}</span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                {authState.user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void; activeTab: string; onTabChange: (tab: string) => void }> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange 
}) => {
  const { hasPermission } = useAuth();

  const menuItems = useMemo(() => [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, permission: 'dashboard:read' },
    { id: 'analytics', name: 'Detailed Analytics', icon: TrendingUp, permission: 'analytics:read' },
    { id: 'reports', name: 'Export Reports', icon: Download, permission: 'reports:export' },
  ], []);

  const availableItems = useMemo(() => 
    menuItems.filter(item => hasPermission(item.permission)),
    [menuItems, hasPermission]
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:static md:inset-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <button 
            onClick={onClose} 
            className="p-2 rounded-md text-gray-400 hover:text-gray-500"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {availableItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

// =============================================================================
// LOGIN FORM COMPONENT
// =============================================================================

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('secret');
  const [error, setError] = useState('');
  const { login, authState } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Analytics Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Accounts:</h3>
            <div className="text-xs text-blue-600 space-y-1">
              {DEMO_ACCOUNTS.map((account, index) => (
                <div key={index} className="flex justify-between">
                  <span>{account.role}:</span>
                  <span>{account.email} / {account.password}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={authState.isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authState.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// DASHBOARD COMPONENT
// =============================================================================

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission } = useAuth();

  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard
  } = useApi(() => apiService.getDashboardData(), [activeTab]);

  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useApi(
    () => apiService.getDetailedAnalytics(),
    [activeTab === 'analytics']
  );

  const handleExportReport = useCallback(async () => {
    try {
      const reportData = {
        report_type: 'sales',
        date_range: { start: '2024-01-01', end: '2024-01-31' },
        format: 'json'
      };
      
      const result = await apiService.exportReport(reportData);
      
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics-report.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to export report');
    }
  }, []);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'dashboard':
        if (dashboardLoading) return <LoadingSpinner size="lg" />;
        if (dashboardError) return <ErrorMessage message={dashboardError} />;
        if (!dashboardData) return null;

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardData.metrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardData.charts.map((chart, index) => (
                <CustomChart key={index} chart={chart} />
              ))}
            </div>
          </div>
        );

      case 'analytics':
        if (!hasPermission('analytics:read')) {
          return <ErrorMessage message="You don't have permission to view detailed analytics" type="warning" />;
        }

        if (analyticsLoading) return <LoadingSpinner size="lg" />;
        if (analyticsError) return <ErrorMessage message={analyticsError} />;
        if (!analyticsData) return null;

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Detailed Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsData.metrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analyticsData.charts.map((chart, index) => (
                <CustomChart key={index} chart={chart} />
              ))}
            </div>
          </div>
        );

      case 'reports':
        if (!hasPermission('reports:export')) {
          return <ErrorMessage message="You don't have permission to export reports" type="warning" />;
        }

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Export Reports</h2>
            
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Report</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md">
                    <option value="sales">Sales Report</option>
                    <option value="users">User Analytics</option>
                    <option value="revenue">Revenue Report</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                      defaultValue="2024-01-01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                      defaultValue="2024-01-31"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md">
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>

                <button
                  onClick={handleExportReport}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return <ErrorMessage message="Page not found" type="warning" />;
    }
  }, [activeTab, dashboardData, dashboardLoading, dashboardError, analyticsData, analyticsLoading, analyticsError, hasPermission, handleExportReport]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 p-6 max-w-7xl mx-auto">
          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)} 
            />
          )}

          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

const AnalyticsDashboard: React.FC = () => {
  const { authState } = useAuth();

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {authState.isAuthenticated ? <Dashboard /> : <LoginForm />}
    </ErrorBoundary>
  );
};

// =============================================================================
// ROOT APP COMPONENT WITH PROVIDERS
// =============================================================================

export default function App() {
  return (
    <AuthProvider>
      <AnalyticsDashboard />
    </AuthProvider>
  );
}