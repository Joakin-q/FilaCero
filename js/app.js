// Registro del Service Worker para transformar la web en una PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrado con éxito con el scope:', registration.scope);
            })
            .catch(error => {
                console.error('Error al registrar el ServiceWorker:', error);
            });
    });
}