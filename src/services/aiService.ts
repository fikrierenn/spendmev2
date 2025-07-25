import { supabase } from '../lib/supabase';

export interface AIResponse {
  success: boolean;
  message: string;
  suggestions?: string[];
  data?: any;
}

export class AIService {
  // AI destekli giriş yardımı
  static async getLoginAssistance(email: string, errorType?: string): Promise<AIResponse> {
    try {
      // Kullanıcının giriş geçmişini kontrol et
      const { data: loginHistory } = await supabase
        .from('spendme_login_attempts')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(5);

      // Hata tipine göre öneriler
      const suggestions: string[] = [];
      
      if (errorType === 'invalid_credentials') {
        suggestions.push('Şifrenizi kontrol edin ve büyük/küçük harflere dikkat edin');
        suggestions.push('Caps Lock tuşunun açık olmadığından emin olun');
        suggestions.push('Şifrenizi unuttuysanız "Şifremi Unuttum" seçeneğini kullanın');
      } else if (errorType === 'user_not_found') {
        suggestions.push('Bu e-posta adresi ile kayıtlı hesap bulunamadı');
        suggestions.push('Yeni hesap oluşturmak için "Kayıt Ol" seçeneğini kullanın');
        suggestions.push('E-posta adresinizi kontrol edin');
      } else if (errorType === 'too_many_requests') {
        suggestions.push('Çok fazla başarısız giriş denemesi yapıldı');
        suggestions.push('Birkaç dakika bekleyip tekrar deneyin');
        suggestions.push('Şifrenizi sıfırlamayı düşünün');
      }

      // Akıllı öneriler
      if (loginHistory && loginHistory.length > 0) {
        const lastLogin = loginHistory[0];
        const timeDiff = Date.now() - new Date(lastLogin.created_at).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          suggestions.push('Son girişinizden bu yana 24 saat geçti. Hesabınızın güvenliği için şifrenizi güncellemeyi düşünün');
        }
      }

      return {
        success: true,
        message: 'AI destekli giriş yardımı hazırlandı',
        suggestions
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI yardımı alınırken hata oluştu',
        suggestions: ['Tekrar deneyin', 'Manuel olarak giriş yapmayı deneyin']
      };
    }
  }

  // Akıllı hesap oluşturma önerileri
  static async getSignupSuggestions(email: string): Promise<AIResponse> {
    try {
      // E-posta domain'ine göre öneriler
      const domain = email.split('@')[1];
      const suggestions: string[] = [];
      
      if (domain === 'gmail.com') {
        suggestions.push('Gmail hesabınızla hızlı giriş yapabilirsiniz');
        suggestions.push('Güçlü bir şifre seçin (en az 8 karakter)');
      } else if (domain === 'outlook.com' || domain === 'hotmail.com') {
        suggestions.push('Outlook hesabınızla hızlı giriş yapabilirsiniz');
        suggestions.push('İki faktörlü doğrulama kullanmanızı öneririz');
      } else {
        suggestions.push('İş e-postanızla güvenli giriş yapabilirsiniz');
        suggestions.push('Şirket güvenlik politikalarınıza uygun şifre seçin');
      }

      // Genel güvenlik önerileri
      suggestions.push('Şifrenizde büyük/küçük harf, rakam ve özel karakter kullanın');
      suggestions.push('Kişisel bilgilerinizi şifre olarak kullanmayın');
      suggestions.push('Hesabınızı oluşturduktan sonra profil bilgilerinizi tamamlayın');

      return {
        success: true,
        message: 'Akıllı hesap oluşturma önerileri hazırlandı',
        suggestions
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI önerileri alınırken hata oluştu',
        suggestions: ['Güçlü bir şifre seçin', 'E-posta adresinizi doğru girdiğinizden emin olun']
      };
    }
  }

  // Giriş denemesi kaydetme
  static async logLoginAttempt(email: string, success: boolean, errorType?: string): Promise<void> {
    try {
      await supabase
        .from('spendme_login_attempts')
        .insert({
          email,
          success,
          error_type: errorType,
          ip_address: 'client_ip', // Gerçek uygulamada IP adresi alınır
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Login attempt logging failed:', error);
    }
  }

  // Akıllı şifre güçlülük kontrolü
  static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Uzunluk kontrolü
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Şifre en az 8 karakter olmalıdır');
    }

    // Büyük harf kontrolü
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir büyük harf kullanın');
    }

    // Küçük harf kontrolü
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir küçük harf kullanın');
    }

    // Rakam kontrolü
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir rakam kullanın');
    }

    // Özel karakter kontrolü
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir özel karakter kullanın');
    }

    // Yaygın şifre kontrolü
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      score -= 2;
      feedback.push('Yaygın şifreler kullanmayın');
    }

    return {
      score,
      feedback,
      isStrong: score >= 4
    };
  }

  // E-posta format kontrolü
  static validateEmail(email: string): {
    isValid: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    if (!isValid) {
      suggestions.push('Geçerli bir e-posta adresi girin');
      suggestions.push('Örnek: kullanici@domain.com');
    }

    // Domain kontrolü
    const domain = email.split('@')[1];
    if (domain && domain.length < 3) {
      suggestions.push('E-posta domain\'i çok kısa görünüyor');
    }

    return {
      isValid,
      suggestions
    };
  }
} 