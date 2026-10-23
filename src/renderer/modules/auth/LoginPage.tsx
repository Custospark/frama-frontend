import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { IdCard, LogIn } from 'lucide-react';
import { useAuth } from '../../app/contexts/useAuth';
import { useToast } from '../../app/contexts/useToast';
import { Button } from '../../shared/components/buttons/Button';
import { PinInput } from '../../shared/components/inputs/PinInput';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { ROUTES, homeRouteFor } from '../../app/routes/constants/shared.paths';
import { AuthLayout } from './AuthLayout';
import { AUTH_HERO_IMAGES } from './authHeroImages';
import { PRODUCT_NAME } from '../../shared/brand/framaBrand';

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const { login, isAuthenticated, isInitialized, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [accessCode, setAccessCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (isInitialized && isAuthenticated && user) {
    const from = (location.state as LocationState | null)?.from;
    const destination =
      user.role === 'executive' ? ROUTES.ADMIN.DASHBOARD : from ?? homeRouteFor(user.role);
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const loggedIn = await login(accessCode.trim().toUpperCase(), pin);
      showToast('success', 'Welcome back.');
      const from = (location.state as LocationState | null)?.from;
      const destination =
        loggedIn.role === 'executive' ? ROUTES.ADMIN.DASHBOARD : from ?? homeRouteFor(loggedIn.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid access code or PIN.'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm uppercase tracking-wide';

  return (
    <AuthLayout
      title="Sign In"
      subtitle={`Welcome back to ${PRODUCT_NAME}`}
      heroImage={AUTH_HERO_IMAGES.login}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            required
            autoCapitalize="characters"
            placeholder="Access code (e.g. FRAMA, EXEC, RUBAGA)"
            className={inputCls}
          />
        </div>

        <PinInput
          label="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••"
          required
        />

        <div className="text-right -mt-3">
          <Link
            to={ROUTES.CHANGE_PIN}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Forgot / change PIN?
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full gap-2 py-3.5" loading={loading}>
          <LogIn className="h-4 w-4" aria-hidden />
          Sign In
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
        <p className="text-xs text-gray-500">
          Managers use their <span className="font-semibold text-gray-700">branch code</span> ·
          Executives &amp; admins use their own <span className="font-semibold text-gray-700">access code</span>.
        </p>
      </div>
    </AuthLayout>
  );
}
