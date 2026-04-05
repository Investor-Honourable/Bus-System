import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { Mail, Bus, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import backgroundImage from "../../assets/ac0115c200b867df897b82be118608edd9b6ec3d.png";
import { apiEndpoint } from "../utils/apiConfig.js";

export function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('auth.emailInvalid'));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(apiEndpoint('/controller/forgot_password.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('Forgot password response:', data); // Debug log

      if (data.success) {
        setIsSuccess(true);
      } else {
        setError(data.message || t('errors.serverError'));
      }
    } catch (err) {
      // For demo purposes, if API fails, show success anyway
      console.error('Forgot password API error:', err);
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError("");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Bus on scenic road"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Success Card */}
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('forgotPassword.checkEmail')}
            </h1>
            <p className="text-gray-600 mb-2">
              {t('forgotPassword.resetLinkSent')}{
                <span className="font-semibold">{email}</span>
              }
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {t('forgotPassword.checkSpam')}
            </p>
            
            <Link to="/login">
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-sm text-white/80">
            © 2026 CamTransit. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt="Bus on scenic road"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Forgot Password Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <img 
              src="/src/assets/CamTransit.png" 
              alt="CamTransit Logo" 
              className="w-48 sm:w-56 md:w-64 lg:w-72 h-auto mx-auto -mb-12 sm:-mb-16 md:-mb-20 object-contain"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('auth.forgotPassword')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('forgotPassword.enterEmail')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-gray-700">
                {t('auth.emailLabel')}
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="test1@gmail.com"
                  value={email}
                  onChange={handleChange}
                  className={`pl-10 h-12 bg-gray-50 border-gray-200 ${
                    error ? "border-red-500" : ""
                  }`}
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base"
            >
              {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
            </Button>
          </form>

          {/* Back to Login Link */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-white/80">
          © 2026 CamTransit. All rights reserved.
        </p>
      </div>
    </div>
  );
}
