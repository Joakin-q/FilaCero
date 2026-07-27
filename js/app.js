document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    // Funcionalidad para abrir/cerrar el menú lateral en celulares
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Cerrar el menú si se hace clic fuera de él en versión móvil
    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 768) {
            const isClickInsideMenu = sidebar.contains(event.target);
            const isClickOnButton = menuBtn.contains(event.target);
            
            if (!isClickInsideMenu && !isClickOnButton && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });
});