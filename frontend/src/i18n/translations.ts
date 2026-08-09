export type Lang = 'en' | 'fr' | 'rw';

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'rw', label: 'Ikinyarwanda' }
];

// Keys are grouped by area of the app. Add new keys here as you translate
// more of the UI — components should never hardcode English strings that
// a user will see.
export const translations: Record<Lang, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.patients': 'Patients',
    'nav.appointments': 'Appointments',
    'nav.referrals': 'Referrals',
    'nav.doctors': 'Doctors',
    'nav.hospitals': 'Hospitals',
    'nav.laboratories': 'Laboratories',
    'nav.billing': 'Billing',
    'nav.reports': 'Reports',
    'nav.auditLog': 'Audit Log',
    'nav.settings': 'Settings',

    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.backToDashboard': 'Back to Dashboard',
    'common.language': 'Language',

    'dashboard.welcome': 'Welcome back',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.newReferral': 'New Referral',
    'dashboard.newAppointment': 'New Appointment',
    'dashboard.addPatient': 'Add Patient',
    'dashboard.labRequest': 'Lab Request',
    'dashboard.viewTestQueue': 'View Test Queue'
  },
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.patients': 'Patients',
    'nav.appointments': 'Rendez-vous',
    'nav.referrals': 'Références',
    'nav.doctors': 'Médecins',
    'nav.hospitals': 'Hôpitaux',
    'nav.laboratories': 'Laboratoires',
    'nav.billing': 'Facturation',
    'nav.reports': 'Rapports',
    'nav.auditLog': "Journal d'audit",
    'nav.settings': 'Paramètres',

    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.search': 'Rechercher',
    'common.loading': 'Chargement...',
    'common.backToDashboard': 'Retour au tableau de bord',
    'common.language': 'Langue',

    'dashboard.welcome': 'Bon retour',
    'dashboard.quickActions': 'Actions rapides',
    'dashboard.newReferral': 'Nouvelle référence',
    'dashboard.newAppointment': 'Nouveau rendez-vous',
    'dashboard.addPatient': 'Ajouter un patient',
    'dashboard.labRequest': "Demande d'analyse",
    'dashboard.viewTestQueue': 'Voir la file des analyses'
  },
  rw: {
    'nav.dashboard': 'Ikibaho',
    'nav.patients': 'Abarwayi',
    'nav.appointments': 'Gahunda zo kwa muganga',
    'nav.referrals': 'Kohereza abarwayi',
    'nav.doctors': 'Abaganga',
    'nav.hospitals': 'Ibitaro',
    'nav.laboratories': 'Za Laboratwari',
    'nav.billing': 'Kwishyura',
    'nav.reports': 'Raporo',
    'nav.auditLog': "Raporo y'ibikorwa",
    'nav.settings': 'Igenamiterere',

    'common.save': 'Bika',
    'common.cancel': 'Hagarika',
    'common.delete': 'Siba',
    'common.edit': 'Hindura',
    'common.add': 'Ongeraho',
    'common.search': 'Shakisha',
    'common.loading': 'Birimo gutegurwa...',
    'common.backToDashboard': 'Subira ku kibaho',
    'common.language': 'Ururimi',

    'dashboard.welcome': 'Murakaza neza',
    'dashboard.quickActions': 'Ibikorwa byihuse',
    'dashboard.newReferral': 'Kohereza umurwayi mushya',
    'dashboard.newAppointment': 'Gahunda nshya',
    'dashboard.addPatient': 'Ongeraho umurwayi',
    'dashboard.labRequest': 'Gusaba ikizamini',
    'dashboard.viewTestQueue': "Reba urutonde rw'ibizamini"
  }
};
