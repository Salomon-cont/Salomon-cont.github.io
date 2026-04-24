document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li a');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // Intersection Observer for scroll animations (fade in elements)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add animation styles dynamically to sections
    const animateElements = document.querySelectorAll('.skill-category, .project-card, .about-container, .contact-card');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Background Video Logic (Optional control can be added here)
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        // Ensure video is playing (some browsers need interaction)
        document.body.addEventListener('click', () => {
            if (bgVideo.paused) bgVideo.play();
        }, { once: true });
    }


    // Technology data for hacker modal
    const techData = {
        'Python': 'Lenguaje de alto nivel ideal para IA, ciencia de datos, backend y automatización. Dominio en bibliotecas como Pandas, NumPy y frameworks como Django/FastAPI.',
        'JavaScript': 'El lenguaje de la web. Creación de interactividad en el cliente y lógica de servidor. Manejo avanzado del DOM y asincronía (Promises, async/await).',
        'TypeScript': 'Superconjunto tipado de JavaScript que añade tipado estático opcional para crear código más robusto, predecible y mantenible en proyectos grandes.',
        'Java': 'Lenguaje orientado a objetos robusto y multiplataforma. Experiencia en desarrollo empresarial, aplicaciones backend y ecosistema Spring Boot.',
        'C++': 'Lenguaje de alto rendimiento y bajo nivel. Utilizado para sistemas embebidos, procesamiento en tiempo real y componentes críticos en motores gráficos o IA.',
        'C#': 'Lenguaje multiparadigma de Microsoft. Experiencia en el ecosistema .NET, desarrollo de aplicaciones de escritorio, backend y videojuegos con Unity.',
        
        'HTML5 / CSS3': 'Bases fundamentales del desarrollo web. Creación de estructuras semánticas y diseños responsivos (Flexbox, Grid) con animaciones avanzadas.',
        'React.js': 'Librería de interfaces de usuario. Desarrollo basado en componentes, gestión de estado complejo (Redux/Context API) y ciclos de vida con Hooks.',
        'Node.js': 'Entorno de ejecución de JS en servidor. Construcción de APIs RESTful escalables, arquitecturas orientadas a eventos y manejo de WebSockets.',
        'Express': 'Framework web minimalista para Node.js. Creación ágil de rutas, middlewares personalizados y gestión eficiente de peticiones HTTP.',
        'Tailwind CSS': 'Framework CSS utility-first. Creación rápida de interfaces de usuario altamente personalizadas sin abandonar el HTML, optimizado para producción.',
        
        'Git / GitHub': 'Sistemas de control de versiones. Gestión de ramas, resolución de conflictos, revisión de código (Pull Requests) e integración continua (CI/CD).',
        'Docker': 'Plataforma de contenerización. Creación de Dockerfiles, despliegue de entornos aislados consistentes y orquestación básica con Docker Compose.',
        'PostgreSQL': 'Sistema de base de datos relacional avanzado. Diseño de esquemas complejos, optimización de consultas SQL, índices y manejo de transacciones.',
        'MongoDB': 'Base de datos NoSQL orientada a documentos. Modelado flexible de datos, consultas de agregación complejas y diseño de schemas escalables.',
        'TensorFlow / PyTorch': 'Frameworks líderes en Machine Learning y Deep Learning. Diseño, entrenamiento e inferencia de modelos de visión computacional y redes neuronales.'
    };

    // Modal Logic
    const techModal = document.getElementById('tech-modal');
    const closeTechModal = document.getElementById('close-modal');
    const techCmd = document.getElementById('tech-cmd');
    const techDescription = document.getElementById('tech-description');
    const techTags = document.querySelectorAll('.tag');

    let typingInterval;

    techTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            const techName = tag.innerText.trim();
            const info = techData[techName] || 'ERROR: Dependencia no encontrada en la base de datos...';
            
            // Create mini-squares animation at click location
            const rect = tag.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            for (let i = 0; i < 15; i++) {
                const pixel = document.createElement('div');
                pixel.className = 'pixel-particle';
                pixel.style.left = `${centerX}px`;
                pixel.style.top = `${centerY}px`;
                
                const tx = (Math.random() - 0.5) * 200;
                const ty = (Math.random() - 0.5) * 200;
                pixel.style.setProperty('--tx', `${tx}px`);
                pixel.style.setProperty('--ty', `${ty}px`);
                pixel.style.animation = `pixel-fade ${0.5 + Math.random() * 0.5}s ease-out forwards`;
                
                document.body.appendChild(pixel);
                setTimeout(() => pixel.remove(), 1000);
            }

            // Open Modal
            techModal.classList.add('active');
            techCmd.innerText = `analyze --tech "${techName}"`;
            techDescription.innerHTML = '';
            
            // Typewriter effect
            clearInterval(typingInterval);
            let index = 0;
            typingInterval = setInterval(() => {
                if (index < info.length) {
                    techDescription.innerHTML += info.charAt(index);
                    index++;
                } else {
                    clearInterval(typingInterval);
                }
            }, 30); // Typing speed
        });
    });

    closeTechModal.addEventListener('click', () => {
        techModal.classList.remove('active');
        clearInterval(typingInterval);
    });

    techModal.addEventListener('click', (e) => {
        if (e.target === techModal) {
            techModal.classList.remove('active');
            clearInterval(typingInterval);
        }
    });
});
