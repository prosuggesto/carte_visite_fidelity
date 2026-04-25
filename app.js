/* ============================================
   Fidelity Business Card
   ============================================ */

(function () {
    'use strict';

    const CONTACT = {
        firstName: 'Diego',
        lastName: 'Lamperim',
        email: 'lamperim.diego.fidelity.es@gmail.com',
        phone: '+33767569224',
    };

    // Private Access Check
    const urlParams = new URLSearchParams(window.location.search);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const hasAccess = urlParams.get('source') === 'qr' || isStandalone;

    function initFlip() {
        const card = document.getElementById('business-card');
        if (!card) return;

        if (!hasAccess) {
            document.body.classList.add('locked-mode');
            // If locked, we don't allow flipping or interacting
            return;
        }

        // Toggle sur mobile (clic)
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            card.classList.toggle('is-flipped');
            
            const hint = document.getElementById('tap-hint');
            if (hint) {
                hint.style.opacity = '0';
            }
        });
    }

    // ============================================
    // QR CODE
    // ============================================
    function generateQRCode() {
        const container = document.getElementById('qrcode');
        if (!container) return;
        container.innerHTML = '';

        const url = new URL(window.location.href);
        // Ensure the generated QR code gives access
        url.searchParams.set('source', 'qr');
        
        const cardEl = document.querySelector('.card-face.back');
        // Increase QR code base size up to 100px for easier detection
        const qrSize = cardEl ? Math.min(Math.floor(cardEl.offsetHeight * 0.45), 100) : 90;

        new QRCode(container, {
            text: url.toString(),
            width: qrSize,
            height: qrSize,
            colorDark: '#FFD700',
            colorLight: '#141420',
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // ============================================
    // VCARD
    // ============================================
    function generateVCard() {
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${CONTACT.firstName} ${CONTACT.lastName}`,
            `N:${CONTACT.lastName};${CONTACT.firstName};;;`,
            `TEL;TYPE=CELL:${CONTACT.phone}`,
            `EMAIL;TYPE=INTERNET:${CONTACT.email}`,
            `URL:${window.location.href}`,
            `REV:${new Date().toISOString()}`,
            'END:VCARD'
        ].join('\n');

        const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${CONTACT.firstName}_${CONTACT.lastName}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        const toast = document.getElementById('toast');
        const el = document.getElementById('toast-message');
        if (toast && el) {
            el.textContent = 'Contact enregistré !';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }
    }

    function init() {
        // Apparition simple
        const card = document.getElementById('business-card');
        if (card) {
            setTimeout(() => card.classList.add('visible'), 100);
        }

        initFlip();
        generateQRCode();
        
        const btn = document.getElementById('save-contact');
        if (btn) {
            if (!hasAccess) {
                // Button does nothing in locked mode visually, but let's disable functionality too
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                });
            } else {
                btn.addEventListener('click', generateVCard);
            }
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        }

        let t;
        window.addEventListener('resize', () => {
            clearTimeout(t);
            t = setTimeout(generateQRCode, 300);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
