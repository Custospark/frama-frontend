import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IdCard, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '../../shared/components/buttons/Button';
import { PinInput } from '../../shared/components/inputs/PinInput';
import { axiosInstance } from '../../app/api/axiosConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { ROUTES } from '../../app/routes/constants/shared.paths';
import { AuthLayout } from './AuthLayout';
import { AUTH_HERO_IMAGES } from './authHeroImages';

export default function ChangePinPage() {
  const navigate = useNavigate();

  const [accessCode, setAccessCode] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (newPin !== confirmPin) {
      setError('The new PIN and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.CHANGE_PIN, {
        access_code: accessCode.trim().toUpperCase(),
        current_pin: currentPin,
        pin: newPin,
        pin_confirmation: confirmPin,
      });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update your PIN. Check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm uppercase tracking-wide';

  if (done) {
    return (
      <AuthLayout
        title="PIN Updated"
        subtitle="Your new PIN is now active. No email verification required."
        heroImage={AUTH_HERO_IMAGES.changePin}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="text-sm text-gray-600">
            You can now sign in with your new PIN using the same access code.
          </p>
          <Button className="w-full gap-2 py-3.5" onClick={() => navigate(ROUTES.LOGIN, { replace: true })}>
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Change PIN"
      subtitle="Enter your access code, current PIN, and choose a new PIN."
      heroImage={AUTH_HERO_IMAGES.changePin}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            required
            autoCapitalize="characters"
            placeholder="Access code (e.g. RUBAGA or FRAMA)"
            className={inputCls}
          />
        </div>

        <PinInput
          label="Current PIN"
          value={currentPin}
          onChange={(e) => setCurrentPin(digitsOnly(e.target.value))}
          placeholder="••••"
          required
        />
        <PinInput
          label="New PIN"
          value={newPin}
          onChange={(e) => setNewPin(digitsOnly(e.target.value))}
          placeholder="••••"
          required
        />
        <PinInput
          label="Confirm new PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(digitsOnly(e.target.value))}
          placeholder="••••"
          required
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full gap-2 py-3.5" loading={loading}>
          <KeyRound className="h-4 w-4" aria-hidden />
          Update PIN
        </Button>

        <p className="text-center text-sm text-gray-500">
          <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
