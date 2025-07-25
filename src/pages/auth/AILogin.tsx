import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Mail, Lock, User, ArrowRight, 
  Brain, Shield, Zap, CheckCircle, AlertCircle,
  Sparkles, Bot, Lightbulb, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AIService } from '../../services/aiService';
import toast from 'react-hot-toast';

const AILogin: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[]; isStrong: boolean }>({ score: 0, feedback: [], isStrong: false });
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; suggestions: string[] }>({ isValid: true, suggestions: [] });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const passwordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // E-posta değişikliklerini izle
  useEffect(() => {
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }

    if (formData.email) {
      emailTimeoutRef.current = setTimeout(() => {
        const validation = AIService.validateEmail(formData.email);
        setEmailValidation(validation);
        
        if (validation.isValid && !isLogin) {
          getAISuggestions();
        }
      }, 500);
    }

    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, [formData.email, isLogin]);

  // Şifre değişikliklerini izle
  useEffect(() => {
    if (passwordTimeoutRef.current) {
      clearTimeout(passwordTimeoutRef.current);
    }

    if (formData.password) {
      passwordTimeoutRef.current = setTimeout(() => {
        const strength = AIService.checkPasswordStrength(formData.password);
        setPasswordStrength(strength);
      }, 300);
    }

    return () => {
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
      }
    };
  }, [formData.password]);

  const getAISuggestions = async () => {
    if (!formData.email) return;
    
    setAiLoading(true);
    try {
      const response = await AIService.getSignupSuggestions(formData.email);
      if (response.success && response.suggestions) {
        setAiSuggestions(response.suggestions);
        setShowAiHelp(true);
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const getAILoginHelp = async (errorType?: string) => {
    if (!formData.email) return;
    
    setAiLoading(true);
    try {
      const response = await AIService.getLoginAssistance(formData.email, errorType);
      if (response.success && response.suggestions) {
        setAiSuggestions(response.suggestions);
        setShowAiHelp(true);
      }
    } catch (error) {
      console.error('AI login help error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }

    if (!isLogin && !passwordStrength.isStrong) {
      toast.error('Daha güçlü bir şifre seçin!');
      return;
    }

    setLoading(true);
    try {
      const { error } = isLogin 
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password);

      if (error) {
        // AI yardımı al
        const errorType = error.message.includes('Invalid login credentials') ? 'invalid_credentials' :
                         error.message.includes('User not found') ? 'user_not_found' :
                         error.message.includes('Too many requests') ? 'too_many_requests' : undefined;
        
        await AIService.logLoginAttempt(formData.email, false, errorType);
        await getAILoginHelp(errorType);
        throw error;
      }

      // Başarılı giriş kaydet
      await AIService.logLoginAttempt(formData.email, true);

      if (isLogin) {
        toast.success('Başarıyla giriş yaptınız!');
        navigate('/dashboard');
      } else {
        toast.success('Hesabınız oluşturuldu! Giriş yapabilirsiniz.');
        setIsLogin(true);
        setFormData({ ...formData, confirmPassword: '' });
        setShowAiHelp(false);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error?.message || 'Bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score >= 4) return 'text-green-600';
    if (passwordStrength.score >= 3) return 'text-yellow-600';
    if (passwordStrength.score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score >= 4) return 'Çok Güçlü';
    if (passwordStrength.score >= 3) return 'Güçlü';
    if (passwordStrength.score >= 2) return 'Orta';
    if (passwordStrength.score >= 1) return 'Zayıf';
    return 'Çok Zayıf';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* AI Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Brain className="text-white h-10 w-10" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
              <Zap className="text-white h-3 w-3" />
            </div>
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Destekli
          </span>
          <br />
          {isLogin ? 'Giriş Yapın' : 'Hesap Oluşturun'}
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {isLogin ? (
            <>
              Hesabınız yok mu?{' '}
              <button
                onClick={() => {
                  setIsLogin(false);
                  setShowAiHelp(false);
                }}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Ücretsiz hesap oluşturun
              </button>
            </>
          ) : (
            <>
              Zaten hesabınız var mı?{' '}
              <button
                onClick={() => {
                  setIsLogin(true);
                  setShowAiHelp(false);
                }}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Giriş yapın
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                E-posta Adresi
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${emailValidation.isValid ? 'text-gray-400' : 'text-red-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`appearance-none block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm transition-all duration-200 ${
                    emailValidation.isValid 
                      ? 'border-gray-300 dark:border-gray-600' 
                      : 'border-red-300 dark:border-red-600'
                  }`}
                  placeholder="ornek@email.com"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {aiLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
                  {!aiLoading && formData.email && (
                    emailValidation.isValid ? 
                      <CheckCircle className="h-5 w-5 text-green-400" /> : 
                      <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
              </div>
              {!emailValidation.isValid && emailValidation.suggestions.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  {emailValidation.suggestions[0]}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Şifre
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {!isLogin && formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Şifre gücü:</span>
                    <span className={`font-medium ${getPasswordStrengthColor()}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="mt-1 flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= level
                            ? passwordStrength.score >= 4
                              ? 'bg-green-500'
                              : passwordStrength.score >= 3
                              ? 'bg-yellow-500'
                              : 'bg-orange-500'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {passwordStrength.feedback[0]}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Şifre Tekrarı
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`appearance-none block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {formData.confirmPassword && (
                      formData.password === formData.confirmPassword ? 
                        <CheckCircle className="h-5 w-5 text-green-400" /> : 
                        <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="mt-2 text-sm text-red-600">
                    Şifreler eşleşmiyor
                  </div>
                )}
              </div>
            )}

            {/* AI Help Section */}
            {showAiHelp && aiSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Bot className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    AI Önerileri
                  </span>
                </div>
                <ul className="space-y-2">
                  {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-start text-sm text-blue-800 dark:text-blue-200">
                      <Lightbulb className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setShowAiHelp(false)}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Önerileri gizle
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || (!isLogin && !passwordStrength.isStrong)}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                  loading || (!isLogin && !passwordStrength.isStrong)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>{isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </div>

            {/* AI Features Highlight */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>Güvenli</span>
                </div>
                <div className="flex items-center">
                  <Brain className="h-3 w-3 mr-1" />
                  <span>AI Destekli</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>Akıllı</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AILogin; 