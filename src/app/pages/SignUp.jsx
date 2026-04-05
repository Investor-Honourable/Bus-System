import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { User, Mail, Lock, Bus, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import backgroundImage from "../../assets/ac0115c200b867df897b82be118608edd9b6ec3d.png";
import { apiEndpoint } from "../utils/apiConfig.js";

// Password strength rules and validation
const PASSWORD_RULES = {
  minLength: { regex: /.{8,}/, message: "At least 8 characters" },
  uppercase: { regex: /[A-Z]/, message: "One uppercase letter (A-Z)" },
  lowercase: { regex: /[a-z]/, message: "One lowercase letter (a-z)" },
  number: { regex: /[0-9]/, message: "One number (0-9)" },
  special: { regex: /[!@#$%^&*(),.?":{}|<>]/, message: "One special character (!@#$%^&*)" },
};

function checkPasswordStrength(password) {
  const results = {};
  let score = 0;
  
  for (const [rule, config] of Object.entries(PASSWORD_RULES)) {
    results[rule] = config.regex.test(password);
    if (results[rule]) score++;
  }
  
  return { results, score };
}

function getStrengthLabel(score) {
  if (score === 0 || score === 1) return { label: "Very Weak", color: "bg-red-500", width: "10%" };
  if (score === 2) return { label: "Weak", color: "bg-orange-500", width: "30%" };
  if (score === 3) return { label: "Fair", color: "bg-yellow-500", width: "50%" };
  if (score === 4) return { label: "Strong", color: "bg-blue-500", width: "75%" };
  return { label: "Very Strong", color: "bg-green-500", width: "100%" };
}

export function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ results: {}, score: 0 });

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength({ results: {}, score: 0 });
    }
  }, [formData.password]);

  const validateForm = () => {
    const newErrors = {};
    const strength = checkPasswordStrength(formData.password);

    if (!formData.name.trim()) {
      newErrors.name = t('auth.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('auth.nameMinLength');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    // Strong password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (strength.score < 5) {
      const failedRules = Object.entries(PASSWORD_RULES)
        .filter(([key]) => !strength.results[key])
        .map(([, config]) => config.message);
      newErrors.password = "Password must have: " + failedRules.join(", ");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint("/auth.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        setErrors({ email: t('errors.serverError') });
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.status === "success") {
        // Store user data in localStorage
        localStorage.setItem("busfare_current_user", JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        }));

        setIsLoading(false);
        // Navigate to dashboard for smooth transition
        navigate("/dashboard");
      } else {
        // Handle specific error messages
        const errorMessage = data.message || t('auth.signUpError');
        setErrors({ email: errorMessage });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      // More helpful error message
      setErrors({ email: t('errors.networkError') });
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

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

      {/* Sign Up Card */}
      <div className="relative z-10 w-full max-w-md mx-3 sm:mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <img 
              src="/src/assets/CamTransit.png" 
              alt="CamTransit Logo" 
              className="w-48 sm:w-56 md:w-64 lg:w-72 h-auto mx-auto -mb-12 sm:-mb-16 md:-mb-20 object-contain"
            />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('auth.signUp')}
            </h1>
            <p className="text-gray-600 mt-2">{t('auth.createAccount')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <Label htmlFor="name" className="text-gray-700">
                {t('auth.fullName')}
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t('auth.enterName')}
                  value={formData.name}
                  onChange={handleChange}
                  className={`pl-10 h-12 bg-gray-50 border-gray-200 ${
                    errors.name ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 h-12 bg-gray-50 border-gray-200 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-gray-700">
                {t('auth.passwordLabel')}
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 pr-10 h-12 bg-gray-50 border-gray-200 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStrengthLabel(passwordStrength.score).color} transition-all duration-300`}
                      style={{ width: getStrengthLabel(passwordStrength.score).width }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(PASSWORD_RULES).map(([key, config]) => (
                      <span 
                        key={key}
                        className={`text-xs flex items-center gap-1 ${
                          passwordStrength.results[key] ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {passwordStrength.results[key] ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {key === 'minLength' ? '8+ chars' : key}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">
                {t('auth.confirmPassword')}
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 h-12 bg-gray-50 border-gray-200 ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base"
            >
              {isLoading ? t('auth.creatingAccount') : t('auth.signUp')}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-gray-600">
            {t('auth.alreadyHaveAccount')}{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-purple-600 transition-colors"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-white/80">
          © 2026 CamTransit. All rights reserved.
        </p>
      </div>
    </div>
  );
}
