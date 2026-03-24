import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { Lock, Bus, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import backgroundImage from "../../assets/ac0115c200b867df897b82be118608edd9b6ec3d.png";

export function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(t("errors.unauthorized"));
      setIsError(true);
      return;
    }

    if (!password.trim()) {
      setError(t("auth.passwordRequired"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch") || "Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost/api/controller/reset_password.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || t("errors.serverError"));
        setIsError(true);
      }
    } catch (err) {
      console.error("Reset password API error:", err);
      setError(t("errors.networkError"));
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Bus on scenic road"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("errors.unauthorized")}
            </h1>
            <p className="text-gray-600 mb-6">
              Invalid or missing reset token
            </p>
            <Link to="/forgot-password">
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {t("forgotPassword.title")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Bus on scenic road"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("resetPassword.success")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t("resetPassword.redirecting")}
            </p>
            <Link to="/login">
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {t("auth.signIn")}
              </Button>
            </Link>
          </div>
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

      {/* Reset Password Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <img 
              src="/src/assets/CamTransit.png" 
              alt="CamTransit Logo" 
              className="w-72 h-72 mx-auto -mb-20 object-contain"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t("resetPassword.title")}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("resetPassword.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-gray-700">
                {t("auth.passwordLabel")}
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 h-12 bg-gray-50 border-gray-200 ${
                    error ? "border-red-500" : ""
                  }`}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">
                {t("auth.confirmPassword")}
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? t("common.loading") : t("resetPassword.resetButton")}
            </Button>
          </form>

          {/* Back to Login Link */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            {t("forgotPassword.backToLogin")}
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
