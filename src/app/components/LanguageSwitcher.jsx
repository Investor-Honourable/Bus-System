import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const translations = {
  en: {
    'landing.badge': '🇨🇲 Cameroon #1 Bus Booking Platform',
    'landing.hero_title': 'Travel Across Cameroon — With Comfort & Safety',
    'landing.hero_desc': 'Book your bus tickets in seconds. Experience modern, reliable, and affordable travel across all major cities in Cameroon.',
    'landing.cta_primary': 'Book Your Trip Now',
    'landing.cta_secondary': 'Explore Routes',
    'landing.rating_text': '4.8/5 from 10,000+ happy travelers',
    'landing.features_title': 'Travel Made Simple & Safe',
    'landing.features_desc': 'Experience the best bus booking platform in Cameroon with modern features designed for your comfort.',
    'landing.feature_instant_title': 'Instant Booking',
    'landing.feature_instant_desc': 'Book your tickets in under 2 minutes. No queues, no hassle.',
    'landing.feature_secure_title': '100% Secure',
    'landing.feature_secure_desc': 'Your payment and personal data are protected with top-tier security.',
    'landing.feature_fleet_title': 'Modern Fleet',
    'landing.feature_fleet_desc': 'Travel in comfort with our modern, air-conditioned buses.',
    'landing.feature_coverage_title': 'Wide Coverage',
    'landing.feature_coverage_desc': 'Connect to all major cities across Cameroon with ease.',
    'landing.routes_title': 'Where Do You Want to Go?',
    'landing.routes_desc': 'Explore our most popular routes across Cameroon with competitive prices and comfortable buses.',
    'landing.steps_title': 'Book in 3 Easy Steps',
    'landing.steps_desc': 'Our streamlined booking process makes it easy to get your tickets in minutes.',
    'landing.step1_title': 'Choose Your Route',
    'landing.step2_title': 'Select Your Seat',
    'landing.step3_title': 'Pay & Travel',
    'landing.testimonials_badge': 'Customer Reviews',
    'landing.testimonials_title': 'What Our Travelers Say',
    'landing.testimonials_desc': 'Join thousands of satisfied travelers who trust CamerTransit for their journeys.',
    'landing.stats_travelers': 'Happy Travelers',
    'landing.stats_routes': 'Routes Available',
    'landing.stats_trips': 'Daily Trips',
    'landing.stats_rating': 'Average Rating',
    'landing.cta_title': 'Ready to Start Your Journey?',
    'landing.cta_desc': 'Join thousands of satisfied travelers across Cameroon. Book your next trip today!',
    'landing.cta_create': 'Create Free Account',
    'landing.footer_about': 'Your trusted partner for comfortable and affordable bus travel across Cameroon.',
    'landing.footer_quicklinks': 'Quick Links',
    'landing.footer_support': 'Support',
    'landing.footer_contact': 'Contact Us',
    'landing.nav_home': 'Home',
    'landing.nav_features': 'Features',
    'landing.nav_routes': 'Routes',
    'landing.nav_testimonials': 'Testimonials',
    'landing.nav_contact': 'Contact',
    'landing.nav_signin': 'Sign In',
    'landing.nav_getstarted': 'Get Started',
    'landing.footer_features': 'Features',
    'landing.footer_routes': 'Routes',
    'landing.footer_booknow': 'Book Now',
    'landing.footer_myaccount': 'My Account',
    'landing.footer_helpcenter': 'Help Center',
    'landing.footer_terms': 'Terms of Service',
    'landing.footer_privacy': 'Privacy Policy',
    'landing.footer_refund': 'Refund Policy',
    'landing.footer_copyright': '© 2026 CamTransit. All rights reserved. Made with ❤️ in Cameroon.',
  },
  fr: {
    'landing.badge': '🇨🇲 Cameroun #1 Réservation de Bus',
    'landing.hero_title': 'Voyagez au Cameroun avec Confort et Sécurité',
    'landing.hero_desc': 'Réservez vos billets de bus en quelques secondes. Voyagez de manière moderne, fiable et abordable dans tout le Cameroun.',
    'landing.cta_primary': 'Réserver Votre Voyage',
    'landing.cta_secondary': 'Voir les Routes',
    'landing.rating_text': '4.8/5 de 10 000+ voyageurs satisfaits',
    'landing.features_title': 'Voyages Simples et Sûrs',
    'landing.features_desc': 'Découvrez la meilleure plateforme de réservation de bus au Cameroun conçue pour votre confort.',
    'landing.feature_instant_title': 'Réservation Instantanée',
    'landing.feature_instant_desc': 'Réservez vos billets en moins de 2 minutes. Pas de file.d\'attente.',
    'landing.feature_secure_title': '100% Sécurisé',
    'landing.feature_secure_desc': 'Vos paiements et données personnelles sont protégés.',
    'landing.feature_fleet_title': 'Flotte Moderne',
    'landing.feature_fleet_desc': 'Voyagez confortablement dans nos bus climatisés modernes.',
    'landing.feature_coverage_title': 'Grande Couverture',
    'landing.feature_coverage_desc': 'Connectez toutes les grandes villes du Cameroun facilement.',
    'landing.routes_title': 'Où Voulez-vous Aller ?',
    'landing.routes_desc': 'Explorez nos routes les plus populaires au Cameroun avec des prix concurrents et des bus confortables.',
    'landing.steps_title': 'Réservez en 3 Étapes Faciles',
    'landing.steps_desc': 'Notre processus de réservation simplifié vous permet d\'obtenir vos billets en quelques minutes.',
    'landing.step1_title': 'Choisissez Votre Route',
    'landing.step2_title': 'Choisissez Votre Siège',
    'landing.step3_title': 'Payez et Voyagez',
    'landing.testimonials_badge': 'Avis Clients',
    'landing.testimonials_title': 'Ce Que Disent Nos Voyageurs',
    'landing.testimonials_desc': 'Rejoignez des milliers de voyageurs satisfaits qui font confiance à CamerTransit pour leurs déplacements.',
    'landing.stats_travelers': 'Voyageurs Satisfaits',
    'landing.stats_routes': 'Routes Disponibles',
    'landing.stats_trips': 'Départs Quotidiens',
    'landing.stats_rating': 'Note Moyenne',
    'landing.cta_title': 'Prêt à Commencer Votre Voyage ?',
    'landing.cta_desc': 'Rejoignez des milliers de voyageurs satisfaits au Cameroun. Réservez votre prochain voyage aujourd\'hui !',
    'landing.cta_create': 'Créer un Compte Gratuit',
    'landing.footer_about': 'Votre partenaire de confiance pour des voyages en bus confortables et abordable au Cameroun.',
    'landing.footer_quicklinks': 'Liens Rapides',
    'landing.footer_support': 'Support',
    'landing.footer_contact': 'Contactez-nous',
    'landing.nav_home': 'Accueil',
    'landing.nav_features': 'Fonctionnalités',
    'landing.nav_routes': 'Routes',
    'landing.nav_testimonials': 'Témoignages',
    'landing.nav_contact': 'Contact',
    'landing.nav_signin': 'Connexion',
    'landing.nav_getstarted': 'Commencer',
    'landing.footer_features': 'Fonctionnalités',
    'landing.footer_routes': 'Routes',
    'landing.footer_booknow': 'Réserver',
    'landing.footer_myaccount': 'Mon Compte',
    'landing.footer_helpcenter': 'Centre d\'Aide',
    'landing.footer_terms': 'Conditions d\'Utilisation',
    'landing.footer_privacy': 'Politique de Confidentialité',
    'landing.footer_refund': 'Politique de Remboursement',
    'landing.footer_copyright': '© 2026 CamTransit. Tous droits réservés. Fait avec ❤️ au Cameroun.',
  }
};

