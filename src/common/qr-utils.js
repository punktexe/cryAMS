// Common utilities for QR code processing
export const QR_CODE_FORMATS = {
    URL: 'url',
    TEXT: 'text',
    EMAIL: 'email',
    PHONE: 'phone',
    WIFI: 'wifi',
    VCARD: 'vcard'
};

export function detectQRCodeType(content) {
    if (content.startsWith('http://') || content.startsWith('https://')) {
        return QR_CODE_FORMATS.URL;
    }
    if (content.startsWith('mailto:')) {
        return QR_CODE_FORMATS.EMAIL;
    }
    if (content.startsWith('tel:')) {
        return QR_CODE_FORMATS.PHONE;
    }
    if (content.startsWith('WIFI:')) {
        return QR_CODE_FORMATS.WIFI;
    }
    if (content.startsWith('BEGIN:VCARD')) {
        return QR_CODE_FORMATS.VCARD;
    }
    return QR_CODE_FORMATS.TEXT;
}

export function formatQRCodeContent(content) {
    const type = detectQRCodeType(content);
    
    switch (type) {
        case QR_CODE_FORMATS.URL:
            return `<a href="${content}" target="_blank">${content}</a>`;
        case QR_CODE_FORMATS.EMAIL:
            return `<a href="${content}">${content.replace('mailto:', '')}</a>`;
        case QR_CODE_FORMATS.PHONE:
            return `<a href="${content}">${content.replace('tel:', '')}</a>`;
        case QR_CODE_FORMATS.WIFI:
            return parseWifiQR(content);
        case QR_CODE_FORMATS.VCARD:
            return parseVCardQR(content);
        default:
            return content;
    }
}

function parseWifiQR(content) {
    const params = content.replace('WIFI:', '').split(';');
    let result = '<strong>WIFI Netzwerk:</strong><br>';
    params.forEach(param => {
        const [key, value] = param.split(':');
        if (key && value) {
            result += `${key}: ${value}<br>`;
        }
    });
    return result;
}

function parseVCardQR(content) {
    const lines = content.split('\n');
    let result = '<strong>Kontakt:</strong><br>';
    lines.forEach(line => {
        if (line.startsWith('FN:')) {
            result += `Name: ${line.replace('FN:', '')}<br>`;
        } else if (line.startsWith('TEL:')) {
            result += `Telefon: ${line.replace('TEL:', '')}<br>`;
        } else if (line.startsWith('EMAIL:')) {
            result += `Email: ${line.replace('EMAIL:', '')}<br>`;
        }
    });
    return result;
}
