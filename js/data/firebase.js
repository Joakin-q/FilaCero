(function () {
  if (!window.FC_CONFIG?.firebaseConfig) {
    throw new Error('Falta la configuración de Firebase.');
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(window.FC_CONFIG.firebaseConfig);
  }

  window.FC_FIREBASE = {
    auth: firebase.auth(),
    db: firebase.firestore()
  };
})();