window.i18nTranslations = translations;

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('app_language');
    if (stored && translations[stored]) {
      setCurrentLang(stored);
    }
  }, []);

  const applyTranslations = (langCode) => {
    const trans = translations[langCode];
    if (!trans) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (trans[key]) {
        el.textContent = trans[key];
      }
    });
    // Also update navigation items
    const navFeatures = document.querySelector('[data-nav="features"]');
    const navRoutes = document.querySelector('[data-nav="routes"]');
    const navTestimonials = document.querySelector('[data-nav="testimonials"]');
    const navContact = document.querySelector('[data-nav="contact"]');
    
    if (navFeatures && trans['landing.nav_features']) navFeatures.textContent = trans['landing.nav_features'];
    if (navRoutes && trans['landing.nav_routes']) navRoutes.textContent = trans['landing.nav_routes'];
    if (navTestimonials && trans['landing.nav_testimonials']) navTestimonials.textContent = trans['landing.nav_testimonials'];
    if (navContact && trans['landing.nav_contact']) navContact.textContent = trans['landing.nav_contact'];
  };

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('app_language', langCode);
    applyTranslations(langCode);
    setIsOpen(false);
  };

  const activeLang = languages.find(l => l.code === currentLang);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
          currentLang === 'en' 
            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 hover:bg-blue-200' 
            : 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200'
        }`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-bold">{activeLang?.flag} {activeLang?.code.toUpperCase()}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden min-w-[140px]">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                currentLang === lang.code 
                  ? 'bg-blue-50 text-blue-700 font-bold' 
                  : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;